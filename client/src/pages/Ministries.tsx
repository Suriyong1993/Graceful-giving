import React from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmptyState } from "@/components/common/CommonUI";
import { UsersRound } from "lucide-react";

export default function Ministries() {
  const [, setLocation] = useLocation();

  return (
    <AppLayout
      title="พันธกิจและฝ่ายงาน"
      subtitle="จัดการทีมรับใช้และข้อมูลฝ่ายงานของคริสตจักร"
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-[#E9D9BF] bg-[#FFF4DF] p-6 shadow-sm md:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white p-3 text-[#E99A4A]">
              <UsersRound className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#38251B]">
                พันธกิจและฝ่ายงาน
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#70452E]/80">
                ข้อมูลฝ่ายงาน สมาชิก
                และกิจกรรมจะแสดงเมื่อมีแหล่งข้อมูลจริงและสิทธิ์การเข้าถึงที่รองรับ
              </p>
            </div>
          </div>
        </section>
        <EmptyState
          title="ยังไม่มีข้อมูลฝ่ายงาน"
          description="ระบบยังไม่มี endpoint สำหรับรายการพันธกิจและสมาชิกของแต่ละฝ่าย จึงไม่แสดงข้อมูลตัวอย่าง"
          actionText="ไปหน้าสมาชิก"
          onAction={() => setLocation("/members")}
        />
      </div>
    </AppLayout>
  );
}
