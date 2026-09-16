import React from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmptyState } from "@/components/common/CommonUI";
import { ArrowLeft } from "lucide-react";

export default function MemberDetail() {
  const [, setLocation] = useLocation();
  return (
    <AppLayout title="รายละเอียดสมาชิก" subtitle="ตรวจสอบข้อมูลจากระบบ">
      <div className="max-w-3xl space-y-6">
        <button
          type="button"
          onClick={() => setLocation("/members")}
          className="min-h-11 inline-flex items-center gap-2 text-sm font-medium text-[#70452E]"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับหน้าสมาชิก
        </button>
        <EmptyState
          title="ไม่พบข้อมูลสมาชิก"
          description="ยังไม่มี members data source สำหรับรายละเอียดสมาชิกและประวัติการถวาย"
          actionText="กลับหน้าสมาชิก"
          onAction={() => setLocation("/members")}
        />
      </div>
    </AppLayout>
  );
}
