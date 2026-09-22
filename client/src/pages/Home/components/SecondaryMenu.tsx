import {
  Banknote,
  CalendarDays,
  FileBarChart,
  MoreHorizontal,
  UsersRound,
} from "lucide-react";
import { AppMenu } from "@/components/layout/AppNavigation";

interface SecondaryMenuProps {
  canOpenReports: boolean;
  canOpenMembers: boolean;
  secondaryTileColsClass: string;
  onOpenReports: () => void;
  onOpenMembers: () => void;
  onOpenNews: () => void;
  onOpenWithdrawals: () => void;
}

export function SecondaryMenu({
  canOpenReports,
  canOpenMembers,
  secondaryTileColsClass,
  onOpenReports,
  onOpenMembers,
  onOpenNews,
  onOpenWithdrawals,
}: SecondaryMenuProps) {
  return (
    <section
      aria-label="เมนูลัดอื่น ๆ"
      className={`grid grid-cols-3 gap-3 sm:gap-4 md:gap-5 w-full ${secondaryTileColsClass}`}
    >
      {/* รายงาน */}
      {canOpenReports && (
        <button
          onClick={onOpenReports}
          className="flex flex-col items-center justify-center min-h-[82px] sm:min-h-[96px] py-3.5 px-3 rounded-2xl bg-card border border-line hover:border-ink-3 hover:bg-page transition-colors focus-visible:ring-2 focus-visible:ring-ink-3 shadow-2xs"
          aria-label="รายงาน"
        >
          <FileBarChart className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2] text-ink-3 mb-1.5" />
          <span className="text-xs sm:text-sm font-bold text-ink tracking-tight text-center">
            รายงาน
          </span>
        </button>
      )}

      {/* สมาชิก */}
      {canOpenMembers && (
        <button
          onClick={onOpenMembers}
          className="flex flex-col items-center justify-center min-h-[82px] sm:min-h-[96px] py-3.5 px-3 rounded-2xl bg-card border border-line hover:border-brand hover:bg-page transition-colors focus-visible:ring-2 focus-visible:ring-brand shadow-2xs"
          aria-label="สมาชิก"
        >
          <UsersRound className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2] text-brand mb-1.5" />
          <span className="text-xs sm:text-sm font-bold text-ink tracking-tight text-center">
            สมาชิก
          </span>
        </button>
      )}

      {/* กิจกรรม */}
      <button
        onClick={onOpenNews}
        className="flex flex-col items-center justify-center min-h-[82px] sm:min-h-[96px] py-3.5 px-3 rounded-2xl bg-card border border-line hover:border-danger hover:bg-danger-soft transition-colors focus-visible:ring-2 focus-visible:ring-danger shadow-2xs"
        aria-label="กิจกรรม"
      >
        <CalendarDays className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2] text-danger mb-1.5" />
        <span className="text-xs sm:text-sm font-bold text-ink tracking-tight text-center">
          กิจกรรม
        </span>
      </button>

      {/* ขอเบิกเงิน */}
      <button
        onClick={onOpenWithdrawals}
        className="flex flex-col items-center justify-center min-h-[82px] sm:min-h-[96px] py-3.5 px-3 rounded-2xl bg-card border border-line hover:border-brand hover:bg-page transition-colors focus-visible:ring-2 focus-visible:ring-brand shadow-2xs"
        aria-label="ยื่นคำขอเบิกเงิน"
      >
        <Banknote className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2] text-brand mb-1.5" />
        <span className="text-xs sm:text-sm font-bold text-ink tracking-tight text-center">
          ขอเบิกเงิน
        </span>
      </button>

      {/* เพิ่มเติม */}
      <AppMenu>
        <button
          type="button"
          className="flex flex-col items-center justify-center min-h-[82px] sm:min-h-[96px] py-3.5 px-3 w-full rounded-2xl bg-card border border-line hover:border-info hover:bg-info-soft transition-colors focus-visible:ring-2 focus-visible:ring-info shadow-2xs"
          aria-label="เพิ่มเติม"
        >
          <MoreHorizontal className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2] text-info mb-1.5" />
          <span className="text-xs sm:text-sm font-bold text-ink tracking-tight text-center">
            เพิ่มเติม
          </span>
        </button>
      </AppMenu>
    </section>
  );
}
