import React from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { BackLink, EmptyState } from "@/components/common/CommonUI";

export default function MinistryDetail() {
  const [, setLocation] = useLocation();

  return (
    <AppLayout title="รายละเอียดฝ่ายงาน" subtitle="ตรวจสอบข้อมูลจากระบบ">
      <div className="max-w-3xl space-y-6">
        <BackLink
          label="กลับหน้ารวมฝ่ายงาน"
          onClick={() => setLocation("/ministries")}
        />
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
