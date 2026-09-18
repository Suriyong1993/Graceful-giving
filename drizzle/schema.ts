import {
  boolean,
  decimal,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// ─── Shared enums (Postgres enum types need unique names; values mirror the old MySQL enums) ───

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const financeAccountTypeEnum = pgEnum("finance_account_type", [
  "general",
  "tithe",
  "mission",
  "building",
  "welfare",
  "special",
]);
export const offeringCategoryEnum = pgEnum("offering_category", [
  "tithe",
  "general",
  "mission",
  "building",
  "welfare",
  "special",
]);
export const offeringMethodEnum = pgEnum("offering_method", [
  "cash",
  "transfer",
  "check",
]);
export const expenseCategoryEnum = pgEnum("expense_category", [
  "utilities",
  "ministry",
  "pastoral",
  "admin",
  "building",
  "worship",
  "welfare",
  "other",
]);
export const expenseStatusEnum = pgEnum("expense_status", [
  "draft",
  "approved",
  "paid",
  "voided",
]);
export const offeringStatusEnum = pgEnum("offering_status", [
  "active",
  "voided",
]);
export const withdrawalStatusEnum = pgEnum("withdrawal_status", [
  "pending",
  "approved",
  "rejected",
  "disbursed",
]);
export const newsCategoryEnum = pgEnum("news_category", [
  "announcement",
  "ministry",
  "finance",
  "pastoral",
]);
export const newsStatusEnum = pgEnum("news_status", [
  "draft",
  "published",
  "archived",
]);
export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "published",
  "cancelled",
]);
export const memberStatusEnum = pgEnum("member_status", [
  "active",
  "inactive",
  "pending",
]);
export const countingSessionStatusEnum = pgEnum("counting_session_status", [
  "counting",
  "counted",
  "verified",
  "posted",
  "closed",
]);
export const cashKindEnum = pgEnum("cash_kind", ["note", "coin"]);
export const bankRecordTypeEnum = pgEnum("bank_record_type", [
  /** A member transferred straight into the church account. */
  "transfer_in",
  /** The treasurer banked counted cash. */
  "cash_deposit",
]);
export const sessionDocumentKindEnum = pgEnum("session_document_kind", [
  "count_sheet",
  "envelope_photo",
  "deposit_slip",
  "transfer_slip",
  "passbook_page",
  "deduction_receipt",
  "other",
]);

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  /** Church-specific role for financial access control */
  churchRole: varchar("churchRole", { length: 20 }).$type<
    "SUPER_ADMIN" | "PASTOR" | "TREASURER" | "COUNTER" | "MEMBER"
  >(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ChurchRole =
  | "SUPER_ADMIN"
  | "PASTOR"
  | "TREASURER"
  | "COUNTER"
  | "MEMBER";

// ─── Church Profile ───────────────────────────────────────────────────────────

/** Church profile and configuration — one per churchId. */
export const churchProfiles = pgTable("church_profiles", {
  id: serial("id").primaryKey(),
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
  fiscalYearStartMonth: integer("fiscalYearStartMonth").default(1).notNull(),
  logoUrl: varchar("logoUrl", { length: 500 }),
  /** Whether the church has completed the initial 8-step setup */
  setupCompleted: boolean("setupCompleted").default(false).notNull(),
  /** Custom verse or motto */
  motto: varchar("motto", { length: 280 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type ChurchProfile = typeof churchProfiles.$inferSelect;
export type InsertChurchProfile = typeof churchProfiles.$inferInsert;

// ─── Members ──────────────────────────────────────────────────────────────────
export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  churchId: varchar("churchId", { length: 64 }).notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 320 }),
  status: memberStatusEnum("status").default("active").notNull(),
  /** Standing offering-envelope number issued to this member. */
  envelopeNo: varchar("envelopeNo", { length: 30 }),
  avatarUrl: varchar("avatarUrl", { length: 500 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Member = typeof members.$inferSelect;
export type InsertMember = typeof members.$inferInsert;

// ─── Persistent Notifications ────────────────────────────────────────────────
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  churchId: varchar("churchId", { length: 64 }).notNull(),
  userId: integer("userId").notNull(),
  type: varchar("type", { length: 40 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description"),
  link: varchar("link", { length: 500 }),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ─── Audit Log ────────────────────────────────────────────────────────────────
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  churchId: varchar("churchId", { length: 64 }).notNull(),
  userId: integer("userId").notNull(),
  action: varchar("action", { length: 40 }).notNull(),
  entity: varchar("entity", { length: 80 }).notNull(),
  entityId: integer("entityId"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ─── Finance Accounts / Funds ──────────────────────────────────────────────────

/** Fund and ledger account definitions for the church. */
export const financeAccounts = pgTable("finance_accounts", {
  id: serial("id").primaryKey(),
  churchId: varchar("churchId", { length: 64 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  type: financeAccountTypeEnum("type").default("general").notNull(),
  /** Running balance — updated whenever an offering or expense is recorded */
  balance: decimal("balance", { precision: 15, scale: 2 })
    .default("0")
    .notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: integer("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type FinanceAccount = typeof financeAccounts.$inferSelect;
export type InsertFinanceAccount = typeof financeAccounts.$inferInsert;

// ─── Offerings / Donations ────────────────────────────────────────────────────

/** Individual offering / donation records. Donor name is optional for privacy. */
export const offerings = pgTable("offerings", {
  id: serial("id").primaryKey(),
  churchId: varchar("churchId", { length: 64 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  category: offeringCategoryEnum("category").default("general").notNull(),
  fundId: integer("fundId"),
  /** Visible only to TREASURER and SUPER_ADMIN */
  donorName: varchar("donorName", { length: 120 }),
  donorMemberId: integer("donorMemberId"),
  /** Set when the row was posted from a weekly counting session. */
  sessionId: integer("sessionId"),
  receiptDate: timestamp("receiptDate").defaultNow().notNull(),
  method: offeringMethodEnum("method").default("cash").notNull(),
  /** Bank transfer reference or cheque number */
  reference: varchar("reference", { length: 120 }),
  notes: text("notes"),
  status: offeringStatusEnum("status").default("active").notNull(),
  voidedAt: timestamp("voidedAt"),
  recordedBy: integer("recordedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Offering = typeof offerings.$inferSelect;
export type InsertOffering = typeof offerings.$inferInsert;

// ─── Expenses ─────────────────────────────────────────────────────────────────

/** Church expense records. */
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  churchId: varchar("churchId", { length: 64 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  category: expenseCategoryEnum("category").default("other").notNull(),
  fundId: integer("fundId"),
  description: varchar("description", { length: 280 }).notNull(),
  details: text("details"),
  expenseDate: timestamp("expenseDate").defaultNow().notNull(),
  payee: varchar("payee", { length: 120 }),
  receiptRef: varchar("receiptRef", { length: 120 }),
  status: expenseStatusEnum("status").default("approved").notNull(),
  approvedBy: integer("approvedBy"),
  recordedBy: integer("recordedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

// ─── Withdrawal Requests ──────────────────────────────────────────────────────

/** Withdrawal requests with multi-step approval workflow. */
export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: serial("id").primaryKey(),
  churchId: varchar("churchId", { length: 64 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  purpose: varchar("purpose", { length: 280 }).notNull(),
  details: text("details"),
  fundId: integer("fundId"),
  requestedBy: integer("requestedBy").notNull(),
  requestDate: timestamp("requestDate").defaultNow().notNull(),
  status: withdrawalStatusEnum("status").default("pending").notNull(),
  approvedBy: integer("approvedBy"),
  approvalDate: timestamp("approvalDate"),
  approvalNote: text("approvalNote"),
  rejectionReason: text("rejectionReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
export type InsertWithdrawalRequest = typeof withdrawalRequests.$inferInsert;

// ─── Budget Plans ─────────────────────────────────────────────────────────────

/** Budget allocation per period and fund/category. */
export const budgetPlans = pgTable("budget_plans", {
  id: serial("id").primaryKey(),
  churchId: varchar("churchId", { length: 64 }).notNull(),
  year: integer("year").notNull(),
  /** null = annual budget; 1-12 = monthly budget */
  month: integer("month"),
  fundId: integer("fundId"),
  category: varchar("category", { length: 80 }),
  plannedAmount: decimal("plannedAmount", {
    precision: 15,
    scale: 2,
  }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type BudgetPlan = typeof budgetPlans.$inferSelect;
export type InsertBudgetPlan = typeof budgetPlans.$inferInsert;

// ─── News & Events (existing) ─────────────────────────────────────────────────

/** Published updates visible to church members. */
export const churchNews = pgTable("church_news", {
  id: serial("id").primaryKey(),
  churchId: varchar("churchId", { length: 64 })
    .notNull()
    .default("demo-church"),
  authorId: integer("authorId").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  summary: varchar("summary", { length: 280 }).notNull(),
  body: text("body").notNull(),
  category: newsCategoryEnum("category").default("announcement").notNull(),
  status: newsStatusEnum("status").default("draft").notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type ChurchNews = typeof churchNews.$inferSelect;
export type InsertChurchNews = typeof churchNews.$inferInsert;

/** Church calendar events visible to members. */
export const churchEvents = pgTable("church_events", {
  id: serial("id").primaryKey(),
  churchId: varchar("churchId", { length: 64 })
    .notNull()
    .default("demo-church"),
  authorId: integer("authorId").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  summary: varchar("summary", { length: 280 }).notNull(),
  description: text("description").notNull(),
  startsAt: timestamp("startsAt").notNull(),
  endsAt: timestamp("endsAt"),
  location: varchar("location", { length: 180 }),
  registrationUrl: varchar("registrationUrl", { length: 500 }),
  status: eventStatusEnum("status").default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type ChurchEvent = typeof churchEvents.$inferSelect;
export type InsertChurchEvent = typeof churchEvents.$inferInsert;

// ─── Weekly Offering Count ────────────────────────────────────────────────────

/**
 * One counting session per worship service. The church currently holds a single
 * Sunday morning service, but `serviceRound` keeps the model ready for more
 * without the UI having to show it.
 */
export const countingSessions = pgTable("counting_sessions", {
  id: serial("id").primaryKey(),
  churchId: varchar("churchId", { length: 64 })
    .notNull()
    .default("demo-church"),
  /** The Sunday this offering was received. */
  serviceDate: timestamp("serviceDate").notNull(),
  /** 1 = the morning service. Reserved for churches with several rounds. */
  serviceRound: integer("serviceRound").default(1).notNull(),
  serviceName: varchar("serviceName", { length: 120 }),
  status: countingSessionStatusEnum("status").default("counting").notNull(),
  countedBy: integer("countedBy").notNull(),
  countSubmittedAt: timestamp("countSubmittedAt"),
  /** Must differ from countedBy: nobody verifies their own count. */
  verifiedBy: integer("verifiedBy"),
  verifiedAt: timestamp("verifiedAt"),
  postedBy: integer("postedBy"),
  postedAt: timestamp("postedAt"),
  closedAt: timestamp("closedAt"),
  /** Required before posting when any variance is non-zero. */
  varianceNote: text("varianceNote"),
  varianceApprovedBy: integer("varianceApprovedBy"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

/** One row per offering envelope, or per lump sum with no envelope. */
export const offeringEnvelopes = pgTable("offering_envelopes", {
  id: serial("id").primaryKey(),
  sessionId: integer("sessionId").notNull(),
  churchId: varchar("churchId", { length: 64 })
    .notNull()
    .default("demo-church"),
  /** The member's standing envelope number; null for loose or anonymous giving. */
  envelopeNo: varchar("envelopeNo", { length: 30 }),
  memberId: integer("memberId"),
  /** Used when the giver is not a registered member. */
  donorName: varchar("donorName", { length: 180 }),
  isAnonymous: boolean("isAnonymous").default(false).notNull(),
  category: offeringCategoryEnum("category").default("general").notNull(),
  fundId: integer("fundId"),
  method: offeringMethodEnum("method").default("cash").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  /** Bank reference or cheque number when the gift did not arrive as cash. */
  reference: varchar("reference", { length: 120 }),
  notes: text("notes"),
  recordedBy: integer("recordedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

/**
 * The physical count sheet: one row per denomination.
 * The subtotal is intentionally not stored — it is always denomination ×
 * quantity, and a stored copy could disagree with its own inputs.
 */
export const cashCounts = pgTable("cash_counts", {
  id: serial("id").primaryKey(),
  sessionId: integer("sessionId").notNull(),
  /** Face value in baht: 1000 … 0.25 */
  denomination: decimal("denomination", { precision: 8, scale: 2 }).notNull(),
  kind: cashKindEnum("kind").notNull(),
  quantity: integer("quantity").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

/**
 * Cash taken out of the offering before it reaches the bank.
 * The church allows this, so the trail must stay complete:
 * counted cash − deductions = bank deposit.
 */
export const sessionDeductions = pgTable("session_deductions", {
  id: serial("id").primaryKey(),
  sessionId: integer("sessionId").notNull(),
  churchId: varchar("churchId", { length: 64 })
    .notNull()
    .default("demo-church"),
  purpose: varchar("purpose", { length: 200 }).notNull(),
  reason: text("reason").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  /** Who received the money. */
  paidTo: varchar("paidTo", { length: 180 }).notNull(),
  requestedBy: integer("requestedBy").notNull(),
  /** Must differ from requestedBy. */
  approvedBy: integer("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  category: expenseCategoryEnum("category").default("other").notNull(),
  fundId: integer("fundId"),
  /** Set once the deduction is written into the expense ledger. */
  expenseId: integer("expenseId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

/** Money arriving in or leaving for the bank account, matched to the passbook. */
export const bankRecords = pgTable("bank_records", {
  id: serial("id").primaryKey(),
  sessionId: integer("sessionId").notNull(),
  churchId: varchar("churchId", { length: 64 })
    .notNull()
    .default("demo-church"),
  type: bankRecordTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  /** Who sent the transfer; null for a cash deposit made by the treasurer. */
  transferredBy: integer("transferredBy"),
  transferredByName: varchar("transferredByName", { length: 180 }),
  bankRef: varchar("bankRef", { length: 120 }),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
  /** Passbook reconciliation. */
  passbookMatched: boolean("passbookMatched").default(false).notNull(),
  passbookDate: timestamp("passbookDate"),
  matchedBy: integer("matchedBy"),
  recordedBy: integer("recordedBy").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

/**
 * Evidence for the session. Files live in the church's Google Drive; only the
 * identifiers and metadata are kept here.
 */
export const sessionDocuments = pgTable("session_documents", {
  id: serial("id").primaryKey(),
  sessionId: integer("sessionId").notNull(),
  churchId: varchar("churchId", { length: 64 })
    .notNull()
    .default("demo-church"),
  kind: sessionDocumentKindEnum("kind").default("other").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }),
  fileSize: integer("fileSize"),
  /** Google Drive file id. */
  driveFileId: varchar("driveFileId", { length: 180 }),
  /** Drive webViewLink, or another URL when the file is stored elsewhere. */
  fileUrl: varchar("fileUrl", { length: 600 }),
  /** Drive folder path used, e.g. "2026/09/2026-09-20". */
  drivePath: varchar("drivePath", { length: 300 }),
  /** Links the document to the deduction or bank record it evidences. */
  deductionId: integer("deductionId"),
  bankRecordId: integer("bankRecordId"),
  uploadedBy: integer("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CountingSession = typeof countingSessions.$inferSelect;
export type InsertCountingSession = typeof countingSessions.$inferInsert;
export type OfferingEnvelope = typeof offeringEnvelopes.$inferSelect;
export type InsertOfferingEnvelope = typeof offeringEnvelopes.$inferInsert;
export type CashCount = typeof cashCounts.$inferSelect;
export type InsertCashCount = typeof cashCounts.$inferInsert;
export type SessionDeduction = typeof sessionDeductions.$inferSelect;
export type InsertSessionDeduction = typeof sessionDeductions.$inferInsert;
export type BankRecord = typeof bankRecords.$inferSelect;
export type InsertBankRecord = typeof bankRecords.$inferInsert;
export type SessionDocument = typeof sessionDocuments.$inferSelect;
export type InsertSessionDocument = typeof sessionDocuments.$inferInsert;
