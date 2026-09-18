import React from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmptyState } from "@/components/common/CommonUI";
import { ArrowLeft } from "lucide-react";

export default function BudgetDetail() {
  const [, setLocation] = useLocation();

  return (
    <AppLayout title="รายละเอียดงบประมาณ" subtitle="ตรวจสอบข้อมูลจากระบบ">
      <div className="max-w-3xl space-y-6">
        <button
          type="button"
          onClick={() => setLocation("/budgets")}
          className="min-h-11 inline-flex items-center gap-2 text-sm font-medium text-[#70452E]"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับหน้ารวมงบประมาณ
        </button>
        <EmptyState
          title="ไม่พบรายละเอียดงบประมาณ"
          description="ยังไม่มี data source สำหรับรายละเอียดงบประมาณ จึงไม่แสดงตัวเลขหรือรายการจำลอง"
          actionText="กลับหน้ารวมงบประมาณ"
          onAction={() => setLocation("/budgets")}
        />
      </div>
    </AppLayout>
  );
}
