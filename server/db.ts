import {
  and,
  asc,
  between,
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
  budgetPlans,
  churchEvents,
  churchNews,
  churchProfiles,
  expenses,
  financeAccounts,
  InsertChurchEvent,
  InsertChurchNews,
  InsertChurchProfile,
  InsertExpense,
  InsertFinanceAccount,
  InsertOffering,
  InsertUser,
  InsertWithdrawalRequest,
  InsertMember,
  InsertNotification,
  auditLogs,
  members,
  notifications,
  offerings,
  users,
  withdrawalRequests,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export const DEFAULT_CHURCH_ID = "demo-church";

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Supabase transaction pooler (:6543) requires prepared statements off.
      const client = postgres(process.env.DATABASE_URL, { prepare: false });
      // Eager health-check: `postgres` connects lazily, so verify now to preserve
      // the getDb()-returns-null (never throws) contract on unreachable URLs.
      await client`SELECT 1`;
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

export async function updateUserChurchRole(
  userId: number,
  churchRole: string | null
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(users)
    .set({ churchRole } as any)
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
  await db
    .insert(churchProfiles)
    .values({ ...input, churchId })
    .onConflictDoUpdate({
      target: churchProfiles.churchId,
      set: { ...input, updatedAt: new Date() },
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
              between(offerings.receiptDate, thisMonthStart, thisMonthEnd)
            )
          ),
        db
          .select({ total: sum(offerings.amount) })
          .from(offerings)
          .where(
            and(
              eq(offerings.churchId, churchId),
              between(offerings.receiptDate, prevMonthStart, prevMonthEnd)
            )
          ),
        db
          .select({ total: sum(expenses.amount) })
          .from(expenses)
          .where(
            and(
              eq(expenses.churchId, churchId),
              between(expenses.expenseDate, thisMonthStart, thisMonthEnd)
            )
          ),
        db
          .select({ total: sum(expenses.amount) })
          .from(expenses)
          .where(
            and(
              eq(expenses.churchId, churchId),
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
            between(offerings.receiptDate, start, end)
          )
        ),
      db
        .select({ total: sum(expenses.amount) })
        .from(expenses)
        .where(
          and(
            eq(expenses.churchId, churchId),
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
    .where(and(eq(offerings.id, id), eq(offerings.churchId, churchId)))
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
  const result = await db
    .insert(offerings)
    .values({ ...input, churchId })
    .returning({ id: offerings.id });
  // Update fund balance
  if (input.fundId) {
    await db.execute(
      sql`UPDATE finance_accounts SET balance = balance + ${input.amount} WHERE id = ${input.fundId} AND churchId = ${churchId}`
    );
  }
  return result[0].id;
}

export async function updateOffering(
  id: number,
  input: Partial<Omit<InsertOffering, "churchId" | "recordedBy">>,
  churchId = DEFAULT_CHURCH_ID
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db
    .select({ amount: offerings.amount, fundId: offerings.fundId })
    .from(offerings)
    .where(and(eq(offerings.id, id), eq(offerings.churchId, churchId)))
    .limit(1);
  if (!existing[0]) return null;
  await db
    .update(offerings)
    .set(input as any)
    .where(and(eq(offerings.id, id), eq(offerings.churchId, churchId)));
  if (input.amount !== undefined || input.fundId !== undefined) {
    const oldAmount = Number(existing[0].amount);
    const newAmount =
      input.amount === undefined ? oldAmount : Number(input.amount);
    const oldFundId = existing[0].fundId;
    const newFundId = input.fundId === undefined ? oldFundId : input.fundId;
    if (oldFundId)
      await db.execute(
        sql`UPDATE finance_accounts SET balance = balance - ${oldAmount} WHERE id = ${oldFundId} AND churchId = ${churchId}`
      );
    if (newFundId)
      await db.execute(
        sql`UPDATE finance_accounts SET balance = balance + ${newAmount} WHERE id = ${newFundId} AND churchId = ${churchId}`
      );
  }
  return id;
}

export async function deleteOffering(id: number, churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db
    .select({ amount: offerings.amount, fundId: offerings.fundId })
    .from(offerings)
    .where(and(eq(offerings.id, id), eq(offerings.churchId, churchId)))
    .limit(1);
  if (!existing[0]) return false;
  await db
    .delete(offerings)
    .where(and(eq(offerings.id, id), eq(offerings.churchId, churchId)));
  if (existing[0].fundId)
    await db.execute(
      sql`UPDATE finance_accounts SET balance = balance - ${Number(existing[0].amount)} WHERE id = ${existing[0].fundId} AND churchId = ${churchId}`
    );
  return true;
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
    .where(and(eq(expenses.id, id), eq(expenses.churchId, churchId)))
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
  const result = await db
    .insert(expenses)
    .values({ ...input, churchId })
    .returning({ id: expenses.id });
  // Deduct fund balance
  if (input.fundId) {
    await db.execute(
      sql`UPDATE finance_accounts SET balance = balance - ${input.amount} WHERE id = ${input.fundId} AND churchId = ${churchId}`
    );
  }
  return result[0].id;
}

export async function updateExpense(
  id: number,
  input: Partial<Omit<InsertExpense, "churchId" | "recordedBy">>,
  churchId = DEFAULT_CHURCH_ID
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db
    .select({ amount: expenses.amount, fundId: expenses.fundId })
    .from(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.churchId, churchId)))
    .limit(1);
  if (!existing[0]) return null;
  await db
    .update(expenses)
    .set(input as any)
    .where(and(eq(expenses.id, id), eq(expenses.churchId, churchId)));
  if (input.amount !== undefined || input.fundId !== undefined) {
    const oldAmount = Number(existing[0].amount);
    const newAmount =
      input.amount === undefined ? oldAmount : Number(input.amount);
    const oldFundId = existing[0].fundId;
    const newFundId = input.fundId === undefined ? oldFundId : input.fundId;
    if (oldFundId)
      await db.execute(
        sql`UPDATE finance_accounts SET balance = balance + ${oldAmount} WHERE id = ${oldFundId} AND churchId = ${churchId}`
      );
    if (newFundId)
      await db.execute(
        sql`UPDATE finance_accounts SET balance = balance - ${newAmount} WHERE id = ${newFundId} AND churchId = ${churchId}`
      );
  }
  return id;
}

export async function deleteExpense(id: number, churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db
    .select({ amount: expenses.amount, fundId: expenses.fundId })
    .from(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.churchId, churchId)))
    .limit(1);
  if (!existing[0]) return false;
  await db
    .delete(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.churchId, churchId)));
  if (existing[0].fundId)
    await db.execute(
      sql`UPDATE finance_accounts SET balance = balance + ${Number(existing[0].amount)} WHERE id = ${existing[0].fundId} AND churchId = ${churchId}`
    );
  return true;
}

export async function voidOffering(id: number, churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db
    .select({
      amount: offerings.amount,
      fundId: offerings.fundId,
      status: offerings.status,
    })
    .from(offerings)
    .where(and(eq(offerings.id, id), eq(offerings.churchId, churchId)))
    .limit(1);
  if (!existing[0] || existing[0].status === "voided") return false;
  await db
    .update(offerings)
    .set({ status: "voided", voidedAt: new Date() })
    .where(and(eq(offerings.id, id), eq(offerings.churchId, churchId)));
  if (existing[0].fundId)
    await db.execute(
      sql`UPDATE finance_accounts SET balance = balance - ${Number(existing[0].amount)} WHERE id = ${existing[0].fundId} AND churchId = ${churchId}`
    );
  return true;
}

export async function voidExpense(id: number, churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db
    .select({
      amount: expenses.amount,
      fundId: expenses.fundId,
      status: expenses.status,
    })
    .from(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.churchId, churchId)))
    .limit(1);
  if (!existing[0] || existing[0].status === "voided") return false;
  await db
    .update(expenses)
    .set({ status: "voided" })
    .where(and(eq(expenses.id, id), eq(expenses.churchId, churchId)));
  if (existing[0].fundId)
    await db.execute(
      sql`UPDATE finance_accounts SET balance = balance + ${Number(existing[0].amount)} WHERE id = ${existing[0].fundId} AND churchId = ${churchId}`
    );
  return true;
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
  await db
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
    );
}

export async function disburseWithdrawal(
  id: number,
  churchId = DEFAULT_CHURCH_ID
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(withdrawalRequests)
    .set({ status: "disbursed" })
    .where(
      and(
        eq(withdrawalRequests.id, id),
        eq(withdrawalRequests.churchId, churchId)
      )
    );
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
