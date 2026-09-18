// Idempotent schema initialization for PostgreSQL
export const ENUM_STATEMENTS: string[] = [
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
  `DO $$ BEGIN CREATE TYPE "public"."session_document_kind" AS ENUM('count_sheet', 'envelope_photo', 'deposit_slip', 'transfer_slip', 'passbook_page', 'deduction_receipt', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
];

export const TABLE_STATEMENTS: string[] = [
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
  );`,
];

export const INDEX_STATEMENTS: string[] = [
  `CREATE INDEX IF NOT EXISTS "members_church_idx" ON "members" USING btree ("churchId");`,
  `CREATE INDEX IF NOT EXISTS "notifications_user_idx" ON "notifications" USING btree ("churchId", "userId", "createdAt");`,
  `CREATE INDEX IF NOT EXISTS "audit_logs_entity_idx" ON "audit_logs" USING btree ("churchId", "entity", "entityId", "createdAt");`,
];

export async function runSchemaInit(client: any) {
  for (const stmt of ENUM_STATEMENTS) {
    try {
      await client.unsafe(stmt);
    } catch (err: any) {
      console.warn("[Enum Init]", err.message);
    }
  }
  for (const stmt of TABLE_STATEMENTS) {
    try {
      await client.unsafe(stmt);
    } catch (err: any) {
      console.warn("[Table Init]", err.message);
    }
  }
  for (const stmt of INDEX_STATEMENTS) {
    try {
      await client.unsafe(stmt);
    } catch (err: any) {
      console.warn("[Index Init]", err.message);
    }
  }
}
