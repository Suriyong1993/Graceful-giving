import React from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmptyState } from "@/components/common/CommonUI";
import { BarChart3, Plus } from "lucide-react";

export default function Budgets() {
  const [, setLocation] = useLocation();

  return (
    <AppLayout
      title="งบประมาณพันธกิจ"
      subtitle="ติดตามการใช้จ่ายจริงเทียบกับงบประมาณที่ได้รับอนุมัติ"
      action={
        <button
          type="button"
          onClick={() => setLocation("/expenses/new")}
          className="min-h-11 inline-flex items-center gap-2 rounded-2xl bg-[#E99A4A] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#D88939]"
        >
          <Plus className="h-4 w-4" />
          บันทึกรายจ่าย
        </button>
      }
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-[#E9D9BF] bg-[#FFF4DF] p-6 shadow-sm md:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-card p-3 text-[#E99A4A]">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#38251B]">แผนงบประมาณ</h1>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#70452E]/80">
                หน้านี้จะแสดงงบประมาณที่สร้างจากระบบจริงเมื่อมี budget data
                source พร้อมใช้งาน
              </p>
            </div>
          </div>
        </section>
        <EmptyState
          title="ยังไม่มีข้อมูลงบประมาณ"
          description="ระบบยังไม่มีรายการงบประมาณที่เชื่อมต่อกับหน้านี้ จึงยังไม่แสดงตัวเลขประมาณการ"
          actionText="ดูรายงานการเงิน"
          onAction={() => setLocation("/reports")}
        />
      </div>
    </AppLayout>
  );
}
