interface FinancialSummaryRowProps {
  isBalanceLoading: boolean;
  showBalance: boolean;
  monthlyIncome: number | undefined;
  monthlyExpense: number | undefined;
  netMonthly: number | undefined;
  incomeTrend: string;
  expenseTrend: string;
  isPositiveNet: boolean;
  fmtShortBaht: (n: number) => string;
  trendArrow: (trend: string) => string;
  trendValue: (trend: string) => string;
}

export function FinancialSummaryRow({
  isBalanceLoading,
  showBalance,
  monthlyIncome,
  monthlyExpense,
  netMonthly,
  incomeTrend,
  expenseTrend,
  isPositiveNet,
  fmtShortBaht,
  trendArrow,
  trendValue,
}: FinancialSummaryRowProps) {
  return (
    <section
      aria-label="สรุปตัวเลขการเงินรายเดือน"
      style={{ animationDelay: "160ms" }}
      className="animate-fade-up grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full"
    >
      {/* Card 1: รายรับ (Income) */}
      <div className="min-w-0 bg-card border border-success-line rounded-2xl p-5 sm:p-6 flex sm:flex-col items-center sm:items-start gap-4 shadow-xs hover:border-success-line transition-colors">
        <div className="min-w-0 max-w-full flex-1">
          <span className="text-sm sm:text-base font-bold text-success">
            รายรับเดือนนี้
          </span>
          {isBalanceLoading ? (
            <div className="h-8 md:h-10 w-32 my-1 rounded-xl bg-sunken animate-pulse" />
          ) : (
            <div className="text-2xl sm:text-3xl md:text-4xl font-semibold text-success break-words tabular-nums mt-0.5">
              {showBalance && monthlyIncome !== undefined
                ? fmtShortBaht(monthlyIncome)
                : "-"}
            </div>
          )}
          <span className="text-xs sm:text-sm font-semibold text-success flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1">
            <span>
              {trendArrow(incomeTrend)} {trendValue(incomeTrend)}
            </span>
            <span className="text-xs text-ink-3 font-normal">
              จากเดือนที่แล้ว
            </span>
          </span>
        </div>
      </div>

      {/* Card 2: รายจ่าย (Expenses) */}
      <div className="min-w-0 bg-card border border-danger-soft rounded-2xl p-5 sm:p-6 flex sm:flex-col items-center sm:items-start gap-4 shadow-xs hover:border-danger-line transition-colors">
        <div className="min-w-0 max-w-full flex-1">
          <span className="text-sm sm:text-base font-bold text-danger">
            รายจ่ายเดือนนี้
          </span>
          {isBalanceLoading ? (
            <div className="h-8 md:h-10 w-32 my-1 rounded-xl bg-sunken animate-pulse" />
          ) : (
            <div className="text-2xl sm:text-3xl md:text-4xl font-semibold text-danger break-words tabular-nums mt-0.5">
              {showBalance && monthlyExpense !== undefined
                ? fmtShortBaht(monthlyExpense)
                : "-"}
            </div>
          )}
          <span className="text-xs sm:text-sm font-semibold text-danger flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1">
            <span>
              {trendArrow(expenseTrend)} {trendValue(expenseTrend)}
            </span>
            <span className="text-xs text-ink-3 font-normal">
              จากเดือนที่แล้ว
            </span>
          </span>
        </div>
      </div>

      {/* Card 3: คงเหลือ (Net) */}
      <div
        className={`min-w-0 bg-card rounded-2xl p-5 sm:p-6 flex sm:flex-col items-center sm:items-start gap-4 border shadow-xs sm:col-span-2 lg:col-span-1 transition-colors ${isPositiveNet ? "border-line hover:border-brand" : "border-danger-soft hover:border-danger-line"}`}
      >
        <div className="min-w-0 max-w-full flex-1">
          <span className="text-sm sm:text-base font-bold text-brand-strong">
            คงเหลือสุทธิเดือนนี้
          </span>
          {isBalanceLoading ? (
            <div className="h-8 md:h-10 w-32 my-1 rounded-xl bg-sunken animate-pulse" />
          ) : (
            <div className="text-2xl sm:text-3xl md:text-4xl font-semibold text-ink break-words tabular-nums mt-0.5">
              {showBalance && netMonthly !== undefined
                ? fmtShortBaht(netMonthly)
                : "-"}
            </div>
          )}
          <span
            className={`text-xs sm:text-sm font-semibold flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1 ${isPositiveNet ? "text-success" : "text-danger"}`}
          >
            <span>
              {isPositiveNet ? "รายรับมากกว่ารายจ่าย" : "รายจ่ายมากกว่ารายรับ"}
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}
