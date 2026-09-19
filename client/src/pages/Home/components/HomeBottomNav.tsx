import {
  CircleUserRound, FileBarChart, Home as HomeIcon, Plus, ReceiptText,
} from "lucide-react";

type HomeTab = "home" | "ledger" | "reports" | "profile";

interface HomeBottomNavProps {
  activeTab: HomeTab;
  onTabChange: (tab: HomeTab) => void;
  onOpenOffering: () => void;
}

export function HomeBottomNav({ activeTab, onTabChange, onOpenOffering }: HomeBottomNavProps) {
  return (
    <nav
      aria-label="เมนูนำทางหลักบนมือถือ"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFF4DF]/95 backdrop-blur-md border-t border-[#E9D9BF] px-4 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-lg"
    >
      <div className="max-w-md mx-auto flex items-center justify-between relative">
        {/* 1. หน้าแรก */}
        <button
          onClick={() => onTabChange("home")}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2.5 rounded-2xl transition-all ${
            activeTab === "home"
              ? "bg-[#FBE9CD] text-[#70452E] font-bold shadow-2xs"
              : "text-[#927D6D] hover:text-[#70452E]"
          }`}
          aria-label="ไปที่หน้าแรก"
        >
          <HomeIcon className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[11px] mt-0.5 font-bold">หน้าแรก</span>
        </button>

        {/* 2. รายการ */}
        <button
          onClick={() => onTabChange("ledger")}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2.5 rounded-2xl transition-all ${
            activeTab === "ledger"
              ? "bg-[#FBE9CD] text-[#70452E] font-bold shadow-2xs"
              : "text-[#927D6D] hover:text-[#70452E]"
          }`}
          aria-label="ไปที่รายการการเงิน"
        >
          <ReceiptText className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[11px] mt-0.5 font-bold">รายการ</span>
        </button>

        {/* 3. CENTER PRIMARY FAB: WARM ORANGE '+' ELEVATED BUTTON */}
        <div className="relative -top-5 flex flex-col items-center">
          <button
            onClick={onOpenOffering}
            className="w-14 h-14 rounded-full bg-[#E99A4A] hover:bg-[#DE8640] text-white flex items-center justify-center clay-button-shadow transition-transform active:scale-95 border-3 border-white focus-visible:ring-2 focus-visible:ring-[#E99A4A]"
            aria-label="บันทึกการถวายใหม่ (เพิ่มรายการ)"
          >
            <Plus className="w-7 h-7 stroke-[2.8]" />
          </button>
          <span className="text-[11px] font-extrabold text-[#70452E] mt-0.5">
            เพิ่ม
          </span>
        </div>

        {/* 4. รายงาน */}
        <button
          onClick={() => onTabChange("reports")}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2.5 rounded-2xl transition-all ${
            activeTab === "reports"
              ? "bg-[#FBE9CD] text-[#70452E] font-bold shadow-2xs"
              : "text-[#927D6D] hover:text-[#70452E]"
          }`}
          aria-label="ไปที่หน้ารายงาน"
        >
          <FileBarChart className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[11px] mt-0.5 font-bold">รายงาน</span>
        </button>

        {/* 5. ฉัน */}
        <button
          onClick={() => onTabChange("profile")}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2.5 rounded-2xl transition-all ${
            activeTab === "profile"
              ? "bg-[#FBE9CD] text-[#70452E] font-bold shadow-2xs"
              : "text-[#927D6D] hover:text-[#70452E]"
          }`}
          aria-label="ไปที่หน้าฉัน (โปรไฟล์)"
        >
          <CircleUserRound className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[11px] mt-0.5 font-bold">ฉัน</span>
        </button>
      </div>

      {/* Script Brand Signature: "All for His Glory ♥" */}
      <div className="pt-1.5 text-center">
        <p className="font-script text-xs md:text-sm text-[#927D6D]/85 tracking-wide">
          All for His Glory ♥
        </p>
      </div>
    </nav>
  );
}
