import {
  and,
  asc,
  between,
  count,
  desc,
  eq,
  gte,
  lte,
  ne,
  sql,
  sum,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  bankRecords,
  budgetPlans,
  cashCounts,
  churchEvents,
  churchNews,
  churchProfiles,
  countingSessions,
  expenses,
  financeAccounts,
  InsertBankRecord,
  InsertCashCount,
  InsertChurchEvent,
  InsertChurchNews,
  InsertChurchProfile,
  InsertCountingSession,
  InsertExpense,
  InsertFinanceAccount,
  InsertOffering,
  InsertOfferingEnvelope,
  InsertSessionDeduction,
  InsertSessionDocument,
  InsertUser,
  InsertWithdrawalRequest,
  InsertMember,
  InsertNotification,
  auditLogs,
  members,
  notifications,
  offeringEnvelopes,
  offerings,
  sessionDeductions,
  sessionDocuments,
  users,
  withdrawalRequests,
} from "../drizzle/schema";
import type { CountingStatus } from "@shared/counting";
import { reconcile } from "@shared/counting";
import { ENV } from "./_core/env";

import { runSchemaInit } from "./schema_init";

let _db: ReturnType<typeof drizzle> | null = null;
let _schemaInitialized = false;

export const DEFAULT_CHURCH_ID = "demo-church";

export async function getDb() {
  const dbUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL;
  if (!_db && dbUrl) {
    try {
      // Supabase / Neon transaction pooler requires prepared statements off.
      const client = postgres(dbUrl, { prepare: false });
      // Eager health-check: `postgres` connects lazily, so verify now to preserve
      // the getDb()-returns-null (never throws) contract on unreachable URLs.
      await client`SELECT 1`;

      if (!_schemaInitialized) {
        _schemaInitialized = true;
        try {
          console.log("[Database] Ensuring tables and schema exist for Neon Postgres...");
          await runSchemaInit(client);
          console.log("[Database] Tables verified/created successfully.");
        } catch (initErr) {
          console.warn("[Database] Schema init warning:", initErr);
        }
      }

      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (user.churchRole !== undefined) {
    values.churchRole = user.churchRole;
    updateSet.churchRole = user.churchRole;
  }
  values.lastSignedIn ??= new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db
    .insert(users)
    .values(values)
    .onConflictDoUpdate({ target: users.openId, set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select({
      id: users.id,
      openId: users.openId,
      name: users.name,
      email: users.email,
      loginMethod: users.loginMethod,
      role: users.role,
      churchRole: users.churchRole,
      churchRoles: users.churchRoles,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
    })
    .from(users)
    .orderBy(desc(users.lastSignedIn));
}

export async function updateUserChurchRole(
  userId: number,
  churchRole: string | null,
  churchRoles?: string[] | null
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rolesString = churchRoles ? churchRoles.join(",") : churchRole;
  const isSuperAdmin =
    churchRole === "SUPER_ADMIN" ||
    Boolean(churchRoles && churchRoles.includes("SUPER_ADMIN"));
  const role = isSuperAdmin ? "admin" : "user";
  await db
    .update(users)
    .set({
      churchRole,
      churchRoles: rolesString,
      role,
      updatedAt: new Date(),
    } as any)
    .where(eq(users.id, userId));
}

export async function updateUserProfile(
  userId: number,
  input: { name?: string }
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(users)
    .set({
      ...(input.name ? { name: input.name } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

// ─── Church Profile ───────────────────────────────────────────────────────────

export async function getChurchProfile(churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(churchProfiles)
    .where(eq(churchProfiles.churchId, churchId))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertChurchProfile(input: InsertChurchProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const churchId = input.churchId ?? DEFAULT_CHURCH_ID;
  const { id, createdAt, churchId: _c, ...updateFields } = input;
  await db
    .insert(churchProfiles)
    .values({ ...input, churchId })
    .onConflictDoUpdate({
      target: churchProfiles.churchId,
      set: { ...updateFields, updatedAt: new Date() },
    });
}

export async function markSetupCompleted(churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(churchProfiles)
    .set({ setupCompleted: true })
    .where(eq(churchProfiles.churchId, churchId));
}

// ─── Finance Accounts / Funds ──────────────────────────────────────────────────

export async function listFinanceAccounts(churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(financeAccounts)
    .where(
      and(
        eq(financeAccounts.churchId, churchId),
        eq(financeAccounts.isActive, true)
      )
    )
    .orderBy(asc(financeAccounts.sortOrder), asc(financeAccounts.name));
}

export async function createFinanceAccount(input: InsertFinanceAccount) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db
    .insert(financeAccounts)
    .values({ ...input, churchId: input.churchId ?? DEFAULT_CHURCH_ID })
    .returning({ id: financeAccounts.id });
  return result[0].id;
}

// ─── Financial Summary ────────────────────────────────────────────────────────

export type FinancialSummary = {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  prevMonthIncome: number;
  prevMonthExpense: number;
  accounts: Array<{ id: number; name: string; type: string; balance: number }>;
};

export async function getFinancialSummary(
  churchId = DEFAULT_CHURCH_ID
): Promise<FinancialSummary | null> {
  const db = await getDb();
  if (!db) return null;

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59
  );
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59
  );

  try {
    const [accounts, thisOfferings, prevOfferings, thisExpenses, prevExpenses] =
      await Promise.all([
        db
          .select()
          .from(financeAccounts)
          .where(
            and(
              eq(financeAccounts.churchId, churchId),
              eq(financeAccounts.isActive, true)
            )
          ),
        db
          .select({ total: sum(offerings.amount) })
          .from(offerings)
          .where(
            and(
              eq(offerings.churchId, churchId),
              ne(offerings.status, "voided"),
              between(offerings.receiptDate, thisMonthStart, thisMonthEnd)
            )
          ),
        db
          .select({ total: sum(offerings.amount) })
          .from(offerings)
          .where(
            and(
              eq(offerings.churchId, churchId),
              ne(offerings.status, "voided"),
              between(offerings.receiptDate, prevMonthStart, prevMonthEnd)
            )
          ),
        db
          .select({ total: sum(expenses.amount) })
          .from(expenses)
          .where(
            and(
              eq(expenses.churchId, churchId),
              ne(expenses.status, "voided"),
              between(expenses.expenseDate, thisMonthStart, thisMonthEnd)
            )
          ),
        db
          .select({ total: sum(expenses.amount) })
          .from(expenses)
          .where(
            and(
              eq(expenses.churchId, churchId),
              ne(expenses.status, "voided"),
              between(expenses.expenseDate, prevMonthStart, prevMonthEnd)
            )
          ),
      ]);

    const totalBalance = accounts.reduce(
      (sum, a) => sum + parseFloat((a.balance as unknown as string) ?? "0"),
      0
    );
    const monthlyIncome =
      parseFloat((thisOfferings[0]?.total as unknown as string) ?? "0") || 0;
    const monthlyExpense =
      parseFloat((thisExpenses[0]?.total as unknown as string) ?? "0") || 0;
    const prevMonthIncome =
      parseFloat((prevOfferings[0]?.total as unknown as string) ?? "0") || 0;
    const prevMonthExpense =
      parseFloat((prevExpenses[0]?.total as unknown as string) ?? "0") || 0;

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      prevMonthIncome,
      prevMonthExpense,
      accounts: accounts.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        balance: parseFloat((a.balance as unknown as string) ?? "0"),
      })),
    };
  } catch {
    return null;
  }
}

export type MonthlyStats = Array<{
  month: string;
  income: number;
  expense: number;
}>;

export async function getMonthlyStats(
  churchId = DEFAULT_CHURCH_ID,
  months = 6
): Promise<MonthlyStats> {
  const db = await getDb();
  if (!db) return [];

  const result: MonthlyStats = [];
  const now = new Date();
  const thaiMonths = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
  ];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

    const [inc, exp] = await Promise.all([
      db
        .select({ total: sum(offerings.amount) })
        .from(offerings)
        .where(
          and(
            eq(offerings.churchId, churchId),
            ne(offerings.status, "voided"),
            between(offerings.receiptDate, start, end)
          )
        ),
      db
        .select({ total: sum(expenses.amount) })
        .from(expenses)
        .where(
          and(
            eq(expenses.churchId, churchId),
            ne(expenses.status, "voided"),
            between(expenses.expenseDate, start, end)
          )
        ),
    ]);

    result.push({
      month: thaiMonths[d.getMonth()],
      income: parseFloat((inc[0]?.total as unknown as string) ?? "0") || 0,
      expense: parseFloat((exp[0]?.total as unknown as string) ?? "0") || 0,
    });
  }
  return result;
}

// ─── Offerings ────────────────────────────────────────────────────────────────

export type OfferingRow = {
  id: number;
  amount: number;
  category: string;
  donorName: string | null;
  receiptDate: Date;
  method: string;
  notes: string | null;
  fundId: number | null;
};

export async function listOfferings(
  churchId = DEFAULT_CHURCH_ID,
  opts: {
    limit?: number;
    showDonorNames?: boolean;
    fromDate?: Date;
    toDate?: Date;
  } = {}
): Promise<OfferingRow[]> {
  const db = await getDb();
  if (!db) return [];
  const { limit = 50, showDonorNames = false, fromDate, toDate } = opts;

  const conditions = [
    eq(offerings.churchId, churchId),
    ne(offerings.status, "voided"),
  ];
  if (fromDate) conditions.push(gte(offerings.receiptDate, fromDate));
  if (toDate) conditions.push(lte(offerings.receiptDate, toDate));

  const rows = await db
    .select()
    .from(offerings)
    .where(and(...conditions))
    .orderBy(desc(offerings.receiptDate))
    .limit(limit);

  return rows.map(r => ({
    id: r.id,
    amount: parseFloat((r.amount as unknown as string) ?? "0"),
    category: r.category,
    donorName: showDonorNames
      ? r.donorName
      : r.donorName
        ? "ผู้ถวายนิรนาม"
        : null,
    receiptDate: r.receiptDate,
    method: r.method,
    notes: r.notes,
    fundId: r.fundId,
  }));
}

export async function getOfferingById(
  id: number,
  churchId = DEFAULT_CHURCH_ID,
  showDonorNames = false
): Promise<OfferingRow | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(offerings)
    .where(
      and(
        eq(offerings.id, id),
        eq(offerings.churchId, churchId),
        ne(offerings.status, "voided")
      )
    )
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    amount: parseFloat((row.amount as unknown as string) ?? "0"),
    category: row.category,
    donorName: showDonorNames
      ? row.donorName
      : row.donorName
        ? "ผู้ถวายนิรนาม"
        : null,
    receiptDate: row.receiptDate,
    method: row.method,
    notes: row.notes,
    fundId: row.fundId,
  };
}

export async function createOffering(
  input: Omit<InsertOffering, "churchId">,
  churchId = DEFAULT_CHURCH_ID
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async tx => {
    const result = await tx
      .insert(offerings)
      .values({ ...input, churchId })
      .returning({ id: offerings.id });
    // Update fund balance in the same transaction as the offering insert.
    if (input.fundId) {
      await tx.execute(
        sql`UPDATE finance_accounts SET balance = balance + ${input.amount} WHERE id = ${input.fundId} AND "churchId" = ${churchId}`
      );
    }
    return result[0].id;
  });
}

export async function updateOffering(
  id: number,
  input: Partial<Omit<InsertOffering, "churchId" | "recordedBy">>,
  churchId = DEFAULT_CHURCH_ID
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async tx => {
    const existing = await tx
      .select({ amount: offerings.amount, fundId: offerings.fundId })
      .from(offerings)
      .where(
        and(
          eq(offerings.id, id),
          eq(offerings.churchId, churchId),
          ne(offerings.status, "voided")
        )
      )
      .limit(1);
    if (!existing[0]) return null;
    const updatedRows = await tx
      .update(offerings)
      .set(input as any)
      .where(
        and(
          eq(offerings.id, id),
          eq(offerings.churchId, churchId),
          ne(offerings.status, "voided")
        )
      )
      .returning({ id: offerings.id });
    if (!updatedRows[0]) return null;
    if (input.amount !== undefined || input.fundId !== undefined) {
      const oldAmount = Number(existing[0].amount);
      const newAmount =
        input.amount === undefined ? oldAmount : Number(input.amount);
      const oldFundId = existing[0].fundId;
      const newFundId = input.fundId === undefined ? oldFundId : input.fundId;
      if (oldFundId)
        await tx.execute(
          sql`UPDATE finance_accounts SET balance = balance - ${oldAmount} WHERE id = ${oldFundId} AND "churchId" = ${churchId}`
        );
      if (newFundId)
        await tx.execute(
          sql`UPDATE finance_accounts SET balance = balance + ${newAmount} WHERE id = ${newFundId} AND "churchId" = ${churchId}`
        );
    }
    return id;
  });
}

export async function deleteOffering(id: number, churchId = DEFAULT_CHURCH_ID) {
  return voidOffering(id, churchId);
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export type ExpenseRow = {
  id: number;
  amount: number;
  category: string;
  description: string;
  expenseDate: Date;
  payee: string | null;
  status: string;
  fundId: number | null;
};

export async function listExpenses(
  churchId = DEFAULT_CHURCH_ID,
  opts: { limit?: number; fromDate?: Date; toDate?: Date } = {}
): Promise<ExpenseRow[]> {
  const db = await getDb();
  if (!db) return [];
  const { limit = 50, fromDate, toDate } = opts;

  const conditions = [
    eq(expenses.churchId, churchId),
    ne(expenses.status, "voided"),
  ];
  if (fromDate) conditions.push(gte(expenses.expenseDate, fromDate));
  if (toDate) conditions.push(lte(expenses.expenseDate, toDate));

  const rows = await db
    .select()
    .from(expenses)
    .where(and(...conditions))
    .orderBy(desc(expenses.expenseDate))
    .limit(limit);

  return rows.map(r => ({
    id: r.id,
    amount: parseFloat((r.amount as unknown as string) ?? "0"),
    category: r.category,
    description: r.description,
    expenseDate: r.expenseDate,
    payee: r.payee,
    status: r.status,
    fundId: r.fundId,
  }));
}

export async function getExpenseById(
  id: number,
  churchId = DEFAULT_CHURCH_ID
): Promise<ExpenseRow | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(expenses)
    .where(
      and(
        eq(expenses.id, id),
        eq(expenses.churchId, churchId),
        ne(expenses.status, "voided")
      )
    )
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    amount: parseFloat((row.amount as unknown as string) ?? "0"),
    category: row.category,
    description: row.description,
    expenseDate: row.expenseDate,
    payee: row.payee,
    status: row.status,
    fundId: row.fundId,
  };
}

export async function createExpense(
  input: Omit<InsertExpense, "churchId">,
  churchId = DEFAULT_CHURCH_ID
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async tx => {
    const result = await tx
      .insert(expenses)
      .values({ ...input, churchId })
      .returning({ id: expenses.id });
    // Deduct fund balance in the same transaction as the expense insert.
    if (input.fundId) {
      await tx.execute(
        sql`UPDATE finance_accounts SET balance = balance - ${input.amount} WHERE id = ${input.fundId} AND "churchId" = ${churchId}`
      );
    }
    return result[0].id;
  });
}

export async function updateExpense(
  id: number,
  input: Partial<Omit<InsertExpense, "churchId" | "recordedBy">>,
  churchId = DEFAULT_CHURCH_ID
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async tx => {
    const existing = await tx
      .select({ amount: expenses.amount, fundId: expenses.fundId })
      .from(expenses)
      .where(
        and(
          eq(expenses.id, id),
          eq(expenses.churchId, churchId),
          ne(expenses.status, "voided")
        )
      )
      .limit(1);
    if (!existing[0]) return null;
    const updatedRows = await tx
      .update(expenses)
      .set(input as any)
      .where(
        and(
          eq(expenses.id, id),
          eq(expenses.churchId, churchId),
          ne(expenses.status, "voided")
        )
      )
      .returning({ id: expenses.id });
    if (!updatedRows[0]) return null;
    if (input.amount !== undefined || input.fundId !== undefined) {
      const oldAmount = Number(existing[0].amount);
      const newAmount =
        input.amount === undefined ? oldAmount : Number(input.amount);
      const oldFundId = existing[0].fundId;
      const newFundId = input.fundId === undefined ? oldFundId : input.fundId;
      if (oldFundId)
        await tx.execute(
          sql`UPDATE finance_accounts SET balance = balance + ${oldAmount} WHERE id = ${oldFundId} AND "churchId" = ${churchId}`
        );
      if (newFundId)
        await tx.execute(
          sql`UPDATE finance_accounts SET balance = balance - ${newAmount} WHERE id = ${newFundId} AND "churchId" = ${churchId}`
        );
    }
    return id;
  });
}

export async function deleteExpense(id: number, churchId = DEFAULT_CHURCH_ID) {
  return voidExpense(id, churchId);
}

export async function voidOffering(id: number, churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async tx => {
    const existing = await tx
      .select({
        amount: offerings.amount,
        fundId: offerings.fundId,
        status: offerings.status,
      })
      .from(offerings)
      .where(
        and(
          eq(offerings.id, id),
          eq(offerings.churchId, churchId),
          ne(offerings.status, "voided")
        )
      )
      .limit(1);
    if (!existing[0] || existing[0].status === "voided") return false;
    const updatedRows = await tx
      .update(offerings)
      .set({ status: "voided", voidedAt: new Date() })
      .where(
        and(
          eq(offerings.id, id),
          eq(offerings.churchId, churchId),
          ne(offerings.status, "voided")
        )
      )
      .returning({ id: offerings.id });
    if (!updatedRows[0]) return false;
    if (existing[0].fundId)
      await tx.execute(
        sql`UPDATE finance_accounts SET balance = balance - ${Number(existing[0].amount)} WHERE id = ${existing[0].fundId} AND "churchId" = ${churchId}`
      );
    return true;
  });
}

export async function voidExpense(id: number, churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async tx => {
    const existing = await tx
      .select({
        amount: expenses.amount,
        fundId: expenses.fundId,
        status: expenses.status,
      })
      .from(expenses)
      .where(
        and(
          eq(expenses.id, id),
          eq(expenses.churchId, churchId),
          ne(expenses.status, "voided")
        )
      )
      .limit(1);
    if (!existing[0] || existing[0].status === "voided") return false;
    const updatedRows = await tx
      .update(expenses)
      .set({ status: "voided" })
      .where(
        and(
          eq(expenses.id, id),
          eq(expenses.churchId, churchId),
          ne(expenses.status, "voided")
        )
      )
      .returning({ id: expenses.id });
    if (!updatedRows[0]) return false;
    if (existing[0].fundId)
      await tx.execute(
        sql`UPDATE finance_accounts SET balance = balance + ${Number(existing[0].amount)} WHERE id = ${existing[0].fundId} AND "churchId" = ${churchId}`
      );
    return true;
  });
}

// ─── Withdrawal Requests ──────────────────────────────────────────────────────

export async function listWithdrawalRequests(
  churchId = DEFAULT_CHURCH_ID,
  opts: { userId?: number; status?: string } = {}
) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(withdrawalRequests.churchId, churchId)];
  if (opts.userId)
    conditions.push(eq(withdrawalRequests.requestedBy, opts.userId));

  const rows = await db
    .select()
    .from(withdrawalRequests)
    .where(and(...conditions))
    .orderBy(desc(withdrawalRequests.createdAt))
    .limit(50);

  return rows.map(r => ({
    ...r,
    amount: parseFloat((r.amount as unknown as string) ?? "0"),
  }));
}

export async function createWithdrawalRequest(
  input: Omit<InsertWithdrawalRequest, "churchId">,
  churchId = DEFAULT_CHURCH_ID
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db
    .insert(withdrawalRequests)
    .values({ ...input, churchId })
    .returning({ id: withdrawalRequests.id });
  return result[0].id;
}

export async function approveWithdrawal(
  id: number,
  approverId: number,
  action: "approved" | "rejected",
  note: string,
  churchId = DEFAULT_CHURCH_ID
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db
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
  return rows.length > 0;
}

export async function disburseWithdrawal(
  id: number,
  churchId = DEFAULT_CHURCH_ID
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db
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
  return rows.length > 0;
}

// ─── Members / Notifications / Audit ──────────────────────────────────────────

export async function listMembers(churchId = DEFAULT_CHURCH_ID, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(members)
    .where(eq(members.churchId, churchId))
    .orderBy(asc(members.name))
    .limit(limit);
}

export async function getMemberById(id: number, churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(members)
    .where(and(eq(members.id, id), eq(members.churchId, churchId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createMember(
  input: Omit<InsertMember, "churchId">,
  churchId = DEFAULT_CHURCH_ID
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db
    .insert(members)
    .values({ ...input, churchId })
    .returning({ id: members.id });
  return rows[0].id;
}

export async function updateMember(
  id: number,
  input: Partial<Omit<InsertMember, "churchId">>,
  churchId = DEFAULT_CHURCH_ID
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db
    .update(members)
    .set(input)
    .where(and(eq(members.id, id), eq(members.churchId, churchId)))
    .returning({ id: members.id });
  return rows[0]?.id ?? null;
}

export async function deactivateMember(
  id: number,
  churchId = DEFAULT_CHURCH_ID
) {
  return updateMember(id, { status: "inactive" }, churchId);
}

export async function listNotifications(
  userId: number,
  churchId = DEFAULT_CHURCH_ID,
  limit = 50
) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.churchId, churchId)
      )
    )
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function createNotification(
  input: Omit<InsertNotification, "churchId" | "createdAt" | "readAt">,
  churchId = DEFAULT_CHURCH_ID
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db
    .insert(notifications)
    .values({ ...input, churchId })
    .returning({ id: notifications.id });
  return rows[0].id;
}

export async function markNotificationRead(
  id: number,
  userId: number,
  churchId = DEFAULT_CHURCH_ID
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.id, id),
        eq(notifications.userId, userId),
        eq(notifications.churchId, churchId)
      )
    );
}

export async function markAllNotificationsRead(
  userId: number,
  churchId = DEFAULT_CHURCH_ID
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.churchId, churchId)
      )
    );
}

export async function createAuditLog(
  input: Omit<
    InsertNotification,
    | "userId"
    | "type"
    | "title"
    | "description"
    | "link"
    | "readAt"
    | "createdAt"
  > & {
    userId: number;
    action: string;
    entity: string;
    entityId?: number | null;
    metadata?: unknown;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(auditLogs).values({
    churchId: input.churchId,
    userId: input.userId,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId ?? null,
    metadata: input.metadata,
  });
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export type ReportRow = {
  date: string;
  type: "income" | "expense";
  category: string;
  description: string;
  amount: number;
  method?: string;
};

export async function getFinancialReportData(
  churchId = DEFAULT_CHURCH_ID,
  fromDate: Date,
  toDate: Date
): Promise<ReportRow[]> {
  const db = await getDb();
  if (!db) return [];

  const [offeringsRows, expensesRows] = await Promise.all([
    db
      .select()
      .from(offerings)
      .where(
        and(
          eq(offerings.churchId, churchId),
          ne(offerings.status, "voided"),
          between(offerings.receiptDate, fromDate, toDate)
        )
      )
      .orderBy(asc(offerings.receiptDate)),
    db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.churchId, churchId),
          ne(expenses.status, "voided"),
          between(expenses.expenseDate, fromDate, toDate)
        )
      )
      .orderBy(asc(expenses.expenseDate)),
  ]);

  const rows: ReportRow[] = [
    ...offeringsRows.map(r => ({
      date: r.receiptDate.toISOString().split("T")[0],
      type: "income" as const,
      category: r.category,
      description: r.notes || `ถวาย${r.category}`,
      amount: parseFloat((r.amount as unknown as string) ?? "0"),
      method: r.method,
    })),
    ...expensesRows.map(r => ({
      date: r.expenseDate.toISOString().split("T")[0],
      type: "expense" as const,
      category: r.category,
      description: r.description,
      amount: parseFloat((r.amount as unknown as string) ?? "0"),
    })),
  ];

  return rows.sort((a, b) => a.date.localeCompare(b.date));
}

export async function getBudgetComparison(
  churchId = DEFAULT_CHURCH_ID,
  year: number
) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(budgetPlans)
    .where(and(eq(budgetPlans.churchId, churchId), eq(budgetPlans.year, year)));
}

// ─── News & Events (existing) ─────────────────────────────────────────────────

export async function listPublishedChurchNews(limit = 12) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(churchNews)
    .where(
      and(
        eq(churchNews.churchId, DEFAULT_CHURCH_ID),
        eq(churchNews.status, "published")
      )
    )
    .orderBy(desc(churchNews.publishedAt), desc(churchNews.createdAt))
    .limit(limit);
}

export async function listPublishedChurchEvents(limit = 12) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(churchEvents)
    .where(
      and(
        eq(churchEvents.churchId, DEFAULT_CHURCH_ID),
        eq(churchEvents.status, "published")
      )
    )
    .orderBy(asc(churchEvents.startsAt))
    .limit(limit);
}

export async function listAllChurchNews(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(churchNews)
    .where(eq(churchNews.churchId, DEFAULT_CHURCH_ID))
    .orderBy(desc(churchNews.updatedAt))
    .limit(limit);
}

export async function listAllChurchEvents(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(churchEvents)
    .where(eq(churchEvents.churchId, DEFAULT_CHURCH_ID))
    .orderBy(desc(churchEvents.updatedAt))
    .limit(limit);
}

export async function createChurchNews(
  input: Omit<InsertChurchNews, "churchId">
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db
    .insert(churchNews)
    .values({ ...input, churchId: DEFAULT_CHURCH_ID })
    .returning({ id: churchNews.id });
  return result[0].id;
}

export async function createChurchEvent(
  input: Omit<InsertChurchEvent, "churchId">
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db
    .insert(churchEvents)
    .values({ ...input, churchId: DEFAULT_CHURCH_ID })
    .returning({ id: churchEvents.id });
  return result[0].id;
}

export async function updateChurchNews(
  id: number,
  input: Omit<InsertChurchNews, "churchId" | "authorId">
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(churchNews)
    .set(input)
    .where(
      and(eq(churchNews.id, id), eq(churchNews.churchId, DEFAULT_CHURCH_ID))
    );
}

export async function updateChurchEvent(
  id: number,
  input: Omit<InsertChurchEvent, "churchId" | "authorId">
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(churchEvents)
    .set(input)
    .where(
      and(eq(churchEvents.id, id), eq(churchEvents.churchId, DEFAULT_CHURCH_ID))
    );
}

export async function updateChurchNewsStatus(
  id: number,
  status: "draft" | "published" | "archived"
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(churchNews)
    .set({
      status,
      publishedAt: status === "published" ? new Date() : undefined,
    })
    .where(
      and(eq(churchNews.id, id), eq(churchNews.churchId, DEFAULT_CHURCH_ID))
    );
}

export async function updateChurchEventStatus(
  id: number,
  status: "draft" | "published" | "cancelled"
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(churchEvents)
    .set({ status })
    .where(
      and(eq(churchEvents.id, id), eq(churchEvents.churchId, DEFAULT_CHURCH_ID))
    );
}

export async function deleteChurchNews(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .delete(churchNews)
    .where(
      and(eq(churchNews.id, id), eq(churchNews.churchId, DEFAULT_CHURCH_ID))
    );
}

export async function deleteChurchEvent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .delete(churchEvents)
    .where(
      and(eq(churchEvents.id, id), eq(churchEvents.churchId, DEFAULT_CHURCH_ID))
    );
}

// ─── Weekly Offering Counting ─────────────────────────────────────────────────

const num = (value: unknown) => parseFloat((value as string) ?? "0");

export async function listCountingSessions(
  churchId = DEFAULT_CHURCH_ID,
  limit = 52
) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(countingSessions)
    .where(eq(countingSessions.churchId, churchId))
    .orderBy(desc(countingSessions.serviceDate))
    .limit(limit);
  return rows;
}

export async function getCountingSession(
  id: number,
  churchId = DEFAULT_CHURCH_ID
) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(countingSessions)
    .where(
      and(eq(countingSessions.id, id), eq(countingSessions.churchId, churchId))
    )
    .limit(1);
  return rows[0] ?? null;
}

/**
 * The session with every part needed to reconcile it. Returns null when the
 * session does not exist, so callers can map that to NOT_FOUND.
 */
export async function getCountingSessionDetail(
  id: number,
  churchId = DEFAULT_CHURCH_ID
) {
  const db = await getDb();
  if (!db) return null;
  const session = await getCountingSession(id, churchId);
  if (!session) return null;

  const [envelopeRows, cashRows, deductionRows, bankRows, documentRows] =
    await Promise.all([
      db
        .select()
        .from(offeringEnvelopes)
        .where(eq(offeringEnvelopes.sessionId, id))
        .orderBy(asc(offeringEnvelopes.id)),
      db
        .select()
        .from(cashCounts)
        .where(eq(cashCounts.sessionId, id))
        .orderBy(desc(cashCounts.denomination)),
      db
        .select()
        .from(sessionDeductions)
        .where(eq(sessionDeductions.sessionId, id))
        .orderBy(asc(sessionDeductions.id)),
      db
        .select()
        .from(bankRecords)
        .where(eq(bankRecords.sessionId, id))
        .orderBy(asc(bankRecords.id)),
      db
        .select()
        .from(sessionDocuments)
        .where(eq(sessionDocuments.sessionId, id))
        .orderBy(desc(sessionDocuments.createdAt)),
    ]);

  const envelopes = envelopeRows.map(r => ({ ...r, amount: num(r.amount) }));
  const cash = cashRows.map(r => ({
    ...r,
    denomination: num(r.denomination),
  }));
  const deductions = deductionRows.map(r => ({ ...r, amount: num(r.amount) }));
  const bank = bankRows.map(r => ({ ...r, amount: num(r.amount) }));

  return {
    session,
    envelopes,
    cashCounts: cash,
    deductions,
    bankRecords: bank,
    documents: documentRows,
    reconciliation: reconcile({
      envelopes,
      cashCounts: cash,
      deductions,
      bankRecords: bank,
    }),
  };
}

export async function createCountingSession(
  input: Omit<InsertCountingSession, "churchId">,
  churchId = DEFAULT_CHURCH_ID
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db
    .insert(countingSessions)
    .values({ ...input, churchId })
    .returning({ id: countingSessions.id });
  return rows[0].id;
}

export async function updateCountingSession(
  id: number,
  input: Partial<Omit<InsertCountingSession, "churchId">>,
  churchId = DEFAULT_CHURCH_ID
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db
    .update(countingSessions)
    .set(input)
    .where(
      and(eq(countingSessions.id, id), eq(countingSessions.churchId, churchId))
    )
    .returning({ id: countingSessions.id });
  return rows[0]?.id ?? null;
}

/**
 * Moves the session to a new status, but only from the status the caller saw.
 * The `from` guard makes the update a compare-and-set, so two people pressing
 * the same button cannot both succeed.
 */
export async function setCountingSessionStatus(
  id: number,
  from: CountingStatus,
  to: CountingStatus,
  patch: Partial<Omit<InsertCountingSession, "churchId" | "status">> = {},
  churchId = DEFAULT_CHURCH_ID
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db
    .update(countingSessions)
    .set({ ...patch, status: to })
    .where(
      and(
        eq(countingSessions.id, id),
        eq(countingSessions.churchId, churchId),
        eq(countingSessions.status, from)
      )
    )
    .returning({ id: countingSessions.id });
  return rows.length > 0;
}

export async function addOfferingEnvelope(
  input: Omit<InsertOfferingEnvelope, "churchId">,
  churchId = DEFAULT_CHURCH_ID
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db
    .insert(offeringEnvelopes)
    .values({ ...input, churchId })
    .returning({ id: offeringEnvelopes.id });
  return rows[0].id;
}

export async function updateOfferingEnvelope(
  id: number,
  sessionId: number,
  input: Partial<Omit<InsertOfferingEnvelope, "churchId" | "sessionId">>
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db
    .update(offeringEnvelopes)
    .set(input)
    .where(
      and(
        eq(offeringEnvelopes.id, id),
        eq(offeringEnvelopes.sessionId, sessionId)
      )
    )
    .returning({ id: offeringEnvelopes.id });
  return rows[0]?.id ?? null;
}

export async function deleteOfferingEnvelope(id: number, sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db
    .delete(offeringEnvelopes)
    .where(
      and(
        eq(offeringEnvelopes.id, id),
        eq(offeringEnvelopes.sessionId, sessionId)
      )
    )
    .returning({ id: offeringEnvelopes.id });
  return rows.length > 0;
}

/** One row per denomination per session; writing the same denomination twice updates it. */
export async function setCashCount(
  input: InsertCashCount & { denomination: string }
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async tx => {
    const existing = await tx
      .select({ id: cashCounts.id })
      .from(cashCounts)
      .where(
        and(
          eq(cashCounts.sessionId, input.sessionId),
          eq(cashCounts.denomination, input.denomination),
          eq(cashCounts.kind, input.kind)
        )
      )
      .limit(1);
    if (existing[0]) {
      await tx
        .update(cashCounts)
        .set({ quantity: input.quantity })
        .where(eq(cashCounts.id, existing[0].id));
      return existing[0].id;
    }
    const rows = await tx
      .insert(cashCounts)
      .values(input)
      .returning({ id: cashCounts.id });
    return rows[0].id;
  });
}

export async function addSessionDeduction(
  input: Omit<InsertSessionDeduction, "churchId">,
  churchId = DEFAULT_CHURCH_ID
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db
    .insert(sessionDeductions)
    .values({ ...input, churchId })
    .returning({ id: sessionDeductions.id });
  return rows[0].id;
}

/** Approves a deduction. Rejects the attempt when the approver requested it. */
export async function approveSessionDeduction(
  id: number,
  approverId: number,
  churchId = DEFAULT_CHURCH_ID
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db
    .update(sessionDeductions)
    .set({ approvedBy: approverId, approvedAt: new Date() })
    .where(
      and(
        eq(sessionDeductions.id, id),
        eq(sessionDeductions.churchId, churchId),
        ne(sessionDeductions.requestedBy, approverId)
      )
    )
    .returning({ id: sessionDeductions.id });
  return rows.length > 0;
}

export async function deleteSessionDeduction(id: number, sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db
    .delete(sessionDeductions)
    .where(
      and(
        eq(sessionDeductions.id, id),
        eq(sessionDeductions.sessionId, sessionId)
      )
    )
    .returning({ id: sessionDeductions.id });
  return rows.length > 0;
}

export async function addBankRecord(
  input: Omit<InsertBankRecord, "churchId">,
  churchId = DEFAULT_CHURCH_ID
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db
    .insert(bankRecords)
    .values({ ...input, churchId })
    .returning({ id: bankRecords.id });
  return rows[0].id;
}

/** Marks a bank line as seen in the passbook. */
export async function matchBankRecordToPassbook(
  id: number,
  matchedBy: number,
  passbookDate: Date,
  churchId = DEFAULT_CHURCH_ID
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db
    .update(bankRecords)
    .set({ passbookMatched: true, passbookDate, matchedBy })
    .where(and(eq(bankRecords.id, id), eq(bankRecords.churchId, churchId)))
    .returning({ id: bankRecords.id });
  return rows.length > 0;
}

export async function addSessionDocument(
  input: Omit<InsertSessionDocument, "churchId">,
  churchId = DEFAULT_CHURCH_ID
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db
    .insert(sessionDocuments)
    .values({ ...input, churchId })
    .returning({ id: sessionDocuments.id });
  return rows[0].id;
}

/**
 * Writes a verified session into the ledger, in one transaction:
 * every envelope becomes an offering row, every approved deduction becomes an
 * expense row, and the fund balances move once. Nothing here recalculates the
 * money — the caller must reconcile first.
 */
export async function postCountingSession(
  id: number,
  postedBy: number,
  churchId = DEFAULT_CHURCH_ID
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  return db.transaction(async tx => {
    // Compare-and-set on `verified` so a session can never post twice.
    const claimed = await tx
      .update(countingSessions)
      .set({ status: "posted", postedBy, postedAt: new Date() })
      .where(
        and(
          eq(countingSessions.id, id),
          eq(countingSessions.churchId, churchId),
          eq(countingSessions.status, "verified")
        )
      )
      .returning({
        id: countingSessions.id,
        serviceDate: countingSessions.serviceDate,
      });
    if (!claimed[0]) return null;
    const serviceDate = claimed[0].serviceDate;

    const envelopeRows = await tx
      .select()
      .from(offeringEnvelopes)
      .where(eq(offeringEnvelopes.sessionId, id));

    let offeringCount = 0;
    for (const envelope of envelopeRows) {
      await tx.insert(offerings).values({
        churchId,
        sessionId: id,
        amount: envelope.amount,
        category: envelope.category,
        fundId: envelope.fundId,
        donorName: envelope.isAnonymous ? null : envelope.donorName,
        donorMemberId: envelope.memberId,
        receiptDate: serviceDate,
        method: envelope.method,
        reference: envelope.reference,
        notes: envelope.notes,
        recordedBy: envelope.recordedBy,
      });
      if (envelope.fundId) {
        await tx.execute(
          sql`UPDATE finance_accounts SET balance = balance + ${envelope.amount} WHERE id = ${envelope.fundId} AND "churchId" = ${churchId}`
        );
      }
      offeringCount += 1;
    }

    const deductionRows = await tx
      .select()
      .from(sessionDeductions)
      .where(eq(sessionDeductions.sessionId, id));

    let deductionCount = 0;
    for (const deduction of deductionRows) {
      const inserted = await tx
        .insert(expenses)
        .values({
          churchId,
          amount: deduction.amount,
          category: deduction.category,
          fundId: deduction.fundId,
          description: deduction.purpose,
          details: `หักจากถุงถวาย ${deduction.reason}`,
          expenseDate: serviceDate,
          payee: deduction.paidTo,
          status: "approved",
          recordedBy: deduction.requestedBy,
        } as InsertExpense)
        .returning({ id: expenses.id });
      await tx
        .update(sessionDeductions)
        .set({ expenseId: inserted[0].id })
        .where(eq(sessionDeductions.id, deduction.id));
      if (deduction.fundId) {
        await tx.execute(
          sql`UPDATE finance_accounts SET balance = balance - ${deduction.amount} WHERE id = ${deduction.fundId} AND "churchId" = ${churchId}`
        );
      }
      deductionCount += 1;
    }

    return { offeringCount, deductionCount };
  });
}

// ─── Financial report aggregation ─────────────────────────────────────────────

export type ReportSummary = {
  from: string;
  to: string;
  income: Array<{ category: string; total: number; count: number }>;
  expense: Array<{ category: string; total: number; count: number }>;
  totalIncome: number;
  totalExpense: number;
  net: number;
  transactionCount: number;
  funds: Array<{ id: number; name: string; type: string; balance: number }>;
};

/**
 * Totals for the report screen, grouped by category and computed in the
 * database from the same rows the ledger shows. Voided records are excluded,
 * matching every other read path.
 */
export async function getFinancialReportSummary(
  churchId = DEFAULT_CHURCH_ID,
  fromDate: Date,
  toDate: Date
): Promise<ReportSummary> {
  const empty: ReportSummary = {
    from: fromDate.toISOString().slice(0, 10),
    to: toDate.toISOString().slice(0, 10),
    income: [],
    expense: [],
    totalIncome: 0,
    totalExpense: 0,
    net: 0,
    transactionCount: 0,
    funds: [],
  };

  const db = await getDb();
  if (!db) return empty;

  const [incomeRows, expenseRows, fundRows] = await Promise.all([
    db
      .select({
        category: offerings.category,
        total: sum(offerings.amount),
        count: count(offerings.id),
      })
      .from(offerings)
      .where(
        and(
          eq(offerings.churchId, churchId),
          ne(offerings.status, "voided"),
          between(offerings.receiptDate, fromDate, toDate)
        )
      )
      .groupBy(offerings.category),
    db
      .select({
        category: expenses.category,
        total: sum(expenses.amount),
        count: count(expenses.id),
      })
      .from(expenses)
      .where(
        and(
          eq(expenses.churchId, churchId),
          ne(expenses.status, "voided"),
          between(expenses.expenseDate, fromDate, toDate)
        )
      )
      .groupBy(expenses.category),
    db
      .select()
      .from(financeAccounts)
      .where(
        and(
          eq(financeAccounts.churchId, churchId),
          eq(financeAccounts.isActive, true)
        )
      )
      .orderBy(asc(financeAccounts.sortOrder), asc(financeAccounts.name)),
  ]);

  const toRow = (r: { category: string; total: unknown; count: number }) => ({
    category: r.category,
    total: parseFloat((r.total as string) ?? "0"),
    count: Number(r.count),
  });

  const income = incomeRows.map(toRow);
  const expense = expenseRows.map(toRow);
  const totalIncome = income.reduce((sum, r) => sum + r.total, 0);
  const totalExpense = expense.reduce((sum, r) => sum + r.total, 0);

  return {
    ...empty,
    income,
    expense,
    totalIncome,
    totalExpense,
    net: totalIncome - totalExpense,
    transactionCount:
      income.reduce((n, r) => n + r.count, 0) +
      expense.reduce((n, r) => n + r.count, 0),
    funds: fundRows.map(f => ({
      id: f.id,
      name: f.name,
      type: f.type,
      balance: parseFloat((f.balance as unknown as string) ?? "0"),
    })),
  };
}
