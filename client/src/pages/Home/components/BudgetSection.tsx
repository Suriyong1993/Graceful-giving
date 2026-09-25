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
      className="bg-white rounded-2xl p-5 sm:p-6 border border-[#DDE5F0] shadow-xs space-y-4 w-full"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-bold text-[#0C1B33]">
          แผนการใช้จ่าย
        </h2>
        {canOpenReports && (
          <button
            onClick={onOpenReports}
            className="min-h-11 -mr-2 px-2 text-sm sm:text-base font-bold text-[#0F2947] hover:underline flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-[#12325C]"
          >
            <span>ดูรายงาน</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
      <p className="py-6 text-sm sm:text-base text-[#1E4470] font-bold">
        ยังไม่มีข้อมูลแผนการใช้จ่ายจากระบบ จึงยังไม่แสดงตัวเลขประมาณการ
      </p>
    </section>
  );
}
