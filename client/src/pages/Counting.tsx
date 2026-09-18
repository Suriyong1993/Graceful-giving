import React, { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  StatusBadge,
} from "@/components/common/CommonUI";
import {
  confirmDiscardChanges,
  useUnsavedChanges,
} from "@/hooks/useUnsavedChanges";
import { ChevronRight, Coins, Plus, X } from "lucide-react";
import { toast } from "sonner";

/** The Sunday on or before today, as a yyyy-mm-dd string for a date input. */
function lastSunday(): string {
  const today = new Date();
  const back = today.getDay();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - back);
  const offset = sunday.getTimezoneOffset();
  return new Date(sunday.getTime() - offset * 60_000)
    .toISOString()
    .slice(0, 10);
}

const fmtThaiDate = (value: Date | string) =>
  new Intl.DateTimeFormat("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));

export default function Counting() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [showCreate, setShowCreate] = useState(false);
  const [serviceDate, setServiceDate] = useState(lastSunday());
  const [notes, setNotes] = useState("");

  const sessionsQuery = trpc.counting.list.useQuery(undefined, {
    retry: false,
  });

  const isDirty = showCreate && (serviceDate !== lastSunday() || notes !== "");
  useUnsavedChanges(isDirty);

  const closeCreate = async () => {
    if (!(await confirmDiscardChanges(isDirty))) return;
    setShowCreate(false);
    setServiceDate(lastSunday());
    setNotes("");
  };

  const createSession = trpc.counting.create.useMutation({
    onSuccess: async ({ id }) => {
      await utils.counting.list.invalidate();
      setShowCreate(false);
      setNotes("");
      toast.success("เปิดรอบนับเงินถวายแล้ว");
      setLocation(`/counting/${id}`);
    },
    onError: error =>
      toast.error("เปิดรอบไม่สำเร็จ", { description: error.message }),
  });

  const sessions = sessionsQuery.data ?? [];

  const openCount = useMemo(
    () =>
      sessions.filter(s => s.status === "counting" || s.status === "counted")
        .length,
    [sessions]
  );

  return (
    <AppLayout
      activeRoute="/counting"
      title="นับเงินถวาย"
      subtitle="บันทึกและกระทบยอดเงินถวายของแต่ละวันอาทิตย์"
      action={
        <button
          type="button"
          onClick={() => (showCreate ? closeCreate() : setShowCreate(true))}
          className="min-h-11 inline-flex items-center gap-2 rounded-2xl bg-[#E99A4A] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#DE8640]"
        >
          <Plus className="h-4 w-4" />
          เปิดรอบใหม่
        </button>
      }
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-[#E9D9BF] bg-[#FFF4DF] p-6 shadow-sm md:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white p-3 text-[#E99A4A]">
              <Coins className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#38251B]">
                รอบนับเงินถวายรายสัปดาห์
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#674F42]">
                แต่ละรอบเก็บครบทั้งซองถวาย ผลนับธนบัตรและเหรียญ รายการหักเบิก
                ยอดนำฝาก และการกระทบยอด
                {openCount > 0
                  ? ` — ขณะนี้มี ${openCount} รอบที่ยังไม่ปิด`
                  : ""}
              </p>
            </div>
          </div>
        </section>

        {showCreate && (
          <form
            onSubmit={event => {
              event.preventDefault();
              createSession.mutate({
                serviceDate: new Date(`${serviceDate}T00:00:00`),
                serviceRound: 1,
                notes: notes.trim() || undefined,
              });
            }}
            className="rounded-3xl border border-[#E9D9BF] bg-white p-6 shadow-sm"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-bold text-[#38251B]">เปิดรอบนับเงินถวาย</h2>
              <button
                type="button"
                onClick={closeCreate}
                aria-label="ปิด"
                className="flex size-11 items-center justify-center rounded-xl text-[#927D6D] hover:bg-[#FFF4DF]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-[#674F42]">
                วันอาทิตย์ที่รับถวาย *
                <input
                  type="date"
                  required
                  value={serviceDate}
                  onChange={event => setServiceDate(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#E9D9BF] p-3 text-sm font-normal text-[#38251B]"
                />
              </label>
              <label className="text-sm font-semibold text-[#674F42] md:col-span-2">
                บันทึกเพิ่มเติม
                <textarea
                  rows={2}
                  value={notes}
                  onChange={event => setNotes(event.target.value)}
                  placeholder="เช่น มีถวายพิเศษวันครบรอบคริสตจักร"
                  className="mt-1 w-full rounded-xl border border-[#E9D9BF] p-3 text-sm font-normal text-[#38251B]"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={createSession.isPending}
              className="mt-5 min-h-11 rounded-2xl bg-[#4F8B33] px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {createSession.isPending ? "กำลังเปิดรอบ…" : "เปิดรอบและเริ่มนับ"}
            </button>
          </form>
        )}

        {sessionsQuery.isLoading ? (
          <LoadingSkeleton count={4} />
        ) : sessionsQuery.isError ? (
          <ErrorState
            title="โหลดรอบนับเงินถวายไม่สำเร็จ"
            description="เชื่อมต่อฐานข้อมูลไม่ได้ กรุณาลองใหม่อีกครั้ง"
            onRetry={() => sessionsQuery.refetch()}
          />
        ) : sessions.length === 0 ? (
          <EmptyState
            title="ยังไม่มีรอบนับเงินถวาย"
            description="เปิดรอบของวันอาทิตย์ล่าสุดเพื่อเริ่มบันทึกซองถวายและนับเงิน"
            actionText="เปิดรอบใหม่"
            onAction={() => setShowCreate(true)}
          />
        ) : (
          <div className="space-y-3">
            {sessions.map(session => (
              <button
                key={session.id}
                type="button"
                onClick={() => setLocation(`/counting/${session.id}`)}
                className="flex w-full items-center justify-between gap-4 rounded-2xl border border-[#E9D9BF] bg-white p-5 text-left shadow-sm transition-colors hover:bg-[#FFF9EE]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-[#38251B]">
                      {fmtThaiDate(session.serviceDate)}
                    </h2>
                    <StatusBadge status={session.status} />
                  </div>
                  {session.varianceNote && (
                    <p className="mt-1 text-sm text-[#C26B1E]">
                      มีผลต่างที่บันทึกคำอธิบายไว้
                    </p>
                  )}
                  {session.notes && (
                    <p className="mt-1 truncate text-sm text-[#674F42]">
                      {session.notes}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-[#927D6D]" />
              </button>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
