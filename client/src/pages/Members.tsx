import React from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmptyState, LoadingSkeleton } from "@/components/common/CommonUI";
import { trpc } from "@/lib/trpc";
import { UsersRound } from "lucide-react";

export default function Members() {
  const [, setLocation] = useLocation();
  const membersQuery = trpc.members.list.useQuery(undefined, { retry: false });

  return (
    <AppLayout title="สมาชิกคริสตจักร" subtitle="ข้อมูลสมาชิกจากฐานข้อมูลจริง">
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
              <p className="mt-1 text-sm text-[#70452E]/80">
                รายชื่อและสถานะจะถูกอ่านจากฐานข้อมูลของคริสตจักรนี้
              </p>
            </div>
          </div>
        </section>
        {membersQuery.isLoading ? (
          <LoadingSkeleton count={4} />
        ) : membersQuery.isError ? (
          <EmptyState
            title="โหลดข้อมูลสมาชิกไม่สำเร็จ"
            description="เกิดข้อผิดพลาดในการเชื่อมต่อข้อมูลจริง กรุณาลองใหม่"
            actionText="ลองใหม่"
            onAction={() => membersQuery.refetch()}
          />
        ) : !membersQuery.data?.length ? (
          <EmptyState
            title="ยังไม่มีข้อมูลสมาชิก"
            description="เพิ่มสมาชิกผ่าน data layer ที่ได้รับอนุญาต เพื่อให้ข้อมูลถูกบันทึกในฐานข้อมูลจริง"
            actionText="กลับหน้าหลัก"
            onAction={() => setLocation("/")}
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {membersQuery.data.map(member => (
              <button
                key={member.id}
                type="button"
                onClick={() => setLocation(`/members/${member.id}`)}
                className="rounded-2xl border border-[#E9D9BF] bg-white p-5 text-left shadow-sm hover:bg-[#FFF9EE]"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-bold text-[#38251B]">{member.name}</h2>
                  <span className="rounded-full bg-[#DCECC5] px-2 py-1 text-[11px] text-[#38251B]">
                    {member.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[#70452E]/80">
                  {member.phone || "ไม่ระบุเบอร์โทรศัพท์"}
                </p>
                <p className="text-sm text-[#70452E]/80">
                  {member.email || "ไม่ระบุอีเมล"}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
