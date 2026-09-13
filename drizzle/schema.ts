import { boolean, decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  /** Church-specific role for financial access control */
  churchRole: varchar("churchRole", { length: 20 }).$type<"SUPER_ADMIN" | "PASTOR" | "TREASURER" | "MEMBER">(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ChurchRole = "SUPER_ADMIN" | "PASTOR" | "TREASURER" | "MEMBER";

// ─── Church Profile ───────────────────────────────────────────────────────────

/** Church profile and configuration — one per churchId. */
export const churchProfiles = mysqlTable("church_profiles", {
  id: int("id").autoincrement().primaryKey(),
  churchId: varchar("churchId", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 180 }).notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  website: varchar("website", { length: 500 }),
  pastorName: varchar("pastorName", { length: 120 }),
  assistantPastorName: varchar("assistantPastorName", { length: 120 }),
  treasurerName: varchar("treasurerName", { length: 120 }),
  bankName: varchar("bankName", { length: 120 }),
  bankAccount: varchar("bankAccount", { length: 30 }),
  bankAccountName: varchar("bankAccountName", { length: 120 }),
  /** Month (1-12) when the fiscal year starts */
  fiscalYearStartMonth: int("fiscalYearStartMonth").default(1).notNull(),
  logoUrl: varchar("logoUrl", { length: 500 }),
  /** Whether the church has completed the initial 8-step setup */
  setupCompleted: boolean("setupCompleted").default(false).notNull(),
  /** Custom verse or motto */
  motto: varchar("motto", { length: 280 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChurchProfile = typeof churchProfiles.$inferSelect;
export type InsertChurchProfile = typeof churchProfiles.$inferInsert;

// ─── Finance Accounts / Funds ──────────────────────────────────────────────────

/** Fund and ledger account definitions for the church. */
export const financeAccounts = mysqlTable("finance_accounts", {
  id: int("id").autoincrement().primaryKey(),
  churchId: varchar("churchId", { length: 64 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  type: mysqlEnum("type", ["general", "tithe", "mission", "building", "welfare", "special"]).default("general").notNull(),
  /** Running balance — updated whenever an offering or expense is recorded */
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0").notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FinanceAccount = typeof financeAccounts.$inferSelect;
export type InsertFinanceAccount = typeof financeAccounts.$inferInsert;

// ─── Offerings / Donations ────────────────────────────────────────────────────

/** Individual offering / donation records. Donor name is optional for privacy. */
export const offerings = mysqlTable("offerings", {
  id: int("id").autoincrement().primaryKey(),
  churchId: varchar("churchId", { length: 64 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  category: mysqlEnum("category", ["tithe", "general", "mission", "building", "welfare", "special"]).default("general").notNull(),
  fundId: int("fundId"),
  /** Visible only to TREASURER and SUPER_ADMIN */
  donorName: varchar("donorName", { length: 120 }),
  donorMemberId: int("donorMemberId"),
  receiptDate: timestamp("receiptDate").defaultNow().notNull(),
  method: mysqlEnum("method", ["cash", "transfer", "check"]).default("cash").notNull(),
  /** Bank transfer reference or cheque number */
  reference: varchar("reference", { length: 120 }),
  notes: text("notes"),
  recordedBy: int("recordedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Offering = typeof offerings.$inferSelect;
export type InsertOffering = typeof offerings.$inferInsert;

// ─── Expenses ─────────────────────────────────────────────────────────────────

/** Church expense records. */
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  churchId: varchar("churchId", { length: 64 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  category: mysqlEnum("category", [
    "utilities", "ministry", "pastoral", "admin",
    "building", "worship", "welfare", "other",
  ]).default("other").notNull(),
  fundId: int("fundId"),
  description: varchar("description", { length: 280 }).notNull(),
  details: text("details"),
  expenseDate: timestamp("expenseDate").defaultNow().notNull(),
  payee: varchar("payee", { length: 120 }),
  receiptRef: varchar("receiptRef", { length: 120 }),
  status: mysqlEnum("status", ["draft", "approved", "paid"]).default("approved").notNull(),
  approvedBy: int("approvedBy"),
  recordedBy: int("recordedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

// ─── Withdrawal Requests ──────────────────────────────────────────────────────

/** Withdrawal requests with multi-step approval workflow. */
export const withdrawalRequests = mysqlTable("withdrawal_requests", {
  id: int("id").autoincrement().primaryKey(),
  churchId: varchar("churchId", { length: 64 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  purpose: varchar("purpose", { length: 280 }).notNull(),
  details: text("details"),
  fundId: int("fundId"),
  requestedBy: int("requestedBy").notNull(),
  requestDate: timestamp("requestDate").defaultNow().notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "disbursed"]).default("pending").notNull(),
  approvedBy: int("approvedBy"),
  approvalDate: timestamp("approvalDate"),
  approvalNote: text("approvalNote"),
  rejectionReason: text("rejectionReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
export type InsertWithdrawalRequest = typeof withdrawalRequests.$inferInsert;

// ─── Budget Plans ─────────────────────────────────────────────────────────────

/** Budget allocation per period and fund/category. */
export const budgetPlans = mysqlTable("budget_plans", {
  id: int("id").autoincrement().primaryKey(),
  churchId: varchar("churchId", { length: 64 }).notNull(),
  year: int("year").notNull(),
  /** null = annual budget; 1-12 = monthly budget */
  month: int("month"),
  fundId: int("fundId"),
  category: varchar("category", { length: 80 }),
  plannedAmount: decimal("plannedAmount", { precision: 15, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BudgetPlan = typeof budgetPlans.$inferSelect;
export type InsertBudgetPlan = typeof budgetPlans.$inferInsert;

// ─── News & Events (existing) ─────────────────────────────────────────────────

/** Published updates visible to church members. */
export const churchNews = mysqlTable("church_news", {
  id: int("id").autoincrement().primaryKey(),
  churchId: varchar("churchId", { length: 64 }).notNull().default("demo-church"),
  authorId: int("authorId").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  summary: varchar("summary", { length: 280 }).notNull(),
  body: text("body").notNull(),
  category: mysqlEnum("category", ["announcement", "ministry", "finance", "pastoral"]).default("announcement").notNull(),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChurchNews = typeof churchNews.$inferSelect;
export type InsertChurchNews = typeof churchNews.$inferInsert;

/** Church calendar events visible to members. */
export const churchEvents = mysqlTable("church_events", {
  id: int("id").autoincrement().primaryKey(),
  churchId: varchar("churchId", { length: 64 }).notNull().default("demo-church"),
  authorId: int("authorId").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  summary: varchar("summary", { length: 280 }).notNull(),
  description: text("description").notNull(),
  startsAt: timestamp("startsAt").notNull(),
  endsAt: timestamp("endsAt"),
  location: varchar("location", { length: 180 }),
  registrationUrl: varchar("registrationUrl", { length: 500 }),
  status: mysqlEnum("status", ["draft", "published", "cancelled"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChurchEvent = typeof churchEvents.$inferSelect;
export type InsertChurchEvent = typeof churchEvents.$inferInsert;
