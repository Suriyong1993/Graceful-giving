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
          className="flex flex-col items-center justify-center min-h-[82px] sm:min-h-[96px] py-3.5 px-3 rounded-2xl bg-white border border-[#DDE5F0] hover:border-[#7C3AED] hover:bg-[#F5F3FF] transition-colors focus-visible:ring-2 focus-visible:ring-[#7C3AED] shadow-2xs"
          aria-label="รายงาน"
        >
          <FileBarChart className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2] text-[#7C3AED] mb-1.5" />
          <span className="text-xs sm:text-sm font-bold text-[#0C1B33] tracking-tight text-center">
            รายงาน
          </span>
        </button>
      )}

      {/* สมาชิก */}
      {canOpenMembers && (
        <button
          onClick={onOpenMembers}
          className="flex flex-col items-center justify-center min-h-[82px] sm:min-h-[96px] py-3.5 px-3 rounded-2xl bg-white border border-[#DDE5F0] hover:border-[#12325C] hover:bg-[#F6F8FC] transition-colors focus-visible:ring-2 focus-visible:ring-[#12325C] shadow-2xs"
          aria-label="สมาชิก"
        >
          <UsersRound className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2] text-[#12325C] mb-1.5" />
          <span className="text-xs sm:text-sm font-bold text-[#0C1B33] tracking-tight text-center">
            สมาชิก
          </span>
        </button>
      )}

      {/* กิจกรรม */}
      <button
        onClick={onOpenNews}
        className="flex flex-col items-center justify-center min-h-[82px] sm:min-h-[96px] py-3.5 px-3 rounded-2xl bg-white border border-[#DDE5F0] hover:border-[#DC2626] hover:bg-[#FEF2F2] transition-colors focus-visible:ring-2 focus-visible:ring-[#DC2626] shadow-2xs"
        aria-label="กิจกรรม"
      >
        <CalendarDays className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2] text-[#DC2626] mb-1.5" />
        <span className="text-xs sm:text-sm font-bold text-[#0C1B33] tracking-tight text-center">
          กิจกรรม
        </span>
      </button>

      {/* ขอเบิกเงิน */}
      <button
        onClick={onOpenWithdrawals}
        className="flex flex-col items-center justify-center min-h-[82px] sm:min-h-[96px] py-3.5 px-3 rounded-2xl bg-white border border-[#DDE5F0] hover:border-[#12325C] hover:bg-[#F6F8FC] transition-colors focus-visible:ring-2 focus-visible:ring-[#12325C] shadow-2xs"
        aria-label="ยื่นคำขอเบิกเงิน"
      >
        <Banknote className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2] text-[#12325C] mb-1.5" />
        <span className="text-xs sm:text-sm font-bold text-[#0C1B33] tracking-tight text-center">
          ขอเบิกเงิน
        </span>
      </button>

      {/* เพิ่มเติม */}
      <AppMenu>
        <button
          type="button"
          className="flex flex-col items-center justify-center min-h-[82px] sm:min-h-[96px] py-3.5 px-3 w-full rounded-2xl bg-white border border-[#DDE5F0] hover:border-[#1D4ED8] hover:bg-[#EFF6FF] transition-colors focus-visible:ring-2 focus-visible:ring-[#1D4ED8] shadow-2xs"
          aria-label="เพิ่มเติม"
        >
          <MoreHorizontal className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2] text-[#1D4ED8] mb-1.5" />
          <span className="text-xs sm:text-sm font-bold text-[#0C1B33] tracking-tight text-center">
            เพิ่มเติม
          </span>
        </button>
      </AppMenu>
    </section>
  );
}
