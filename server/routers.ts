import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  approveWithdrawal,
  createChurchEvent,
  createChurchNews,
  createExpense,
  createFinanceAccount,
  createOffering,
  createWithdrawalRequest,
  DEFAULT_CHURCH_ID,
  deleteChurchEvent,
  deleteChurchNews,
  disburseWithdrawal,
  getChurchProfile,
  getFinancialReportData,
  getFinancialSummary,
  getMonthlyStats,
  listAllChurchEvents,
  listAllChurchNews,
  listExpenses,
  listFinanceAccounts,
  listOfferings,
  listPublishedChurchEvents,
  listPublishedChurchNews,
  listWithdrawalRequests,
  markSetupCompleted,
  updateChurchEvent,
  updateChurchEventStatus,
  updateChurchNews,
  updateChurchNewsStatus,
  updateUserChurchRole,
  upsertChurchProfile,
} from "./db";
import { TRPCError } from "@trpc/server";
import type { User } from "../drizzle/schema";

// ─── Permission helpers ────────────────────────────────────────────────────────

function canManageFinance(user: User): boolean {
  return (
    user.role === "admin" ||
    user.churchRole === "TREASURER" ||
    user.churchRole === "SUPER_ADMIN"
  );
}

function canViewDonorNames(user: User): boolean {
  return (
    user.role === "admin" ||
    user.churchRole === "TREASURER" ||
    user.churchRole === "SUPER_ADMIN"
  );
}

function canApproveWithdrawals(user: User): boolean {
  return (
    user.role === "admin" ||
    user.churchRole === "TREASURER" ||
    user.churchRole === "SUPER_ADMIN"
  );
}

function canManageChurchSettings(user: User): boolean {
  return (
    user.role === "admin" ||
    user.churchRole === "SUPER_ADMIN" ||
    user.churchRole === "PASTOR"
  );
}

// ─── Shared Procedures ────────────────────────────────────────────────────────

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "เฉพาะผู้ดูแลระบบเท่านั้น" });
  }
  return next();
});

const financeProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!canManageFinance(ctx.user)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "คุณไม่มีสิทธิ์จัดการข้อมูลการเงิน" });
  }
  return next();
});

const churchLeaderProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!canManageChurchSettings(ctx.user)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "เฉพาะผู้นำคริสตจักรเท่านั้น" });
  }
  return next();
});

// ─── Zod Enums ────────────────────────────────────────────────────────────────

const newsCategory = z.enum(["announcement", "ministry", "finance", "pastoral"]);
const newsStatus = z.enum(["draft", "published", "archived"]);
const eventStatus = z.enum(["draft", "published", "cancelled"]);
const offeringCategory = z.enum(["tithe", "general", "mission", "building", "welfare", "special"]);
const expenseCategory = z.enum(["utilities", "ministry", "pastoral", "admin", "building", "worship", "welfare", "other"]);
const paymentMethod = z.enum(["cash", "transfer", "check"]);
const churchRoleEnum = z.enum(["SUPER_ADMIN", "PASTOR", "TREASURER", "MEMBER"]);

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,

  // ── Auth ────────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    /** Set the church role of a user (SUPER_ADMIN only) */
    setChurchRole: adminProcedure
      .input(z.object({ userId: z.number().int().positive(), churchRole: churchRoleEnum.nullable() }))
      .mutation(async ({ input }) => {
        await updateUserChurchRole(input.userId, input.churchRole);
        return { success: true } as const;
      }),
  }),

  // ── Church Profile ──────────────────────────────────────────────────────────
  church: router({
    getProfile: protectedProcedure.query(async () => {
      return await getChurchProfile();
    }),
    updateProfile: churchLeaderProcedure
      .input(z.object({
        name: z.string().trim().min(2).max(180),
        address: z.string().trim().max(1000).optional(),
        phone: z.string().trim().max(20).optional(),
        email: z.string().email().max(320).optional().or(z.literal("")),
        website: z.string().url().max(500).optional().or(z.literal("")),
        pastorName: z.string().trim().max(120).optional(),
        assistantPastorName: z.string().trim().max(120).optional(),
        treasurerName: z.string().trim().max(120).optional(),
        bankName: z.string().trim().max(120).optional(),
        bankAccount: z.string().trim().max(30).optional(),
        bankAccountName: z.string().trim().max(120).optional(),
        fiscalYearStartMonth: z.number().int().min(1).max(12).default(1),
        motto: z.string().trim().max(280).optional(),
      }))
      .mutation(async ({ input }) => {
        await upsertChurchProfile({ ...input, churchId: DEFAULT_CHURCH_ID });
        return { success: true } as const;
      }),
    completeSetup: churchLeaderProcedure.mutation(async () => {
      await markSetupCompleted();
      return { success: true } as const;
    }),
  }),

  // ── Finance Summary ─────────────────────────────────────────────────────────
  finance: router({
    summary: protectedProcedure.query(async () => {
      return await getFinancialSummary();
    }),
    monthlyStats: protectedProcedure
      .input(z.object({ months: z.number().int().min(1).max(24).default(6) }).optional())
      .query(async ({ input }) => {
        return await getMonthlyStats(DEFAULT_CHURCH_ID, input?.months ?? 6);
      }),
    accounts: protectedProcedure.query(async () => {
      return await listFinanceAccounts();
    }),
    createAccount: financeProcedure
      .input(z.object({
        name: z.string().trim().min(2).max(120),
        type: z.enum(["general", "tithe", "mission", "building", "welfare", "special"]).default("general"),
        description: z.string().trim().max(500).optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createFinanceAccount({ ...input, churchId: DEFAULT_CHURCH_ID });
        return { id };
      }),
  }),

  // ── Offerings ───────────────────────────────────────────────────────────────
  offerings: router({
    list: protectedProcedure
      .input(z.object({
        limit: z.number().int().min(1).max(200).default(50),
        fromDate: z.coerce.date().optional(),
        toDate: z.coerce.date().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const showDonorNames = canViewDonorNames(ctx.user);
        return await listOfferings(DEFAULT_CHURCH_ID, {
          limit: input?.limit ?? 50,
          showDonorNames,
          fromDate: input?.fromDate,
          toDate: input?.toDate,
        });
      }),
    create: financeProcedure
      .input(z.object({
        amount: z.number().positive(),
        category: offeringCategory.default("general"),
        fundId: z.number().int().positive().optional(),
        donorName: z.string().trim().max(120).optional(),
        receiptDate: z.coerce.date().optional(),
        method: paymentMethod.default("cash"),
        reference: z.string().trim().max(120).optional(),
        notes: z.string().trim().max(500).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createOffering({
          amount: input.amount.toFixed(2),
          category: input.category,
          fundId: input.fundId ?? null,
          donorName: input.donorName ?? null,
          receiptDate: input.receiptDate ?? new Date(),
          method: input.method,
          reference: input.reference ?? null,
          notes: input.notes ?? null,
          recordedBy: ctx.user.id,
        } as any);
        return { id };
      }),
  }),

  // ── Expenses ────────────────────────────────────────────────────────────────
  expenses: router({
    list: protectedProcedure
      .input(z.object({
        limit: z.number().int().min(1).max(200).default(50),
        fromDate: z.coerce.date().optional(),
        toDate: z.coerce.date().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await listExpenses(DEFAULT_CHURCH_ID, {
          limit: input?.limit ?? 50,
          fromDate: input?.fromDate,
          toDate: input?.toDate,
        });
      }),
    create: financeProcedure
      .input(z.object({
        amount: z.number().positive(),
        category: expenseCategory.default("other"),
        fundId: z.number().int().positive().optional(),
        description: z.string().trim().min(2).max(280),
        details: z.string().trim().max(1000).optional(),
        expenseDate: z.coerce.date().optional(),
        payee: z.string().trim().max(120).optional(),
        receiptRef: z.string().trim().max(120).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createExpense({
          amount: input.amount.toFixed(2),
          category: input.category,
          fundId: input.fundId ?? null,
          description: input.description,
          details: input.details ?? null,
          expenseDate: input.expenseDate ?? new Date(),
          payee: input.payee ?? null,
          receiptRef: input.receiptRef ?? null,
          status: "approved",
          recordedBy: ctx.user.id,
        } as any);
        return { id };
      }),
  }),

  // ── Withdrawal Requests ─────────────────────────────────────────────────────
  withdrawals: router({
    list: protectedProcedure
      .input(z.object({ myOnly: z.boolean().default(false) }).optional())
      .query(async ({ ctx, input }) => {
        const userId = input?.myOnly ? ctx.user.id : undefined;
        return await listWithdrawalRequests(DEFAULT_CHURCH_ID, { userId });
      }),
    create: protectedProcedure
      .input(z.object({
        amount: z.number().positive(),
        purpose: z.string().trim().min(5).max(280),
        details: z.string().trim().max(1000).optional(),
        fundId: z.number().int().positive().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createWithdrawalRequest({
          amount: input.amount.toFixed(2),
          purpose: input.purpose,
          details: input.details ?? null,
          fundId: input.fundId ?? null,
          requestedBy: ctx.user.id,
          requestDate: new Date(),
        } as any);
        return { id };
      }),
    approve: financeProcedure
      .input(z.object({
        id: z.number().int().positive(),
        action: z.enum(["approved", "rejected"]),
        note: z.string().trim().max(500).default(""),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!canApproveWithdrawals(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "คุณไม่มีสิทธิ์อนุมัติคำขอเบิก" });
        }
        await approveWithdrawal(input.id, ctx.user.id, input.action, input.note);
        return { success: true } as const;
      }),
    disburse: financeProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await disburseWithdrawal(input.id);
        return { success: true } as const;
      }),
  }),

  // ── Reports ──────────────────────────────────────────────────────────────────
  reports: router({
    financial: protectedProcedure
      .input(z.object({
        fromDate: z.coerce.date(),
        toDate: z.coerce.date(),
      }))
      .query(async ({ input }) => {
        return await getFinancialReportData(DEFAULT_CHURCH_ID, input.fromDate, input.toDate);
      }),
    exportCsv: financeProcedure
      .input(z.object({
        fromDate: z.coerce.date(),
        toDate: z.coerce.date(),
      }))
      .query(async ({ input }) => {
        const rows = await getFinancialReportData(DEFAULT_CHURCH_ID, input.fromDate, input.toDate);
        const header = "วันที่,ประเภท,หมวดหมู่,รายละเอียด,จำนวนเงิน (บาท),ช่องทาง";
        const lines = rows.map((r) =>
          [
            r.date,
            r.type === "income" ? "รายรับ" : "รายจ่าย",
            r.category,
            `"${r.description.replace(/"/g, '""')}"`,
            r.amount.toFixed(2),
            r.method ?? "-",
          ].join(",")
        );
        return { csv: [header, ...lines].join("\n"), rowCount: rows.length };
      }),
  }),

  // ── Updates (existing) ──────────────────────────────────────────────────────
  updates: router({
    feed: protectedProcedure.query(async () => ({
      news: await listPublishedChurchNews(),
      events: await listPublishedChurchEvents(),
    })),
    adminList: adminProcedure.query(async () => ({
      news: await listAllChurchNews(),
      events: await listAllChurchEvents(),
    })),
    createNews: adminProcedure
      .input(z.object({
        title: z.string().trim().min(3).max(180),
        summary: z.string().trim().min(3).max(280),
        body: z.string().trim().min(3),
        category: newsCategory,
        status: newsStatus.default("draft"),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createChurchNews({
          authorId: ctx.user.id,
          title: input.title,
          summary: input.summary,
          body: input.body,
          category: input.category,
          status: input.status,
          publishedAt: input.status === "published" ? new Date() : null,
        });
        return { id };
      }),
    createEvent: adminProcedure
      .input(z.object({
        title: z.string().trim().min(3).max(180),
        summary: z.string().trim().min(3).max(280),
        description: z.string().trim().min(3),
        startsAt: z.coerce.date(),
        endsAt: z.coerce.date().optional(),
        location: z.string().trim().max(180).optional(),
        registrationUrl: z.string().url().max(500).optional().or(z.literal("")),
        status: eventStatus.default("draft"),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createChurchEvent({
          authorId: ctx.user.id,
          title: input.title,
          summary: input.summary,
          description: input.description,
          startsAt: input.startsAt,
          endsAt: input.endsAt ?? null,
          location: input.location || null,
          registrationUrl: input.registrationUrl || null,
          status: input.status,
        });
        return { id };
      }),
    updateNews: adminProcedure
      .input(z.object({
        id: z.number().int().positive(),
        title: z.string().trim().min(3).max(180),
        summary: z.string().trim().min(3).max(280),
        body: z.string().trim().min(3),
        category: newsCategory,
        status: newsStatus,
      }))
      .mutation(async ({ input }) => {
        await updateChurchNews(input.id, {
          title: input.title,
          summary: input.summary,
          body: input.body,
          category: input.category,
          status: input.status,
          publishedAt: input.status === "published" ? new Date() : null,
        });
        return { success: true } as const;
      }),
    updateEvent: adminProcedure
      .input(z.object({
        id: z.number().int().positive(),
        title: z.string().trim().min(3).max(180),
        summary: z.string().trim().min(3).max(280),
        description: z.string().trim().min(3),
        startsAt: z.coerce.date(),
        endsAt: z.coerce.date().optional(),
        location: z.string().trim().max(180).optional(),
        registrationUrl: z.string().url().max(500).optional().or(z.literal("")),
        status: eventStatus,
      }))
      .mutation(async ({ input }) => {
        await updateChurchEvent(input.id, {
          title: input.title,
          summary: input.summary,
          description: input.description,
          startsAt: input.startsAt,
          endsAt: input.endsAt ?? null,
          location: input.location || null,
          registrationUrl: input.registrationUrl || null,
          status: input.status,
        });
        return { success: true } as const;
      }),
    setNewsStatus: adminProcedure
      .input(z.object({ id: z.number().int().positive(), status: newsStatus }))
      .mutation(async ({ input }) => {
        await updateChurchNewsStatus(input.id, input.status);
        return { success: true } as const;
      }),
    setEventStatus: adminProcedure
      .input(z.object({ id: z.number().int().positive(), status: eventStatus }))
      .mutation(async ({ input }) => {
        await updateChurchEventStatus(input.id, input.status);
        return { success: true } as const;
      }),
    deleteNews: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await deleteChurchNews(input.id);
        return { success: true } as const;
      }),
    deleteEvent: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await deleteChurchEvent(input.id);
        return { success: true } as const;
      }),
  }),
});

export type AppRouter = typeof appRouter;
