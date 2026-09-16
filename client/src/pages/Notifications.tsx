import React from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmptyState } from "@/components/common/CommonUI";
import { Bell } from "lucide-react";

export default function Notifications() {
  const [, setLocation] = useLocation();
  return (
    <AppLayout
      title="การแจ้งเตือน"
      subtitle="การแจ้งเตือนจะแสดงจากฐานข้อมูลจริงเมื่อระบบ notification พร้อมใช้งาน"
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-[#E9D9BF] bg-[#FFF4DF] p-6 shadow-sm md:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white p-3 text-[#E99A4A]">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#38251B]">
                ศูนย์การแจ้งเตือน
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-[#70452E]/80">
                สถานะอ่านแล้วจะถูกบันทึกในฐานข้อมูลเมื่อมี notification data
                layer
              </p>
            </div>
          </div>
        </section>
        <EmptyState
          title="ยังไม่มีการแจ้งเตือนจากระบบ"
          description="ไม่แสดงการแจ้งเตือนตัวอย่างหรือใช้ local state แทนข้อมูลจริง"
          actionText="กลับหน้าหลัก"
          onAction={() => setLocation("/")}
        />
      </div>
    </AppLayout>
  );
}
