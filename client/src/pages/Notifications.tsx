import React from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmptyState, LoadingSkeleton } from "@/components/common/CommonUI";
import { trpc } from "@/lib/trpc";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";

export default function Notifications() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const query = trpc.notifications.list.useQuery(undefined, { retry: false });
  const markRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => void utils.notifications.list.invalidate(),
    onError: error =>
      toast.error(error.message || "อัปเดตสถานะการแจ้งเตือนไม่สำเร็จ"),
  });
  const markAllRead = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: async () => {
      await utils.notifications.list.invalidate();
      toast.success("ทำเครื่องหมายว่าอ่านแล้วทั้งหมด");
    },
    onError: error =>
      toast.error(error.message || "อัปเดตสถานะการแจ้งเตือนไม่สำเร็จ"),
  });

  return (
    <AppLayout
      title="การแจ้งเตือน"
      subtitle="สถานะการอ่านถูกบันทึกในฐานข้อมูลจริง"
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-[#E9D9BF] bg-[#FFF4DF] p-6 shadow-sm md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-card p-3 text-[#E99A4A]">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#38251B]">
                  ศูนย์การแจ้งเตือน
                </h1>
                <p className="mt-1 text-sm text-[#70452E]/80">
                  การแจ้งเตือนที่เกิดจากระบบจะแสดงที่นี่
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="min-h-11 inline-flex items-center gap-2 rounded-2xl border border-[#E9D9BF] bg-card px-3 py-2 text-xs font-semibold text-[#70452E] disabled:opacity-50"
            >
              <CheckCheck className="h-4 w-4" />
              อ่านแล้วทั้งหมด
            </button>
          </div>
        </section>
        {query.isLoading ? (
          <LoadingSkeleton count={4} />
        ) : query.isError ? (
          <EmptyState
            title="โหลดการแจ้งเตือนไม่สำเร็จ"
            description="เกิดข้อผิดพลาดในการเชื่อมต่อข้อมูลจริง กรุณาลองใหม่"
            actionText="ลองใหม่"
            onAction={() => query.refetch()}
          />
        ) : !query.data?.length ? (
          <EmptyState
            title="ยังไม่มีการแจ้งเตือน"
            description="เมื่อระบบสร้างการแจ้งเตือนจริง รายการจะแสดงที่หน้านี้"
            actionText="กลับหน้าหลัก"
            onAction={() => setLocation("/")}
          />
        ) : (
          <div className="space-y-3">
            {query.data.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (!item.readAt) markRead.mutate({ id: item.id });
                  if (item.link) setLocation(item.link);
                }}
                className={`w-full rounded-2xl border p-5 text-left shadow-sm ${item.readAt ? "border-[#E9D9BF] bg-card" : "border-[#A8C978] bg-[#F7FAF0]"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-bold text-[#38251B]">{item.title}</h2>
                    <p className="mt-1 text-sm text-[#70452E]/80">
                      {item.description || ""}
                    </p>
                  </div>
                  <span className="text-[11px] text-[#927D6D]">
                    {item.readAt ? "อ่านแล้ว" : "ยังไม่อ่าน"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
