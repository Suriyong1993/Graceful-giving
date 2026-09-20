import { ChevronRight } from "lucide-react";

interface BudgetSectionProps {
  canOpenReports: boolean;
  onOpenReports: () => void;
}

export function BudgetSection({
  canOpenReports,
  onOpenReports,
}: BudgetSectionProps) {
  return (
    <section
      aria-label="แผนการใช้จ่ายงบประมาณ"
      className="bg-white rounded-[28px] sm:rounded-[36px] p-6 sm:p-8 border-2 border-[#E9D9BF] shadow-xs space-y-4 w-full"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-black text-[#2C1810]">
          แผนการใช้จ่าย
        </h2>
        {canOpenReports && (
          <button
            onClick={onOpenReports}
            className="min-h-11 -mr-2 px-2 text-sm sm:text-base font-black text-[#B85E0E] hover:underline flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-[#D47012]"
          >
            <span>ดูรายงาน</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
      <p className="py-6 text-sm sm:text-base text-[#4A2E1B] font-bold">
        ยังไม่มีข้อมูลแผนการใช้จ่ายจากระบบ จึงยังไม่แสดงตัวเลขประมาณการ
      </p>
    </section>
  );
}
