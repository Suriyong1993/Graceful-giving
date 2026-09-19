import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  Banknote,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Eye,
  EyeOff,
  FileBarChart,
  HandCoins,
  Heart,
  Info,
  Landmark,
  Loader2,
  MoreHorizontal,
  ReceiptText,
  Sprout,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Illustration } from "@/components/Illustration";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppMenu } from "@/components/layout/AppNavigation";
import { offeringCategoryLabel } from "@shared/categories";

export const quickActions = [
  { label: "บันทึกถวาย", icon: HandCoins, tone: "income" },
  { label: "บันทึกรายจ่าย", icon: ReceiptText, tone: "expense" },
  { label: "รายงาน", icon: BarChart3, tone: "report" },
  { label: "สมาชิก", icon: UsersRound, tone: "members" },
  { label: "กิจกรรม", icon: CalendarDays, tone: "events" },
  { label: "เพิ่มเติม", icon: MoreHorizontal, tone: "more" },
];

// ─── Formatting helpers ──────────────────────────────────────────────────────

function fmtBaht(n: number) {
  return `฿${n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtShortBaht(n: number) {
  return `฿${n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function pctChange(current: number, prev: number) {
  if (prev === 0) return current > 0 ? "+∞%" : "0%";
  const pct = ((current - prev) / prev) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`;
}

function trendArrow(trend: string) {
  return trend.trim().startsWith("-") ? "↓" : "↑";
}

function trendValue(trend: string) {
  return trend.replace(/^[+\-↑↓]\s*/, "");
}

function fmtThaiDate(d: Date | string) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

// ─── Balance count-up (first-impression polish) ─────────────────────────────
// Animates the hero balance figure from 0 to its real value on mount/update
// instead of just appearing — skips straight to the final value for
// prefers-reduced-motion so no one is forced to watch a number tick up.
function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(target);
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (prefersReducedMotion) {
      setValue(target);
      return;
    }
    const start = performance.now();
    let frameId: number;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs, prefersReducedMotion]);

  return value;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Home() {
  const [, setLocation] = useLocation();
  const [showBalance, setShowBalance] = useState(true);

  // Dialog states
  const [newsOpen, setNewsOpen] = useState(false);

  // tRPC Queries with resilient fallback
  const {
    data: summaryData,
    isLoading: summaryLoading,
    isError: summaryError,
  } = trpc.finance.summary.useQuery(undefined, {
    retry: false,
    staleTime: 30_000,
  });

  const { data: monthlyStatsData } = trpc.finance.monthlyStats.useQuery(
    undefined,
    {
      retry: false,
      staleTime: 60_000,
    }
  );

  const { data: accountsData } = trpc.finance.accounts.useQuery(undefined, {
    retry: false,
    staleTime: 60_000,
  });

  const { data: offeringsData } = trpc.offerings.list.useQuery(
    { limit: 30 },
    { retry: false }
  );

  const { data: expensesData } = trpc.expenses.list.useQuery(
    { limit: 30 },
    { retry: false }
  );

  // Derived values always come from the current API response.
  const totalBalance = summaryData?.totalBalance;
  const monthlyIncome = summaryData?.monthlyIncome;
  const monthlyExpense = summaryData?.monthlyExpense;
  const netMonthly = summaryData
    ? summaryData.monthlyIncome - summaryData.monthlyExpense
    : undefined;
  const incomeTrend = summaryData
    ? pctChange(summaryData.monthlyIncome, summaryData.prevMonthIncome)
    : "";
  const expenseTrend = summaryData
    ? pctChange(summaryData.monthlyExpense, summaryData.prevMonthExpense)
    : "";
  const isBalanceLoading = summaryLoading;
  const isDataUnavailable = !summaryLoading && (summaryError || !summaryData);
  const isPositiveBalance = (totalBalance ?? 0) >= 0;
  const isPositiveNet = (netMonthly ?? 0) >= 0;
  const animatedBalance = useCountUp(totalBalance ?? 0);
  const chartData = monthlyStatsData ?? [];
  const fundAccounts = accountsData ?? [];

  // Combined transactions
  const allTransactions = useMemo(() => {
    const list: any[] = [];
    if (offeringsData && offeringsData.length > 0) {
      offeringsData.forEach((o: any) => {
        list.push({
          id: `offering-${o.id}`,
          rawId: o.id,
          title: offeringCategoryLabel(o.category),
          date: o.receiptDate || o.createdAt,
          type: "income",
          category: o.category,
          subCategory: "อาคารคริสตจักร",
          amount: Number(o.amount),
          tone: "bg-[#FFEBE5] text-[#E06250]",
          icon: Heart,
        });
      });
    }
    if (expensesData && expensesData.length > 0) {
      expensesData.forEach((e: any) => {
        list.push({
          id: `expense-${e.id}`,
          rawId: e.id,
          title: e.description,
          date: e.expenseDate || e.createdAt,
          type: "expense",
          category: e.category,
          subCategory: "พันธกิจนมัสการ",
          amount: Number(e.amount),
          tone: "bg-[#FDF0E2] text-[#B3702A]",
          icon: Landmark,
        });
      });
    }
    return list.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [offeringsData, expensesData]);

  return (
    <AppLayout>
      <div className="space-y-6 sm:space-y-8 md:space-y-10">
        {/* ─── 1. HERO SECTION ─────────────────────────────────────────── */}
        {/* Side-by-side at every breakpoint (text col + image col) so the
                  illustration never drops into an orphaned centered block below
                  the headline on mobile; md+ switches to the wider 12-col split
                  with the extra scripture speech card. */}
        <section
          aria-label="Grace-giving ส่วนต้อนรับ"
          className="animate-fade-up relative rounded-[32px] sm:rounded-[40px] md:rounded-[48px] overflow-hidden bg-gradient-to-br from-[#FFFDF9] via-[#FFF9EE] to-[#FFF1DA] border-2 border-[#E9D9BF] shadow-sm p-6 sm:p-8 md:p-10 lg:p-12 w-full"
        >
          {/* Decorative soft depth aura — spacious and gentle */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 sm:w-72 sm:h-72 md:w-96 md:h-96 rounded-full bg-[#A8C978]/15 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-16 -left-16 w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-[#D47012]/15 blur-3xl"
          />

          {/* Hero Content Grid — fluid auto-scaling across all devices */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 md:gap-10 lg:gap-12 items-center relative z-10 w-full">
            {/* Left Column: Generous typography & whitespace */}
            <div className="min-w-0 md:col-span-7 lg:col-span-7 xl:col-span-7 space-y-4 sm:space-y-5 md:space-y-6 w-full flex flex-col justify-center">
              {/* Brand Title */}
              <h1 className="flex flex-col">
                <span className="flex items-center gap-2 sm:gap-3.5">
                  <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-[#2C1810] tracking-tight leading-none font-display">
                    Grace
                  </span>
                  <span className="text-[#3D7826] -mt-2 sm:-mt-4">
                    <Sprout className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 stroke-[2.5]" />
                  </span>
                </span>
                <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-[#D47012] tracking-tight leading-none font-display mt-1 sm:mt-2">
                  Ledger
                </span>
              </h1>

              {/* Tagline */}
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-black text-[#4A2E1B] leading-relaxed">
                การเงินเชื่อมใจ เพื่อพันธกิจของพระเจ้า
              </p>

              {/* Bible Pill Badge */}
              <div className="inline-flex flex-wrap items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full sm:rounded-2xl bg-white border-2 border-[#E9D9BF] text-sm sm:text-base leading-relaxed text-[#2C1810] shadow-xs max-w-full">
                <span className="whitespace-nowrap font-black text-[#B85E0E] shrink-0">
                  2 โครินธ์ 9:7
                </span>
                <span className="text-[#38251B] font-bold">
                  “ผู้ให้ด้วยใจยินดี พระเจ้าทรงรัก”
                </span>
              </div>
            </div>

            {/* Right Column: Fluid responsive illustration auto-filling the column proportionally */}
            <div className="min-w-0 md:col-span-5 lg:col-span-5 xl:col-span-5 flex items-center justify-center md:justify-end w-full">
              <div className="relative w-full max-w-sm sm:max-w-md md:max-w-none md:w-full aspect-[4/3] sm:aspect-square md:aspect-[4/3] lg:aspect-[16/11] rounded-[28px] sm:rounded-[36px] md:rounded-[42px] overflow-hidden shadow-md border-4 border-white shrink-0 bg-[#FFF4DF]/70 transition-transform duration-500 hover:scale-[1.015]">
                <Illustration
                  src="/illustrations/hero_jesus_shepherd.jpg"
                  alt="พระเยซูคริสต์และลูกแกะ"
                  className="w-full h-full object-cover object-[center_20%]"
                  priority
                  width={512}
                  height={384}
                />
                <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 pointer-events-none">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-sm border border-[#E9D9BF] shadow-xs">
                    <span className="text-xs sm:text-sm font-black text-[#4A2E1B]">
                      พระเยซูผู้เลี้ยงที่ดี ♥
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 2. BALANCE CARD ("ยอดเงินคงเหลือรวม") ─────────────────── */}
        <section
          aria-label="ยอดเงินคงเหลือรวม"
          style={{ animationDelay: "90ms" }}
          className={`animate-fade-up bg-gradient-to-br from-white via-white to-[#F7FBF4] rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 md:p-10 border-2 relative overflow-hidden w-full ${isPositiveBalance ? "border-[#A8D59D]" : "border-[#F2C9BE]"} ${isPositiveBalance ? "clay-balance-glow" : "clay-card-shadow"}`}
        >
          <div className="flex items-center justify-between gap-6">
            {/* Left: Prominent financial figures */}
            <div className="min-w-0 flex-1 space-y-2 sm:space-y-3 z-10">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-lg sm:text-xl md:text-2xl font-black text-[#2C1810]">
                  ยอดเงินคงเหลือรวม
                </h2>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-[#523D2E] hover:text-[#2C1810] transition-colors p-2 rounded-full focus-visible:ring-2 focus-visible:ring-[#D47012]"
                  aria-label={showBalance ? "ซ่อนยอดเงิน" : "แสดงยอดเงิน"}
                  aria-pressed={!showBalance}
                >
                  {showBalance ? (
                    <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <EyeOff className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </button>

                {/* Data-source status */}
                {isBalanceLoading && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#F0EAF8] text-[#7D3C98] text-xs sm:text-sm font-black">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    กำลังโหลดข้อมูล
                  </span>
                )}
                {isDataUnavailable && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FFF3DF] border border-dashed border-[#E9C179] text-[#7A4B0F] text-xs sm:text-sm font-black">
                    <Info className="w-4 h-4" />
                    {summaryError
                      ? "เชื่อมต่อข้อมูลไม่สำเร็จ"
                      : "ยังไม่มีข้อมูลการเงิน"}
                  </span>
                )}
              </div>

              {isBalanceLoading ? (
                <div
                  className="h-12 sm:h-16 md:h-20 w-56 sm:w-80 rounded-2xl bg-[#EDE6D8] animate-pulse"
                  aria-hidden="true"
                />
              ) : (
                <div
                  className={`break-words text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight tabular-nums ${isPositiveBalance ? "text-[#155724]" : "text-[#9E2D12]"}`}
                >
                  {showBalance && summaryData ? fmtBaht(animatedBalance) : "—"}
                </div>
              )}

              <p className="text-sm sm:text-base md:text-lg text-[#4A2E1B] font-bold flex items-center gap-2 pt-1">
                {isBalanceLoading ? (
                  <span>กำลังตรวจสอบยอดเงินล่าสุด…</span>
                ) : isPositiveBalance ? (
                  <>
                    <span>ขอบคุณพระเจ้าสำหรับทุกการถวาย</span>
                    <span className="text-[#3D7826] text-lg">♥</span>
                  </>
                ) : (
                  <span className="text-[#9E2D12] font-black">
                    ยอดคงเหลือติดลบ — ควรตรวจสอบรายจ่าย
                  </span>
                )}
              </p>

              <div className="pt-3">
                <button
                  onClick={() => setLocation("/reports")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-[#FFF4DF] text-[#2C1810] text-sm sm:text-base font-black border-2 border-[#E9D9BF] transition-all focus-visible:ring-2 focus-visible:ring-[#D47012] shadow-xs hover:border-[#D47012]"
                >
                  <BarChart3 className="w-5 h-5 text-[#D47012]" />
                  <span>ดูรายละเอียด</span>
                  <ChevronRight className="w-5 h-5 text-[#523D2E]" />
                </button>
              </div>
            </div>

            {/* Right: Decorative balance_wallet.jpg tucked cleanly in corner */}
            <div className="hidden sm:block shrink-0 z-10">
              <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-44 lg:h-44 rounded-[28px] sm:rounded-[36px] overflow-hidden border-2 border-[#E9D9BF] bg-[#FFF8EB] p-2 shadow-xs">
                <Illustration
                  src="/illustrations/balance_wallet.jpg"
                  alt="กระเป๋าสตางค์ยอดคงเหลือ"
                  className="w-full h-full object-cover rounded-[22px] sm:rounded-[30px]"
                  width={176}
                  height={176}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ─── 3. FINANCIAL SUMMARY CARDS (Row of 3 cards: รายรับ, รายจ่าย, คงเหลือ) ── */}
        <section
          aria-label="สรุปตัวเลขการเงินรายเดือน"
          style={{ animationDelay: "160ms" }}
          className="animate-fade-up grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full"
        >
          {/* Card 1: รายรับ (Income) */}
          <div className="min-w-0 bg-[#EAF5E4] border-2 border-[#B8E2AB] rounded-[28px] sm:rounded-[36px] p-5 sm:p-6 md:p-7 flex sm:flex-col items-center sm:items-start gap-4 shadow-xs">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl overflow-hidden shrink-0 bg-white p-1 border border-[#B8E2AB]">
              <Illustration
                src="/illustrations/income_hand_heart.jpg"
                alt="รายรับ"
                className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
                width={96}
                height={96}
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0 max-w-full flex-1">
              <span className="text-lg sm:text-xl font-black text-[#1C592B]">
                รายรับ
              </span>
              {isBalanceLoading ? (
                <div className="h-9 md:h-11 w-32 my-1 rounded-xl bg-white/80 animate-pulse" />
              ) : (
                <div className="text-3xl sm:text-4xl md:text-5xl font-black text-[#155724] break-words tabular-nums mt-0.5">
                  {showBalance && monthlyIncome !== undefined
                    ? fmtShortBaht(monthlyIncome)
                    : "—"}
                </div>
              )}
              <span className="text-sm sm:text-base font-black text-[#1C592B] flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1">
                <span>
                  {trendArrow(incomeTrend)} {trendValue(incomeTrend)}
                </span>
                <span className="text-xs sm:text-sm text-[#3D4D38] font-bold">
                  จากเดือนที่แล้ว
                </span>
              </span>
            </div>
          </div>

          {/* Card 2: รายจ่าย (Expenses) */}
          <div className="min-w-0 bg-[#FDEDE3] border-2 border-[#F6C6A5] rounded-[28px] sm:rounded-[36px] p-5 sm:p-6 md:p-7 flex sm:flex-col items-center sm:items-start gap-4 shadow-xs">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl overflow-hidden shrink-0 bg-white p-1 border border-[#F6C6A5]">
              <Illustration
                src="/illustrations/expense_hand_coin.jpg"
                alt="รายจ่าย"
                className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
                width={96}
                height={96}
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0 max-w-full flex-1">
              <span className="text-lg sm:text-xl font-black text-[#8A2E14]">
                รายจ่าย
              </span>
              {isBalanceLoading ? (
                <div className="h-9 md:h-11 w-32 my-1 rounded-xl bg-white/80 animate-pulse" />
              ) : (
                <div className="text-3xl sm:text-4xl md:text-5xl font-black text-[#9E2D12] break-words tabular-nums mt-0.5">
                  {showBalance && monthlyExpense !== undefined
                    ? fmtShortBaht(monthlyExpense)
                    : "—"}
                </div>
              )}
              <span className="text-sm sm:text-base font-black text-[#8A2E14] flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1">
                <span>
                  {trendArrow(expenseTrend)} {trendValue(expenseTrend)}
                </span>
                <span className="text-xs sm:text-sm text-[#543930] font-bold">
                  จากเดือนที่แล้ว
                </span>
              </span>
            </div>
          </div>

          {/* Card 3: คงเหลือ (Net) */}
          <div
            className={`min-w-0 rounded-[28px] sm:rounded-[36px] p-5 sm:p-6 md:p-7 flex sm:flex-col items-center sm:items-start gap-4 border-2 shadow-xs sm:col-span-2 lg:col-span-1 ${isPositiveNet ? "bg-[#FFF6E5] border-[#F7D8A2]" : "bg-[#FDEBE8] border-[#F2C9BE]"}`}
          >
            <div
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl overflow-hidden shrink-0 bg-white p-1 border ${isPositiveNet ? "border-[#F7D8A2]" : "border-[#F2C9BE]"}`}
            >
              <Illustration
                src="/illustrations/balance_wallet.jpg"
                alt="คงเหลือ"
                className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
                width={96}
                height={96}
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0 max-w-full flex-1">
              <span className="text-lg sm:text-xl font-black text-[#6B4212]">
                คงเหลือสุทธิ
              </span>
              {isBalanceLoading ? (
                <div className="h-9 md:h-11 w-32 my-1 rounded-xl bg-white/80 animate-pulse" />
              ) : (
                <div className="text-3xl sm:text-4xl md:text-5xl font-black text-[#2C1810] break-words tabular-nums mt-0.5">
                  {showBalance && netMonthly !== undefined
                    ? fmtShortBaht(netMonthly)
                    : "—"}
                </div>
              )}
              <span
                className={`text-sm sm:text-base font-black flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1 ${isPositiveNet ? "text-[#1C592B]" : "text-[#9E2D12]"}`}
              >
                <span>
                  {isPositiveNet
                    ? "รายรับมากกว่ารายจ่าย"
                    : "รายจ่ายมากกว่ารายรับ"}
                </span>
              </span>
            </div>
          </div>
        </section>

        {/* ─── 4a. PRIMARY ACTIONS (บันทึกการถวาย / บันทึกรายจ่าย) ────── */}
        <section
          aria-label="การดำเนินการหลัก"
          style={{ animationDelay: "230ms" }}
          className="animate-fade-up grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full"
        >
          <button
            onClick={() => setLocation("/offerings/new")}
            className="flex items-center justify-center gap-3.5 py-4 sm:py-5 min-h-[68px] sm:min-h-[76px] rounded-2xl sm:rounded-3xl bg-[#2D6A2E] hover:bg-[#235324] text-white font-black text-lg sm:text-2xl clay-button-shadow transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-[#2D6A2E] focus-visible:ring-offset-2 shadow-md"
            aria-label="บันทึกการถวาย"
          >
            <HandCoins className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5]" />
            <span>บันทึกการถวาย</span>
          </button>

          <button
            onClick={() => setLocation("/expenses/new")}
            className="flex items-center justify-center gap-3.5 py-4 sm:py-5 min-h-[68px] sm:min-h-[76px] rounded-2xl sm:rounded-3xl bg-[#B54A1E] hover:bg-[#963C15] text-white font-black text-lg sm:text-2xl clay-button-shadow transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-[#B54A1E] focus-visible:ring-offset-2 shadow-md"
            aria-label="บันทึกรายจ่าย"
          >
            <ReceiptText className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5]" />
            <span>บันทึกรายจ่าย</span>
          </button>
        </section>

        {/* ─── 4b. SECONDARY MENU (รายงาน / สมาชิก / กิจกรรม / เพิ่มเติม) ── */}
        <section
          aria-label="เมนูลัดอื่น ๆ"
          className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4 md:gap-5 w-full"
        >
          {/* รายงาน */}
          <button
            onClick={() => setLocation("/reports")}
            className="flex flex-col items-center justify-center min-h-[82px] sm:min-h-[96px] py-4 px-3 rounded-2xl sm:rounded-3xl bg-white border-2 border-[#E9D9BF] hover:border-[#8E44AD] transition-all hover:scale-102 focus-visible:ring-2 focus-visible:ring-[#8E44AD] shadow-xs"
            aria-label="รายงาน"
          >
            <FileBarChart className="w-7 h-7 stroke-[2.4] text-[#8E44AD] mb-1.5" />
            <span className="text-sm sm:text-base font-black text-[#2C1810] tracking-tight text-center">
              รายงาน
            </span>
          </button>

          {/* สมาชิก */}
          <button
            onClick={() => setLocation("/members")}
            className="flex flex-col items-center justify-center min-h-[82px] sm:min-h-[96px] py-4 px-3 rounded-2xl sm:rounded-3xl bg-white border-2 border-[#E9D9BF] hover:border-[#D47012] transition-all hover:scale-102 focus-visible:ring-2 focus-visible:ring-[#D47012] shadow-xs"
            aria-label="สมาชิก"
          >
            <UsersRound className="w-7 h-7 stroke-[2.4] text-[#D47012] mb-1.5" />
            <span className="text-sm sm:text-base font-black text-[#2C1810] tracking-tight text-center">
              สมาชิก
            </span>
          </button>

          {/* กิจกรรม */}
          <button
            onClick={() => setNewsOpen(true)}
            className="flex flex-col items-center justify-center min-h-[82px] sm:min-h-[96px] py-4 px-3 rounded-2xl sm:rounded-3xl bg-white border-2 border-[#E9D9BF] hover:border-[#C9503B] transition-all hover:scale-102 focus-visible:ring-2 focus-visible:ring-[#C9503B] shadow-xs"
            aria-label="กิจกรรม"
          >
            <CalendarDays className="w-7 h-7 stroke-[2.4] text-[#C9503B] mb-1.5" />
            <span className="text-sm sm:text-base font-black text-[#2C1810] tracking-tight text-center">
              กิจกรรม
            </span>
          </button>

          {/* ขอเบิกเงิน */}
          <button
            onClick={() => setLocation("/withdrawals/new")}
            className="flex flex-col items-center justify-center min-h-[82px] sm:min-h-[96px] py-4 px-3 rounded-2xl sm:rounded-3xl bg-white border-2 border-[#E9D9BF] hover:border-[#E99A4A] transition-all hover:scale-102 focus-visible:ring-2 focus-visible:ring-[#E99A4A] shadow-xs"
            aria-label="ยื่นคำขอเบิกเงิน"
          >
            <Banknote className="w-7 h-7 stroke-[2.4] text-[#E99A4A] mb-1.5" />
            <span className="text-sm sm:text-base font-black text-[#2C1810] tracking-tight text-center">
              ขอเบิกเงิน
            </span>
          </button>

          {/* เพิ่มเติม */}
          <AppMenu>
            <button
              type="button"
              className="flex flex-col items-center justify-center min-h-[82px] sm:min-h-[96px] py-4 px-3 w-full rounded-2xl sm:rounded-3xl bg-white border-2 border-[#E9D9BF] hover:border-[#2A75A0] transition-all hover:scale-102 focus-visible:ring-2 focus-visible:ring-[#2A75A0] shadow-xs"
              aria-label="เพิ่มเติม"
            >
              <MoreHorizontal className="w-7 h-7 stroke-[2.4] text-[#2A75A0] mb-1.5" />
              <span className="text-sm sm:text-base font-black text-[#2C1810] tracking-tight text-center">
                เพิ่มเติม
              </span>
            </button>
          </AppMenu>
        </section>

        {/* ─── 5. CHURCH NEWS CARD ("ข่าวสารจากคริสตจักร") ─────────── */}
        <section aria-label="ข่าวสารจากคริสตจักร" className="w-full">
          <div
            onClick={() => setNewsOpen(true)}
            className="cursor-pointer bg-gradient-to-r from-[#FFFDF8] via-[#FFF8EC] to-[#FFF1DE] border-2 border-[#E9D9BF] rounded-[28px] sm:rounded-[36px] p-5 sm:p-7 flex items-center justify-between gap-4 hover:border-[#D47012] transition-all shadow-xs"
            role="button"
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === " ") {
                setNewsOpen(true);
              }
            }}
            aria-label="เปิดดูข่าวสารจากคริสตจักร"
          >
            <div className="flex items-center gap-4">
              <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl overflow-hidden shrink-0 bg-white p-1.5 border border-[#E9D9BF]">
                <Illustration
                  src="/illustrations/bible_cross.jpg"
                  alt="พระคัมภีร์และกางเขน"
                  className="w-full h-full object-cover rounded-xl"
                  width={88}
                  height={88}
                  aria-hidden="true"
                />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#2C1810]">
                  ข่าวสารจากคริสตจักร
                </h2>
                <p className="text-sm sm:text-base text-[#4A2E1B] font-bold mt-0.5">
                  ติดตามประกาศ กิจกรรม และพันธกิจต่าง ๆ
                </p>
              </div>
            </div>
            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[#2C1810] border-2 border-[#E9D9BF] shrink-0 shadow-2xs">
              <ChevronRight className="w-6 h-6" />
            </div>
          </div>
        </section>

        {/* ─── 6. BUDGET SECTION (real data only) ─────────────────────── */}
        <section
          aria-label="แผนการใช้จ่ายงบประมาณ"
          className="bg-white rounded-[28px] sm:rounded-[36px] p-6 sm:p-8 border-2 border-[#E9D9BF] shadow-xs space-y-4 w-full"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-[#2C1810]">
              แผนการใช้จ่าย
            </h2>
            <button
              onClick={() => setLocation("/reports")}
              className="text-sm sm:text-base font-black text-[#B85E0E] hover:underline flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-[#D47012]"
            >
              <span>ดูรายงาน</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <p className="py-6 text-sm sm:text-base text-[#4A2E1B] font-bold">
            ยังไม่มีข้อมูลแผนการใช้จ่ายจากระบบ จึงยังไม่แสดงตัวเลขประมาณการ
          </p>
        </section>

        {/* ─── 7. RECENT TRANSACTIONS SECTION ("รายการล่าสุด") ─────── */}
        <section
          aria-label="รายการธุรกรรมล่าสุด"
          className="bg-white rounded-[28px] sm:rounded-[36px] p-6 sm:p-8 border-2 border-[#E9D9BF] shadow-xs space-y-4 w-full"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-[#2C1810]">
              รายการล่าสุด
            </h2>
            <button
              onClick={() => setLocation("/transactions")}
              className="text-sm sm:text-base font-black text-[#B85E0E] hover:underline flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-[#D47012]"
            >
              <span>ดูทั้งหมด</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="divide-y-2 divide-[#F0E6D8]/60">
            {allTransactions.length === 0 && (
              <p className="py-8 text-center text-sm sm:text-base text-[#4A2E1B] font-bold">
                ยังไม่มีรายการธุรกรรมล่าสุดจากระบบ
              </p>
            )}
            {allTransactions.slice(0, 4).map(tx => {
              const IconComponent = tx.icon || Heart;
              const isIncome = tx.type === "income";
              return (
                <div
                  key={tx.id}
                  className="py-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-2xl ${tx.tone} flex items-center justify-center shrink-0`}
                    >
                      <IconComponent className="w-6 h-6 stroke-[2.4]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-base sm:text-lg font-black text-[#2C1810] leading-tight truncate">
                        {tx.title}
                      </p>
                      <p className="text-xs sm:text-sm text-[#4A2E1B] font-bold pt-0.5">
                        {typeof tx.date === "string"
                          ? tx.date
                          : fmtThaiDate(tx.date)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={`text-base sm:text-xl font-black ${isIncome ? "text-[#155724]" : "text-[#9E2D12]"}`}
                    >
                      {isIncome ? "+" : "-"}
                      {fmtBaht(tx.amount)}
                    </p>
                    <p className="text-xs sm:text-sm text-[#4A2E1B] font-bold">
                      {tx.subCategory}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
      {/* ─── SHEET: CHURCH NEWS & ANNOUNCEMENTS ─────────────────────────────── */}
      <Sheet open={newsOpen} onOpenChange={setNewsOpen}>
        <SheetContent className="bg-[#FFFDF8] border-l border-[#E9D9BF] w-full sm:max-w-lg p-6 sm:p-8 overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl sm:text-2xl font-black text-[#70452E] flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-[#E99A4A]" />
              <span>ข่าวสารและประกาศคริสตจักร</span>
            </SheetTitle>
            <SheetDescription className="text-sm sm:text-base text-[#927D6D] font-medium mt-1">
              ติดตามกิจกรรม พันธกิจ และคำพยานพระพร
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5">
            <div className="p-5 sm:p-6 rounded-3xl bg-[#FFF4DF] border-2 border-[#E9D9BF] space-y-3 shadow-xs">
              <span className="text-xs font-black px-3 py-1 rounded-full bg-[#E99A4A] text-white inline-block">
                ประกาศสำคัญ
              </span>
              <h4 className="text-lg sm:text-xl font-black text-[#70452E]">
                ค่ายสามัคคีธรรมประจำปี 2026
              </h4>
              <p className="text-sm sm:text-base text-[#38251B] leading-relaxed font-medium">
                ขอเชิญชวนพี่น้องสมาชิกทุกท่านร่วมค่ายสามัคคีธรรม วันที่ 18-20
                ต.ค. นี้ ณ ศูนย์ฝึกอบรมคริสเตียน
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-3xl bg-[#EAF5E4] border-2 border-[#D2EAC7] space-y-3 shadow-xs">
              <span className="text-xs font-black px-3 py-1 rounded-full bg-[#A8C978] text-white inline-block">
                รายงานพันธกิจ
              </span>
              <h4 className="text-lg sm:text-xl font-black text-[#4F8B33]">
                โครงการแจกถุงยังชีพสู่ชุมชนรอบโบสถ์
              </h4>
              <p className="text-sm sm:text-base text-[#38251B] leading-relaxed font-medium">
                คริสตจักรได้ส่งมอบถุงยังชีพจำนวน 120 ชุดแก่ครอบครัวยากไร้
                ขอบคุณพระเจ้าสำหรับทุกการถวาย
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
