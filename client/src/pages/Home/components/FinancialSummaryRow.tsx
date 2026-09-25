import { Illustration } from "@/components/Illustration";

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
      <div className="min-w-0 bg-white border border-[#B9E6D0] rounded-2xl p-5 sm:p-6 flex sm:flex-col items-center sm:items-start gap-4 shadow-xs hover:border-[#34D399] transition-colors">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 bg-[#E6F6EE] p-1 border border-[#B9E6D0]">
          <Illustration
            src="/illustrations/income_hand_heart.jpg"
            alt="รายรับ"
            className="w-full h-full object-cover rounded-lg"
            width={96}
            height={96}
            aria-hidden="true"
          />
        </div>
        <div className="min-w-0 max-w-full flex-1">
          <span className="text-sm sm:text-base font-bold text-[#065F46]">
            รายรับเดือนนี้
          </span>
          {isBalanceLoading ? (
            <div className="h-8 md:h-10 w-32 my-1 rounded-xl bg-slate-100 animate-pulse" />
          ) : (
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#064E3B] break-words tabular-nums mt-0.5">
              {showBalance && monthlyIncome !== undefined
                ? fmtShortBaht(monthlyIncome)
                : "—"}
            </div>
          )}
          <span className="text-xs sm:text-sm font-semibold text-[#065F46] flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1">
            <span>
              {trendArrow(incomeTrend)} {trendValue(incomeTrend)}
            </span>
            <span className="text-xs text-slate-500 font-normal">
              จากเดือนที่แล้ว
            </span>
          </span>
        </div>
      </div>

      {/* Card 2: รายจ่าย (Expenses) */}
      <div className="min-w-0 bg-white border border-[#FECACA] rounded-2xl p-5 sm:p-6 flex sm:flex-col items-center sm:items-start gap-4 shadow-xs hover:border-[#FDA4AF] transition-colors">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 bg-[#FEE2E2] p-1 border border-[#FECACA]">
          <Illustration
            src="/illustrations/expense_hand_coin.jpg"
            alt="รายจ่าย"
            className="w-full h-full object-cover rounded-lg"
            width={96}
            height={96}
            aria-hidden="true"
          />
        </div>
        <div className="min-w-0 max-w-full flex-1">
          <span className="text-sm sm:text-base font-bold text-[#7C2D12]">
            รายจ่ายเดือนนี้
          </span>
          {isBalanceLoading ? (
            <div className="h-8 md:h-10 w-32 my-1 rounded-xl bg-slate-100 animate-pulse" />
          ) : (
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#7C2D12] break-words tabular-nums mt-0.5">
              {showBalance && monthlyExpense !== undefined
                ? fmtShortBaht(monthlyExpense)
                : "—"}
            </div>
          )}
          <span className="text-xs sm:text-sm font-semibold text-[#7C2D12] flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1">
            <span>
              {trendArrow(expenseTrend)} {trendValue(expenseTrend)}
            </span>
            <span className="text-xs text-slate-500 font-normal">
              จากเดือนที่แล้ว
            </span>
          </span>
        </div>
      </div>

      {/* Card 3: คงเหลือ (Net) */}
      <div
        className={`min-w-0 bg-white rounded-2xl p-5 sm:p-6 flex sm:flex-col items-center sm:items-start gap-4 border shadow-xs sm:col-span-2 lg:col-span-1 transition-colors ${isPositiveNet ? "border-[#DDE5F0] hover:border-[#12325C]" : "border-[#FECACA] hover:border-[#FDA4AF]"}`}
      >
        <div
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 bg-[#EDF1F7] p-1 border ${isPositiveNet ? "border-[#DDE5F0]" : "border-[#FECACA]"}`}
        >
          <Illustration
            src="/illustrations/balance_wallet.jpg"
            alt="คงเหลือ"
            className="w-full h-full object-cover rounded-lg"
            width={96}
            height={96}
            aria-hidden="true"
          />
        </div>
        <div className="min-w-0 max-w-full flex-1">
          <span className="text-sm sm:text-base font-bold text-[#475569]">
            คงเหลือสุทธิเดือนนี้
          </span>
          {isBalanceLoading ? (
            <div className="h-8 md:h-10 w-32 my-1 rounded-xl bg-slate-100 animate-pulse" />
          ) : (
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0C1B33] break-words tabular-nums mt-0.5">
              {showBalance && netMonthly !== undefined
                ? fmtShortBaht(netMonthly)
                : "—"}
            </div>
          )}
          <span
            className={`text-xs sm:text-sm font-semibold flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1 ${isPositiveNet ? "text-[#065F46]" : "text-[#7C2D12]"}`}
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
