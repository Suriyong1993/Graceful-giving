import React from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmptyState } from "@/components/common/CommonUI";
import { UsersRound } from "lucide-react";

export default function Members() {
  const [, setLocation] = useLocation();

  return (
    <AppLayout
      title="สมาชิกคริสตจักร"
      subtitle="ข้อมูลสมาชิกจะแสดงจากฐานข้อมูลจริงเมื่อ data layer พร้อมใช้งาน"
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-[#E9D9BF] bg-[#FFF4DF] p-6 shadow-sm md:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white p-3 text-[#E99A4A]">
              <UsersRound className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#38251B]">
                สมาชิกคริสตจักร
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#70452E]/80">
                หน้านี้จะรองรับการค้นหา เพิ่ม แก้ไข และจัดการสมาชิกเมื่อมี
                members table และ API ที่มีสิทธิ์รองรับ
              </p>
            </div>
          </div>
        </section>
        <EmptyState
          title="ยังไม่มีข้อมูลสมาชิกจากระบบ"
          description="ไม่มีการแสดงรายชื่อสมาชิกตัวอย่างเพื่อป้องกันการเข้าใจผิดว่าข้อมูลเป็นข้อมูลจริง"
          actionText="กลับหน้าหลัก"
          onAction={() => setLocation("/")}
        />
      </div>
    </AppLayout>
  );
}
