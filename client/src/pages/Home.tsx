import { useEffect, useMemo, useState } from "react";
import { trpc, type RouterOutputs } from "@/lib/trpc";
import { Heart, Landmark } from "lucide-react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { canAccessRoute } from "@/lib/routeAccess";
import { offeringCategoryLabel } from "@shared/categories";
import { HeroSection } from "./Home/components/HeroSection";
import { BalanceCard } from "./Home/components/BalanceCard";
import { FinancialSummaryRow } from "./Home/components/FinancialSummaryRow";
import { PrimaryActions } from "./Home/components/PrimaryActions";
import { SecondaryMenu } from "./Home/components/SecondaryMenu";
import { ChurchNewsCard } from "./Home/components/ChurchNewsCard";
import { BudgetSection } from "./Home/components/BudgetSection";
import {
  RecentTransactions,
  type TransactionItem,
} from "./Home/components/RecentTransactions";
import { ChurchNewsSheet } from "./Home/components/ChurchNewsSheet";

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
  const { user } = useAuth();
  const [showBalance, setShowBalance] = useState(true);

  // Dialog states
  const [newsOpen, setNewsOpen] = useState(false);

  // The dashboard only offers shortcuts the signed-in role can actually open,
  // so a tile never drops the user on the Restricted Access screen.
  const canOpenReports = canAccessRoute("/reports", user);
  const canOpenMembers = canAccessRoute("/members", user);
  const canRecordExpense = canAccessRoute("/expenses", user);

  // Three tiles always show (กิจกรรม, ขอเบิกเงิน, เพิ่มเติม); the two gated
  // ones change the count, so match the column count to what is actually
  // rendered rather than leaving empty columns.
  const visibleSecondaryTiles =
    3 + (canOpenReports ? 1 : 0) + (canOpenMembers ? 1 : 0);
  const secondaryTileColsClass =
    visibleSecondaryTiles === 5
      ? "sm:grid-cols-5"
      : visibleSecondaryTiles === 4
        ? "sm:grid-cols-4"
        : "sm:grid-cols-3";

  // tRPC Queries with resilient fallback
  const {
    data: summaryData,
    isLoading: summaryLoading,
    isError: summaryError,
  } = trpc.finance.summary.useQuery(undefined, {
    retry: false,
    staleTime: 30_000,
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

  // Combined transactions
  const allTransactions = useMemo<TransactionItem[]>(() => {
    type OfferingItem = RouterOutputs["offerings"]["list"][number];
    type ExpenseItem = RouterOutputs["expenses"]["list"][number];
    const list: TransactionItem[] = [];
    if (offeringsData && offeringsData.length > 0) {
      offeringsData.forEach((o: OfferingItem) => {
        list.push({
          id: `offering-${o.id}`,
          rawId: o.id,
          title: offeringCategoryLabel(o.category),
          date: o.receiptDate,
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
      expensesData.forEach((e: ExpenseItem) => {
        list.push({
          id: `expense-${e.id}`,
          rawId: e.id,
          title: e.description,
          date: e.expenseDate,
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
        {/* 1. Hero Section */}
        <HeroSection />

        {/* 2. Balance Card */}
        <BalanceCard
          showBalance={showBalance}
          setShowBalance={setShowBalance}
          isPositiveBalance={isPositiveBalance}
          isBalanceLoading={isBalanceLoading}
          isDataUnavailable={isDataUnavailable}
          summaryError={summaryError}
          hasSummaryData={!!summaryData}
          animatedBalance={animatedBalance}
          canOpenReports={canOpenReports}
          onOpenReports={() => setLocation("/reports")}
          fmtBaht={fmtBaht}
        />

        {/* 3. Financial Summary Cards */}
        <FinancialSummaryRow
          isBalanceLoading={isBalanceLoading}
          showBalance={showBalance}
          monthlyIncome={monthlyIncome}
          monthlyExpense={monthlyExpense}
          netMonthly={netMonthly}
          incomeTrend={incomeTrend}
          expenseTrend={expenseTrend}
          isPositiveNet={isPositiveNet}
          fmtShortBaht={fmtShortBaht}
          trendArrow={trendArrow}
          trendValue={trendValue}
        />

        {/* 4a. Primary Actions */}
        <PrimaryActions
          canRecordExpense={canRecordExpense}
          onNewOffering={() => setLocation("/offerings/new")}
          onNewExpense={() => setLocation("/expenses/new")}
        />

        {/* 4b. Secondary Menu */}
        <SecondaryMenu
          canOpenReports={canOpenReports}
          canOpenMembers={canOpenMembers}
          secondaryTileColsClass={secondaryTileColsClass}
          onOpenReports={() => setLocation("/reports")}
          onOpenMembers={() => setLocation("/members")}
          onOpenNews={() => setNewsOpen(true)}
          onOpenWithdrawals={() => setLocation("/withdrawals/new")}
        />

        {/* 5. Church News Card */}
        <ChurchNewsCard onOpenNews={() => setNewsOpen(true)} />

        {/* 6. Budget Section */}
        <BudgetSection
          canOpenReports={canOpenReports}
          onOpenReports={() => setLocation("/reports")}
        />

        {/* 7. Recent Transactions Section */}
        <RecentTransactions
          allTransactions={allTransactions}
          onViewAll={() => setLocation("/transactions")}
          fmtBaht={fmtBaht}
          fmtThaiDate={fmtThaiDate}
        />
      </div>

      {/* Sheet: Church News & Announcements */}
      <ChurchNewsSheet open={newsOpen} onOpenChange={setNewsOpen} />
    </AppLayout>
  );
}
