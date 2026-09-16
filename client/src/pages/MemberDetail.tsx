import React from "react";
import { useLocation, useParams } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmptyState, LoadingSkeleton } from "@/components/common/CommonUI";
import { trpc } from "@/lib/trpc";
import { ArrowLeft } from "lucide-react";

export default function MemberDetail() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const id = Number(params.id);
  const query = trpc.members.getById.useQuery(
    { id },
    { enabled: Number.isInteger(id) && id > 0, retry: false }
  );
  return (
    <AppLayout title="รายละเอียดสมาชิก" subtitle="ข้อมูลจากฐานข้อมูลจริง">
      <div className="max-w-3xl space-y-6">
        <button
          type="button"
          onClick={() => setLocation("/members")}
          className="min-h-11 inline-flex items-center gap-2 text-sm font-medium text-[#70452E]"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับหน้าสมาชิก
        </button>
        {query.isLoading ? (
          <LoadingSkeleton count={3} />
        ) : query.isError ? (
          <EmptyState
            title="โหลดข้อมูลสมาชิกไม่สำเร็จ"
            description="เกิดข้อผิดพลาดในการเชื่อมต่อข้อมูลจริง กรุณาลองใหม่"
            actionText="ลองใหม่"
            onAction={() => query.refetch()}
          />
        ) : !query.data ? (
          <EmptyState
            title="ไม่พบข้อมูลสมาชิก"
            description="ไม่มีสมาชิกตามรหัสที่ระบุในฐานข้อมูล"
            actionText="กลับหน้าสมาชิก"
            onAction={() => setLocation("/members")}
          />
        ) : (
          <div className="rounded-3xl border border-[#E9D9BF] bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-2xl font-bold text-[#38251B]">
                {query.data.name}
              </h1>
              <span className="rounded-full bg-[#DCECC5] px-3 py-1 text-xs text-[#38251B]">
                {query.data.status}
              </span>
            </div>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-[#927D6D]">โทรศัพท์</dt>
                <dd className="mt-1 text-sm font-semibold text-[#38251B]">
                  {query.data.phone || "ไม่ระบุ"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#927D6D]">อีเมล</dt>
                <dd className="mt-1 text-sm font-semibold text-[#38251B]">
                  {query.data.email || "ไม่ระบุ"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-[#927D6D]">ข้อมูลเพิ่มเติม</dt>
                <dd className="mt-1 text-sm text-[#38251B]">
                  {query.data.notes || "ไม่มีข้อมูลเพิ่มเติม"}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
