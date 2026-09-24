/**
 * Financial invariants, checked against a real Postgres database.
 *
 * These tests do not ask "did the API answer". They ask whether the numbers
 * still describe the money that actually moved:
 *
 *   - one offering stands for one amount of money received
 *   - one approved LINE slip produces exactly one offering
 *   - a transfer counted in a Sunday round reuses the offering that already
 *     records it; posting the round does not add a second one
 *   - a fund balance equals its active offerings minus its live expenses
 *
 * Skipped unless DATABASE_URL is set. To run it:
 *   DATABASE_URL=postgresql://user@host:port/db pnpm exec vitest run \
 *     server/finance.invariants.test.ts
 *
 * Every row belongs to a throwaway tenant (server/test/tenant.ts) that is
 * dropped afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { appRouter } from "./routers";
import { getDb } from "./db";
import type { TrpcContext } from "./_core/context";
import { TEST_CHURCH_ID, purgeTenant } from "./test/tenant";

type User = NonNullable<TrpcContext["user"]>;

const hasDb = Boolean(process.env.DATABASE_URL);
const describeDb = hasDb ? describe : describe.skip;

afterAll(async () => {
  if (!hasDb) return;
  const db = await getDb();
  if (db) await purgeTenant(db);
});

function callerFor(user: User) {
  return appRouter.createCaller({
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  });
}

const base: User = {
  id: 0,
  openId: "x",
  email: null,
  name: null,
  loginMethod: null,
  role: "user",
  churchRole: "MEMBER",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};
const counter: User = { ...base, id: 801, openId: "c", churchRole: "COUNTER" };
const treasurer: User = {
  ...base,
  id: 802,
  openId: "t",
  churchRole: "TREASURER",
};

type Row = Record<string, unknown>;
async function rows(query: ReturnType<typeof sql>): Promise<Row[]> {
  const db = await getDb();
  return (await db!.execute(query)) as unknown as Row[];
}
const num = (v: unknown) => parseFloat(String(v ?? 0));

let fundId = 0;
let slipSeq = 0;

async function fundBalance(): Promise<number> {
  const [row] = await rows(
    sql`SELECT balance FROM finance_accounts WHERE id = ${fundId}`
  );
  return num(row.balance);
}

async function activeOfferingCount(): Promise<number> {
  const [row] = await rows(
    sql`SELECT count(*) AS n FROM offerings
        WHERE "churchId" = ${TEST_CHURCH_ID} AND status = 'active'`
  );
  return Number(row.n);
}

/**
 * The fund opened at 0, so its stored balance must equal what the ledger rows
 * say. A difference means some path moved the balance without a ledger row,
 * or wrote a ledger row without moving the balance, or did either twice.
 */
async function ledgerBalance(): Promise<number> {
  const [row] = await rows(
    sql`SELECT
          COALESCE((SELECT sum(amount) FROM offerings
                    WHERE "fundId" = ${fundId} AND status = 'active'), 0)
        - COALESCE((SELECT sum(amount) FROM expenses
                    WHERE "fundId" = ${fundId} AND status <> 'voided'), 0)
        AS balance`
  );
  return num(row.balance);
}

/** A LINE slip as the OCR worker leaves it, ready for review. */
async function insertSlip(amount: number): Promise<number> {
  slipSeq += 1;
  const [row] = await rows(
    sql`INSERT INTO line_slips
          ("churchId", "lineUserId", "lineEventId", "slipImageKey", "slipHash",
           status, "extractedAmount", "extractedRef", "extractedDate")
        VALUES (${TEST_CHURCH_ID}, 'U-test', ${`evt-${slipSeq}-${Date.now()}`},
                ${`slips/test-${slipSeq}.jpg`}, ${`hash-${slipSeq}-${Date.now()}`},
                'extracted', ${amount}, ${`REF-${slipSeq}-${Date.now()}`},
                ${"2026-09-18T03:00:00Z"})
        RETURNING id`
  );
  return Number(row.id);
}

async function approveSlip(slipId: number, amount: number) {
  return callerFor(treasurer).givingInbox.approve({
    slipId,
    fundId,
    amount,
    category: "general",
  });
}

/** Opens a round, records the given envelopes and verifies it. */
async function verifiedRound(
  serviceDate: Date,
  envelopes: Array<{
    amount: number;
    method: "cash" | "transfer";
    linkedOfferingId?: number;
  }>
): Promise<number> {
  const { id } = await callerFor(counter).counting.create({
    serviceDate,
    serviceRound: 1,
  });
  let cash = 0;
  for (const e of envelopes) {
    await callerFor(counter).counting.addEnvelope({
      sessionId: id,
      fundId,
      amount: e.amount,
      method: e.method,
      category: "general",
      isAnonymous: true,
      ...(e.linkedOfferingId ? { linkedOfferingId: e.linkedOfferingId } : {}),
    } as Parameters<
      ReturnType<typeof callerFor>["counting"]["addEnvelope"]
    >[0]);
    if (e.method === "cash") cash += e.amount;
  }
  if (cash > 0) {
    await callerFor(counter).counting.setCashCount({
      sessionId: id,
      denomination: 1,
      kind: "coin",
      quantity: cash,
    });
  }
  await callerFor(counter).counting.submitCount({ id });
  await callerFor(treasurer).counting.verify({ id });
  return id;
}

describeDb("financial invariants", () => {
  beforeAll(async () => {
    const db = await getDb();
    if (!db)
      throw new Error("DATABASE_URL set but the database is unreachable");
    const [row] = await rows(
      sql`INSERT INTO finance_accounts ("churchId", name, type, balance, "isActive")
          VALUES (${TEST_CHURCH_ID}, 'กองทุนทดสอบ invariants', 'general', 0, true)
          RETURNING id`
    );
    fundId = Number(row.id);
  });

  describe("one approved slip is one offering", () => {
    it("creates exactly one transfer offering and links it back", async () => {
      const before = await activeOfferingCount();
      const slipId = await insertSlip(500);
      const { offeringId } = await approveSlip(slipId, 500);

      expect(await activeOfferingCount()).toBe(before + 1);
      const [slip] = await rows(
        sql`SELECT "approvedOfferingId" FROM line_slips WHERE id = ${slipId}`
      );
      expect(Number(slip.approvedOfferingId)).toBe(offeringId);
      const [offering] = await rows(
        sql`SELECT method, amount FROM offerings WHERE id = ${offeringId}`
      );
      expect(offering.method).toBe("transfer");
      expect(num(offering.amount)).toBe(500);
    });

    it("refuses a second approval of the same slip", async () => {
      const slipId = await insertSlip(700);
      await approveSlip(slipId, 700);
      const before = await activeOfferingCount();
      const balance = await fundBalance();

      await expect(approveSlip(slipId, 700)).rejects.toMatchObject({
        code: "CONFLICT",
      });
      expect(await activeOfferingCount()).toBe(before);
      expect(await fundBalance()).toBe(balance);
    });

    it("cannot point two slips at one offering, even by direct SQL", async () => {
      const a = await insertSlip(100);
      const { offeringId } = await approveSlip(a, 100);
      const b = await insertSlip(100);
      await expect(
        rows(
          sql`UPDATE line_slips SET "approvedOfferingId" = ${offeringId}
              WHERE id = ${b}`
        )
      ).rejects.toThrow();
    });
  });

  describe("a counted transfer reuses the offering that recorded it", () => {
    it("posts cash as new offerings and a linked transfer as none", async () => {
      const slipId = await insertSlip(3000);
      const { offeringId } = await approveSlip(slipId, 3000);
      const offeringsBefore = await activeOfferingCount();
      const balanceBefore = await fundBalance();

      const sessionId = await verifiedRound(new Date("2026-09-20T01:00:00Z"), [
        { amount: 1000, method: "cash" },
        { amount: 3000, method: "transfer", linkedOfferingId: offeringId },
      ]);
      const result = await callerFor(treasurer).counting.post({
        id: sessionId,
        varianceNote: "ไม่มีรายการฝากธนาคารในรอบทดสอบ",
      });

      // Only the cash envelope is new money in the ledger.
      expect(await activeOfferingCount()).toBe(offeringsBefore + 1);
      expect(await fundBalance()).toBe(balanceBefore + 1000);
      expect(result.offeringCount).toBe(1);
    });

    it("refuses to post a transfer that is not linked to an offering", async () => {
      const sessionId = await verifiedRound(new Date("2026-09-27T01:00:00Z"), [
        { amount: 2000, method: "transfer" },
      ]);
      const offeringsBefore = await activeOfferingCount();
      const balanceBefore = await fundBalance();

      await expect(
        callerFor(treasurer).counting.post({
          id: sessionId,
          varianceNote: "ทดสอบ",
        })
      ).rejects.toMatchObject({ code: "CONFLICT" });
      expect(await activeOfferingCount()).toBe(offeringsBefore);
      expect(await fundBalance()).toBe(balanceBefore);
      const [session] = await rows(
        sql`SELECT status FROM counting_sessions WHERE id = ${sessionId}`
      );
      expect(session.status).toBe("verified");
    });

    it("lets the treasurer link a transfer after the count is submitted", async () => {
      const sessionId = await verifiedRound(new Date("2026-11-01T01:00:00Z"), [
        { amount: 1200, method: "transfer" },
      ]);
      const slipId = await insertSlip(1200);
      const { offeringId } = await approveSlip(slipId, 1200);
      const [envelope] = await rows(
        sql`SELECT id FROM offering_envelopes WHERE "sessionId" = ${sessionId}`
      );

      // Counters cannot change the link once the count is locked.
      await expect(
        callerFor(counter).counting.linkTransfer({
          sessionId,
          envelopeId: Number(envelope.id),
          linkedOfferingId: offeringId,
        })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      await callerFor(treasurer).counting.linkTransfer({
        sessionId,
        envelopeId: Number(envelope.id),
        linkedOfferingId: offeringId,
      });
      const offeringsBefore = await activeOfferingCount();
      const balanceBefore = await fundBalance();
      const result = await callerFor(treasurer).counting.post({
        id: sessionId,
        varianceNote: "ไม่มีรายการฝากธนาคารในรอบทดสอบ",
      });
      expect(result.offeringCount).toBe(0);
      expect(result.linkedTransferCount).toBe(1);
      expect(await activeOfferingCount()).toBe(offeringsBefore);
      expect(await fundBalance()).toBe(balanceBefore);
    });

    it("will not void or re-amount an offering a round has counted", async () => {
      const slipId = await insertSlip(600);
      const { offeringId } = await approveSlip(slipId, 600);
      await verifiedRound(new Date("2026-11-08T01:00:00Z"), [
        { amount: 600, method: "transfer", linkedOfferingId: offeringId },
      ]);
      await expect(
        callerFor(treasurer).offerings.delete({ id: offeringId })
      ).rejects.toMatchObject({ code: "CONFLICT" });
      await expect(
        callerFor(treasurer).offerings.update({ id: offeringId, amount: 650 })
      ).rejects.toMatchObject({ code: "CONFLICT" });
    });

    it("still allows a notes edit that resends the same amount", async () => {
      const slipId = await insertSlip(610);
      const { offeringId } = await approveSlip(slipId, 610);
      await verifiedRound(new Date("2026-11-15T01:00:00Z"), [
        { amount: 610, method: "transfer", linkedOfferingId: offeringId },
      ]);
      // TransactionDetail always sends the amount with the notes.
      await callerFor(treasurer).offerings.update({
        id: offeringId,
        amount: 610,
        notes: "แก้หมายเหตุอย่างเดียว",
      });
      const [row] = await rows(
        sql`SELECT notes, amount FROM offerings WHERE id = ${offeringId}`
      );
      expect(row.notes).toBe("แก้หมายเหตุอย่างเดียว");
      expect(num(row.amount)).toBe(610);
    });

    it("refuses to link a cash envelope and logs nothing", async () => {
      const slipId = await insertSlip(420);
      const { offeringId } = await approveSlip(slipId, 420);
      const sessionId = await verifiedRound(new Date("2026-11-22T01:00:00Z"), [
        { amount: 420, method: "cash" },
      ]);
      const [envelope] = await rows(
        sql`SELECT id FROM offering_envelopes WHERE "sessionId" = ${sessionId}`
      );
      await expect(
        callerFor(treasurer).counting.linkTransfer({
          sessionId,
          envelopeId: Number(envelope.id),
          linkedOfferingId: offeringId,
        })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
      const [log] = await rows(
        sql`SELECT count(*) AS n FROM audit_logs
            WHERE action = 'LINK_TRANSFER' AND "entityId" = ${Number(envelope.id)}`
      );
      expect(Number(log.n)).toBe(0);
    });

    it("refuses to link one offering to two envelopes", async () => {
      const slipId = await insertSlip(400);
      const { offeringId } = await approveSlip(slipId, 400);
      const { id: first } = await callerFor(counter).counting.create({
        serviceDate: new Date("2026-10-04T01:00:00Z"),
        serviceRound: 1,
      });
      const { id: second } = await callerFor(counter).counting.create({
        serviceDate: new Date("2026-10-04T01:00:00Z"),
        serviceRound: 2,
      });
      const envelope = {
        fundId,
        amount: 400,
        method: "transfer" as const,
        category: "general" as const,
        isAnonymous: true,
        linkedOfferingId: offeringId,
      };
      await callerFor(counter).counting.addEnvelope({
        sessionId: first,
        ...envelope,
      });
      await expect(
        callerFor(counter).counting.addEnvelope({
          sessionId: second,
          ...envelope,
        })
      ).rejects.toMatchObject({ code: "CONFLICT" });

      // The database refuses it too, not only the router.
      await expect(
        rows(
          sql`INSERT INTO offering_envelopes
                ("sessionId", "churchId", amount, method, "linkedOfferingId", "recordedBy")
              VALUES (${second}, ${TEST_CHURCH_ID}, 400, 'transfer', ${offeringId}, ${counter.id})`
        )
      ).rejects.toThrow();
    });

    it("takes the amount from the linked offering, not from the form", async () => {
      const slipId = await insertSlip(900);
      const { offeringId } = await approveSlip(slipId, 900);
      const { id } = await callerFor(counter).counting.create({
        serviceDate: new Date("2026-10-11T01:00:00Z"),
        serviceRound: 1,
      });
      await expect(
        callerFor(counter).counting.addEnvelope({
          sessionId: id,
          fundId,
          amount: 950,
          method: "transfer",
          category: "general",
          isAnonymous: true,
          linkedOfferingId: offeringId,
        })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("only links transfer offerings", async () => {
      const cash = await callerFor(treasurer).offerings.create({
        amount: 250,
        category: "general",
        fundId,
        method: "cash",
      } as Parameters<ReturnType<typeof callerFor>["offerings"]["create"]>[0]);
      const { id } = await callerFor(counter).counting.create({
        serviceDate: new Date("2026-10-18T01:00:00Z"),
        serviceRound: 1,
      });
      await expect(
        callerFor(counter).counting.addEnvelope({
          sessionId: id,
          fundId,
          amount: 250,
          method: "transfer",
          category: "general",
          isAnonymous: true,
          linkedOfferingId: cash.id,
        })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  describe("a disbursed withdrawal is exactly one expense", () => {
    async function approvedWithdrawal(amount: number): Promise<number> {
      const { id } = await callerFor(counter).withdrawals.create({
        amount,
        purpose: "ซื้ออุปกรณ์ห้องนมัสการ",
        fundId,
      });
      await callerFor(treasurer).withdrawals.approve({
        id,
        action: "approved",
        note: "",
      });
      return id;
    }
    async function expensesFor(withdrawalId: number) {
      return rows(
        sql`SELECT id, amount, status, "fundId" FROM expenses
            WHERE "withdrawalId" = ${withdrawalId}`
      );
    }

    it("writes one expense, moves the balance once and marks it disbursed", async () => {
      const id = await approvedWithdrawal(1500);
      const balanceBefore = await fundBalance();

      const result = await callerFor(treasurer).withdrawals.disburse({ id });

      const written = await expensesFor(id);
      expect(written).toHaveLength(1);
      expect(Number(written[0].id)).toBe(result.expenseId);
      expect(num(written[0].amount)).toBe(1500);
      expect(Number(written[0].fundId)).toBe(fundId);
      expect(await fundBalance()).toBe(balanceBefore - 1500);
      const [withdrawal] = await rows(
        sql`SELECT status, "disbursedBy" FROM withdrawal_requests WHERE id = ${id}`
      );
      expect(withdrawal.status).toBe("disbursed");
      expect(Number(withdrawal.disbursedBy)).toBe(treasurer.id);
      const [log] = await rows(
        sql`SELECT count(*) AS n FROM audit_logs
            WHERE entity = 'withdrawal_request' AND "entityId" = ${id}
              AND action = 'DISBURSE'`
      );
      expect(Number(log.n)).toBe(1);
    });

    it("refuses a second disbursement and changes nothing", async () => {
      const id = await approvedWithdrawal(800);
      await callerFor(treasurer).withdrawals.disburse({ id });
      const balance = await fundBalance();

      await expect(
        callerFor(treasurer).withdrawals.disburse({ id })
      ).rejects.toMatchObject({ code: "CONFLICT" });
      expect(await expensesFor(id)).toHaveLength(1);
      expect(await fundBalance()).toBe(balance);
    });

    it("pays once when two disbursements race", async () => {
      const id = await approvedWithdrawal(300);
      const balance = await fundBalance();
      const results = await Promise.allSettled([
        callerFor(treasurer).withdrawals.disburse({ id }),
        callerFor(treasurer).withdrawals.disburse({ id }),
      ]);
      expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
      expect(await expensesFor(id)).toHaveLength(1);
      expect(await fundBalance()).toBe(balance - 300);
    });

    it("does not pay a request that is not approved", async () => {
      const { id } = await callerFor(counter).withdrawals.create({
        amount: 450,
        purpose: "ยังไม่ได้อนุมัติ",
        fundId,
      });
      const balance = await fundBalance();
      await expect(
        callerFor(treasurer).withdrawals.disburse({ id })
      ).rejects.toMatchObject({ code: "CONFLICT" });
      expect(await expensesFor(id)).toHaveLength(0);
      expect(await fundBalance()).toBe(balance);
    });

    it("does not pay a request without a fund", async () => {
      const { id } = await callerFor(counter).withdrawals.create({
        amount: 450,
        purpose: "ไม่ระบุกองทุน",
      });
      await callerFor(treasurer).withdrawals.approve({
        id,
        action: "approved",
        note: "",
      });
      await expect(
        callerFor(treasurer).withdrawals.disburse({ id })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
      expect(await expensesFor(id)).toHaveLength(0);
      const [withdrawal] = await rows(
        sql`SELECT status FROM withdrawal_requests WHERE id = ${id}`
      );
      expect(withdrawal.status).toBe("approved");
    });

    it("keeps the paid expense: no void, no second expense in SQL", async () => {
      const id = await approvedWithdrawal(200);
      const { expenseId } = await callerFor(treasurer).withdrawals.disburse({
        id,
      });
      await expect(
        callerFor(treasurer).expenses.delete({ id: expenseId })
      ).rejects.toMatchObject({ code: "CONFLICT" });
      await expect(
        rows(
          sql`INSERT INTO expenses
                ("churchId", amount, category, description, status, "recordedBy", "withdrawalId")
              VALUES (${TEST_CHURCH_ID}, 200, 'other', 'ซ้ำ', 'paid', ${treasurer.id}, ${id})`
        )
      ).rejects.toThrow();
    });

    it("leaves every disbursed withdrawal with exactly one live expense", async () => {
      const broken = await rows(
        sql`SELECT w.id, count(e.id) AS n
            FROM withdrawal_requests w
            LEFT JOIN expenses e
              ON e."withdrawalId" = w.id AND e.status <> 'voided'
            WHERE w."churchId" = ${TEST_CHURCH_ID} AND w.status = 'disbursed'
            GROUP BY w.id HAVING count(e.id) <> 1`
      );
      expect(broken).toEqual([]);
    });
  });

  describe("fund balance agrees with the ledger", () => {
    it("equals active offerings minus live expenses", async () => {
      expect(await fundBalance()).toBe(await ledgerBalance());
    });
  });
});
