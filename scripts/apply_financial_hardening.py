from pathlib import Path
import re


def replace_exact(text: str, old: str, new: str, expected: int = 1) -> str:
    count = text.count(old)
    if count != expected:
        raise RuntimeError(f"Expected {expected} occurrences, found {count}: {old[:100]!r}")
    return text.replace(old, new)


db_path = Path("server/db.ts")
db = db_path.read_text()

# Exclude voided rows from every date-bounded financial aggregate/report query.
patterns = [
    (
        r'eq\(offerings\.churchId, churchId\),\n(\s*)between\(offerings\.receiptDate',
        r'eq(offerings.churchId, churchId),\n\1ne(offerings.status, "voided"),\n\1between(offerings.receiptDate',
        3,
    ),
    (
        r'eq\(expenses\.churchId, churchId\),\n(\s*)between\(expenses\.expenseDate',
        r'eq(expenses.churchId, churchId),\n\1ne(expenses.status, "voided"),\n\1between(expenses.expenseDate',
        3,
    ),
]
for pattern, replacement, minimum in patterns:
    db, count = re.subn(pattern, replacement, db)
    if count < minimum:
        raise RuntimeError(f"Expected at least {minimum} aggregate matches, found {count}")

# All single-record offering/expense operations must reject voided rows.
db = db.replace(
    'and(eq(offerings.id, id), eq(offerings.churchId, churchId))',
    'and(\n        eq(offerings.id, id),\n        eq(offerings.churchId, churchId),\n        ne(offerings.status, "voided")\n      )',
)
db = db.replace(
    'and(eq(expenses.id, id), eq(expenses.churchId, churchId))',
    'and(\n        eq(expenses.id, id),\n        eq(expenses.churchId, churchId),\n        ne(expenses.status, "voided")\n      )',
)

# Do not adjust balances if a concurrent void/update won the conditional update.
db = replace_exact(
    db,
    '''    await tx
      .update(offerings)
      .set(input as any)
      .where(and(
        eq(offerings.id, id),
        eq(offerings.churchId, churchId),
        ne(offerings.status, "voided")
      ));
    if (input.amount !== undefined || input.fundId !== undefined) {''',
    '''    const updatedRows = await tx
      .update(offerings)
      .set(input as any)
      .where(and(
        eq(offerings.id, id),
        eq(offerings.churchId, churchId),
        ne(offerings.status, "voided")
      ))
      .returning({ id: offerings.id });
    if (!updatedRows[0]) return null;
    if (input.amount !== undefined || input.fundId !== undefined) {''',
)
db = replace_exact(
    db,
    '''    await tx
      .update(expenses)
      .set(input as any)
      .where(and(
        eq(expenses.id, id),
        eq(expenses.churchId, churchId),
        ne(expenses.status, "voided")
      ));
    if (input.amount !== undefined || input.fundId !== undefined) {''',
    '''    const updatedRows = await tx
      .update(expenses)
      .set(input as any)
      .where(and(
        eq(expenses.id, id),
        eq(expenses.churchId, churchId),
        ne(expenses.status, "voided")
      ))
      .returning({ id: expenses.id });
    if (!updatedRows[0]) return null;
    if (input.amount !== undefined || input.fundId !== undefined) {''',
)
db = replace_exact(
    db,
    '''    await tx
      .update(offerings)
      .set({ status: "voided", voidedAt: new Date() })
      .where(and(
        eq(offerings.id, id),
        eq(offerings.churchId, churchId),
        ne(offerings.status, "voided")
      ));
    if (existing[0].fundId)''',
    '''    const updatedRows = await tx
      .update(offerings)
      .set({ status: "voided", voidedAt: new Date() })
      .where(and(
        eq(offerings.id, id),
        eq(offerings.churchId, churchId),
        ne(offerings.status, "voided")
      ))
      .returning({ id: offerings.id });
    if (!updatedRows[0]) return false;
    if (existing[0].fundId)''',
)
db = replace_exact(
    db,
    '''    await tx
      .update(expenses)
      .set({ status: "voided" })
      .where(and(
        eq(expenses.id, id),
        eq(expenses.churchId, churchId),
        ne(expenses.status, "voided")
      ));
    if (existing[0].fundId)''',
    '''    const updatedRows = await tx
      .update(expenses)
      .set({ status: "voided" })
      .where(and(
        eq(expenses.id, id),
        eq(expenses.churchId, churchId),
        ne(expenses.status, "voided")
      ))
      .returning({ id: expenses.id });
    if (!updatedRows[0]) return false;
    if (existing[0].fundId)''',
)

# Enforce withdrawal state transitions atomically.
db = replace_exact(
    db,
    '''  await db
    .update(withdrawalRequests)
    .set({
      status: action,
      approvedBy: approverId,
      approvalDate: new Date(),
      approvalNote: action === "approved" ? note : null,
      rejectionReason: action === "rejected" ? note : null,
    })
    .where(
      and(
        eq(withdrawalRequests.id, id),
        eq(withdrawalRequests.churchId, churchId)
      )
    );''',
    '''  const rows = await db
    .update(withdrawalRequests)
    .set({
      status: action,
      approvedBy: approverId,
      approvalDate: new Date(),
      approvalNote: action === "approved" ? note : null,
      rejectionReason: action === "rejected" ? note : null,
    })
    .where(
      and(
        eq(withdrawalRequests.id, id),
        eq(withdrawalRequests.churchId, churchId),
        eq(withdrawalRequests.status, "pending")
      )
    )
    .returning({ id: withdrawalRequests.id });
  return rows.length > 0;''',
)
db = replace_exact(
    db,
    '''  await db
    .update(withdrawalRequests)
    .set({ status: "disbursed" })
    .where(
      and(
        eq(withdrawalRequests.id, id),
        eq(withdrawalRequests.churchId, churchId)
      )
    );''',
    '''  const rows = await db
    .update(withdrawalRequests)
    .set({ status: "disbursed" })
    .where(
      and(
        eq(withdrawalRequests.id, id),
        eq(withdrawalRequests.churchId, churchId),
        eq(withdrawalRequests.status, "approved")
      )
    )
    .returning({ id: withdrawalRequests.id });
  return rows.length > 0;''',
)

db_path.write_text(db)

router_path = Path("server/routers.ts")
router = router_path.read_text()

# Regular members may only see their own withdrawal requests.
router = replace_exact(
    router,
    'const userId = input?.myOnly ? ctx.user.id : undefined;',
    'const userId = input?.myOnly || !canManageFinance(ctx.user) ? ctx.user.id : undefined;',
)

# Surface invalid withdrawal transitions rather than reporting false success.
router = replace_exact(
    router,
    '''        await approveWithdrawal(
          input.id,
          ctx.user.id,
          input.action,
          input.note
        );
        return { success: true } as const;''',
    '''        const updated = await approveWithdrawal(
          input.id,
          ctx.user.id,
          input.action,
          input.note
        );
        if (!updated) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "คำขอเบิกนี้ไม่ได้อยู่ในสถานะรออนุมัติ",
          });
        }
        return { success: true } as const;''',
)
router = replace_exact(
    router,
    '''      .mutation(async ({ input }) => {
        await disburseWithdrawal(input.id);
        return { success: true } as const;
      }),''',
    '''      .mutation(async ({ input }) => {
        const updated = await disburseWithdrawal(input.id);
        if (!updated) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "ต้องอนุมัติคำขอเบิกก่อนจ่ายเงิน",
          });
        }
        return { success: true } as const;
      }),''',
)

# Member records contain sensitive data; restrict mutations to church leaders.
start = router.index('  members: router({')
end = router.index('  // ── Notifications', start)
members_block = router[start:end]
members_block = replace_exact(members_block, '    create: protectedProcedure', '    create: churchLeaderProcedure')
members_block = replace_exact(members_block, '    update: protectedProcedure', '    update: churchLeaderProcedure')
members_block = replace_exact(members_block, '    deactivate: protectedProcedure', '    deactivate: churchLeaderProcedure')
router = router[:start] + members_block + router[end:]

# Validate event chronology as documented.
router = replace_exact(
    router,
    '''          status: eventStatus.default("draft"),
        })
      )''',
    '''          status: eventStatus.default("draft"),
        }).refine(data => !data.endsAt || data.endsAt >= data.startsAt, {
          message: "เวลาสิ้นสุดต้องไม่มาก่อนเวลาเริ่มต้น",
          path: ["endsAt"],
        })
      )''',
)
router = replace_exact(
    router,
    '''          status: eventStatus,
        })
      )''',
    '''          status: eventStatus,
        }).refine(data => !data.endsAt || data.endsAt >= data.startsAt, {
          message: "เวลาสิ้นสุดต้องไม่มาก่อนเวลาเริ่มต้น",
          path: ["endsAt"],
        })
      )''',
)

router_path.write_text(router)

# Add access/validation regression coverage that does not require a live database.
test_path = Path("server/security.regression.test.ts")
test_path.write_text('''import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type User = NonNullable<TrpcContext["user"]>;

function createContext(user: User | null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

const member: User = {
  id: 2,
  openId: "member",
  email: "member@example.com",
  name: "Member",
  loginMethod: "manus",
  role: "user",
  churchRole: "MEMBER",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const admin: User = {
  ...member,
  id: 1,
  openId: "admin",
  role: "admin",
  churchRole: "SUPER_ADMIN",
};

describe("security regressions", () => {
  it("blocks regular members from mutating member records", async () => {
    const caller = appRouter.createCaller(createContext(member));
    await expect(caller.members.create({ name: "Example Member" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.members.update({ id: 1, name: "Changed" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.members.deactivate({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects an event whose end precedes its start", async () => {
    const caller = appRouter.createCaller(createContext(admin));
    await expect(caller.updates.createEvent({
      title: "กิจกรรมทดสอบ",
      summary: "กิจกรรมสำหรับทดสอบเวลา",
      description: "รายละเอียดกิจกรรมทดสอบ",
      startsAt: new Date("2026-09-18T10:00:00Z"),
      endsAt: new Date("2026-09-18T09:00:00Z"),
      status: "draft",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
''')
