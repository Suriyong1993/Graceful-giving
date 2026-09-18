// server/_core/apiHandler.ts
import "dotenv/config";

// server/_core/app.ts
import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// server/_core/oauth.ts
function registerOAuthRoutes(_app) {
}

// server/_core/env.ts
var ENV = {
  // Clerk Auth
  clerkSecretKey: process.env.CLERK_SECRET_KEY ?? "",
  clerkPublishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY ?? "",
  // App settings
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // Built-in Forge API (for AI features)
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/_core/storageProxy.ts
function registerStorageProxy(app2) {
  app2.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/routers.ts
import { z as z2 } from "zod";

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  const secure = isSecureRequest(req);
  return {
    httpOnly: true,
    path: "/",
    // SameSite=None is only legal on a secure origin. Browsers reject such a
    // cookie over plain http, which silently breaks both sign-in and sign-out
    // on non-https origins. Fall back to Lax there; https keeps None so the
    // session still works when the app is embedded cross-site.
    sameSite: secure ? "none" : "lax",
    secure
  };
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/db.ts
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
  sum
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// drizzle/schema.ts
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
  varchar
} from "drizzle-orm/pg-core";
var userRoleEnum = pgEnum("user_role", ["user", "admin"]);
var financeAccountTypeEnum = pgEnum("finance_account_type", [
  "general",
  "tithe",
  "mission",
  "building",
  "welfare",
  "special"
]);
var offeringCategoryEnum = pgEnum("offering_category", [
  "tithe",
  "general",
  "mission",
  "building",
  "welfare",
  "special"
]);
var offeringMethodEnum = pgEnum("offering_method", [
  "cash",
  "transfer",
  "check"
]);
var expenseCategoryEnum = pgEnum("expense_category", [
  "utilities",
  "ministry",
  "pastoral",
  "admin",
  "building",
  "worship",
  "welfare",
  "other"
]);
var expenseStatusEnum = pgEnum("expense_status", [
  "draft",
  "approved",
  "paid",
  "voided"
]);
var offeringStatusEnum = pgEnum("offering_status", [
  "active",
  "voided"
]);
var withdrawalStatusEnum = pgEnum("withdrawal_status", [
  "pending",
  "approved",
  "rejected",
  "disbursed"
]);
var newsCategoryEnum = pgEnum("news_category", [
  "announcement",
  "ministry",
  "finance",
  "pastoral"
]);
var newsStatusEnum = pgEnum("news_status", [
  "draft",
  "published",
  "archived"
]);
var eventStatusEnum = pgEnum("event_status", [
  "draft",
  "published",
  "cancelled"
]);
var memberStatusEnum = pgEnum("member_status", [
  "active",
  "inactive",
  "pending"
]);
var countingSessionStatusEnum = pgEnum("counting_session_status", [
  "counting",
  "counted",
  "verified",
  "posted",
  "closed"
]);
var cashKindEnum = pgEnum("cash_kind", ["note", "coin"]);
var bankRecordTypeEnum = pgEnum("bank_record_type", [
  /** A member transferred straight into the church account. */
  "transfer_in",
  /** The treasurer banked counted cash. */
  "cash_deposit"
]);
var sessionDocumentKindEnum = pgEnum("session_document_kind", [
  "count_sheet",
  "envelope_photo",
  "deposit_slip",
  "transfer_slip",
  "passbook_page",
  "deduction_receipt",
  "other"
]);
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  /** Church-specific role for financial access control */
  churchRole: varchar("churchRole", { length: 20 }).$type(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date()),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var churchProfiles = pgTable("church_profiles", {
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var members = pgTable("members", {
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  churchId: varchar("churchId", { length: 64 }).notNull(),
  userId: integer("userId").notNull(),
  type: varchar("type", { length: 40 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description"),
  link: varchar("link", { length: 500 }),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  churchId: varchar("churchId", { length: 64 }).notNull(),
  userId: integer("userId").notNull(),
  action: varchar("action", { length: 40 }).notNull(),
  entity: varchar("entity", { length: 80 }).notNull(),
  entityId: integer("entityId"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var financeAccounts = pgTable("finance_accounts", {
  id: serial("id").primaryKey(),
  churchId: varchar("churchId", { length: 64 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  type: financeAccountTypeEnum("type").default("general").notNull(),
  /** Running balance — updated whenever an offering or expense is recorded */
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0").notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: integer("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var offerings = pgTable("offerings", {
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var expenses = pgTable("expenses", {
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var withdrawalRequests = pgTable("withdrawal_requests", {
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var budgetPlans = pgTable("budget_plans", {
  id: serial("id").primaryKey(),
  churchId: varchar("churchId", { length: 64 }).notNull(),
  year: integer("year").notNull(),
  /** null = annual budget; 1-12 = monthly budget */
  month: integer("month"),
  fundId: integer("fundId"),
  category: varchar("category", { length: 80 }),
  plannedAmount: decimal("plannedAmount", {
    precision: 15,
    scale: 2
  }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var churchNews = pgTable("church_news", {
  id: serial("id").primaryKey(),
  churchId: varchar("churchId", { length: 64 }).notNull().default("demo-church"),
  authorId: integer("authorId").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  summary: varchar("summary", { length: 280 }).notNull(),
  body: text("body").notNull(),
  category: newsCategoryEnum("category").default("announcement").notNull(),
  status: newsStatusEnum("status").default("draft").notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var churchEvents = pgTable("church_events", {
  id: serial("id").primaryKey(),
  churchId: varchar("churchId", { length: 64 }).notNull().default("demo-church"),
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var countingSessions = pgTable("counting_sessions", {
  id: serial("id").primaryKey(),
  churchId: varchar("churchId", { length: 64 }).notNull().default("demo-church"),
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var offeringEnvelopes = pgTable("offering_envelopes", {
  id: serial("id").primaryKey(),
  sessionId: integer("sessionId").notNull(),
  churchId: varchar("churchId", { length: 64 }).notNull().default("demo-church"),
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var cashCounts = pgTable("cash_counts", {
  id: serial("id").primaryKey(),
  sessionId: integer("sessionId").notNull(),
  /** Face value in baht: 1000 … 0.25 */
  denomination: decimal("denomination", { precision: 8, scale: 2 }).notNull(),
  kind: cashKindEnum("kind").notNull(),
  quantity: integer("quantity").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var sessionDeductions = pgTable("session_deductions", {
  id: serial("id").primaryKey(),
  sessionId: integer("sessionId").notNull(),
  churchId: varchar("churchId", { length: 64 }).notNull().default("demo-church"),
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var bankRecords = pgTable("bank_records", {
  id: serial("id").primaryKey(),
  sessionId: integer("sessionId").notNull(),
  churchId: varchar("churchId", { length: 64 }).notNull().default("demo-church"),
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var sessionDocuments = pgTable("session_documents", {
  id: serial("id").primaryKey(),
  sessionId: integer("sessionId").notNull(),
  churchId: varchar("churchId", { length: 64 }).notNull().default("demo-church"),
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
  createdAt: timestamp("createdAt").defaultNow().notNull()
});

// shared/counting.ts
function toSatang(baht) {
  return Math.round(baht * 100);
}
function toBaht(satang) {
  return satang / 100;
}
function sumSatang(values) {
  return values.reduce((total, value) => total + toSatang(value), 0);
}
function reconcile(input) {
  const envelopeCash = sumSatang(
    input.envelopes.filter((e) => e.method === "cash").map((e) => e.amount)
  );
  const envelopeTransfer = sumSatang(
    input.envelopes.filter((e) => e.method === "transfer").map((e) => e.amount)
  );
  const envelopeCheck = sumSatang(
    input.envelopes.filter((e) => e.method === "check").map((e) => e.amount)
  );
  const offeringTotal = envelopeCash + envelopeTransfer + envelopeCheck;
  const countedCash = input.cashCounts.reduce(
    (total, row) => total + toSatang(row.denomination) * row.quantity,
    0
  );
  const deductions = sumSatang(input.deductions.map((d) => d.amount));
  const expectedDeposit = countedCash - deductions;
  const cashDeposit = sumSatang(
    input.bankRecords.filter((r) => r.type === "cash_deposit").map((r) => r.amount)
  );
  const transferIn = sumSatang(
    input.bankRecords.filter((r) => r.type === "transfer_in").map((r) => r.amount)
  );
  const cashVariance = countedCash - envelopeCash;
  const depositVariance = cashDeposit - expectedDeposit;
  const transferVariance = transferIn - envelopeTransfer;
  return {
    offeringTotal: toBaht(offeringTotal),
    envelopeCashTotal: toBaht(envelopeCash),
    envelopeTransferTotal: toBaht(envelopeTransfer),
    envelopeCheckTotal: toBaht(envelopeCheck),
    countedCashTotal: toBaht(countedCash),
    cashVariance: toBaht(cashVariance),
    deductionTotal: toBaht(deductions),
    expectedDeposit: toBaht(expectedDeposit),
    actualCashDeposit: toBaht(cashDeposit),
    depositVariance: toBaht(depositVariance),
    actualTransferIn: toBaht(transferIn),
    transferVariance: toBaht(transferVariance),
    isBalanced: cashVariance === 0 && depositVariance === 0 && transferVariance === 0
  };
}
var ALLOWED_TRANSITIONS = {
  counting: ["counted"],
  counted: ["counting", "verified"],
  verified: ["counted", "posted"],
  posted: ["closed"],
  closed: []
};
function canTransition(from, to) {
  return ALLOWED_TRANSITIONS[from].includes(to);
}
function isEditable(status) {
  return status === "counting";
}

// server/schema_init.ts
var ENUM_STATEMENTS = [
  `DO $$ BEGIN CREATE TYPE "public"."event_status" AS ENUM('draft', 'published', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."expense_category" AS ENUM('utilities', 'ministry', 'pastoral', 'admin', 'building', 'worship', 'welfare', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."expense_status" AS ENUM('draft', 'approved', 'paid', 'voided'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."finance_account_type" AS ENUM('general', 'tithe', 'mission', 'building', 'welfare', 'special'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."news_category" AS ENUM('announcement', 'ministry', 'finance', 'pastoral'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."news_status" AS ENUM('draft', 'published', 'archived'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."offering_category" AS ENUM('tithe', 'general', 'mission', 'building', 'welfare', 'special'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."offering_method" AS ENUM('cash', 'transfer', 'check'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."user_role" AS ENUM('user', 'admin'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."withdrawal_status" AS ENUM('pending', 'approved', 'rejected', 'disbursed'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."member_status" AS ENUM('active', 'inactive', 'pending'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."offering_status" AS ENUM('active', 'voided'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."bank_record_type" AS ENUM('transfer_in', 'cash_deposit'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."cash_kind" AS ENUM('note', 'coin'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."counting_session_status" AS ENUM('counting', 'counted', 'verified', 'posted', 'closed'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."session_document_kind" AS ENUM('count_sheet', 'envelope_photo', 'deposit_slip', 'transfer_slip', 'passbook_page', 'deduction_receipt', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$;`
];
var TABLE_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "users" (
    "id" serial PRIMARY KEY NOT NULL,
    "openId" varchar(64) NOT NULL UNIQUE,
    "name" text,
    "email" varchar(320),
    "loginMethod" varchar(64),
    "role" "user_role" DEFAULT 'user' NOT NULL,
    "churchRole" varchar(20),
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL,
    "lastSignedIn" timestamp DEFAULT now() NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "church_profiles" (
    "id" serial PRIMARY KEY NOT NULL,
    "churchId" varchar(64) NOT NULL UNIQUE,
    "name" varchar(180) NOT NULL,
    "address" text,
    "phone" varchar(20),
    "email" varchar(320),
    "website" varchar(500),
    "pastorName" varchar(120),
    "assistantPastorName" varchar(120),
    "treasurerName" varchar(120),
    "bankName" varchar(120),
    "bankAccount" varchar(30),
    "bankAccountName" varchar(120),
    "fiscalYearStartMonth" integer DEFAULT 1 NOT NULL,
    "logoUrl" varchar(500),
    "setupCompleted" boolean DEFAULT false NOT NULL,
    "motto" varchar(280),
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "finance_accounts" (
    "id" serial PRIMARY KEY NOT NULL,
    "churchId" varchar(64) NOT NULL,
    "name" varchar(120) NOT NULL,
    "type" "finance_account_type" DEFAULT 'general' NOT NULL,
    "balance" numeric(15, 2) DEFAULT '0' NOT NULL,
    "description" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "budget_plans" (
    "id" serial PRIMARY KEY NOT NULL,
    "churchId" varchar(64) NOT NULL,
    "year" integer NOT NULL,
    "month" integer,
    "fundId" integer,
    "category" varchar(80),
    "plannedAmount" numeric(15, 2) NOT NULL,
    "notes" text,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "church_events" (
    "id" serial PRIMARY KEY NOT NULL,
    "churchId" varchar(64) DEFAULT 'demo-church' NOT NULL,
    "authorId" integer NOT NULL,
    "title" varchar(180) NOT NULL,
    "summary" varchar(280) NOT NULL,
    "description" text NOT NULL,
    "startsAt" timestamp NOT NULL,
    "endsAt" timestamp,
    "location" varchar(180),
    "registrationUrl" varchar(500),
    "status" "event_status" DEFAULT 'draft' NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "church_news" (
    "id" serial PRIMARY KEY NOT NULL,
    "churchId" varchar(64) DEFAULT 'demo-church' NOT NULL,
    "authorId" integer NOT NULL,
    "title" varchar(180) NOT NULL,
    "summary" varchar(280) NOT NULL,
    "body" text NOT NULL,
    "category" "news_category" DEFAULT 'announcement' NOT NULL,
    "status" "news_status" DEFAULT 'draft' NOT NULL,
    "publishedAt" timestamp,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "expenses" (
    "id" serial PRIMARY KEY NOT NULL,
    "churchId" varchar(64) NOT NULL,
    "amount" numeric(15, 2) NOT NULL,
    "category" "expense_category" DEFAULT 'other' NOT NULL,
    "fundId" integer,
    "description" varchar(280) NOT NULL,
    "details" text,
    "expenseDate" timestamp DEFAULT now() NOT NULL,
    "payee" varchar(120),
    "receiptRef" varchar(120),
    "status" "expense_status" DEFAULT 'approved' NOT NULL,
    "approvedBy" integer,
    "recordedBy" integer NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "offerings" (
    "id" serial PRIMARY KEY NOT NULL,
    "churchId" varchar(64) NOT NULL,
    "amount" numeric(15, 2) NOT NULL,
    "category" "offering_category" DEFAULT 'general' NOT NULL,
    "fundId" integer,
    "donorName" varchar(120),
    "donorMemberId" integer,
    "receiptDate" timestamp DEFAULT now() NOT NULL,
    "method" "offering_method" DEFAULT 'cash' NOT NULL,
    "reference" varchar(120),
    "notes" text,
    "recordedBy" integer NOT NULL,
    "status" "offering_status" DEFAULT 'active' NOT NULL,
    "voidedAt" timestamp,
    "sessionId" integer,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "withdrawal_requests" (
    "id" serial PRIMARY KEY NOT NULL,
    "churchId" varchar(64) NOT NULL,
    "amount" numeric(15, 2) NOT NULL,
    "purpose" varchar(280) NOT NULL,
    "details" text,
    "fundId" integer,
    "requestedBy" integer NOT NULL,
    "requestDate" timestamp DEFAULT now() NOT NULL,
    "status" "withdrawal_status" DEFAULT 'pending' NOT NULL,
    "approvedBy" integer,
    "approvalDate" timestamp,
    "approvalNote" text,
    "rejectionReason" text,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "members" (
    "id" serial PRIMARY KEY NOT NULL,
    "churchId" varchar(64) NOT NULL,
    "name" varchar(180) NOT NULL,
    "phone" varchar(30),
    "email" varchar(320),
    "status" "member_status" DEFAULT 'active' NOT NULL,
    "avatarUrl" varchar(500),
    "envelopeNo" varchar(30),
    "notes" text,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "notifications" (
    "id" serial PRIMARY KEY NOT NULL,
    "churchId" varchar(64) NOT NULL,
    "userId" integer NOT NULL,
    "type" varchar(40) NOT NULL,
    "title" varchar(180) NOT NULL,
    "description" text,
    "link" varchar(500),
    "readAt" timestamp,
    "createdAt" timestamp DEFAULT now() NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" serial PRIMARY KEY NOT NULL,
    "churchId" varchar(64) NOT NULL,
    "userId" integer NOT NULL,
    "action" varchar(40) NOT NULL,
    "entity" varchar(80) NOT NULL,
    "entityId" integer,
    "metadata" jsonb,
    "createdAt" timestamp DEFAULT now() NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "bank_records" (
    "id" serial PRIMARY KEY NOT NULL,
    "sessionId" integer NOT NULL,
    "churchId" varchar(64) DEFAULT 'demo-church' NOT NULL,
    "type" "bank_record_type" NOT NULL,
    "amount" numeric(15, 2) NOT NULL,
    "transferredBy" integer,
    "transferredByName" varchar(180),
    "bankRef" varchar(120),
    "occurredAt" timestamp DEFAULT now() NOT NULL,
    "passbookMatched" boolean DEFAULT false NOT NULL,
    "passbookDate" timestamp,
    "matchedBy" integer,
    "recordedBy" integer NOT NULL,
    "notes" text,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "cash_counts" (
    "id" serial PRIMARY KEY NOT NULL,
    "sessionId" integer NOT NULL,
    "denomination" numeric(8, 2) NOT NULL,
    "kind" "cash_kind" NOT NULL,
    "quantity" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "counting_sessions" (
    "id" serial PRIMARY KEY NOT NULL,
    "churchId" varchar(64) DEFAULT 'demo-church' NOT NULL,
    "serviceDate" timestamp NOT NULL,
    "serviceRound" integer DEFAULT 1 NOT NULL,
    "serviceName" varchar(120),
    "status" "counting_session_status" DEFAULT 'counting' NOT NULL,
    "countedBy" integer NOT NULL,
    "countSubmittedAt" timestamp,
    "verifiedBy" integer,
    "verifiedAt" timestamp,
    "postedBy" integer,
    "postedAt" timestamp,
    "closedAt" timestamp,
    "varianceNote" text,
    "varianceApprovedBy" integer,
    "notes" text,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "offering_envelopes" (
    "id" serial PRIMARY KEY NOT NULL,
    "sessionId" integer NOT NULL,
    "churchId" varchar(64) DEFAULT 'demo-church' NOT NULL,
    "envelopeNo" varchar(30),
    "memberId" integer,
    "donorName" varchar(180),
    "isAnonymous" boolean DEFAULT false NOT NULL,
    "category" "offering_category" DEFAULT 'general' NOT NULL,
    "fundId" integer,
    "method" "offering_method" DEFAULT 'cash' NOT NULL,
    "amount" numeric(15, 2) NOT NULL,
    "reference" varchar(120),
    "notes" text,
    "recordedBy" integer NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "session_deductions" (
    "id" serial PRIMARY KEY NOT NULL,
    "sessionId" integer NOT NULL,
    "churchId" varchar(64) DEFAULT 'demo-church' NOT NULL,
    "purpose" varchar(200) NOT NULL,
    "reason" text NOT NULL,
    "amount" numeric(15, 2) NOT NULL,
    "paidTo" varchar(180) NOT NULL,
    "requestedBy" integer NOT NULL,
    "approvedBy" integer,
    "approvedAt" timestamp,
    "category" "expense_category" DEFAULT 'other' NOT NULL,
    "fundId" integer,
    "expenseId" integer,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "session_documents" (
    "id" serial PRIMARY KEY NOT NULL,
    "sessionId" integer NOT NULL,
    "churchId" varchar(64) DEFAULT 'demo-church' NOT NULL,
    "kind" "session_document_kind" DEFAULT 'other' NOT NULL,
    "fileName" varchar(255) NOT NULL,
    "mimeType" varchar(120),
    "fileSize" integer,
    "driveFileId" varchar(180),
    "fileUrl" varchar(600),
    "drivePath" varchar(300),
    "deductionId" integer,
    "bankRecordId" integer,
    "uploadedBy" integer NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL
  );`
];
var INDEX_STATEMENTS = [
  `CREATE INDEX IF NOT EXISTS "members_church_idx" ON "members" USING btree ("churchId");`,
  `CREATE INDEX IF NOT EXISTS "notifications_user_idx" ON "notifications" USING btree ("churchId", "userId", "createdAt");`,
  `CREATE INDEX IF NOT EXISTS "audit_logs_entity_idx" ON "audit_logs" USING btree ("churchId", "entity", "entityId", "createdAt");`
];
async function runSchemaInit(client) {
  for (const stmt of ENUM_STATEMENTS) {
    try {
      await client.unsafe(stmt);
    } catch (err) {
      console.warn("[Enum Init]", err.message);
    }
  }
  for (const stmt of TABLE_STATEMENTS) {
    try {
      await client.unsafe(stmt);
    } catch (err) {
      console.warn("[Table Init]", err.message);
    }
  }
  for (const stmt of INDEX_STATEMENTS) {
    try {
      await client.unsafe(stmt);
    } catch (err) {
      console.warn("[Index Init]", err.message);
    }
  }
}

// server/db.ts
var _db = null;
var _schemaInitialized = false;
var DEFAULT_CHURCH_ID = "demo-church";
async function getDb() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
  if (!_db && dbUrl) {
    try {
      const client = postgres(dbUrl, { prepare: false });
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
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  const values = { openId: user.openId };
  const updateSet = {};
  const textFields = ["name", "email", "loginMethod"];
  const assignNullable = (field) => {
    const value = user[field];
    if (value === void 0) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== void 0) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== void 0) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= /* @__PURE__ */ new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = /* @__PURE__ */ new Date();
  await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateUserChurchRole(userId, churchRole) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(users).set({ churchRole }).where(eq(users.id, userId));
}
async function getChurchProfile(churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(churchProfiles).where(eq(churchProfiles.churchId, churchId)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function upsertChurchProfile(input) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const churchId = input.churchId ?? DEFAULT_CHURCH_ID;
  const { id, createdAt, churchId: _c, ...updateFields } = input;
  await db.insert(churchProfiles).values({ ...input, churchId }).onConflictDoUpdate({
    target: churchProfiles.churchId,
    set: { ...updateFields, updatedAt: /* @__PURE__ */ new Date() }
  });
}
async function markSetupCompleted(churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(churchProfiles).set({ setupCompleted: true }).where(eq(churchProfiles.churchId, churchId));
}
async function listFinanceAccounts(churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(financeAccounts).where(
    and(
      eq(financeAccounts.churchId, churchId),
      eq(financeAccounts.isActive, true)
    )
  ).orderBy(asc(financeAccounts.sortOrder), asc(financeAccounts.name));
}
async function createFinanceAccount(input) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(financeAccounts).values({ ...input, churchId: input.churchId ?? DEFAULT_CHURCH_ID }).returning({ id: financeAccounts.id });
  return result[0].id;
}
async function getFinancialSummary(churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) return null;
  const now = /* @__PURE__ */ new Date();
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
    const [accounts, thisOfferings, prevOfferings, thisExpenses, prevExpenses] = await Promise.all([
      db.select().from(financeAccounts).where(
        and(
          eq(financeAccounts.churchId, churchId),
          eq(financeAccounts.isActive, true)
        )
      ),
      db.select({ total: sum(offerings.amount) }).from(offerings).where(
        and(
          eq(offerings.churchId, churchId),
          ne(offerings.status, "voided"),
          between(offerings.receiptDate, thisMonthStart, thisMonthEnd)
        )
      ),
      db.select({ total: sum(offerings.amount) }).from(offerings).where(
        and(
          eq(offerings.churchId, churchId),
          ne(offerings.status, "voided"),
          between(offerings.receiptDate, prevMonthStart, prevMonthEnd)
        )
      ),
      db.select({ total: sum(expenses.amount) }).from(expenses).where(
        and(
          eq(expenses.churchId, churchId),
          ne(expenses.status, "voided"),
          between(expenses.expenseDate, thisMonthStart, thisMonthEnd)
        )
      ),
      db.select({ total: sum(expenses.amount) }).from(expenses).where(
        and(
          eq(expenses.churchId, churchId),
          ne(expenses.status, "voided"),
          between(expenses.expenseDate, prevMonthStart, prevMonthEnd)
        )
      )
    ]);
    const totalBalance = accounts.reduce(
      (sum2, a) => sum2 + parseFloat(a.balance ?? "0"),
      0
    );
    const monthlyIncome = parseFloat(thisOfferings[0]?.total ?? "0") || 0;
    const monthlyExpense = parseFloat(thisExpenses[0]?.total ?? "0") || 0;
    const prevMonthIncome = parseFloat(prevOfferings[0]?.total ?? "0") || 0;
    const prevMonthExpense = parseFloat(prevExpenses[0]?.total ?? "0") || 0;
    return {
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      prevMonthIncome,
      prevMonthExpense,
      accounts: accounts.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        balance: parseFloat(a.balance ?? "0")
      }))
    };
  } catch {
    return null;
  }
}
async function getMonthlyStats(churchId = DEFAULT_CHURCH_ID, months = 6) {
  const db = await getDb();
  if (!db) return [];
  const result = [];
  const now = /* @__PURE__ */ new Date();
  const thaiMonths = [
    "\u0E21.\u0E04.",
    "\u0E01.\u0E1E.",
    "\u0E21\u0E35.\u0E04.",
    "\u0E40\u0E21.\u0E22.",
    "\u0E1E.\u0E04.",
    "\u0E21\u0E34.\u0E22.",
    "\u0E01.\u0E04.",
    "\u0E2A.\u0E04.",
    "\u0E01.\u0E22.",
    "\u0E15.\u0E04.",
    "\u0E1E.\u0E22.",
    "\u0E18.\u0E04."
  ];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const [inc, exp] = await Promise.all([
      db.select({ total: sum(offerings.amount) }).from(offerings).where(
        and(
          eq(offerings.churchId, churchId),
          ne(offerings.status, "voided"),
          between(offerings.receiptDate, start, end)
        )
      ),
      db.select({ total: sum(expenses.amount) }).from(expenses).where(
        and(
          eq(expenses.churchId, churchId),
          ne(expenses.status, "voided"),
          between(expenses.expenseDate, start, end)
        )
      )
    ]);
    result.push({
      month: thaiMonths[d.getMonth()],
      income: parseFloat(inc[0]?.total ?? "0") || 0,
      expense: parseFloat(exp[0]?.total ?? "0") || 0
    });
  }
  return result;
}
async function listOfferings(churchId = DEFAULT_CHURCH_ID, opts = {}) {
  const db = await getDb();
  if (!db) return [];
  const { limit = 50, showDonorNames = false, fromDate, toDate } = opts;
  const conditions = [
    eq(offerings.churchId, churchId),
    ne(offerings.status, "voided")
  ];
  if (fromDate) conditions.push(gte(offerings.receiptDate, fromDate));
  if (toDate) conditions.push(lte(offerings.receiptDate, toDate));
  const rows = await db.select().from(offerings).where(and(...conditions)).orderBy(desc(offerings.receiptDate)).limit(limit);
  return rows.map((r) => ({
    id: r.id,
    amount: parseFloat(r.amount ?? "0"),
    category: r.category,
    donorName: showDonorNames ? r.donorName : r.donorName ? "\u0E1C\u0E39\u0E49\u0E16\u0E27\u0E32\u0E22\u0E19\u0E34\u0E23\u0E19\u0E32\u0E21" : null,
    receiptDate: r.receiptDate,
    method: r.method,
    notes: r.notes,
    fundId: r.fundId
  }));
}
async function getOfferingById(id, churchId = DEFAULT_CHURCH_ID, showDonorNames = false) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(offerings).where(
    and(
      eq(offerings.id, id),
      eq(offerings.churchId, churchId),
      ne(offerings.status, "voided")
    )
  ).limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    amount: parseFloat(row.amount ?? "0"),
    category: row.category,
    donorName: showDonorNames ? row.donorName : row.donorName ? "\u0E1C\u0E39\u0E49\u0E16\u0E27\u0E32\u0E22\u0E19\u0E34\u0E23\u0E19\u0E32\u0E21" : null,
    receiptDate: row.receiptDate,
    method: row.method,
    notes: row.notes,
    fundId: row.fundId
  };
}
async function createOffering(input, churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async (tx) => {
    const result = await tx.insert(offerings).values({ ...input, churchId }).returning({ id: offerings.id });
    if (input.fundId) {
      await tx.execute(
        sql`UPDATE finance_accounts SET balance = balance + ${input.amount} WHERE id = ${input.fundId} AND "churchId" = ${churchId}`
      );
    }
    return result[0].id;
  });
}
async function updateOffering(id, input, churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async (tx) => {
    const existing = await tx.select({ amount: offerings.amount, fundId: offerings.fundId }).from(offerings).where(
      and(
        eq(offerings.id, id),
        eq(offerings.churchId, churchId),
        ne(offerings.status, "voided")
      )
    ).limit(1);
    if (!existing[0]) return null;
    const updatedRows = await tx.update(offerings).set(input).where(
      and(
        eq(offerings.id, id),
        eq(offerings.churchId, churchId),
        ne(offerings.status, "voided")
      )
    ).returning({ id: offerings.id });
    if (!updatedRows[0]) return null;
    if (input.amount !== void 0 || input.fundId !== void 0) {
      const oldAmount = Number(existing[0].amount);
      const newAmount = input.amount === void 0 ? oldAmount : Number(input.amount);
      const oldFundId = existing[0].fundId;
      const newFundId = input.fundId === void 0 ? oldFundId : input.fundId;
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
async function listExpenses(churchId = DEFAULT_CHURCH_ID, opts = {}) {
  const db = await getDb();
  if (!db) return [];
  const { limit = 50, fromDate, toDate } = opts;
  const conditions = [
    eq(expenses.churchId, churchId),
    ne(expenses.status, "voided")
  ];
  if (fromDate) conditions.push(gte(expenses.expenseDate, fromDate));
  if (toDate) conditions.push(lte(expenses.expenseDate, toDate));
  const rows = await db.select().from(expenses).where(and(...conditions)).orderBy(desc(expenses.expenseDate)).limit(limit);
  return rows.map((r) => ({
    id: r.id,
    amount: parseFloat(r.amount ?? "0"),
    category: r.category,
    description: r.description,
    expenseDate: r.expenseDate,
    payee: r.payee,
    status: r.status,
    fundId: r.fundId
  }));
}
async function getExpenseById(id, churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(expenses).where(
    and(
      eq(expenses.id, id),
      eq(expenses.churchId, churchId),
      ne(expenses.status, "voided")
    )
  ).limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    amount: parseFloat(row.amount ?? "0"),
    category: row.category,
    description: row.description,
    expenseDate: row.expenseDate,
    payee: row.payee,
    status: row.status,
    fundId: row.fundId
  };
}
async function createExpense(input, churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async (tx) => {
    const result = await tx.insert(expenses).values({ ...input, churchId }).returning({ id: expenses.id });
    if (input.fundId) {
      await tx.execute(
        sql`UPDATE finance_accounts SET balance = balance - ${input.amount} WHERE id = ${input.fundId} AND "churchId" = ${churchId}`
      );
    }
    return result[0].id;
  });
}
async function updateExpense(id, input, churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async (tx) => {
    const existing = await tx.select({ amount: expenses.amount, fundId: expenses.fundId }).from(expenses).where(
      and(
        eq(expenses.id, id),
        eq(expenses.churchId, churchId),
        ne(expenses.status, "voided")
      )
    ).limit(1);
    if (!existing[0]) return null;
    const updatedRows = await tx.update(expenses).set(input).where(
      and(
        eq(expenses.id, id),
        eq(expenses.churchId, churchId),
        ne(expenses.status, "voided")
      )
    ).returning({ id: expenses.id });
    if (!updatedRows[0]) return null;
    if (input.amount !== void 0 || input.fundId !== void 0) {
      const oldAmount = Number(existing[0].amount);
      const newAmount = input.amount === void 0 ? oldAmount : Number(input.amount);
      const oldFundId = existing[0].fundId;
      const newFundId = input.fundId === void 0 ? oldFundId : input.fundId;
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
async function voidOffering(id, churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async (tx) => {
    const existing = await tx.select({
      amount: offerings.amount,
      fundId: offerings.fundId,
      status: offerings.status
    }).from(offerings).where(
      and(
        eq(offerings.id, id),
        eq(offerings.churchId, churchId),
        ne(offerings.status, "voided")
      )
    ).limit(1);
    if (!existing[0] || existing[0].status === "voided") return false;
    const updatedRows = await tx.update(offerings).set({ status: "voided", voidedAt: /* @__PURE__ */ new Date() }).where(
      and(
        eq(offerings.id, id),
        eq(offerings.churchId, churchId),
        ne(offerings.status, "voided")
      )
    ).returning({ id: offerings.id });
    if (!updatedRows[0]) return false;
    if (existing[0].fundId)
      await tx.execute(
        sql`UPDATE finance_accounts SET balance = balance - ${Number(existing[0].amount)} WHERE id = ${existing[0].fundId} AND "churchId" = ${churchId}`
      );
    return true;
  });
}
async function voidExpense(id, churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async (tx) => {
    const existing = await tx.select({
      amount: expenses.amount,
      fundId: expenses.fundId,
      status: expenses.status
    }).from(expenses).where(
      and(
        eq(expenses.id, id),
        eq(expenses.churchId, churchId),
        ne(expenses.status, "voided")
      )
    ).limit(1);
    if (!existing[0] || existing[0].status === "voided") return false;
    const updatedRows = await tx.update(expenses).set({ status: "voided" }).where(
      and(
        eq(expenses.id, id),
        eq(expenses.churchId, churchId),
        ne(expenses.status, "voided")
      )
    ).returning({ id: expenses.id });
    if (!updatedRows[0]) return false;
    if (existing[0].fundId)
      await tx.execute(
        sql`UPDATE finance_accounts SET balance = balance + ${Number(existing[0].amount)} WHERE id = ${existing[0].fundId} AND "churchId" = ${churchId}`
      );
    return true;
  });
}
async function listWithdrawalRequests(churchId = DEFAULT_CHURCH_ID, opts = {}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(withdrawalRequests.churchId, churchId)];
  if (opts.userId)
    conditions.push(eq(withdrawalRequests.requestedBy, opts.userId));
  const rows = await db.select().from(withdrawalRequests).where(and(...conditions)).orderBy(desc(withdrawalRequests.createdAt)).limit(50);
  return rows.map((r) => ({
    ...r,
    amount: parseFloat(r.amount ?? "0")
  }));
}
async function createWithdrawalRequest(input, churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(withdrawalRequests).values({ ...input, churchId }).returning({ id: withdrawalRequests.id });
  return result[0].id;
}
async function approveWithdrawal(id, approverId, action, note, churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.update(withdrawalRequests).set({
    status: action,
    approvedBy: approverId,
    approvalDate: /* @__PURE__ */ new Date(),
    approvalNote: action === "approved" ? note : null,
    rejectionReason: action === "rejected" ? note : null
  }).where(
    and(
      eq(withdrawalRequests.id, id),
      eq(withdrawalRequests.churchId, churchId),
      eq(withdrawalRequests.status, "pending")
    )
  ).returning({ id: withdrawalRequests.id });
  return rows.length > 0;
}
async function disburseWithdrawal(id, churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.update(withdrawalRequests).set({ status: "disbursed" }).where(
    and(
      eq(withdrawalRequests.id, id),
      eq(withdrawalRequests.churchId, churchId),
      eq(withdrawalRequests.status, "approved")
    )
  ).returning({ id: withdrawalRequests.id });
  return rows.length > 0;
}
async function listMembers(churchId = DEFAULT_CHURCH_ID, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(members).where(eq(members.churchId, churchId)).orderBy(asc(members.name)).limit(limit);
}
async function getMemberById(id, churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(members).where(and(eq(members.id, id), eq(members.churchId, churchId))).limit(1);
  return rows[0] ?? null;
}
async function createMember(input, churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.insert(members).values({ ...input, churchId }).returning({ id: members.id });
  return rows[0].id;
}
async function updateMember(id, input, churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.update(members).set(input).where(and(eq(members.id, id), eq(members.churchId, churchId))).returning({ id: members.id });
  return rows[0]?.id ?? null;
}
async function deactivateMember(id, churchId = DEFAULT_CHURCH_ID) {
  return updateMember(id, { status: "inactive" }, churchId);
}
async function listNotifications(userId, churchId = DEFAULT_CHURCH_ID, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(
    and(
      eq(notifications.userId, userId),
      eq(notifications.churchId, churchId)
    )
  ).orderBy(desc(notifications.createdAt)).limit(limit);
}
async function createNotification(input, churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.insert(notifications).values({ ...input, churchId }).returning({ id: notifications.id });
  return rows[0].id;
}
async function markNotificationRead(id, userId, churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(notifications).set({ readAt: /* @__PURE__ */ new Date() }).where(
    and(
      eq(notifications.id, id),
      eq(notifications.userId, userId),
      eq(notifications.churchId, churchId)
    )
  );
}
async function markAllNotificationsRead(userId, churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(notifications).set({ readAt: /* @__PURE__ */ new Date() }).where(
    and(
      eq(notifications.userId, userId),
      eq(notifications.churchId, churchId)
    )
  );
}
async function createAuditLog(input) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(auditLogs).values({
    churchId: input.churchId,
    userId: input.userId,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId ?? null,
    metadata: input.metadata
  });
}
async function getFinancialReportData(churchId = DEFAULT_CHURCH_ID, fromDate, toDate) {
  const db = await getDb();
  if (!db) return [];
  const [offeringsRows, expensesRows] = await Promise.all([
    db.select().from(offerings).where(
      and(
        eq(offerings.churchId, churchId),
        ne(offerings.status, "voided"),
        between(offerings.receiptDate, fromDate, toDate)
      )
    ).orderBy(asc(offerings.receiptDate)),
    db.select().from(expenses).where(
      and(
        eq(expenses.churchId, churchId),
        ne(expenses.status, "voided"),
        between(expenses.expenseDate, fromDate, toDate)
      )
    ).orderBy(asc(expenses.expenseDate))
  ]);
  const rows = [
    ...offeringsRows.map((r) => ({
      date: r.receiptDate.toISOString().split("T")[0],
      type: "income",
      category: r.category,
      description: r.notes || `\u0E16\u0E27\u0E32\u0E22${r.category}`,
      amount: parseFloat(r.amount ?? "0"),
      method: r.method
    })),
    ...expensesRows.map((r) => ({
      date: r.expenseDate.toISOString().split("T")[0],
      type: "expense",
      category: r.category,
      description: r.description,
      amount: parseFloat(r.amount ?? "0")
    }))
  ];
  return rows.sort((a, b) => a.date.localeCompare(b.date));
}
async function listPublishedChurchNews(limit = 12) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(churchNews).where(
    and(
      eq(churchNews.churchId, DEFAULT_CHURCH_ID),
      eq(churchNews.status, "published")
    )
  ).orderBy(desc(churchNews.publishedAt), desc(churchNews.createdAt)).limit(limit);
}
async function listPublishedChurchEvents(limit = 12) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(churchEvents).where(
    and(
      eq(churchEvents.churchId, DEFAULT_CHURCH_ID),
      eq(churchEvents.status, "published")
    )
  ).orderBy(asc(churchEvents.startsAt)).limit(limit);
}
async function listAllChurchNews(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(churchNews).where(eq(churchNews.churchId, DEFAULT_CHURCH_ID)).orderBy(desc(churchNews.updatedAt)).limit(limit);
}
async function listAllChurchEvents(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(churchEvents).where(eq(churchEvents.churchId, DEFAULT_CHURCH_ID)).orderBy(desc(churchEvents.updatedAt)).limit(limit);
}
async function createChurchNews(input) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(churchNews).values({ ...input, churchId: DEFAULT_CHURCH_ID }).returning({ id: churchNews.id });
  return result[0].id;
}
async function createChurchEvent(input) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(churchEvents).values({ ...input, churchId: DEFAULT_CHURCH_ID }).returning({ id: churchEvents.id });
  return result[0].id;
}
async function updateChurchNews(id, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(churchNews).set(input).where(
    and(eq(churchNews.id, id), eq(churchNews.churchId, DEFAULT_CHURCH_ID))
  );
}
async function updateChurchEvent(id, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(churchEvents).set(input).where(
    and(eq(churchEvents.id, id), eq(churchEvents.churchId, DEFAULT_CHURCH_ID))
  );
}
async function updateChurchNewsStatus(id, status) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(churchNews).set({
    status,
    publishedAt: status === "published" ? /* @__PURE__ */ new Date() : void 0
  }).where(
    and(eq(churchNews.id, id), eq(churchNews.churchId, DEFAULT_CHURCH_ID))
  );
}
async function updateChurchEventStatus(id, status) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(churchEvents).set({ status }).where(
    and(eq(churchEvents.id, id), eq(churchEvents.churchId, DEFAULT_CHURCH_ID))
  );
}
async function deleteChurchNews(id) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(churchNews).where(
    and(eq(churchNews.id, id), eq(churchNews.churchId, DEFAULT_CHURCH_ID))
  );
}
async function deleteChurchEvent(id) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(churchEvents).where(
    and(eq(churchEvents.id, id), eq(churchEvents.churchId, DEFAULT_CHURCH_ID))
  );
}
var num = (value) => parseFloat(value ?? "0");
async function listCountingSessions(churchId = DEFAULT_CHURCH_ID, limit = 52) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(countingSessions).where(eq(countingSessions.churchId, churchId)).orderBy(desc(countingSessions.serviceDate)).limit(limit);
  return rows;
}
async function getCountingSession(id, churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(countingSessions).where(
    and(eq(countingSessions.id, id), eq(countingSessions.churchId, churchId))
  ).limit(1);
  return rows[0] ?? null;
}
async function getCountingSessionDetail(id, churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) return null;
  const session = await getCountingSession(id, churchId);
  if (!session) return null;
  const [envelopeRows, cashRows, deductionRows, bankRows, documentRows] = await Promise.all([
    db.select().from(offeringEnvelopes).where(eq(offeringEnvelopes.sessionId, id)).orderBy(asc(offeringEnvelopes.id)),
    db.select().from(cashCounts).where(eq(cashCounts.sessionId, id)).orderBy(desc(cashCounts.denomination)),
    db.select().from(sessionDeductions).where(eq(sessionDeductions.sessionId, id)).orderBy(asc(sessionDeductions.id)),
    db.select().from(bankRecords).where(eq(bankRecords.sessionId, id)).orderBy(asc(bankRecords.id)),
    db.select().from(sessionDocuments).where(eq(sessionDocuments.sessionId, id)).orderBy(desc(sessionDocuments.createdAt))
  ]);
  const envelopes = envelopeRows.map((r) => ({ ...r, amount: num(r.amount) }));
  const cash = cashRows.map((r) => ({
    ...r,
    denomination: num(r.denomination)
  }));
  const deductions = deductionRows.map((r) => ({ ...r, amount: num(r.amount) }));
  const bank = bankRows.map((r) => ({ ...r, amount: num(r.amount) }));
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
      bankRecords: bank
    })
  };
}
async function createCountingSession(input, churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.insert(countingSessions).values({ ...input, churchId }).returning({ id: countingSessions.id });
  return rows[0].id;
}
async function setCountingSessionStatus(id, from, to, patch = {}, churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.update(countingSessions).set({ ...patch, status: to }).where(
    and(
      eq(countingSessions.id, id),
      eq(countingSessions.churchId, churchId),
      eq(countingSessions.status, from)
    )
  ).returning({ id: countingSessions.id });
  return rows.length > 0;
}
async function addOfferingEnvelope(input, churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.insert(offeringEnvelopes).values({ ...input, churchId }).returning({ id: offeringEnvelopes.id });
  return rows[0].id;
}
async function updateOfferingEnvelope(id, sessionId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.update(offeringEnvelopes).set(input).where(
    and(
      eq(offeringEnvelopes.id, id),
      eq(offeringEnvelopes.sessionId, sessionId)
    )
  ).returning({ id: offeringEnvelopes.id });
  return rows[0]?.id ?? null;
}
async function deleteOfferingEnvelope(id, sessionId) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.delete(offeringEnvelopes).where(
    and(
      eq(offeringEnvelopes.id, id),
      eq(offeringEnvelopes.sessionId, sessionId)
    )
  ).returning({ id: offeringEnvelopes.id });
  return rows.length > 0;
}
async function setCashCount(input) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async (tx) => {
    const existing = await tx.select({ id: cashCounts.id }).from(cashCounts).where(
      and(
        eq(cashCounts.sessionId, input.sessionId),
        eq(cashCounts.denomination, input.denomination),
        eq(cashCounts.kind, input.kind)
      )
    ).limit(1);
    if (existing[0]) {
      await tx.update(cashCounts).set({ quantity: input.quantity }).where(eq(cashCounts.id, existing[0].id));
      return existing[0].id;
    }
    const rows = await tx.insert(cashCounts).values(input).returning({ id: cashCounts.id });
    return rows[0].id;
  });
}
async function addSessionDeduction(input, churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.insert(sessionDeductions).values({ ...input, churchId }).returning({ id: sessionDeductions.id });
  return rows[0].id;
}
async function approveSessionDeduction(id, approverId, churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.update(sessionDeductions).set({ approvedBy: approverId, approvedAt: /* @__PURE__ */ new Date() }).where(
    and(
      eq(sessionDeductions.id, id),
      eq(sessionDeductions.churchId, churchId),
      ne(sessionDeductions.requestedBy, approverId)
    )
  ).returning({ id: sessionDeductions.id });
  return rows.length > 0;
}
async function deleteSessionDeduction(id, sessionId) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.delete(sessionDeductions).where(
    and(
      eq(sessionDeductions.id, id),
      eq(sessionDeductions.sessionId, sessionId)
    )
  ).returning({ id: sessionDeductions.id });
  return rows.length > 0;
}
async function addBankRecord(input, churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.insert(bankRecords).values({ ...input, churchId }).returning({ id: bankRecords.id });
  return rows[0].id;
}
async function matchBankRecordToPassbook(id, matchedBy, passbookDate, churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.update(bankRecords).set({ passbookMatched: true, passbookDate, matchedBy }).where(and(eq(bankRecords.id, id), eq(bankRecords.churchId, churchId))).returning({ id: bankRecords.id });
  return rows.length > 0;
}
async function addSessionDocument(input, churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.insert(sessionDocuments).values({ ...input, churchId }).returning({ id: sessionDocuments.id });
  return rows[0].id;
}
async function postCountingSession(id, postedBy, churchId = DEFAULT_CHURCH_ID) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async (tx) => {
    const claimed = await tx.update(countingSessions).set({ status: "posted", postedBy, postedAt: /* @__PURE__ */ new Date() }).where(
      and(
        eq(countingSessions.id, id),
        eq(countingSessions.churchId, churchId),
        eq(countingSessions.status, "verified")
      )
    ).returning({
      id: countingSessions.id,
      serviceDate: countingSessions.serviceDate
    });
    if (!claimed[0]) return null;
    const serviceDate = claimed[0].serviceDate;
    const envelopeRows = await tx.select().from(offeringEnvelopes).where(eq(offeringEnvelopes.sessionId, id));
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
        recordedBy: envelope.recordedBy
      });
      if (envelope.fundId) {
        await tx.execute(
          sql`UPDATE finance_accounts SET balance = balance + ${envelope.amount} WHERE id = ${envelope.fundId} AND "churchId" = ${churchId}`
        );
      }
      offeringCount += 1;
    }
    const deductionRows = await tx.select().from(sessionDeductions).where(eq(sessionDeductions.sessionId, id));
    let deductionCount = 0;
    for (const deduction of deductionRows) {
      const inserted = await tx.insert(expenses).values({
        churchId,
        amount: deduction.amount,
        category: deduction.category,
        fundId: deduction.fundId,
        description: deduction.purpose,
        details: `\u0E2B\u0E31\u0E01\u0E08\u0E32\u0E01\u0E16\u0E38\u0E07\u0E16\u0E27\u0E32\u0E22 ${deduction.reason}`,
        expenseDate: serviceDate,
        payee: deduction.paidTo,
        status: "approved",
        recordedBy: deduction.requestedBy
      }).returning({ id: expenses.id });
      await tx.update(sessionDeductions).set({ expenseId: inserted[0].id }).where(eq(sessionDeductions.id, deduction.id));
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
async function getFinancialReportSummary(churchId = DEFAULT_CHURCH_ID, fromDate, toDate) {
  const empty = {
    from: fromDate.toISOString().slice(0, 10),
    to: toDate.toISOString().slice(0, 10),
    income: [],
    expense: [],
    totalIncome: 0,
    totalExpense: 0,
    net: 0,
    transactionCount: 0,
    funds: []
  };
  const db = await getDb();
  if (!db) return empty;
  const [incomeRows, expenseRows, fundRows] = await Promise.all([
    db.select({
      category: offerings.category,
      total: sum(offerings.amount),
      count: count(offerings.id)
    }).from(offerings).where(
      and(
        eq(offerings.churchId, churchId),
        ne(offerings.status, "voided"),
        between(offerings.receiptDate, fromDate, toDate)
      )
    ).groupBy(offerings.category),
    db.select({
      category: expenses.category,
      total: sum(expenses.amount),
      count: count(expenses.id)
    }).from(expenses).where(
      and(
        eq(expenses.churchId, churchId),
        ne(expenses.status, "voided"),
        between(expenses.expenseDate, fromDate, toDate)
      )
    ).groupBy(expenses.category),
    db.select().from(financeAccounts).where(
      and(
        eq(financeAccounts.churchId, churchId),
        eq(financeAccounts.isActive, true)
      )
    ).orderBy(asc(financeAccounts.sortOrder), asc(financeAccounts.name))
  ]);
  const toRow = (r) => ({
    category: r.category,
    total: parseFloat(r.total ?? "0"),
    count: Number(r.count)
  });
  const income = incomeRows.map(toRow);
  const expense = expenseRows.map(toRow);
  const totalIncome = income.reduce((sum2, r) => sum2 + r.total, 0);
  const totalExpense = expense.reduce((sum2, r) => sum2 + r.total, 0);
  return {
    ...empty,
    income,
    expense,
    totalIncome,
    totalExpense,
    net: totalIncome - totalExpense,
    transactionCount: income.reduce((n, r) => n + r.count, 0) + expense.reduce((n, r) => n + r.count, 0),
    funds: fundRows.map((f) => ({
      id: f.id,
      name: f.name,
      type: f.type,
      balance: parseFloat(f.balance ?? "0")
    }))
  };
}

// server/routers.ts
import { TRPCError as TRPCError3 } from "@trpc/server";

// shared/categories.ts
var EXPENSE_CATEGORY_IDS = [
  "utilities",
  "ministry",
  "pastoral",
  "admin",
  "building",
  "worship",
  "welfare",
  "other"
];
var OFFERING_CATEGORY_IDS = [
  "tithe",
  "general",
  "mission",
  "building",
  "welfare",
  "special"
];

// server/routers.ts
function canManageFinance(user) {
  return user.role === "admin" || user.churchRole === "TREASURER" || user.churchRole === "SUPER_ADMIN";
}
function canViewDonorNames(user) {
  return user.role === "admin" || user.churchRole === "TREASURER" || user.churchRole === "SUPER_ADMIN";
}
function canApproveWithdrawals(user) {
  return user.role === "admin" || user.churchRole === "TREASURER" || user.churchRole === "SUPER_ADMIN";
}
function canManageChurchSettings(user) {
  return user.role === "admin" || user.churchRole === "SUPER_ADMIN" || user.churchRole === "PASTOR";
}
function canCountOfferings(user) {
  return user.churchRole === "COUNTER" || canManageFinance(user);
}
function canVerifyCount(user) {
  return canManageFinance(user);
}
function canApproveDeduction(user) {
  return user.role === "admin" || user.churchRole === "SUPER_ADMIN" || user.churchRole === "PASTOR" || user.churchRole === "TREASURER";
}
var adminProcedure2 = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError3({
      code: "FORBIDDEN",
      message: "\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E1C\u0E39\u0E49\u0E14\u0E39\u0E41\u0E25\u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19"
    });
  }
  return next();
});
var financeProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!canManageFinance(ctx.user)) {
    throw new TRPCError3({
      code: "FORBIDDEN",
      message: "\u0E04\u0E38\u0E13\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E01\u0E32\u0E23\u0E40\u0E07\u0E34\u0E19"
    });
  }
  return next();
});
var churchLeaderProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!canManageChurchSettings(ctx.user)) {
    throw new TRPCError3({
      code: "FORBIDDEN",
      message: "\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E1C\u0E39\u0E49\u0E19\u0E33\u0E04\u0E23\u0E34\u0E2A\u0E15\u0E08\u0E31\u0E01\u0E23\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19"
    });
  }
  return next();
});
var newsCategory = z2.enum([
  "announcement",
  "ministry",
  "finance",
  "pastoral"
]);
var newsStatus = z2.enum(["draft", "published", "archived"]);
var eventStatus = z2.enum(["draft", "published", "cancelled"]);
var offeringCategory = z2.enum(OFFERING_CATEGORY_IDS);
var expenseCategory = z2.enum(EXPENSE_CATEGORY_IDS);
var expenseStatus = z2.enum(["draft", "approved", "paid"]);
var paymentMethod = z2.enum(["cash", "transfer", "check"]);
var churchRoleEnum = z2.enum([
  "SUPER_ADMIN",
  "PASTOR",
  "TREASURER",
  "COUNTER",
  "MEMBER"
]);
var reportDateRange = z2.object({ fromDate: z2.coerce.date(), toDate: z2.coerce.date() }).refine((data) => data.fromDate <= data.toDate, {
  message: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19\u0E15\u0E49\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E2B\u0E25\u0E31\u0E07\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E34\u0E49\u0E19\u0E2A\u0E38\u0E14",
  path: ["toDate"]
});
function csvCell(value) {
  const raw = String(value);
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}
async function requireCountingSession(id) {
  const session = await getCountingSession(id);
  if (!session) {
    throw new TRPCError3({
      code: "NOT_FOUND",
      message: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E23\u0E2D\u0E1A\u0E19\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19\u0E16\u0E27\u0E32\u0E22"
    });
  }
  return session;
}
function assertCountEditable(status) {
  if (!isEditable(status)) {
    throw new TRPCError3({
      code: "CONFLICT",
      message: "\u0E23\u0E2D\u0E1A\u0E19\u0E35\u0E49\u0E2A\u0E48\u0E07\u0E19\u0E31\u0E1A\u0E41\u0E25\u0E49\u0E27 \u0E15\u0E49\u0E2D\u0E07\u0E2A\u0E48\u0E07\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E41\u0E01\u0E49\u0E44\u0E02\u0E01\u0E48\u0E2D\u0E19\u0E08\u0E36\u0E07\u0E08\u0E30\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E14\u0E49"
    });
  }
}
function assertCanCount(user) {
  if (!canCountOfferings(user)) {
    throw new TRPCError3({
      code: "FORBIDDEN",
      message: "\u0E04\u0E38\u0E13\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E19\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19\u0E16\u0E27\u0E32\u0E22"
    });
  }
}
function assertCanVerify(user) {
  if (!canVerifyCount(user)) {
    throw new TRPCError3({
      code: "FORBIDDEN",
      message: "\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E40\u0E2B\u0E23\u0E31\u0E0D\u0E0D\u0E34\u0E01\u0E2B\u0E23\u0E37\u0E2D\u0E1C\u0E39\u0E49\u0E14\u0E39\u0E41\u0E25\u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19"
    });
  }
}
var appRouter = router({
  system: systemRouter,
  // ── Auth ────────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),
    /** Set the church role of a user (SUPER_ADMIN only) */
    setChurchRole: adminProcedure2.input(
      z2.object({
        userId: z2.number().int().positive(),
        churchRole: churchRoleEnum.nullable()
      })
    ).mutation(async ({ input }) => {
      await updateUserChurchRole(input.userId, input.churchRole);
      return { success: true };
    })
  }),
  // ── Church Profile ──────────────────────────────────────────────────────────
  church: router({
    getProfile: protectedProcedure.query(async () => {
      return await getChurchProfile();
    }),
    updateProfile: churchLeaderProcedure.input(
      z2.object({
        name: z2.string().trim().min(2).max(180),
        address: z2.string().trim().max(1e3).optional(),
        phone: z2.string().trim().max(20).optional(),
        email: z2.string().email().max(320).optional().or(z2.literal("")),
        website: z2.string().url().max(500).optional().or(z2.literal("")),
        pastorName: z2.string().trim().max(120).optional(),
        assistantPastorName: z2.string().trim().max(120).optional(),
        treasurerName: z2.string().trim().max(120).optional(),
        bankName: z2.string().trim().max(120).optional(),
        bankAccount: z2.string().trim().max(30).optional(),
        bankAccountName: z2.string().trim().max(120).optional(),
        fiscalYearStartMonth: z2.number().int().min(1).max(12).default(1),
        motto: z2.string().trim().max(280).optional()
      })
    ).mutation(async ({ input }) => {
      await upsertChurchProfile({ ...input, churchId: DEFAULT_CHURCH_ID });
      return { success: true };
    }),
    completeSetup: churchLeaderProcedure.mutation(async () => {
      await markSetupCompleted();
      return { success: true };
    })
  }),
  // ── Finance Summary ─────────────────────────────────────────────────────────
  finance: router({
    summary: protectedProcedure.query(async () => {
      return await getFinancialSummary();
    }),
    monthlyStats: protectedProcedure.input(
      z2.object({ months: z2.number().int().min(1).max(24).default(6) }).optional()
    ).query(async ({ input }) => {
      return await getMonthlyStats(DEFAULT_CHURCH_ID, input?.months ?? 6);
    }),
    accounts: protectedProcedure.query(async () => {
      return await listFinanceAccounts();
    }),
    createAccount: financeProcedure.input(
      z2.object({
        name: z2.string().trim().min(2).max(120),
        type: z2.enum([
          "general",
          "tithe",
          "mission",
          "building",
          "welfare",
          "special"
        ]).default("general"),
        description: z2.string().trim().max(500).optional()
      })
    ).mutation(async ({ input }) => {
      const id = await createFinanceAccount({
        ...input,
        churchId: DEFAULT_CHURCH_ID
      });
      return { id };
    })
  }),
  // ── Offerings ───────────────────────────────────────────────────────────────
  offerings: router({
    list: protectedProcedure.input(
      z2.object({
        limit: z2.number().int().min(1).max(200).default(50),
        fromDate: z2.coerce.date().optional(),
        toDate: z2.coerce.date().optional()
      }).optional()
    ).query(async ({ ctx, input }) => {
      const showDonorNames = canViewDonorNames(ctx.user);
      return await listOfferings(DEFAULT_CHURCH_ID, {
        limit: input?.limit ?? 50,
        showDonorNames,
        fromDate: input?.fromDate,
        toDate: input?.toDate
      });
    }),
    getById: protectedProcedure.input(z2.object({ id: z2.number().int().positive() })).query(async ({ ctx, input }) => {
      return await getOfferingById(
        input.id,
        DEFAULT_CHURCH_ID,
        canViewDonorNames(ctx.user)
      );
    }),
    create: financeProcedure.input(
      z2.object({
        amount: z2.number().positive(),
        category: offeringCategory.default("general"),
        fundId: z2.number().int().positive().optional(),
        donorName: z2.string().trim().max(120).optional(),
        receiptDate: z2.coerce.date().optional(),
        method: paymentMethod.default("cash"),
        reference: z2.string().trim().max(120).optional(),
        notes: z2.string().trim().max(500).optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const id = await createOffering({
        amount: input.amount.toFixed(2),
        category: input.category,
        fundId: input.fundId ?? null,
        donorName: input.donorName ?? null,
        receiptDate: input.receiptDate ?? /* @__PURE__ */ new Date(),
        method: input.method,
        reference: input.reference ?? null,
        notes: input.notes ?? null,
        recordedBy: ctx.user.id
      });
      await createAuditLog({
        churchId: DEFAULT_CHURCH_ID,
        userId: ctx.user.id,
        action: "CREATE",
        entity: "offering",
        entityId: id,
        metadata: input
      });
      await createNotification({
        userId: ctx.user.id,
        type: "finance_created",
        title: "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E01\u0E32\u0E23\u0E40\u0E07\u0E34\u0E19\u0E41\u0E25\u0E49\u0E27",
        description: `\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 ${input.amount.toLocaleString()} \u0E1A\u0E32\u0E17\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22\u0E41\u0E25\u0E49\u0E27`,
        link: null
      });
      return { id };
    }),
    update: financeProcedure.input(
      z2.object({
        id: z2.number().int().positive(),
        amount: z2.number().positive().optional(),
        category: offeringCategory.optional(),
        fundId: z2.number().int().positive().nullable().optional(),
        donorName: z2.string().trim().max(120).nullable().optional(),
        receiptDate: z2.coerce.date().optional(),
        method: paymentMethod.optional(),
        reference: z2.string().trim().max(120).nullable().optional(),
        notes: z2.string().trim().max(500).nullable().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const { id, amount, ...rest } = input;
      const updated = await updateOffering(id, {
        ...rest,
        ...amount === void 0 ? {} : { amount: amount.toFixed(2) }
      });
      if (updated === null)
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E16\u0E27\u0E32\u0E22\u0E2B\u0E23\u0E37\u0E2D\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E16\u0E39\u0E01\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27"
        });
      await createAuditLog({
        churchId: DEFAULT_CHURCH_ID,
        userId: ctx.user.id,
        action: "UPDATE",
        entity: "offering",
        entityId: id,
        metadata: rest
      });
      return { id: updated };
    }),
    delete: financeProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const deleted = await voidOffering(input.id);
      if (!deleted)
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E16\u0E27\u0E32\u0E22\u0E2B\u0E23\u0E37\u0E2D\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E16\u0E39\u0E01\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27"
        });
      await createAuditLog({
        churchId: DEFAULT_CHURCH_ID,
        userId: ctx.user.id,
        action: "VOID",
        entity: "offering",
        entityId: input.id
      });
      return { id: input.id };
    })
  }),
  // ── Expenses ────────────────────────────────────────────────────────────────
  expenses: router({
    list: protectedProcedure.input(
      z2.object({
        limit: z2.number().int().min(1).max(200).default(50),
        fromDate: z2.coerce.date().optional(),
        toDate: z2.coerce.date().optional()
      }).optional()
    ).query(async ({ input }) => {
      return await listExpenses(DEFAULT_CHURCH_ID, {
        limit: input?.limit ?? 50,
        fromDate: input?.fromDate,
        toDate: input?.toDate
      });
    }),
    getById: protectedProcedure.input(z2.object({ id: z2.number().int().positive() })).query(async ({ input }) => {
      return await getExpenseById(input.id, DEFAULT_CHURCH_ID);
    }),
    create: financeProcedure.input(
      z2.object({
        amount: z2.number().positive(),
        category: expenseCategory.default("other"),
        fundId: z2.number().int().positive().optional(),
        description: z2.string().trim().min(2).max(280),
        details: z2.string().trim().max(1e3).optional(),
        expenseDate: z2.coerce.date().optional(),
        payee: z2.string().trim().max(120).optional(),
        receiptRef: z2.string().trim().max(120).optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const id = await createExpense({
        amount: input.amount.toFixed(2),
        category: input.category,
        fundId: input.fundId ?? null,
        description: input.description,
        details: input.details ?? null,
        expenseDate: input.expenseDate ?? /* @__PURE__ */ new Date(),
        payee: input.payee ?? null,
        receiptRef: input.receiptRef ?? null,
        status: "approved",
        recordedBy: ctx.user.id
      });
      await createAuditLog({
        churchId: DEFAULT_CHURCH_ID,
        userId: ctx.user.id,
        action: "CREATE",
        entity: "expense",
        entityId: id,
        metadata: input
      });
      await createNotification({
        userId: ctx.user.id,
        type: "finance_created",
        title: "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E23\u0E32\u0E22\u0E08\u0E48\u0E32\u0E22\u0E41\u0E25\u0E49\u0E27",
        description: `\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 ${input.amount.toLocaleString()} \u0E1A\u0E32\u0E17\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22\u0E41\u0E25\u0E49\u0E27`,
        link: null
      });
      return { id };
    }),
    update: financeProcedure.input(
      z2.object({
        id: z2.number().int().positive(),
        amount: z2.number().positive().optional(),
        category: expenseCategory.optional(),
        fundId: z2.number().int().positive().nullable().optional(),
        description: z2.string().trim().min(2).max(280).optional(),
        details: z2.string().trim().max(1e3).nullable().optional(),
        expenseDate: z2.coerce.date().optional(),
        payee: z2.string().trim().max(120).nullable().optional(),
        receiptRef: z2.string().trim().max(120).nullable().optional(),
        status: expenseStatus.optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const { id, amount, ...rest } = input;
      const updated = await updateExpense(id, {
        ...rest,
        ...amount === void 0 ? {} : { amount: amount.toFixed(2) }
      });
      if (updated === null)
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E23\u0E32\u0E22\u0E08\u0E48\u0E32\u0E22\u0E2B\u0E23\u0E37\u0E2D\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E16\u0E39\u0E01\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27"
        });
      await createAuditLog({
        churchId: DEFAULT_CHURCH_ID,
        userId: ctx.user.id,
        action: "UPDATE",
        entity: "expense",
        entityId: id,
        metadata: rest
      });
      return { id: updated };
    }),
    delete: financeProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const deleted = await voidExpense(input.id);
      if (!deleted)
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E23\u0E32\u0E22\u0E08\u0E48\u0E32\u0E22\u0E2B\u0E23\u0E37\u0E2D\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E16\u0E39\u0E01\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27"
        });
      await createAuditLog({
        churchId: DEFAULT_CHURCH_ID,
        userId: ctx.user.id,
        action: "VOID",
        entity: "expense",
        entityId: input.id
      });
      return { id: input.id };
    })
  }),
  // ── Withdrawal Requests ─────────────────────────────────────────────────────
  withdrawals: router({
    list: protectedProcedure.input(z2.object({ myOnly: z2.boolean().default(false) }).optional()).query(async ({ ctx, input }) => {
      const userId = input?.myOnly || !canManageFinance(ctx.user) ? ctx.user.id : void 0;
      return await listWithdrawalRequests(DEFAULT_CHURCH_ID, { userId });
    }),
    create: protectedProcedure.input(
      z2.object({
        amount: z2.number().positive(),
        purpose: z2.string().trim().min(5).max(280),
        details: z2.string().trim().max(1e3).optional(),
        fundId: z2.number().int().positive().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const id = await createWithdrawalRequest({
        amount: input.amount.toFixed(2),
        purpose: input.purpose,
        details: input.details ?? null,
        fundId: input.fundId,
        requestedBy: ctx.user.id,
        requestDate: /* @__PURE__ */ new Date()
      });
      return { id };
    }),
    approve: financeProcedure.input(
      z2.object({
        id: z2.number().int().positive(),
        action: z2.enum(["approved", "rejected"]),
        note: z2.string().trim().max(500).default("")
      })
    ).mutation(async ({ ctx, input }) => {
      if (!canApproveWithdrawals(ctx.user)) {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "\u0E04\u0E38\u0E13\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E04\u0E33\u0E02\u0E2D\u0E40\u0E1A\u0E34\u0E01"
        });
      }
      const updated = await approveWithdrawal(
        input.id,
        ctx.user.id,
        input.action,
        input.note
      );
      if (!updated) {
        throw new TRPCError3({
          code: "CONFLICT",
          message: "\u0E04\u0E33\u0E02\u0E2D\u0E40\u0E1A\u0E34\u0E01\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E23\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34"
        });
      }
      return { success: true };
    }),
    disburse: financeProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(async ({ input }) => {
      const updated = await disburseWithdrawal(input.id);
      if (!updated) {
        throw new TRPCError3({
          code: "CONFLICT",
          message: "\u0E15\u0E49\u0E2D\u0E07\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E04\u0E33\u0E02\u0E2D\u0E40\u0E1A\u0E34\u0E01\u0E01\u0E48\u0E2D\u0E19\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19"
        });
      }
      return { success: true };
    })
  }),
  // ── Members ──────────────────────────────────────────────────────────────────
  members: router({
    list: protectedProcedure.query(async () => listMembers(DEFAULT_CHURCH_ID)),
    getById: protectedProcedure.input(z2.object({ id: z2.number().int().positive() })).query(async ({ input }) => getMemberById(input.id, DEFAULT_CHURCH_ID)),
    create: churchLeaderProcedure.input(
      z2.object({
        name: z2.string().trim().min(2).max(180),
        phone: z2.string().trim().max(30).optional(),
        email: z2.string().email().max(320).optional(),
        status: z2.enum(["active", "inactive", "pending"]).default("active"),
        avatarUrl: z2.string().url().max(500).optional(),
        notes: z2.string().trim().max(2e3).optional()
      })
    ).mutation(async ({ input }) => ({ id: await createMember(input) })),
    update: churchLeaderProcedure.input(
      z2.object({
        id: z2.number().int().positive(),
        name: z2.string().trim().min(2).max(180).optional(),
        phone: z2.string().trim().max(30).nullable().optional(),
        email: z2.string().email().max(320).nullable().optional(),
        status: z2.enum(["active", "inactive", "pending"]).optional(),
        avatarUrl: z2.string().url().max(500).nullable().optional(),
        notes: z2.string().trim().max(2e3).nullable().optional()
      })
    ).mutation(async ({ input }) => {
      const { id, ...data } = input;
      const updated = await updateMember(id, data);
      if (updated === null)
        throw new TRPCError3({ code: "NOT_FOUND", message: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01" });
      return { id: updated };
    }),
    deactivate: churchLeaderProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(async ({ input }) => {
      const updated = await deactivateMember(input.id);
      if (updated === null)
        throw new TRPCError3({ code: "NOT_FOUND", message: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01" });
      return { id: updated };
    })
  }),
  // ── Notifications ────────────────────────────────────────────────────────────
  notifications: router({
    list: protectedProcedure.query(
      async ({ ctx }) => listNotifications(ctx.user.id, DEFAULT_CHURCH_ID)
    ),
    markAsRead: protectedProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await markNotificationRead(input.id, ctx.user.id, DEFAULT_CHURCH_ID);
      return { id: input.id };
    }),
    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      await markAllNotificationsRead(ctx.user.id, DEFAULT_CHURCH_ID);
      return { success: true };
    })
  }),
  // ── Reports ──────────────────────────────────────────────────────────────────
  reports: router({
    /** Category totals and fund balances for the report screen. */
    summary: protectedProcedure.input(reportDateRange).query(
      async ({ input }) => getFinancialReportSummary(
        DEFAULT_CHURCH_ID,
        input.fromDate,
        input.toDate
      )
    ),
    financial: protectedProcedure.input(reportDateRange).query(async ({ input }) => {
      return await getFinancialReportData(
        DEFAULT_CHURCH_ID,
        input.fromDate,
        input.toDate
      );
    }),
    exportCsv: financeProcedure.input(reportDateRange).query(async ({ input }) => {
      const rows = await getFinancialReportData(
        DEFAULT_CHURCH_ID,
        input.fromDate,
        input.toDate
      );
      const header = "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48,\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17,\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48,\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14,\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19 (\u0E1A\u0E32\u0E17),\u0E0A\u0E48\u0E2D\u0E07\u0E17\u0E32\u0E07";
      const lines = rows.map(
        (r) => [
          r.date,
          r.type === "income" ? "\u0E23\u0E32\u0E22\u0E23\u0E31\u0E1A" : "\u0E23\u0E32\u0E22\u0E08\u0E48\u0E32\u0E22",
          r.category,
          r.description,
          r.amount.toFixed(2),
          r.method ?? "-"
        ].map(csvCell).join(",")
      );
      return { csv: [header, ...lines].join("\n"), rowCount: rows.length };
    })
  }),
  // ── Updates (existing) ──────────────────────────────────────────────────────
  updates: router({
    feed: protectedProcedure.query(async () => ({
      news: await listPublishedChurchNews(),
      events: await listPublishedChurchEvents()
    })),
    adminList: adminProcedure2.query(async () => ({
      news: await listAllChurchNews(),
      events: await listAllChurchEvents()
    })),
    createNews: adminProcedure2.input(
      z2.object({
        title: z2.string().trim().min(3).max(180),
        summary: z2.string().trim().min(3).max(280),
        body: z2.string().trim().min(3),
        category: newsCategory,
        status: newsStatus.default("draft")
      })
    ).mutation(async ({ ctx, input }) => {
      const id = await createChurchNews({
        authorId: ctx.user.id,
        title: input.title,
        summary: input.summary,
        body: input.body,
        category: input.category,
        status: input.status,
        publishedAt: input.status === "published" ? /* @__PURE__ */ new Date() : null
      });
      return { id };
    }),
    createEvent: adminProcedure2.input(
      z2.object({
        title: z2.string().trim().min(3).max(180),
        summary: z2.string().trim().min(3).max(280),
        description: z2.string().trim().min(3),
        startsAt: z2.coerce.date(),
        endsAt: z2.coerce.date().optional(),
        location: z2.string().trim().max(180).optional(),
        registrationUrl: z2.string().url().max(500).optional().or(z2.literal("")),
        status: eventStatus.default("draft")
      }).refine((data) => !data.endsAt || data.endsAt >= data.startsAt, {
        message: "\u0E40\u0E27\u0E25\u0E32\u0E2A\u0E34\u0E49\u0E19\u0E2A\u0E38\u0E14\u0E15\u0E49\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E21\u0E32\u0E01\u0E48\u0E2D\u0E19\u0E40\u0E27\u0E25\u0E32\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19",
        path: ["endsAt"]
      })
    ).mutation(async ({ ctx, input }) => {
      const id = await createChurchEvent({
        authorId: ctx.user.id,
        title: input.title,
        summary: input.summary,
        description: input.description,
        startsAt: input.startsAt,
        endsAt: input.endsAt ?? null,
        location: input.location || null,
        registrationUrl: input.registrationUrl || null,
        status: input.status
      });
      return { id };
    }),
    updateNews: adminProcedure2.input(
      z2.object({
        id: z2.number().int().positive(),
        title: z2.string().trim().min(3).max(180),
        summary: z2.string().trim().min(3).max(280),
        body: z2.string().trim().min(3),
        category: newsCategory,
        status: newsStatus
      })
    ).mutation(async ({ input }) => {
      await updateChurchNews(input.id, {
        title: input.title,
        summary: input.summary,
        body: input.body,
        category: input.category,
        status: input.status,
        publishedAt: input.status === "published" ? /* @__PURE__ */ new Date() : null
      });
      return { success: true };
    }),
    updateEvent: adminProcedure2.input(
      z2.object({
        id: z2.number().int().positive(),
        title: z2.string().trim().min(3).max(180),
        summary: z2.string().trim().min(3).max(280),
        description: z2.string().trim().min(3),
        startsAt: z2.coerce.date(),
        endsAt: z2.coerce.date().optional(),
        location: z2.string().trim().max(180).optional(),
        registrationUrl: z2.string().url().max(500).optional().or(z2.literal("")),
        status: eventStatus
      }).refine((data) => !data.endsAt || data.endsAt >= data.startsAt, {
        message: "\u0E40\u0E27\u0E25\u0E32\u0E2A\u0E34\u0E49\u0E19\u0E2A\u0E38\u0E14\u0E15\u0E49\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E21\u0E32\u0E01\u0E48\u0E2D\u0E19\u0E40\u0E27\u0E25\u0E32\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19",
        path: ["endsAt"]
      })
    ).mutation(async ({ input }) => {
      await updateChurchEvent(input.id, {
        title: input.title,
        summary: input.summary,
        description: input.description,
        startsAt: input.startsAt,
        endsAt: input.endsAt ?? null,
        location: input.location || null,
        registrationUrl: input.registrationUrl || null,
        status: input.status
      });
      return { success: true };
    }),
    setNewsStatus: adminProcedure2.input(z2.object({ id: z2.number().int().positive(), status: newsStatus })).mutation(async ({ input }) => {
      await updateChurchNewsStatus(input.id, input.status);
      return { success: true };
    }),
    setEventStatus: adminProcedure2.input(z2.object({ id: z2.number().int().positive(), status: eventStatus })).mutation(async ({ input }) => {
      await updateChurchEventStatus(input.id, input.status);
      return { success: true };
    }),
    deleteNews: adminProcedure2.input(z2.object({ id: z2.number().int().positive() })).mutation(async ({ input }) => {
      await deleteChurchNews(input.id);
      return { success: true };
    }),
    deleteEvent: adminProcedure2.input(z2.object({ id: z2.number().int().positive() })).mutation(async ({ input }) => {
      await deleteChurchEvent(input.id);
      return { success: true };
    })
  }),
  // ── Weekly Offering Counting ────────────────────────────────────────────────
  counting: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      assertCanCount(ctx.user);
      return listCountingSessions();
    }),
    get: protectedProcedure.input(z2.object({ id: z2.number().int().positive() })).query(async ({ ctx, input }) => {
      assertCanCount(ctx.user);
      const detail = await getCountingSessionDetail(input.id);
      if (!detail) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E23\u0E2D\u0E1A\u0E19\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19\u0E16\u0E27\u0E32\u0E22"
        });
      }
      return detail;
    }),
    create: protectedProcedure.input(
      z2.object({
        serviceDate: z2.coerce.date(),
        serviceRound: z2.number().int().min(1).max(9).default(1),
        serviceName: z2.string().trim().max(120).optional(),
        notes: z2.string().trim().max(1e3).optional()
      })
    ).mutation(async ({ ctx, input }) => {
      assertCanCount(ctx.user);
      const id = await createCountingSession({
        serviceDate: input.serviceDate,
        serviceRound: input.serviceRound,
        serviceName: input.serviceName ?? null,
        notes: input.notes ?? null,
        countedBy: ctx.user.id
      });
      await createAuditLog({
        churchId: DEFAULT_CHURCH_ID,
        userId: ctx.user.id,
        action: "CREATE",
        entity: "counting_session",
        entityId: id,
        metadata: input
      });
      return { id };
    }),
    addEnvelope: protectedProcedure.input(
      z2.object({
        sessionId: z2.number().int().positive(),
        envelopeNo: z2.string().trim().max(30).optional(),
        memberId: z2.number().int().positive().optional(),
        donorName: z2.string().trim().max(180).optional(),
        isAnonymous: z2.boolean().default(false),
        category: offeringCategory.default("general"),
        fundId: z2.number().int().positive(),
        method: paymentMethod.default("cash"),
        amount: z2.number().positive(),
        reference: z2.string().trim().max(120).optional(),
        notes: z2.string().trim().max(500).optional()
      })
    ).mutation(async ({ ctx, input }) => {
      assertCanCount(ctx.user);
      const session = await requireCountingSession(input.sessionId);
      assertCountEditable(session.status);
      const id = await addOfferingEnvelope({
        sessionId: input.sessionId,
        envelopeNo: input.envelopeNo ?? null,
        memberId: input.memberId ?? null,
        donorName: input.isAnonymous ? null : input.donorName ?? null,
        isAnonymous: input.isAnonymous,
        category: input.category,
        fundId: input.fundId,
        method: input.method,
        amount: input.amount.toFixed(2),
        reference: input.reference ?? null,
        notes: input.notes ?? null,
        recordedBy: ctx.user.id
      });
      return { id };
    }),
    updateEnvelope: protectedProcedure.input(
      z2.object({
        id: z2.number().int().positive(),
        sessionId: z2.number().int().positive(),
        envelopeNo: z2.string().trim().max(30).nullable().optional(),
        memberId: z2.number().int().positive().nullable().optional(),
        donorName: z2.string().trim().max(180).nullable().optional(),
        isAnonymous: z2.boolean().optional(),
        category: offeringCategory.optional(),
        fundId: z2.number().int().positive().optional(),
        method: paymentMethod.optional(),
        amount: z2.number().positive().optional(),
        reference: z2.string().trim().max(120).nullable().optional(),
        notes: z2.string().trim().max(500).nullable().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      assertCanCount(ctx.user);
      const session = await requireCountingSession(input.sessionId);
      assertCountEditable(session.status);
      const { id, sessionId, amount, ...rest } = input;
      const updated = await updateOfferingEnvelope(id, sessionId, {
        ...rest,
        ...amount === void 0 ? {} : { amount: amount.toFixed(2) }
      });
      if (updated === null) {
        throw new TRPCError3({ code: "NOT_FOUND", message: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E0B\u0E2D\u0E07" });
      }
      return { id: updated };
    }),
    removeEnvelope: protectedProcedure.input(
      z2.object({
        id: z2.number().int().positive(),
        sessionId: z2.number().int().positive()
      })
    ).mutation(async ({ ctx, input }) => {
      assertCanCount(ctx.user);
      const session = await requireCountingSession(input.sessionId);
      assertCountEditable(session.status);
      const removed = await deleteOfferingEnvelope(input.id, input.sessionId);
      if (!removed) {
        throw new TRPCError3({ code: "NOT_FOUND", message: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E0B\u0E2D\u0E07" });
      }
      return { success: true };
    }),
    setCashCount: protectedProcedure.input(
      z2.object({
        sessionId: z2.number().int().positive(),
        denomination: z2.number().positive(),
        kind: z2.enum(["note", "coin"]),
        quantity: z2.number().int().min(0)
      })
    ).mutation(async ({ ctx, input }) => {
      assertCanCount(ctx.user);
      const session = await requireCountingSession(input.sessionId);
      assertCountEditable(session.status);
      const id = await setCashCount({
        sessionId: input.sessionId,
        denomination: input.denomination.toFixed(2),
        kind: input.kind,
        quantity: input.quantity
      });
      return { id };
    }),
    addDeduction: protectedProcedure.input(
      z2.object({
        sessionId: z2.number().int().positive(),
        purpose: z2.string().trim().min(2).max(200),
        reason: z2.string().trim().min(2).max(1e3),
        amount: z2.number().positive(),
        paidTo: z2.string().trim().min(2).max(180),
        category: expenseCategory.default("other"),
        /**
         * Required: cash leaving the bag must reduce a fund, otherwise the
         * fund balance overstates what actually reached the bank.
         */
        fundId: z2.number().int().positive()
      })
    ).mutation(async ({ ctx, input }) => {
      assertCanCount(ctx.user);
      const session = await requireCountingSession(input.sessionId);
      assertCountEditable(session.status);
      const id = await addSessionDeduction({
        sessionId: input.sessionId,
        purpose: input.purpose,
        reason: input.reason,
        amount: input.amount.toFixed(2),
        paidTo: input.paidTo,
        category: input.category,
        fundId: input.fundId ?? null,
        requestedBy: ctx.user.id
      });
      await createAuditLog({
        churchId: DEFAULT_CHURCH_ID,
        userId: ctx.user.id,
        action: "CREATE",
        entity: "session_deduction",
        entityId: id,
        metadata: input
      });
      return { id };
    }),
    approveDeduction: protectedProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(async ({ ctx, input }) => {
      if (!canApproveDeduction(ctx.user)) {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "\u0E04\u0E38\u0E13\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2B\u0E31\u0E01\u0E40\u0E1A\u0E34\u0E01"
        });
      }
      const approved = await approveSessionDeduction(input.id, ctx.user.id);
      if (!approved) {
        throw new TRPCError3({
          code: "CONFLICT",
          message: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \u0E2B\u0E23\u0E37\u0E2D\u0E1C\u0E39\u0E49\u0E02\u0E2D\u0E40\u0E1A\u0E34\u0E01\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E02\u0E2D\u0E07\u0E15\u0E31\u0E27\u0E40\u0E2D\u0E07\u0E44\u0E14\u0E49"
        });
      }
      await createAuditLog({
        churchId: DEFAULT_CHURCH_ID,
        userId: ctx.user.id,
        action: "APPROVE",
        entity: "session_deduction",
        entityId: input.id,
        metadata: {}
      });
      return { success: true };
    }),
    removeDeduction: protectedProcedure.input(
      z2.object({
        id: z2.number().int().positive(),
        sessionId: z2.number().int().positive()
      })
    ).mutation(async ({ ctx, input }) => {
      assertCanCount(ctx.user);
      const session = await requireCountingSession(input.sessionId);
      assertCountEditable(session.status);
      const removed = await deleteSessionDeduction(input.id, input.sessionId);
      if (!removed) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2B\u0E31\u0E01\u0E40\u0E1A\u0E34\u0E01"
        });
      }
      await createAuditLog({
        churchId: DEFAULT_CHURCH_ID,
        userId: ctx.user.id,
        action: "DELETE",
        entity: "session_deduction",
        entityId: input.id,
        metadata: {}
      });
      return { success: true };
    }),
    addBankRecord: financeProcedure.input(
      z2.object({
        sessionId: z2.number().int().positive(),
        type: z2.enum(["transfer_in", "cash_deposit"]),
        amount: z2.number().positive(),
        transferredBy: z2.number().int().positive().optional(),
        transferredByName: z2.string().trim().max(180).optional(),
        bankRef: z2.string().trim().max(120).optional(),
        occurredAt: z2.coerce.date().optional(),
        notes: z2.string().trim().max(500).optional()
      })
    ).mutation(async ({ ctx, input }) => {
      await requireCountingSession(input.sessionId);
      const id = await addBankRecord({
        sessionId: input.sessionId,
        type: input.type,
        amount: input.amount.toFixed(2),
        transferredBy: input.transferredBy ?? null,
        transferredByName: input.transferredByName ?? null,
        bankRef: input.bankRef ?? null,
        occurredAt: input.occurredAt ?? /* @__PURE__ */ new Date(),
        notes: input.notes ?? null,
        recordedBy: ctx.user.id
      });
      await createAuditLog({
        churchId: DEFAULT_CHURCH_ID,
        userId: ctx.user.id,
        action: "CREATE",
        entity: "bank_record",
        entityId: id,
        metadata: input
      });
      return { id };
    }),
    matchPassbook: financeProcedure.input(
      z2.object({
        id: z2.number().int().positive(),
        passbookDate: z2.coerce.date()
      })
    ).mutation(async ({ ctx, input }) => {
      const matched = await matchBankRecordToPassbook(
        input.id,
        ctx.user.id,
        input.passbookDate
      );
      if (!matched) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E18\u0E19\u0E32\u0E04\u0E32\u0E23"
        });
      }
      return { success: true };
    }),
    addDocument: protectedProcedure.input(
      z2.object({
        sessionId: z2.number().int().positive(),
        kind: z2.enum([
          "count_sheet",
          "envelope_photo",
          "deposit_slip",
          "transfer_slip",
          "passbook_page",
          "deduction_receipt",
          "other"
        ]).default("other"),
        fileName: z2.string().trim().min(1).max(255),
        mimeType: z2.string().trim().max(120).optional(),
        fileSize: z2.number().int().min(0).optional(),
        driveFileId: z2.string().trim().max(180).optional(),
        fileUrl: z2.string().trim().max(600).optional(),
        drivePath: z2.string().trim().max(300).optional(),
        deductionId: z2.number().int().positive().optional(),
        bankRecordId: z2.number().int().positive().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      assertCanCount(ctx.user);
      await requireCountingSession(input.sessionId);
      const id = await addSessionDocument({
        sessionId: input.sessionId,
        kind: input.kind,
        fileName: input.fileName,
        mimeType: input.mimeType ?? null,
        fileSize: input.fileSize ?? null,
        driveFileId: input.driveFileId ?? null,
        fileUrl: input.fileUrl ?? null,
        drivePath: input.drivePath ?? null,
        deductionId: input.deductionId ?? null,
        bankRecordId: input.bankRecordId ?? null,
        uploadedBy: ctx.user.id
      });
      return { id };
    }),
    /** counting → counted. The counter hands the sheet over for checking. */
    submitCount: protectedProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(async ({ ctx, input }) => {
      assertCanCount(ctx.user);
      const session = await requireCountingSession(input.id);
      if (!canTransition(session.status, "counted")) {
        throw new TRPCError3({
          code: "CONFLICT",
          message: "\u0E23\u0E2D\u0E1A\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E17\u0E35\u0E48\u0E2A\u0E48\u0E07\u0E19\u0E31\u0E1A\u0E44\u0E14\u0E49"
        });
      }
      const moved = await setCountingSessionStatus(
        input.id,
        session.status,
        "counted",
        { countSubmittedAt: /* @__PURE__ */ new Date() }
      );
      if (!moved) {
        throw new TRPCError3({
          code: "CONFLICT",
          message: "\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E23\u0E2D\u0E1A\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E42\u0E2B\u0E25\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E43\u0E2B\u0E21\u0E48"
        });
      }
      await createAuditLog({
        churchId: DEFAULT_CHURCH_ID,
        userId: ctx.user.id,
        action: "SUBMIT",
        entity: "counting_session",
        entityId: input.id,
        metadata: {}
      });
      return { success: true };
    }),
    /** counted → counting. Sends the sheet back for a re-count. */
    reopenCount: financeProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const session = await requireCountingSession(input.id);
      if (!canTransition(session.status, "counting")) {
        throw new TRPCError3({
          code: "CONFLICT",
          message: "\u0E23\u0E2D\u0E1A\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E2A\u0E48\u0E07\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E19\u0E31\u0E1A\u0E43\u0E2B\u0E21\u0E48\u0E44\u0E14\u0E49"
        });
      }
      const moved = await setCountingSessionStatus(
        input.id,
        session.status,
        "counting",
        { verifiedBy: null, verifiedAt: null }
      );
      if (!moved) {
        throw new TRPCError3({
          code: "CONFLICT",
          message: "\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E23\u0E2D\u0E1A\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E42\u0E2B\u0E25\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E43\u0E2B\u0E21\u0E48"
        });
      }
      await createAuditLog({
        churchId: DEFAULT_CHURCH_ID,
        userId: ctx.user.id,
        action: "REOPEN",
        entity: "counting_session",
        entityId: input.id,
        metadata: {}
      });
      return { success: true };
    }),
    /** counted → verified. Never by the person who counted. */
    verify: protectedProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(async ({ ctx, input }) => {
      assertCanVerify(ctx.user);
      const session = await requireCountingSession(input.id);
      if (session.countedBy === ctx.user.id) {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "\u0E1C\u0E39\u0E49\u0E19\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E23\u0E2D\u0E1A\u0E02\u0E2D\u0E07\u0E15\u0E31\u0E27\u0E40\u0E2D\u0E07\u0E44\u0E14\u0E49"
        });
      }
      if (!canTransition(session.status, "verified")) {
        throw new TRPCError3({
          code: "CONFLICT",
          message: "\u0E15\u0E49\u0E2D\u0E07\u0E2A\u0E48\u0E07\u0E19\u0E31\u0E1A\u0E43\u0E2B\u0E49\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22\u0E01\u0E48\u0E2D\u0E19\u0E08\u0E36\u0E07\u0E08\u0E30\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E44\u0E14\u0E49"
        });
      }
      const moved = await setCountingSessionStatus(
        input.id,
        session.status,
        "verified",
        { verifiedBy: ctx.user.id, verifiedAt: /* @__PURE__ */ new Date() }
      );
      if (!moved) {
        throw new TRPCError3({
          code: "CONFLICT",
          message: "\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E23\u0E2D\u0E1A\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E42\u0E2B\u0E25\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E43\u0E2B\u0E21\u0E48"
        });
      }
      await createAuditLog({
        churchId: DEFAULT_CHURCH_ID,
        userId: ctx.user.id,
        action: "VERIFY",
        entity: "counting_session",
        entityId: input.id,
        metadata: {}
      });
      return { success: true };
    }),
    /**
     * verified → posted. Writes the ledger rows. A session that does not
     * balance needs a written explanation and an approver first.
     */
    post: protectedProcedure.input(
      z2.object({
        id: z2.number().int().positive(),
        varianceNote: z2.string().trim().max(1e3).optional()
      })
    ).mutation(async ({ ctx, input }) => {
      assertCanVerify(ctx.user);
      const detail = await getCountingSessionDetail(input.id);
      if (!detail) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E23\u0E2D\u0E1A\u0E19\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19\u0E16\u0E27\u0E32\u0E22"
        });
      }
      if (!canTransition(detail.session.status, "posted")) {
        throw new TRPCError3({
          code: "CONFLICT",
          message: "\u0E15\u0E49\u0E2D\u0E07\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E23\u0E2D\u0E1A\u0E43\u0E2B\u0E49\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22\u0E01\u0E48\u0E2D\u0E19\u0E08\u0E36\u0E07\u0E08\u0E30\u0E25\u0E07\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E44\u0E14\u0E49"
        });
      }
      const unapproved = detail.deductions.filter((d) => !d.approvedBy);
      if (unapproved.length > 0) {
        throw new TRPCError3({
          code: "CONFLICT",
          message: `\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2B\u0E31\u0E01\u0E40\u0E1A\u0E34\u0E01\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34 ${unapproved.length} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23`
        });
      }
      const note = input.varianceNote?.trim() || detail.session.varianceNote;
      if (!detail.reconciliation.isBalanced && !note) {
        throw new TRPCError3({
          code: "BAD_REQUEST",
          message: "\u0E22\u0E2D\u0E14\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E19 \u0E15\u0E49\u0E2D\u0E07\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E04\u0E33\u0E2D\u0E18\u0E34\u0E1A\u0E32\u0E22\u0E1C\u0E25\u0E15\u0E48\u0E32\u0E07\u0E01\u0E48\u0E2D\u0E19\u0E25\u0E07\u0E1A\u0E31\u0E0D\u0E0A\u0E35"
        });
      }
      if (!detail.reconciliation.isBalanced) {
        await setCountingSessionStatus(
          input.id,
          detail.session.status,
          detail.session.status,
          { varianceNote: note, varianceApprovedBy: ctx.user.id }
        );
      }
      const result = await postCountingSession(input.id, ctx.user.id);
      if (!result) {
        throw new TRPCError3({
          code: "CONFLICT",
          message: "\u0E23\u0E2D\u0E1A\u0E19\u0E35\u0E49\u0E16\u0E39\u0E01\u0E25\u0E07\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27 \u0E2B\u0E23\u0E37\u0E2D\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27"
        });
      }
      await createAuditLog({
        churchId: DEFAULT_CHURCH_ID,
        userId: ctx.user.id,
        action: "POST",
        entity: "counting_session",
        entityId: input.id,
        metadata: { ...result, reconciliation: detail.reconciliation }
      });
      return result;
    }),
    /** posted → closed. Locks the round for good. */
    close: financeProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const session = await requireCountingSession(input.id);
      if (!canTransition(session.status, "closed")) {
        throw new TRPCError3({
          code: "CONFLICT",
          message: "\u0E15\u0E49\u0E2D\u0E07\u0E25\u0E07\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E23\u0E2D\u0E1A\u0E19\u0E35\u0E49\u0E01\u0E48\u0E2D\u0E19\u0E08\u0E36\u0E07\u0E08\u0E30\u0E1B\u0E34\u0E14\u0E23\u0E2D\u0E1A\u0E44\u0E14\u0E49"
        });
      }
      const moved = await setCountingSessionStatus(
        input.id,
        session.status,
        "closed",
        { closedAt: /* @__PURE__ */ new Date() }
      );
      if (!moved) {
        throw new TRPCError3({
          code: "CONFLICT",
          message: "\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E23\u0E2D\u0E1A\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E42\u0E2B\u0E25\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E43\u0E2B\u0E21\u0E48"
        });
      }
      await createAuditLog({
        churchId: DEFAULT_CHURCH_ID,
        userId: ctx.user.id,
        action: "CLOSE",
        entity: "counting_session",
        entityId: input.id,
        metadata: {}
      });
      return { success: true };
    })
  })
});

// server/_core/sdk.ts
import { createClerkClient, verifyToken } from "@clerk/backend";
var clerkClient = createClerkClient({ secretKey: ENV.clerkSecretKey });
var sdk = {
  async authenticateRequest(req) {
    const authHeader = req.headers.authorization ?? "";
    const sessionToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : req.cookies?.["__session"] ?? "";
    if (!sessionToken) {
      throw new Error("No session token provided");
    }
    const payload = await verifyToken(sessionToken, {
      secretKey: ENV.clerkSecretKey
    });
    const clerkUserId = payload.sub;
    if (!clerkUserId) {
      throw new Error("Invalid session token: missing sub");
    }
    let user;
    try {
      user = await getUserByOpenId(clerkUserId);
    } catch (e) {
      console.warn("[Database] getUserByOpenId failed:", e);
      user = void 0;
    }
    if (!user) {
      let clerkUser = null;
      try {
        clerkUser = await clerkClient.users.getUser(clerkUserId);
      } catch (err) {
        console.warn("[Clerk] Failed to fetch user from Clerk API:", err);
      }
      const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? null;
      const name = `${clerkUser?.firstName ?? ""} ${clerkUser?.lastName ?? ""}`.trim() || clerkUser?.username || "Admin";
      try {
        await upsertUser({
          openId: clerkUserId,
          name,
          email,
          loginMethod: clerkUser?.externalAccounts?.[0]?.provider ?? "email",
          role: "admin",
          lastSignedIn: /* @__PURE__ */ new Date()
        });
        user = await getUserByOpenId(clerkUserId);
      } catch (err) {
        console.warn("[Database] Failed to upsert user:", err);
      }
      if (!user) {
        user = {
          id: 1,
          openId: clerkUserId,
          name,
          email,
          loginMethod: "clerk",
          role: "admin",
          churchRole: "SUPER_ADMIN",
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date(),
          lastSignedIn: /* @__PURE__ */ new Date()
        };
      }
    }
    try {
      await upsertUser({ openId: user.openId, lastSignedIn: /* @__PURE__ */ new Date() });
    } catch {
    }
    return user;
  }
};

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/app.ts
function createApp() {
  const app2 = express();
  app2.use(express.json({ limit: "50mb" }));
  app2.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app2);
  registerOAuthRoutes(app2);
  app2.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  return app2;
}

// server/_core/apiHandler.ts
var app = createApp();
var apiHandler_default = app;
export {
  apiHandler_default as default
};
