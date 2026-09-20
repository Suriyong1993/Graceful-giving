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
  );
}
