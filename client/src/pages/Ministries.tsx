import React, { useState } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from "@/components/common/CommonUI";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { canManageMinistries } from "@shared/roles";
import { CalendarClock, Plus, Sprout, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import {
  confirmDiscardChanges,
  useUnsavedChanges,
} from "@/hooks/useUnsavedChanges";

export default function Ministries() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const canManage = canManageMinistries(user);

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [leaderName, setLeaderName] = useState("");
  const [meetingSchedule, setMeetingSchedule] = useState("");
  const [description, setDescription] = useState("");

  const isDirty = Boolean(
    showCreate && (name || leaderName || meetingSchedule || description)
  );
  useUnsavedChanges(isDirty);

  const closeCreateForm = async () => {
    if (!(await confirmDiscardChanges(isDirty))) return;
    setShowCreate(false);
    setName("");
    setLeaderName("");
    setMeetingSchedule("");
    setDescription("");
  };

  const utils = trpc.useUtils();
  const ministriesQuery = trpc.ministries.list.useQuery(undefined, {
    retry: false,
  });
  const createMinistry = trpc.ministries.create.useMutation({
    onSuccess: async () => {
      await utils.ministries.list.invalidate();
      setName("");
      setLeaderName("");
      setMeetingSchedule("");
      setDescription("");
      setShowCreate(false);
      toast.success("เพิ่มฝ่ายงานเรียบร้อยแล้ว");
    },
    onError: error => toast.error(error.message || "เพิ่มฝ่ายงานไม่สำเร็จ"),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 2) {
      toast.error("กรุณาระบุชื่อฝ่ายงาน");
      return;
    }
    createMinistry.mutate({
      name: name.trim(),
      leaderName: leaderName.trim() || undefined,
      meetingSchedule: meetingSchedule.trim() || undefined,
      description: description.trim() || undefined,
    });
  };

  return (
    <AppLayout
      title="พันธกิจและฝ่ายงาน"
      subtitle="ทีมรับใช้และฝ่ายงานของคริสตจักร"
      action={
        canManage ? (
          <button
            type="button"
            onClick={() => {
              if (showCreate) {
                closeCreateForm();
              } else {
                setShowCreate(true);
              }
            }}
            className="min-h-11 inline-flex items-center gap-2 rounded-2xl bg-[#E99A4A] px-4 py-2 text-xs font-bold text-white"
          >
            <Plus className="h-4 w-4" />
            เพิ่มฝ่ายงาน
          </button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-[#E9D9BF] bg-[#FFF4DF] p-6 shadow-sm md:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-card p-3 text-[#3D7826]">
              <Sprout className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#38251B]">
                พันธกิจและฝ่ายงาน
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#70452E]/80">
                {canManage
                  ? "เพิ่มและแก้ไขฝ่ายงาน หัวหน้าฝ่าย และเวลานัดประชุมของแต่ละทีมรับใช้"
                  : "ดูรายชื่อฝ่ายงานและเวลานัดประชุมของแต่ละทีมรับใช้"}
              </p>
            </div>
          </div>
        </section>

        {canManage && showCreate && (
          <form
            onSubmit={submit}
            className="rounded-3xl border border-[#E9D9BF] bg-card p-6 shadow-sm"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-bold text-[#38251B]">เพิ่มฝ่ายงานใหม่</h2>
              <button
                type="button"
                onClick={closeCreateForm}
                className="text-[#927D6D]"
                aria-label="ปิดแบบฟอร์ม"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-[#70452E]">
                ชื่อฝ่ายงาน *
                <input
                  required
                  value={name}
                  onChange={event => setName(event.target.value)}
                  placeholder="เช่น ฝ่ายนมัสการ, ฝ่ายอนุชน"
                  className="mt-1 w-full rounded-xl border border-[#E9D9BF] p-3 font-normal text-[#38251B]"
                />
              </label>
              <label className="text-sm font-semibold text-[#70452E]">
                หัวหน้าฝ่าย
                <input
                  value={leaderName}
                  onChange={event => setLeaderName(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#E9D9BF] p-3 font-normal text-[#38251B]"
                />
              </label>
              <label className="text-sm font-semibold text-[#70452E] md:col-span-2">
                เวลานัดประชุม
                <input
                  value={meetingSchedule}
                  onChange={event => setMeetingSchedule(event.target.value)}
                  placeholder="เช่น ทุกวันอาทิตย์ 09:00"
                  className="mt-1 w-full rounded-xl border border-[#E9D9BF] p-3 font-normal text-[#38251B]"
                />
              </label>
              <label className="text-sm font-semibold text-[#70452E] md:col-span-2">
                รายละเอียดพันธกิจ
                <textarea
                  value={description}
                  onChange={event => setDescription(event.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-[#E9D9BF] p-3 font-normal text-[#38251B]"
                />
              </label>
            </div>
            <button
              disabled={createMinistry.isPending}
              className="mt-5 min-h-11 rounded-2xl bg-[#4F8B33] px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {createMinistry.isPending ? "กำลังบันทึก…" : "บันทึกฝ่ายงาน"}
            </button>
          </form>
        )}

        {ministriesQuery.isLoading ? (
          <LoadingSkeleton count={4} />
        ) : ministriesQuery.isError ? (
          <ErrorState
            title="โหลดข้อมูลฝ่ายงานไม่สำเร็จ"
            description="เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล กรุณาลองใหม่"
            onRetry={() => ministriesQuery.refetch()}
          />
        ) : !ministriesQuery.data?.length ? (
          <EmptyState
            title="ยังไม่มีข้อมูลฝ่ายงาน"
            description={
              canManage
                ? "เพิ่มฝ่ายงานแรกด้วยแบบฟอร์มด้านบนเพื่อบันทึกลงฐานข้อมูลจริง"
                : "คริสตจักรยังไม่ได้บันทึกฝ่ายงานไว้ในระบบ"
            }
            actionText={canManage ? "เพิ่มฝ่ายงาน" : undefined}
            onAction={canManage ? () => setShowCreate(true) : undefined}
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {ministriesQuery.data.map(ministry => (
              <button
                key={ministry.id}
                type="button"
                onClick={() => setLocation(`/ministries/${ministry.id}`)}
                className="rounded-2xl border border-[#E9D9BF] bg-card p-5 text-left shadow-sm hover:bg-[#FFF9EE]"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-bold text-[#38251B]">{ministry.name}</h2>
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] ${
                      ministry.status === "active"
                        ? "bg-[#DCECC5] text-[#38251B]"
                        : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {ministry.status === "active" ? "ดำเนินการ" : "พักงาน"}
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-[#70452E]/80">
                  <UserRound className="h-4 w-4 shrink-0" />
                  {ministry.leaderName || "ยังไม่ระบุหัวหน้าฝ่าย"}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-[#70452E]/80">
                  <CalendarClock className="h-4 w-4 shrink-0" />
                  {ministry.meetingSchedule || "ยังไม่ระบุเวลานัดประชุม"}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
