import {
  BarChart3,
  ChevronRight,
  Eye,
  EyeOff,
  Info,
  Loader2,
} from "lucide-react";
import { Illustration } from "@/components/Illustration";

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
              className="size-11 shrink-0 inline-flex items-center justify-center text-[#523D2E] hover:text-[#2C1810] transition-colors rounded-full focus-visible:ring-2 focus-visible:ring-[#D47012]"
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
              /* Fluid, and never wrapping. The old fixed steps reached 96px,
                 which a seven-figure balance cannot fit beside the card's
                 illustration, and `break-words` then split the figure across
                 two lines mid-digit — "4,182,671." over "50" reads as two
                 different numbers. Scaling down is the only safe way for an
                 amount to lose an argument with its container. */
              className={`whitespace-nowrap text-[clamp(1.75rem,5.5vw,4.5rem)] font-black tracking-tight tabular-nums ${isPositiveBalance ? "text-[#155724]" : "text-[#9E2D12]"}`}
            >
              {showBalance && hasSummaryData ? fmtBaht(animatedBalance) : "—"}
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

          {canOpenReports && (
            <div className="pt-3">
              <button
                onClick={onOpenReports}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-[#FFF4DF] text-[#2C1810] text-sm sm:text-base font-black border-2 border-[#E9D9BF] transition-all focus-visible:ring-2 focus-visible:ring-[#D47012] shadow-xs hover:border-[#D47012]"
              >
                <BarChart3 className="w-5 h-5 text-[#D47012]" />
                <span>ดูรายละเอียด</span>
                <ChevronRight className="w-5 h-5 text-[#523D2E]" />
              </button>
            </div>
          )}
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
  );
}
