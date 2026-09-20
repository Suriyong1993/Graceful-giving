import { FormEvent, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  Megaphone,
  PencilLine,
  Plus,
  Search,
  Send,
  Settings2,
  Trash2,
} from "lucide-react";
import { formatEventDate, formatThaiDate, toDateTimeLocal } from "../utils";
import { StatusPill } from "./SharedPanels";
export function AdminManager() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.updates.adminList.useQuery(undefined, { retry: false });
  const createNews = trpc.updates.createNews.useMutation({
    onSuccess: async () => {
      await utils.updates.adminList.invalidate();
      await utils.updates.feed.invalidate();
      toast.success("สร้างข่าวสารเรียบร้อย");
      setNewsOpen(false);
    },
  });
  const createEvent = trpc.updates.createEvent.useMutation({
    onSuccess: async () => {
      await utils.updates.adminList.invalidate();
      await utils.updates.feed.invalidate();
      toast.success("สร้างกิจกรรมเรียบร้อย");
      setEventOpen(false);
    },
  });
  const updateNews = trpc.updates.updateNews.useMutation({
    onSuccess: async () => {
      await utils.updates.adminList.invalidate();
      await utils.updates.feed.invalidate();
      toast.success("อัปเดตข่าวสารเรียบร้อย");
      setNewsOpen(false);
      setEditingNewsId(null);
    },
  });
  const updateEvent = trpc.updates.updateEvent.useMutation({
    onSuccess: async () => {
      await utils.updates.adminList.invalidate();
      await utils.updates.feed.invalidate();
      toast.success("อัปเดตกิจกรรมเรียบร้อย");
      setEventOpen(false);
      setEditingEventId(null);
    },
  });
  const setNewsStatus = trpc.updates.setNewsStatus.useMutation({
    onSuccess: async () => {
      await utils.updates.adminList.invalidate();
      await utils.updates.feed.invalidate();
      toast.success("เปลี่ยนสถานะข่าวสารเรียบร้อย");
    },
  });
  const setEventStatus = trpc.updates.setEventStatus.useMutation({
    onSuccess: async () => {
      await utils.updates.adminList.invalidate();
      await utils.updates.feed.invalidate();
      toast.success("เปลี่ยนสถานะกิจกรรมเรียบร้อย");
    },
  });
  const deleteNews = trpc.updates.deleteNews.useMutation({
    onSuccess: async () => {
      await utils.updates.adminList.invalidate();
      await utils.updates.feed.invalidate();
      toast.success("ลบข่าวสารเรียบร้อย");
      setDeletingNews(null);
    },
  });
  const deleteEvent = trpc.updates.deleteEvent.useMutation({
    onSuccess: async () => {
      await utils.updates.adminList.invalidate();
      await utils.updates.feed.invalidate();
      toast.success("ลบกิจกรรมเรียบร้อย");
      setDeletingEvent(null);
    },
  });

  const [newsOpen, setNewsOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [editingNewsId, setEditingNewsId] = useState<number | null>(null);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);

  type NewsItem = NonNullable<typeof data>["news"][number];
  type EventItem = NonNullable<typeof data>["events"][number];

  const [deletingNews, setDeletingNews] = useState<NewsItem | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<EventItem | null>(null);
  const [query, setQuery] = useState("");

  const [newsForm, setNewsForm] = useState<{
    title: string;
    summary: string;
    body: string;
    category: "announcement" | "ministry" | "finance" | "pastoral";
    status: "draft" | "published" | "archived";
  }>({ title: "", summary: "", body: "", category: "announcement", status: "draft" });

  const [eventForm, setEventForm] = useState<{
    title: string;
    summary: string;
    description: string;
    startsAt: string;
    endsAt: string;
    location: string;
    registrationUrl: string;
    status: "draft" | "published" | "cancelled";
  }>({ title: "", summary: "", description: "", startsAt: "", endsAt: "", location: "", registrationUrl: "", status: "draft" });

  const filteredNews = useMemo(() => {
    const list = data?.news ?? [];
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((item) => item.title.toLowerCase().includes(q) || item.summary.toLowerCase().includes(q));
  }, [data?.news, query]);

  const filteredEvents = useMemo(() => {
    const list = data?.events ?? [];
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((item) => item.title.toLowerCase().includes(q) || item.summary.toLowerCase().includes(q));
  }, [data?.events, query]);

  const handleNews = (event: FormEvent) => {
    event.preventDefault();
    if (editingNewsId) updateNews.mutate({ id: editingNewsId, ...newsForm });
    else createNews.mutate(newsForm);
  };

  const handleEvent = (event: FormEvent) => {
    event.preventDefault();
    if (eventForm.endsAt && new Date(eventForm.endsAt) < new Date(eventForm.startsAt)) {
      toast.error("วัน-เวลาสิ้นสุด ต้องไม่เกิดขึ้นก่อนวัน-เวลาเริ่มต้น");
      return;
    }
    const payload = {
      ...eventForm,
      startsAt: new Date(eventForm.startsAt),
      endsAt: eventForm.endsAt ? new Date(eventForm.endsAt) : undefined,
    };
    if (editingEventId) updateEvent.mutate({ id: editingEventId, ...payload });
    else createEvent.mutate(payload);
  };

  const beginNewsEdit = (item: NewsItem) => {
    setEditingNewsId(item.id);
    setNewsForm({
      title: item.title,
      summary: item.summary,
      body: item.body,
      category: item.category,
      status: item.status,
    });
    setNewsOpen(true);
  };

  const beginEventEdit = (item: EventItem) => {
    setEditingEventId(item.id);
    setEventForm({
      title: item.title,
      summary: item.summary,
      description: item.description,
      startsAt: toDateTimeLocal(item.startsAt),
      endsAt: item.endsAt ? toDateTimeLocal(item.endsAt) : "",
      location: item.location ?? "",
      registrationUrl: item.registrationUrl ?? "",
      status: item.status,
    });
    setEventOpen(true);
  };

  const openNewNews = () => {
    setEditingNewsId(null);
    setNewsForm({ title: "", summary: "", body: "", category: "announcement", status: "draft" });
    setNewsOpen(true);
  };

  const openNewEvent = () => {
    setEditingEventId(null);
    setEventForm({
      title: "",
      summary: "",
      description: "",
      startsAt: "",
      endsAt: "",
      location: "",
      registrationUrl: "",
      status: "draft",
    });
    setEventOpen(true);
  };

  return (
    <section className="mt-10 rounded-[28px] border border-[#eadfce] bg-[#fffaf1] p-5 sm:p-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Settings2 className="size-5 text-[#bd7b42]" />
            <h2 className="font-display text-xl font-bold tracking-tight text-[#4c392e]">จัดการเนื้อหา</h2>
          </div>
          <p className="mt-1 text-sm text-[#6a5649]">เพิ่มประกาศและปฏิทินกิจกรรมให้สมาชิกติดตาม</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={openNewNews}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#bd7b42] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#a86a34] shadow-sm active:scale-95 transition"
          >
            <Plus className="size-4" /> ข่าวสารใหม่
          </button>
          <button
            onClick={openNewEvent}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[#e5d6c2] bg-white px-4 py-2.5 text-xs font-bold text-[#8d5e30] hover:bg-[#fbf7f0] shadow-sm active:scale-95 transition"
          >
            <CalendarDays className="size-4" /> กิจกรรมใหม่
          </button>
        </div>
      </div>

      <div className="mt-4 relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#786455]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหาชื่อข่าวสารหรือกิจกรรม..."
          className="w-full rounded-2xl border border-[#eadfce] bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-[#4d3a30] focus:border-[#bd7b42] focus:outline-none"
        />
      </div>

      {isLoading ? (
        <div className="mt-5 h-20 animate-pulse rounded-2xl bg-white/70" />
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {/* Admin News List */}
          <div className="rounded-2xl border border-[#eee4d7] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-[#4d3a30]">ข่าวสารทั้งหมด</p>
              <span className="text-xs font-semibold text-[#786455]">{filteredNews.length} รายการ</span>
            </div>
            {filteredNews.length ? (
              <div className="max-h-[380px] overflow-y-auto divide-y divide-[#f1e8dd] pr-1">
                {filteredNews.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#fff0dc] text-[#bd7b42]">
                        <Megaphone className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#4d3a30]">{item.title}</p>
                        <p className="text-[11px] text-[#786455]">{formatThaiDate(item.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        aria-label={`แก้ไขข่าวสาร ${item.title}`}
                        className="grid min-h-[36px] min-w-[36px] place-items-center rounded-lg text-[#8d5e30] hover:bg-[#fff4e5]"
                        onClick={() => beginNewsEdit(item)}
                      >
                        <PencilLine className="size-4" />
                      </button>
                      <button
                        aria-label={`ลบข่าวสาร ${item.title}`}
                        className="grid min-h-[36px] min-w-[36px] place-items-center rounded-lg text-[#c25a50] hover:bg-[#ffefec]"
                        onClick={() => setDeletingNews(item)}
                      >
                        <Trash2 className="size-4" />
                      </button>
                      <StatusPill status={item.status} />
                      {item.status === "draft" && (
                        <button
                          className="min-h-[36px] px-2 text-xs font-bold text-[#2e7d52] hover:underline"
                          onClick={() => setNewsStatus.mutate({ id: item.id, status: "published" })}
                        >
                          เผยแพร่
                        </button>
                      )}
                      {item.status === "published" && (
                        <button
                          className="min-h-[36px] px-2 text-xs font-bold text-[#aa4e46] hover:underline"
                          onClick={() => setNewsStatus.mutate({ id: item.id, status: "archived" })}
                        >
                          เก็บถาวร
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-xs text-[#786455]">ไม่พบข่าวสาร</p>
            )}
          </div>

          {/* Admin Events List */}
          <div className="rounded-2xl border border-[#eee4d7] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-[#4d3a30]">กิจกรรมทั้งหมด</p>
              <span className="text-xs font-semibold text-[#786455]">{filteredEvents.length} รายการ</span>
            </div>
            {filteredEvents.length ? (
              <div className="max-h-[380px] overflow-y-auto divide-y divide-[#f1e8dd] pr-1">
                {filteredEvents.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e7f1fb] text-[#3c6f9e]">
                        <CalendarDays className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#4d3a30]">{item.title}</p>
                        <p className="text-[11px] text-[#3b6d9c]">{formatEventDate(item.startsAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        aria-label={`แก้ไขกิจกรรม ${item.title}`}
                        className="grid min-h-[36px] min-w-[36px] place-items-center rounded-lg text-[#3c6f9e] hover:bg-[#eef6ff]"
                        onClick={() => beginEventEdit(item)}
                      >
                        <PencilLine className="size-4" />
                      </button>
                      <button
                        aria-label={`ลบกิจกรรม ${item.title}`}
                        className="grid min-h-[36px] min-w-[36px] place-items-center rounded-lg text-[#c25a50] hover:bg-[#ffefec]"
                        onClick={() => setDeletingEvent(item)}
                      >
                        <Trash2 className="size-4" />
                      </button>
                      <StatusPill status={item.status} />
                      {item.status === "draft" && (
                        <button
                          className="min-h-[36px] px-2 text-xs font-bold text-[#2e7d52] hover:underline"
                          onClick={() => setEventStatus.mutate({ id: item.id, status: "published" })}
                        >
                          เผยแพร่
                        </button>
                      )}
                      {item.status === "published" && (
                        <button
                          className="min-h-[36px] px-2 text-xs font-bold text-[#aa4e46] hover:underline"
                          onClick={() => setEventStatus.mutate({ id: item.id, status: "cancelled" })}
                        >
                          ยกเลิก
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-xs text-[#786455]">ไม่พบกิจกรรม</p>
            )}
          </div>
        </div>
      )}

      {/* Admin News Create/Edit Dialog */}
      <Dialog open={newsOpen} onOpenChange={setNewsOpen}>
        <DialogContent className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[28px] border-[#eee4d7] bg-[#fffdf8] p-6 shadow-2xl">
          <form onSubmit={handleNews}>
            <DialogHeader className="text-left">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-[#fff0dc] text-[#bd7b42]">
                  <Megaphone className="size-5" />
                </span>
                <div>
                  <DialogTitle className="font-display text-xl font-bold text-[#4c392e]">
                    {editingNewsId ? "แก้ไขข่าวสาร" : "สร้างข่าวสารใหม่"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-[#6a5649]">
                    สมาชิกจะเห็นประกาศนี้เมื่อสถานะเป็นเผยแพร่
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="mt-5 space-y-4">
              <Field label="หัวข้อข่าวสาร">
                <input
                  required
                  maxLength={180}
                  value={newsForm.title}
                  onChange={(event) => setNewsForm({ ...newsForm, title: event.target.value })}
                  placeholder="เช่น เชิญร่วมอธิษฐานประจำสัปดาห์"
                  className="w-full rounded-xl border border-[#e5d8c8] px-3.5 py-2.5 text-sm text-[#4c392e] focus:border-[#bd7b42] focus:outline-none"
                />
              </Field>
              <Field label="สรุปสั้น ๆ">
                <input
                  required
                  maxLength={280}
                  value={newsForm.summary}
                  onChange={(event) => setNewsForm({ ...newsForm, summary: event.target.value })}
                  placeholder="ข้อความที่จะแสดงในการ์ดข่าวสาร"
                  className="w-full rounded-xl border border-[#e5d8c8] px-3.5 py-2.5 text-sm text-[#4c392e] focus:border-[#bd7b42] focus:outline-none"
                />
              </Field>
              <Field label="รายละเอียด">
                <textarea
                  required
                  rows={5}
                  value={newsForm.body}
                  onChange={(event) => setNewsForm({ ...newsForm, body: event.target.value })}
                  placeholder="เขียนรายละเอียดข่าวสาร..."
                  className="w-full rounded-xl border border-[#e5d8c8] px-3.5 py-2.5 text-sm text-[#4c392e] focus:border-[#bd7b42] focus:outline-none"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="หมวดหมู่">
                  <select
                    value={newsForm.category}
                    onChange={(event) => setNewsForm({ ...newsForm, category: event.target.value as typeof newsForm.category })}
                    className="w-full rounded-xl border border-[#e5d8c8] bg-white px-3.5 py-2.5 text-sm text-[#4c392e]"
                  >
                    <option value="announcement">ประกาศ</option>
                    <option value="ministry">พันธกิจ</option>
                    <option value="finance">การเงิน</option>
                    <option value="pastoral">การอภิบาล</option>
                  </select>
                </Field>
                <Field label="สถานะ">
                  <select
                    value={newsForm.status}
                    onChange={(event) => setNewsForm({ ...newsForm, status: event.target.value as typeof newsForm.status })}
                    className="w-full rounded-xl border border-[#e5d8c8] bg-white px-3.5 py-2.5 text-sm text-[#4c392e]"
                  >
                    <option value="draft">ฉบับร่าง</option>
                    <option value="published">เผยแพร่ทันที</option>
                    <option value="archived">เก็บถาวร</option>
                  </select>
                </Field>
              </div>
            </div>
            <SubmitButtons
              pending={createNews.isPending || updateNews.isPending}
              onCancel={() => setNewsOpen(false)}
              label={editingNewsId ? "บันทึกการแก้ไข" : "บันทึกข่าวสาร"}
            />
          </form>
        </DialogContent>
      </Dialog>

      {/* Admin Event Create/Edit Dialog */}
      <Dialog open={eventOpen} onOpenChange={setEventOpen}>
        <DialogContent className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[28px] border-[#eee4d7] bg-[#fffdf8] p-6 shadow-2xl">
          <form onSubmit={handleEvent}>
            <DialogHeader className="text-left">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-[#e7f1fb] text-[#3c6f9e]">
                  <CalendarDays className="size-5" />
                </span>
                <div>
                  <DialogTitle className="font-display text-xl font-bold text-[#4c392e]">
                    {editingEventId ? "แก้ไขกิจกรรม" : "สร้างกิจกรรมใหม่"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-[#6a5649]">
                    กิจกรรมจะปรากฏในปฏิทินของสมาชิก
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="mt-5 space-y-4">
              <Field label="ชื่อกิจกรรม">
                <input
                  required
                  maxLength={180}
                  value={eventForm.title}
                  onChange={(event) => setEventForm({ ...eventForm, title: event.target.value })}
                  placeholder="เช่น ค่ายครอบครัวบ้านแห่งพระคุณ"
                  className="w-full rounded-xl border border-[#e5d8c8] px-3.5 py-2.5 text-sm text-[#4c392e] focus:border-[#bd7b42] focus:outline-none"
                />
              </Field>
              <Field label="สรุปสั้น ๆ">
                <input
                  required
                  maxLength={280}
                  value={eventForm.summary}
                  onChange={(event) => setEventForm({ ...eventForm, summary: event.target.value })}
                  placeholder="ข้อความสั้นสำหรับการ์ดกิจกรรม"
                  className="w-full rounded-xl border border-[#e5d8c8] px-3.5 py-2.5 text-sm text-[#4c392e] focus:border-[#bd7b42] focus:outline-none"
                />
              </Field>
              <Field label="รายละเอียด">
                <textarea
                  required
                  rows={4}
                  value={eventForm.description}
                  onChange={(event) => setEventForm({ ...eventForm, description: event.target.value })}
                  placeholder="รายละเอียดกิจกรรม..."
                  className="w-full rounded-xl border border-[#e5d8c8] px-3.5 py-2.5 text-sm text-[#4c392e] focus:border-[#bd7b42] focus:outline-none"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="เริ่มวันที่และเวลา">
                  <input
                    required
                    type="datetime-local"
                    value={eventForm.startsAt}
                    onChange={(event) => setEventForm({ ...eventForm, startsAt: event.target.value })}
                    className="w-full rounded-xl border border-[#e5d8c8] px-3.5 py-2.5 text-sm text-[#4c392e] focus:border-[#bd7b42] focus:outline-none"
                  />
                </Field>
                <Field label="สิ้นสุด (ถ้ามี)">
                  <input
                    type="datetime-local"
                    value={eventForm.endsAt}
                    onChange={(event) => setEventForm({ ...eventForm, endsAt: event.target.value })}
                    className="w-full rounded-xl border border-[#e5d8c8] px-3.5 py-2.5 text-sm text-[#4c392e] focus:border-[#bd7b42] focus:outline-none"
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="สถานที่">
                  <input
                    value={eventForm.location}
                    onChange={(event) => setEventForm({ ...eventForm, location: event.target.value })}
                    placeholder="เช่น อาคารคริสตจักร"
                    className="w-full rounded-xl border border-[#e5d8c8] px-3.5 py-2.5 text-sm text-[#4c392e] focus:border-[#bd7b42] focus:outline-none"
                  />
                </Field>
                <Field label="ลิงก์ลงทะเบียน">
                  <input
                    type="url"
                    value={eventForm.registrationUrl}
                    onChange={(event) => setEventForm({ ...eventForm, registrationUrl: event.target.value })}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-[#e5d8c8] px-3.5 py-2.5 text-sm text-[#4c392e] focus:border-[#bd7b42] focus:outline-none"
                  />
                </Field>
              </div>
              <Field label="สถานะ">
                <select
                  value={eventForm.status}
                  onChange={(event) => setEventForm({ ...eventForm, status: event.target.value as typeof eventForm.status })}
                  className="w-full rounded-xl border border-[#e5d8c8] bg-white px-3.5 py-2.5 text-sm text-[#4c392e]"
                >
                  <option value="draft">ฉบับร่าง</option>
                  <option value="published">เผยแพร่ทันที</option>
                  <option value="cancelled">ยกเลิก</option>
                </select>
              </Field>
            </div>
            <SubmitButtons
              pending={createEvent.isPending || updateEvent.isPending}
              onCancel={() => setEventOpen(false)}
              label={editingEventId ? "บันทึกการแก้ไข" : "บันทึกกิจกรรม"}
            />
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete News Confirmation Dialog */}
      <Dialog open={!!deletingNews} onOpenChange={(open) => !open && setDeletingNews(null)}>
        <DialogContent className="w-full max-w-sm rounded-[26px] border-[#eee4d7] bg-[#fffdf8] p-6 shadow-2xl">
          {deletingNews && (
            <>
              <DialogHeader className="text-left">
                <div className="flex items-center gap-3 text-[#c25a50]">
                  <div className="grid size-11 place-items-center rounded-2xl bg-[#ffefec]">
                    <AlertTriangle className="size-6" />
                  </div>
                  <div>
                    <DialogTitle className="font-display text-lg font-bold text-[#4c392e]">
                      ยืนยันการลบข่าวสาร
                    </DialogTitle>
                    <DialogDescription className="text-xs text-[#6a5649]">
                      การดำเนินการนี้ไม่สามารถย้อนกลับได้
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <p className="mt-3 rounded-xl bg-[#fff5f3] p-3 text-xs font-semibold text-[#824f49]">
                ต้องการลบ &ldquo;{deletingNews.title}&rdquo; ออกจากระบบหรือไม่?
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingNews(null)}
                  className="min-h-[44px] rounded-xl border border-[#e8dccb] py-2.5 text-xs font-bold text-[#6a5649] hover:bg-[#f8f3eb]"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={deleteNews.isPending}
                  onClick={() => deleteNews.mutate({ id: deletingNews.id })}
                  className="min-h-[44px] rounded-xl bg-[#c25a50] py-2.5 text-xs font-bold text-white hover:bg-[#ab4a40] disabled:opacity-60"
                >
                  {deleteNews.isPending ? "กำลังลบ..." : "ยืนยันลบ"}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Event Confirmation Dialog */}
      <Dialog open={!!deletingEvent} onOpenChange={(open) => !open && setDeletingEvent(null)}>
        <DialogContent className="w-full max-w-sm rounded-[26px] border-[#eee4d7] bg-[#fffdf8] p-6 shadow-2xl">
          {deletingEvent && (
            <>
              <DialogHeader className="text-left">
                <div className="flex items-center gap-3 text-[#c25a50]">
                  <div className="grid size-11 place-items-center rounded-2xl bg-[#ffefec]">
                    <AlertTriangle className="size-6" />
                  </div>
                  <div>
                    <DialogTitle className="font-display text-lg font-bold text-[#4c392e]">
                      ยืนยันการลบกิจกรรม
                    </DialogTitle>
                    <DialogDescription className="text-xs text-[#6a5649]">
                      การดำเนินการนี้ไม่สามารถย้อนกลับได้
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <p className="mt-3 rounded-xl bg-[#fff5f3] p-3 text-xs font-semibold text-[#824f49]">
                ต้องการลบกิจกรรม &ldquo;{deletingEvent.title}&rdquo; หรือไม่?
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingEvent(null)}
                  className="min-h-[44px] rounded-xl border border-[#e8dccb] py-2.5 text-xs font-bold text-[#6a5649] hover:bg-[#f8f3eb]"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={deleteEvent.isPending}
                  onClick={() => deleteEvent.mutate({ id: deletingEvent.id })}
                  className="min-h-[44px] rounded-xl bg-[#c25a50] py-2.5 text-xs font-bold text-white hover:bg-[#ab4a40] disabled:opacity-60"
                >
                  {deleteEvent.isPending ? "กำลังลบ..." : "ยืนยันลบ"}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-bold text-[#5a463a]">
      {label}
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}

export function SubmitButtons({
  pending,
  onCancel,
  label,
}: {
  pending: boolean;
  onCancel: () => void;
  label: string;
}) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="min-h-[44px] rounded-xl border border-[#e8dccb] py-3 text-sm font-bold text-[#6a5649] hover:bg-[#f8f3eb]"
      >
        ยกเลิก
      </button>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#bd7b42] py-3 text-sm font-bold text-white hover:bg-[#a86a34] disabled:opacity-60 shadow-sm"
      >
        {pending ? <Clock3 className="size-4 animate-spin" /> : <Send className="size-4" />}
        {pending ? "กำลังบันทึก..." : label}
      </button>
    </div>
  );
}

