import React from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { BackLink, EmptyState } from "@/components/common/CommonUI";

export default function BudgetDetail() {
  const [, setLocation] = useLocation();

  return (
    <AppLayout title="รายละเอียดงบประมาณ" subtitle="ตรวจสอบข้อมูลจากระบบ">
      <div className="max-w-3xl space-y-6">
        <BackLink
          label="กลับหน้ารวมงบประมาณ"
          onClick={() => setLocation("/budgets")}
        />
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
