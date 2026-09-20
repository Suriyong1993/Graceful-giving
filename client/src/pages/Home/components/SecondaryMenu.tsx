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
          className="flex flex-col items-center justify-center min-h-[82px] sm:min-h-[96px] py-4 px-3 rounded-2xl sm:rounded-3xl bg-white border-2 border-[#E9D9BF] hover:border-[#8E44AD] transition-all hover:scale-102 focus-visible:ring-2 focus-visible:ring-[#8E44AD] shadow-xs"
          aria-label="รายงาน"
        >
          <FileBarChart className="w-7 h-7 stroke-[2.4] text-[#8E44AD] mb-1.5" />
          <span className="text-sm sm:text-base font-black text-[#2C1810] tracking-tight text-center">
            รายงาน
          </span>
        </button>
      )}

      {/* สมาชิก */}
      {canOpenMembers && (
        <button
          onClick={onOpenMembers}
          className="flex flex-col items-center justify-center min-h-[82px] sm:min-h-[96px] py-4 px-3 rounded-2xl sm:rounded-3xl bg-white border-2 border-[#E9D9BF] hover:border-[#D47012] transition-all hover:scale-102 focus-visible:ring-2 focus-visible:ring-[#D47012] shadow-xs"
          aria-label="สมาชิก"
        >
          <UsersRound className="w-7 h-7 stroke-[2.4] text-[#D47012] mb-1.5" />
          <span className="text-sm sm:text-base font-black text-[#2C1810] tracking-tight text-center">
            สมาชิก
          </span>
        </button>
      )}

      {/* กิจกรรม */}
      <button
        onClick={onOpenNews}
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
        onClick={onOpenWithdrawals}
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
  );
}
