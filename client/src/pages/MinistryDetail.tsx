import React from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmptyState } from "@/components/common/CommonUI";
import { ArrowLeft } from "lucide-react";

export default function MinistryDetail() {
  const [, setLocation] = useLocation();

  return (
    <AppLayout title="รายละเอียดฝ่ายงาน" subtitle="ตรวจสอบข้อมูลจากระบบ">
      <div className="max-w-3xl space-y-6">
        <button
          type="button"
          onClick={() => setLocation("/ministries")}
          className="min-h-11 inline-flex items-center gap-2 text-sm font-medium text-[#70452E]"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับหน้ารวมฝ่ายงาน
        </button>
        <EmptyState
          title="ไม่พบรายละเอียดฝ่ายงาน"
          description="ยังไม่มี data source สำหรับรายละเอียดฝ่ายงาน สมาชิก หรือกิจกรรม จึงไม่แสดงข้อมูลจำลอง"
          actionText="กลับหน้ารวมฝ่ายงาน"
          onAction={() => setLocation("/ministries")}
        />
      </div>
    </AppLayout>
  );
}
