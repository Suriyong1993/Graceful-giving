import {
  BarChart3, Bell, CalendarDays, ChevronRight, Eye, EyeOff, FileBarChart,
  HandCoins, Heart, Info, Loader2, MoreHorizontal, ReceiptText, Sprout,
  UsersRound,
} from "lucide-react";
import { Illustration } from "@/components/Illustration";
import { AppMenu } from "@/components/layout/AppNavigation";
import type { TransactionItem } from "../types";
import { fmtBaht, fmtShortBaht, fmtThaiDate, trendArrow, trendValue } from "../utils";

type HomeTab = "home" | "ledger" | "reports" | "profile";

interface HomeDashboardTabProps {
  showBalance: boolean;
  onToggleBalance: () => void;
  isBalanceLoading: boolean;
  isDataUnavailable: boolean;
  summaryError: boolean;
  animatedBalance: number;
  isPositiveBalance: boolean;
  isPositiveNet: boolean;
  summaryData: { totalBalance: number } | null | undefined;
  netMonthly: number | undefined;
  monthlyIncome: number | undefined;
  monthlyExpense: number | undefined;
  incomeTrend: string;
  expenseTrend: string;
  allTransactions: TransactionItem[];
  onTabChange: (tab: HomeTab) => void;
  onOpenOffering: () => void;
  onOpenExpense: () => void;
  onOpenNews: () => void;
}

export function HomeDashboardTab({
  showBalance, onToggleBalance, isBalanceLoading, isDataUnavailable,
  summaryError, animatedBalance, isPositiveBalance, isPositiveNet,
  summaryData, netMonthly, monthlyIncome, monthlyExpense,
  incomeTrend, expenseTrend, allTransactions,
  onTabChange, onOpenOffering, onOpenExpense, onOpenNews,
}: HomeDashboardTabProps) {
  return (
    <div className="space-y-5 md:space-y-7">
      {/* â”€â”€â”€ 1. HERO SECTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section
        aria-label="Grace-giving à¸ªà¹ˆà¸§à¸™à¸•à¹‰à¸­à¸™à¸£à¸±à¸š"
        className="animate-fade-up relative rounded-[28px] md:rounded-[32px] overflow-hidden bg-gradient-to-b md:bg-gradient-to-br from-[#FFFDF8] via-[#FFF8EC] to-[#FFF3DE] border border-[#E9D9BF] shadow-sm p-3.5 sm:p-5 md:p-7"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 md:w-56 md:h-56 rounded-full bg-[#A8C978]/15 blur-3xl"
        />
        <div className="absolute top-3 right-3 md:top-4 md:right-4 z-20">
          <button
            onClick={onOpenNews}
            className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full bg-white/95 border border-[#E9D9BF] shadow-xs flex items-center justify-center text-[#70452E] hover:bg-white transition-all relative focus-visible:ring-2 focus-visible:ring-[#E99A4A]"
            aria-label="à¸à¸²à¸£à¹à¸ˆà¹‰à¸‡à¹€à¸•à¸·à¸­à¸™à¹à¸¥à¸°à¸‚à¹ˆà¸²à¸§à¸ªà¸²à¸£à¸„à¸£à¸´à¸ªà¸•à¸ˆà¸±à¸à¸£"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-[#70452E]" />
            <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#E06250] ring-2 ring-white" />
          </button>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-12 gap-3 sm:gap-5 items-center relative z-10">
          <div className="min-w-0 md:col-span-7 space-y-1.5 sm:space-y-3.5">
            <h1 className="flex flex-col">
              <span className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-2xl sm:text-5xl md:text-6xl font-black text-[#38251B] tracking-tight leading-none font-display">Grace</span>
                <span className="text-[#A8C978] -mt-1.5 sm:-mt-4">
                  <Sprout className="w-5 h-5 sm:w-10 sm:h-10 stroke-[2.5]" />
                </span>
              </span>
              <span className="text-2xl sm:text-5xl md:text-6xl font-black text-[#E99A4A] tracking-tight leading-none font-display">Ledger</span>
            </h1>
            <p className="hidden sm:block text-sm md:text-base font-bold text-[#38251B]/90">
              à¸à¸²à¸£à¹€à¸‡à¸´à¸™à¹€à¸Šà¸·à¹ˆà¸­à¸¡à¹ƒà¸ˆ à¹€à¸žà¸·à¹ˆà¸­à¸žà¸±à¸™à¸˜à¸à¸´à¸ˆà¸‚à¸­à¸‡à¸žà¸£à¸°à¹€à¸ˆà¹‰à¸²
            </p>
            <div className="inline-flex flex-nowrap items-center gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full sm:rounded-2xl bg-white/95 border border-[#E9D9BF] text-[11px] sm:text-xs leading-relaxed text-[#70452E] max-w-full">
              <span className="whitespace-nowrap font-extrabold text-[#E99A4A] shrink-0">2 à¹‚à¸„à¸£à¸´à¸™à¸˜à¹Œ 9:7</span>
              <span className="text-[#70452E] font-medium truncate">"à¸œà¸¹à¹‰à¹ƒà¸«à¹‰à¸”à¹‰à¸§à¸¢à¹ƒà¸ˆà¸¢à¸´à¸™à¸”à¸µ à¸žà¸£à¸°à¹€à¸ˆà¹‰à¸²à¸—à¸£à¸‡à¸£à¸±à¸"</span>
            </div>
          </div>
          <div className="min-w-0 flex items-center justify-center md:col-span-5 md:flex-col md:justify-center md:gap-3 md:pt-10">
            <div className="hidden md:block w-full max-w-56 bg-white/95 backdrop-blur-xs p-3.5 rounded-2xl border border-[#E9D9BF] text-xs space-y-1.5">
              <p className="text-[#70452E] font-medium leading-relaxed">à¸—à¸¸à¸à¸ªà¸´à¹ˆà¸‡à¸—à¸µà¹ˆà¸—à¹ˆà¸²à¸™à¹ƒà¸«à¹‰à¹€à¸žà¸·à¹ˆà¸­à¸à¸²à¸£à¸‡à¸²à¸™à¸‚à¸­à¸‡à¸žà¸£à¸°à¹€à¸ˆà¹‰à¸² à¸¢à¹ˆà¸­à¸¡à¹€à¸à¸´à¸”à¸œà¸¥à¹€à¸ªà¸¡à¸­</p>
              <div className="flex items-center justify-between pt-1 border-t border-[#E9D9BF]/50">
                <span className="text-[10px] text-[#927D6D] font-bold">1 à¹‚à¸„à¸£à¸´à¸™à¸˜à¹Œ 15:58</span>
                <span className="text-[#A8C978]">ðŸŒ±</span>
              </div>
            </div>
            <div className="relative w-24 h-28 sm:w-40 sm:h-52 md:w-full md:max-w-64 md:h-72 rounded-2xl sm:rounded-[28px] overflow-hidden shadow-xs border-2 border-white shrink-0 bg-[#FFF4DF]">
              <Illustration
                src="/illustrations/hero_jesus_shepherd.jpg"
                alt="à¸žà¸£à¸°à¹€à¸¢à¸‹à¸¹à¸„à¸£à¸´à¸ªà¸•à¹Œà¹à¸¥à¸°à¸¥à¸¹à¸à¹à¸à¸°"
                className="w-full h-full object-cover object-[center_20%] hover:scale-104 transition-transform duration-500"
                priority
                width={224}
                height={256}
              />
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€â”€ 2. BALANCE CARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section
        aria-label="à¸¢à¸­à¸”à¹€à¸‡à¸´à¸™à¸„à¸‡à¹€à¸«à¸¥à¸·à¸­à¸£à¸§à¸¡"
        style={{ animationDelay: "90ms" }}
        className={`animate-fade-up bg-gradient-to-br from-white via-white to-[#F7FBF4] rounded-[30px] p-5 md:p-7 border relative overflow-hidden ${isPositiveBalance ? "border-[#DCECC5]/90" : "border-[#F2C9BE]"} ${isPositiveBalance ? "clay-balance-glow" : "clay-card-shadow"}`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-1.5 z-10">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm md:text-base font-bold text-[#38251B]">
                à¸¢à¸­à¸”à¹€à¸‡à¸´à¸™à¸„à¸‡à¹€à¸«à¸¥à¸·à¸­à¸£à¸§à¸¡
              </h2>
              <button
                onClick={onToggleBalance}
                className="text-[#927D6D] hover:text-[#70452E] transition-colors p-1 rounded-full focus-visible:ring-2 focus-visible:ring-[#E99A4A]"
                aria-label={showBalance ? "à¸‹à¹ˆà¸­à¸™à¸¢à¸­à¸”à¹€à¸‡à¸´à¸™" : "à¹à¸ªà¸”à¸‡à¸¢à¸­à¸”à¹€à¸‡à¸´à¸™"}
                aria-pressed={!showBalance}
              >
                {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              {isBalanceLoading && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F0EAF8] text-[#7D3C98] text-[10px] font-bold">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  à¸à¸³à¸¥à¸±à¸‡à¹‚à¸«à¸¥à¸”à¸‚à¹‰à¸­à¸¡à¸¹à¸¥
                </span>
              )}
              {isDataUnavailable && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFF3DF] border border-dashed border-[#E9C179] text-[#946A1E] text-[10px] font-bold">
                  <Info className="w-3 h-3" />
                  {summaryError ? "à¹€à¸Šà¸·à¹ˆà¸­à¸¡à¸•à¹ˆà¸­à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹„à¸¡à¹ˆà¸ªà¸³à¹€à¸£à¹‡à¸ˆ" : "à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸à¸²à¸£à¹€à¸‡à¸´à¸™"}
                </span>
              )}
            </div>
            {isBalanceLoading ? (
              <div
                className="h-9 sm:h-11 md:h-12 w-44 sm:w-56 rounded-xl bg-[#EDE6D8] animate-pulse"
                aria-hidden="true"
              />
            ) : (
              <div
                className={`break-words text-3xl sm:text-4xl md:text-5xl font-black tracking-tight tabular-nums ${isPositiveBalance ? "text-[#1b5e3a]" : "text-[#B3261E]"}`}
              >
                {showBalance && summaryData ? fmtBaht(animatedBalance) : "â€”"}
              </div>
            )}
            <p className="text-xs text-[#5E4C3E] font-medium flex items-center gap-1 pt-0.5">
              {isBalanceLoading ? (
                <span>à¸à¸³à¸¥à¸±à¸‡à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¸¢à¸­à¸”à¹€à¸‡à¸´à¸™à¸¥à¹ˆà¸²à¸ªà¸¸à¸”â€¦</span>
              ) : isPositiveBalance ? (
                <>
                  <span>à¸‚à¸­à¸šà¸„à¸¸à¸“à¸žà¸£à¸°à¹€à¸ˆà¹‰à¸²à¸ªà¸³à¸«à¸£à¸±à¸šà¸—à¸¸à¸à¸à¸²à¸£à¸–à¸§à¸²à¸¢</span>
                  <span className="text-[#A8C978]">â™¥</span>
                </>
              ) : (
                <span className="text-[#B3261E] font-semibold">
                  à¸¢à¸­à¸”à¸„à¸‡à¹€à¸«à¸¥à¸·à¸­à¸•à¸´à¸”à¸¥à¸š â€” à¸„à¸§à¸£à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¸£à¸²à¸¢à¸ˆà¹ˆà¸²à¸¢
                </span>
              )}
            </p>
            <div className="pt-2">
              <button
                onClick={() => onTabChange("reports")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FFF4DF] hover:bg-[#FBE9CD] text-[#70452E] text-xs font-bold border border-[#E9D9BF] transition-all focus-visible:ring-2 focus-visible:ring-[#E99A4A]"
              >
                <BarChart3 className="w-3.5 h-3.5 text-[#E99A4A]" />
                <span>à¸”à¸¹à¸£à¸²à¸¢à¸¥à¸°à¹€à¸­à¸µà¸¢à¸”</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#927D6D]" />
              </button>
            </div>
          </div>
          <div className="hidden sm:block shrink-0 z-10">
            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-[24px] overflow-hidden border border-[#E9D9BF]/80 bg-[#FFF8EB] p-1">
              <Illustration
                src="/illustrations/balance_wallet.jpg"
                alt="à¸à¸£à¸°à¹€à¸›à¹‹à¸²à¸ªà¸•à¸²à¸‡à¸„à¹Œà¸¢à¸­à¸”à¸„à¸‡à¹€à¸«à¸¥à¸·à¸­"
                className="w-full h-full object-cover rounded-[20px]"
                width={112}
                height={112}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€â”€ 3. FINANCIAL SUMMARY CARDS â”€â”€ */}
      <section
        aria-label="à¸ªà¸£à¸¸à¸›à¸•à¸±à¸§à¹€à¸¥à¸‚à¸à¸²à¸£à¹€à¸‡à¸´à¸™à¸£à¸²à¸¢à¹€à¸”à¸·à¸­à¸™"
        style={{ animationDelay: "160ms" }}
        className="animate-fade-up grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4"
      >
        <div className="min-w-0 bg-[#EAF5E4] border border-[#D2EAC7] rounded-[28px] p-4 md:p-5 flex sm:flex-col items-center sm:items-start gap-3.5">
          <div className="w-[76px] h-[76px] md:w-[84px] md:h-[84px] rounded-[22px] overflow-hidden shrink-0 bg-white/95 p-1 border border-[#D2EAC7]">
            <Illustration src="/illustrations/income_hand_heart.jpg" alt="à¸£à¸²à¸¢à¸£à¸±à¸š" className="w-full h-full object-cover rounded-[18px]" width={84} height={84} aria-hidden="true" />
          </div>
          <div className="min-w-0 max-w-full flex-1">
            <span className="text-sm font-bold text-[#70452E]">à¸£à¸²à¸¢à¸£à¸±à¸š</span>
            {isBalanceLoading ? (
              <div className="h-7 md:h-8 w-24 my-0.5 rounded-lg bg-white/70 animate-pulse" />
            ) : (
              <div className="text-2xl md:text-3xl font-black text-[#38251B] break-words tabular-nums">
                {showBalance && monthlyIncome !== undefined ? fmtShortBaht(monthlyIncome) : "â€”"}
              </div>
            )}
            <span className="text-xs font-bold text-[#4F8B33] flex flex-wrap items-center gap-x-1 gap-y-0.5">
              <span>{trendArrow(incomeTrend)} {trendValue(incomeTrend)}</span>
              <span className="text-[11px] text-[#6B5A4C] font-medium">à¸ˆà¸²à¸à¹€à¸”à¸·à¸­à¸™à¸—à¸µà¹ˆà¹à¸¥à¹‰à¸§</span>
            </span>
          </div>
        </div>
        <div className="min-w-0 bg-[#FDEDE3] border border-[#F6D3B8] rounded-[28px] p-4 md:p-5 flex sm:flex-col items-center sm:items-start gap-3.5">
          <div className="w-[76px] h-[76px] md:w-[84px] md:h-[84px] rounded-[22px] overflow-hidden shrink-0 bg-white/95 p-1 border border-[#F6D3B8]">
            <Illustration src="/illustrations/expense_hand_coin.jpg" alt="à¸£à¸²à¸¢à¸ˆà¹ˆà¸²à¸¢" className="w-full h-full object-cover rounded-[18px]" width={84} height={84} aria-hidden="true" />
          </div>
          <div className="min-w-0 max-w-full flex-1">
            <span className="text-sm font-bold text-[#70452E]">à¸£à¸²à¸¢à¸ˆà¹ˆà¸²à¸¢</span>
            {isBalanceLoading ? (
              <div className="h-7 md:h-8 w-24 my-0.5 rounded-lg bg-white/70 animate-pulse" />
            ) : (
              <div className="text-2xl md:text-3xl font-black text-[#38251B] break-words tabular-nums">
                {showBalance && monthlyExpense !== undefined ? fmtShortBaht(monthlyExpense) : "â€”"}
              </div>
            )}
            <span className="text-xs font-bold text-[#B3541E] flex flex-wrap items-center gap-x-1 gap-y-0.5">
              <span>{trendArrow(expenseTrend)} {trendValue(expenseTrend)}</span>
              <span className="text-[11px] text-[#6B5A4C] font-medium">à¸ˆà¸²à¸à¹€à¸”à¸·à¸­à¸™à¸—à¸µà¹ˆà¹à¸¥à¹‰à¸§</span>
            </span>
          </div>
        </div>
        <div className={`min-w-0 rounded-[28px] p-4 md:p-5 flex sm:flex-col items-center sm:items-start gap-3.5 border ${isPositiveNet ? "bg-[#FFF8EB] border-[#FBE9CD]" : "bg-[#FDEBE8] border-[#F2C9BE]"}`}>
          <div className={`w-[76px] h-[76px] md:w-[84px] md:h-[84px] rounded-[22px] overflow-hidden shrink-0 bg-white/95 p-1 border ${isPositiveNet ? "border-[#FBE9CD]" : "border-[#F2C9BE]"}`}>
            <Illustration src="/illustrations/balance_wallet.jpg" alt="à¸„à¸‡à¹€à¸«à¸¥à¸·à¸­" className="w-full h-full object-cover rounded-[18px]" width={84} height={84} aria-hidden="true" />
          </div>
          <div className="min-w-0 max-w-full flex-1">
            <span className="text-sm font-bold text-[#70452E]">à¸„à¸‡à¹€à¸«à¸¥à¸·à¸­</span>
            {isBalanceLoading ? (
              <div className="h-7 md:h-8 w-24 my-0.5 rounded-lg bg-white/70 animate-pulse" />
            ) : (
              <div className="text-2xl md:text-3xl font-black text-[#38251B] break-words tabular-nums">
                {showBalance && netMonthly !== undefined ? fmtShortBaht(netMonthly) : "â€”"}
              </div>
            )}
            <span className={`text-xs font-bold flex flex-wrap items-center gap-x-1 gap-y-0.5 ${isPositiveNet ? "text-[#4F8B33]" : "text-[#B3261E]"}`}>
              <span>{isPositiveNet ? "à¸£à¸²à¸¢à¸£à¸±à¸šà¸¡à¸²à¸à¸à¸§à¹ˆà¸²à¸£à¸²à¸¢à¸ˆà¹ˆà¸²à¸¢" : "à¸£à¸²à¸¢à¸ˆà¹ˆà¸²à¸¢à¸¡à¸²à¸à¸à¸§à¹ˆà¸²à¸£à¸²à¸¢à¸£à¸±à¸š"}</span>
            </span>
          </div>
        </div>
      </section>

      {/* â”€â”€â”€ 4a. PRIMARY ACTIONS â”€â”€ */}
      <section aria-label="à¸à¸²à¸£à¸”à¸³à¹€à¸™à¸´à¸™à¸à¸²à¸£à¸«à¸¥à¸±à¸" style={{ animationDelay: "230ms" }} className="animate-fade-up grid grid-cols-2 gap-3 md:gap-4">
        <button onClick={onOpenOffering} className="flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-2xl bg-[#4F8B33] hover:bg-[#436F2B] text-white font-bold text-sm sm:text-base clay-button-shadow transition-all focus-visible:ring-2 focus-visible:ring-[#4F8B33] focus-visible:ring-offset-2" aria-label="à¸šà¸±à¸™à¸—à¸¶à¸à¸à¸²à¸£à¸–à¸§à¸²à¸¢">
          <HandCoins className="w-5 h-5 stroke-[2.2]" /><span>à¸šà¸±à¸™à¸—à¸¶à¸à¸à¸²à¸£à¸–à¸§à¸²à¸¢</span>
        </button>
        <button onClick={onOpenExpense} className="flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-2xl bg-[#C26B1E] hover:bg-[#A85B18] text-white font-bold text-sm sm:text-base clay-button-shadow transition-all focus-visible:ring-2 focus-visible:ring-[#C26B1E] focus-visible:ring-offset-2" aria-label="à¸šà¸±à¸™à¸—à¸¶à¸à¸£à¸²à¸¢à¸ˆà¹ˆà¸²à¸¢">
          <ReceiptText className="w-5 h-5 stroke-[2.2]" /><span>à¸šà¸±à¸™à¸—à¸¶à¸à¸£à¸²à¸¢à¸ˆà¹ˆà¸²à¸¢</span>
        </button>
      </section>

      {/* â”€â”€â”€ 4b. SECONDARY MENU â”€â”€ */}
      <section aria-label="à¹€à¸¡à¸™à¸¹à¸¥à¸±à¸”à¸­à¸·à¹ˆà¸™ à¹†" className="grid grid-cols-4 gap-2 md:gap-3">
        <button onClick={() => onTabChange("reports")} className="flex flex-col items-center justify-center py-3 rounded-2xl bg-[#FAF6EE] border border-[#EDE2CE] hover:border-[#C39BD3] transition-colors focus-visible:ring-2 focus-visible:ring-[#C39BD3]" aria-label="à¸£à¸²à¸¢à¸‡à¸²à¸™">
          <FileBarChart className="w-5 h-5 stroke-[2] text-[#7D3C98]/80 mb-1" />
          <span className="text-[11px] font-semibold text-[#70452E]/85 tracking-tight text-center">à¸£à¸²à¸¢à¸‡à¸²à¸™</span>
        </button>
        <button onClick={() => {}} className="flex flex-col items-center justify-center py-3 rounded-2xl bg-[#FAF6EE] border border-[#EDE2CE] hover:border-[#E99A4A] transition-colors focus-visible:ring-2 focus-visible:ring-[#E99A4A]" aria-label="à¸ªà¸¡à¸²à¸Šà¸´à¸">
          <UsersRound className="w-5 h-5 stroke-[2] text-[#C26B1E]/80 mb-1" />
          <span className="text-[11px] font-semibold text-[#70452E]/85 tracking-tight text-center">à¸ªà¸¡à¸²à¸Šà¸´à¸</span>
        </button>
        <button onClick={onOpenNews} className="flex flex-col items-center justify-center py-3 rounded-2xl bg-[#FAF6EE] border border-[#EDE2CE] hover:border-[#F7B6A6] transition-colors focus-visible:ring-2 focus-visible:ring-[#F7B6A6]" aria-label="à¸à¸´à¸ˆà¸à¸£à¸£à¸¡">
          <CalendarDays className="w-5 h-5 stroke-[2] text-[#D45945]/80 mb-1" />
          <span className="text-[11px] font-semibold text-[#70452E]/85 tracking-tight text-center">à¸à¸´à¸ˆà¸à¸£à¸£à¸¡</span>
        </button>
        <AppMenu>
          <button type="button" className="flex flex-col items-center justify-center py-3 w-full rounded-2xl bg-[#FAF6EE] border border-[#EDE2CE] hover:border-[#A9D4ED] transition-colors focus-visible:ring-2 focus-visible:ring-[#A9D4ED]" aria-label="à¹€à¸žà¸´à¹ˆà¸¡à¹€à¸•à¸´à¸¡">
            <MoreHorizontal className="w-5 h-5 stroke-[2] text-[#5B7B94]/80 mb-1" />
            <span className="text-[11px] font-semibold text-[#70452E]/85 tracking-tight text-center">à¹€à¸žà¸´à¹ˆà¸¡à¹€à¸•à¸´à¸¡</span>
          </button>
        </AppMenu>
      </section>


      {/* â”€â”€â”€ 5. CHURCH NEWS CARD â”€â”€ */}
      <section aria-label="à¸‚à¹ˆà¸²à¸§à¸ªà¸²à¸£à¸ˆà¸²à¸à¸„à¸£à¸´à¸ªà¸•à¸ˆà¸±à¸à¸£">
        <div onClick={onOpenNews} className="cursor-pointer bg-gradient-to-r from-[#FFFDF8] via-[#FFF8EC] to-[#FFF1DE] border border-[#E9D9BF] rounded-[28px] p-4 md:p-5 flex items-center justify-between gap-4 hover:border-[#E99A4A] transition-all" role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") onOpenNews(); }} aria-label="à¹€à¸›à¸´à¸”à¸”à¸¹à¸‚à¹ˆà¸²à¸§à¸ªà¸²à¸£à¸ˆà¸²à¸à¸„à¸£à¸´à¸ªà¸•à¸ˆà¸±à¸à¸£">
          <div className="flex items-center gap-3.5">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden shrink-0 bg-white p-1 border border-[#E9D9BF]">
              <Illustration src="/illustrations/bible_cross.jpg" alt="à¸žà¸£à¸°à¸„à¸±à¸¡à¸ à¸µà¸£à¹Œà¹à¸¥à¸°à¸à¸²à¸‡à¹€à¸‚à¸™" className="w-full h-full object-cover rounded-xl" width={80} height={80} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-[#38251B]">à¸‚à¹ˆà¸²à¸§à¸ªà¸²à¸£à¸ˆà¸²à¸à¸„à¸£à¸´à¸ªà¸•à¸ˆà¸±à¸à¸£</h2>
              <p className="text-xs text-[#927D6D]">à¸•à¸´à¸”à¸•à¸²à¸¡à¸›à¸£à¸°à¸à¸²à¸¨ à¸à¸´à¸ˆà¸à¸£à¸£à¸¡ à¹à¸¥à¸°à¸žà¸±à¸™à¸˜à¸à¸´à¸ˆà¸•à¹ˆà¸²à¸‡ à¹†</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#927D6D] border border-[#E9D9BF]/80 shrink-0">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </section>

      {/* â”€â”€â”€ 6. BUDGET SECTION â”€â”€ */}
      <section aria-label="à¹à¸œà¸™à¸à¸²à¸£à¹ƒà¸Šà¹‰à¸ˆà¹ˆà¸²à¸¢à¸‡à¸šà¸›à¸£à¸°à¸¡à¸²à¸“" className="bg-white rounded-[28px] p-5 md:p-6 border border-[#E9D9BF]/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base md:text-lg font-bold text-[#38251B]">à¹à¸œà¸™à¸à¸²à¸£à¹ƒà¸Šà¹‰à¸ˆà¹ˆà¸²à¸¢</h2>
          <button onClick={() => onTabChange("reports")} className="text-xs md:text-sm font-bold text-[#E99A4A] hover:underline flex items-center gap-0.5 focus-visible:ring-2 focus-visible:ring-[#E99A4A]">
            <span>à¸”à¸¹à¸£à¸²à¸¢à¸‡à¸²à¸™</span><ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <p className="py-5 text-sm text-[#927D6D]">à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹à¸œà¸™à¸à¸²à¸£à¹ƒà¸Šà¹‰à¸ˆà¹ˆà¸²à¸¢à¸ˆà¸²à¸à¸£à¸°à¸šà¸š à¸ˆà¸¶à¸‡à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¹à¸ªà¸”à¸‡à¸•à¸±à¸§à¹€à¸¥à¸‚à¸›à¸£à¸°à¸¡à¸²à¸“à¸à¸²à¸£</p>
      </section>

      {/* â”€â”€â”€ 7. RECENT TRANSACTIONS SECTION â”€â”€ */}
      <section aria-label="à¸£à¸²à¸¢à¸à¸²à¸£à¸˜à¸¸à¸£à¸à¸£à¸£à¸¡à¸¥à¹ˆà¸²à¸ªà¸¸à¸”" className="bg-white rounded-[28px] p-5 md:p-6 border border-[#E9D9BF]/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base md:text-lg font-bold text-[#38251B]">à¸£à¸²à¸¢à¸à¸²à¸£à¸¥à¹ˆà¸²à¸ªà¸¸à¸”</h2>
          <button onClick={() => onTabChange("ledger")} className="text-xs md:text-sm font-bold text-[#E99A4A] hover:underline flex items-center gap-0.5 focus-visible:ring-2 focus-visible:ring-[#E99A4A]">
            <span>à¸”à¸¹à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”</span><ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="divide-y divide-[#F0E6D8]/60">
          {allTransactions.length === 0 && (
            <p className="py-8 text-center text-sm text-[#927D6D]">à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸£à¸²à¸¢à¸à¸²à¸£à¸˜à¸¸à¸£à¸à¸£à¸£à¸¡à¸¥à¹ˆà¸²à¸ªà¸¸à¸”à¸ˆà¸²à¸à¸£à¸°à¸šà¸š</p>
          )}
          {allTransactions.slice(0, 4).map(tx => {
            const IconComponent = tx.icon || Heart;
            const isIncome = tx.type === "income";
            return (
              <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-full ${tx.tone} flex items-center justify-center shrink-0`}>
                    <IconComponent className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#38251B] leading-tight truncate">{tx.title}</p>
                    <p className="text-[11px] text-[#7A6656] font-medium pt-0.5">{typeof tx.date === "string" ? tx.date : fmtThaiDate(tx.date)}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm md:text-base font-black ${isIncome ? "text-[#1b5e3a]" : "text-[#c7382d]"}`}>
                    {isIncome ? "+" : "-"}{fmtBaht(tx.amount)}
                  </p>
                  <p className="text-[11px] text-[#7A6656] font-medium">{tx.subCategory}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
