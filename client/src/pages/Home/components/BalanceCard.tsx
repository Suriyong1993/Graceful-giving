import { BarChart3, ChevronRight, Eye, EyeOff, Info } from "lucide-react";

interface BalanceCardProps {
  showBalance: boolean;
  setShowBalance: (show: boolean) => void;
  isPositiveBalance: boolean;
  isBalanceLoading: boolean;
  isDataUnavailable: boolean;
  summaryError: unknown;
  hasSummaryData: boolean;
  animatedBalance: number;
  canOpenReports: boolean;
  onOpenReports: () => void;
  fmtBaht: (n: number) => string;
}

export function BalanceCard({
  showBalance,
  setShowBalance,
  isPositiveBalance,
  isBalanceLoading,
  isDataUnavailable,
  summaryError,
  hasSummaryData,
  animatedBalance,
  canOpenReports,
  onOpenReports,
  fmtBaht,
}: BalanceCardProps) {
  return (
    <section
      aria-label="ยอดเงินคงเหลือรวม"
      style={{ animationDelay: "90ms" }}
      className={`animate-fade-up bg-white rounded-2xl p-6 sm:p-8 md:p-10 border relative overflow-hidden w-full ${isPositiveBalance ? "border-[#A8D59D] card-elevation-focus" : "border-[#F2C9BE] card-elevation-sm"}`}
    >
      <div className="flex items-center justify-between gap-6">
        {/* Left: Prominent financial figures */}
        <div className="min-w-0 flex-1 space-y-2 sm:space-y-3 z-10">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#171311]">
              ยอดเงินคงเหลือรวม
            </h2>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="size-11 shrink-0 inline-flex items-center justify-center text-[#3F3833] hover:text-[#171311] transition-colors rounded-full focus-visible:ring-2 focus-visible:ring-[#C94F16]"
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

            {isDataUnavailable && (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FFF8EA] border border-dashed border-[#F9D2AE] text-[#7F3A0D] text-xs sm:text-sm font-bold">
                <Info className="w-4 h-4" />
                {summaryError
                  ? "เชื่อมต่อข้อมูลไม่สำเร็จ"
                  : "ยังไม่มีข้อมูลการเงิน"}
              </span>
            )}
          </div>

          {isBalanceLoading ? (
            <div role="status" aria-live="polite">
              <span className="sr-only">กำลังโหลดยอดเงินคงเหลือ</span>
              <div
                className="h-12 sm:h-16 md:h-20 w-56 sm:w-80 rounded-2xl bg-[#EDE8E3] animate-pulse"
                aria-hidden="true"
              />
            </div>
          ) : (
            <div
              /* Fluid, and never wrapping. The old fixed steps reached 96px,
                 which a seven-figure balance cannot fit beside the card's
                 illustration, and `break-words` then split the figure across
                 two lines mid-digit — "4,182,671." over "50" reads as two
                 different numbers. Scaling down is the only safe way for an
                 amount to lose an argument with its container. */
              className={`whitespace-nowrap text-[clamp(1.75rem,5.5vw,4.5rem)] font-bold tracking-tight tabular-nums ${isPositiveBalance ? "text-[#155724]" : "text-[#9E2D12]"}`}
            >
              {showBalance && hasSummaryData ? fmtBaht(animatedBalance) : "—"}
            </div>
          )}

          <p className="text-sm sm:text-base md:text-lg text-[#3F3833] font-bold flex items-center gap-2 pt-1">
            {isBalanceLoading ? (
              <span
                className="block h-5 w-64 max-w-full rounded-md bg-[#EDE6D8] animate-pulse"
                aria-hidden="true"
              />
            ) : isPositiveBalance ? (
              <>
                <span>ขอบคุณพระเจ้าสำหรับทุกการถวาย</span>
                <span className="text-[#1F5C33] text-lg">♥</span>
              </>
            ) : (
              <span className="text-[#9E2D12] font-bold">
                ยอดคงเหลือติดลบ — ควรตรวจสอบรายจ่าย
              </span>
            )}
          </p>

          {canOpenReports && (
            <div className="pt-3">
              <button
                onClick={onOpenReports}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-[#FFF8EA] text-[#171311] text-sm sm:text-base font-bold border border-[#E7DCC8] transition-colors focus-visible:ring-2 focus-visible:ring-[#C94F16] shadow-2xs hover:border-[#C94F16]"
              >
                <BarChart3 className="w-4 h-4 text-[#C94F16]" />
                <span>ดูรายละเอียด</span>
                <ChevronRight className="w-4 h-4 text-[#3F3833]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
