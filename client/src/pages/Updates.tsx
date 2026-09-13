import { FormEvent, useMemo, useState } from "react";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileText,
  HeartHandshake,
  MapPin,
  Megaphone,
  PencilLine,
  Plus,
  Search,
  Send,
  Settings2,
  Sparkles,
  Tag,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const categoryLabels = {
  announcement: "ประกาศ",
  ministry: "พันธกิจ",
  finance: "การเงิน",
  pastoral: "การอภิบาล",
} as const;

const formatThaiDate = (value: Date | string) => new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
}).format(new Date(value));

const formatEventDate = (value: Date | string) => new Intl.DateTimeFormat("th-TH", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
}).format(new Date(value));

const toDateTimeLocal = (value: Date | string) => {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

type NewsCategory = keyof typeof categoryLabels;

function downloadICS(event: {
  title: string;
  summary: string;
  description?: string;
  startsAt: Date | string;
  endsAt?: Date | string | null;
  location?: string | null;
}) {
  const formatICSDate = (dateVal: Date | string) => {
    const d = new Date(dateVal);
    return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const start = formatICSDate(event.startsAt);
  const end = event.endsAt
    ? formatICSDate(event.endsAt)
    : formatICSDate(new Date(new Date(event.startsAt).getTime() + 2 * 60 * 60 * 1000));

  const escapeICS = (str: string) =>
    str.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Grace Ledger//Church Events//TH",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@grace-ledger.local`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeICS(event.title)}`,
    `DESCRIPTION:${escapeICS((event.summary || "") + (event.description ? "\n\n" + event.description : ""))}`,
    event.location ? `LOCATION:${escapeICS(event.location)}` : "",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  const blob = new Blob([icsLines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/[\s/\\?%*:|"<>]/g, "_")}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success("ดาวน์โหลดไฟล์ปฏิทิน (.ics) เรียบร้อย สามารถนำเข้า Google Calendar หรือ Apple Calendar ได้ทันที");
}

function EmptyPanel({ type }: { type: "news" | "events" }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#eadfce] bg-white/65 px-6 py-12 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#f8eddb] text-[#b17a44]">
        {type === "news" ? <Megaphone className="size-7" strokeWidth={1.5} /> : <CalendarDays className="size-7" strokeWidth={1.5} />}
      </div>
      <p className="mt-4 text-base font-bold text-[#4c392e]">
        {type === "news" ? "ยังไม่มีข่าวสารเผยแพร่" : "ยังไม่มีกิจกรรมที่กำลังจะมาถึง"}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-[#6a5649]">
        {type === "news" ? "เมื่อมีประกาศใหม่ สมาชิกจะเห็นได้ที่หน้านี้ทันที" : "กิจกรรมของคริสตจักรจะแสดงที่นี่เพื่อให้สมาชิกวางแผนได้ง่ายขึ้น"}
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles =
    status === "published"
      ? "bg-[#e6f4e8] text-[#2c7244]"
      : status === "cancelled" || status === "archived"
      ? "bg-[#f9e5e2] text-[#aa4e46]"
      : "bg-[#fff0d2] text-[#916524]";
  const label =
    status === "published"
      ? "เผยแพร่แล้ว"
      : status === "cancelled"
      ? "ยกเลิก"
      : status === "archived"
      ? "เก็บถาวร"
      : "ฉบับร่าง";
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${styles}`}>{label}</span>;
}

function MemberFeed() {
  const { data, isLoading, error, refetch } = trpc.updates.feed.useQuery(undefined, { retry: false });
  const news = data?.news ?? [];
  const events = data?.events ?? [];

  type NewsItem = NonNullable<typeof data>["news"][number];
  type EventItem = NonNullable<typeof data>["events"][number];

  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [newsCategoryFilter, setNewsCategoryFilter] = useState<"all" | NewsCategory>("all");

  const filteredNews = useMemo(() => {
    if (newsCategoryFilter === "all") return news;
    return news.filter((item) => item.category === newsCategoryFilter);
  }, [news, newsCategoryFilter]);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-44 animate-pulse rounded-[24px] bg-white/70" />
        <div className="h-44 animate-pulse rounded-[24px] bg-white/70" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[24px] border border-[#f5c6cb] bg-[#fff0eb] p-6 text-center text-sm text-[#8a3928]">
        <p className="font-bold text-[#9e3825]">ไม่สามารถโหลดข้อมูลข่าวสารได้ในขณะนี้</p>
        <p className="mt-1 text-xs text-[#704d44]">{error.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย"}</p>
        <button
          onClick={() => refetch()}
          className="mt-4 rounded-xl bg-[#c25a50] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#aa473e]"
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-9">
      {/* News section */}
      <section>
        <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="font-display text-xl font-bold tracking-tight text-[#49372d]">ข่าวสารล่าสุด</p>
            <p className="mt-1 text-xs text-[#6a5649]">ประกาศและเรื่องราวพระคุณจากคริสตจักร</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#f8eddb] px-3 py-1 text-[11px] font-bold text-[#8d5e30]">
              {filteredNews.length} รายการ
            </span>
          </div>
        </div>

        {/* Category tabs for news */}
        <div className="mb-4 flex flex-wrap gap-1.5" role="tablist" aria-label="กรองหมวดหมู่ข่าวสาร">
          {(["all", "announcement", "ministry", "finance", "pastoral"] as const).map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={newsCategoryFilter === cat}
              onClick={() => setNewsCategoryFilter(cat)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                newsCategoryFilter === cat
                  ? "bg-[#bd7b42] text-white shadow-sm"
                  : "bg-white/80 text-[#6a5649] hover:bg-white hover:text-[#49372d] border border-[#e8dccb]"
              }`}
            >
              {cat === "all" ? "ทั้งหมด" : categoryLabels[cat]}
            </button>
          ))}
        </div>

        {filteredNews.length === 0 ? (
          <EmptyPanel type="news" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredNews.map((item) => (
              <article
                key={item.id}
                onClick={() => setSelectedNews(item)}
                tabIndex={0}
                role="button"
                aria-label={`ดูข่าวสาร: ${item.title}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedNews(item);
                  }
                }}
                className="group cursor-pointer rounded-[24px] border border-[#eee4d7] bg-white p-5 shadow-[0_5px_15px_rgba(94,70,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(94,70,42,0.08)] focus:outline-none focus:ring-2 focus:ring-[#bd7b42]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff3de] px-2.5 py-1 text-[10px] font-bold text-[#8d5e30]">
                    <Tag className="size-3" />
                    {categoryLabels[item.category]}
                  </span>
                  <span className="text-[10px] text-[#786455] font-medium">
                    {formatThaiDate(item.publishedAt ?? item.createdAt)}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-lg font-bold leading-7 text-[#4d392f] group-hover:text-[#9e5d26] transition-colors">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#6a5649] line-clamp-3">{item.summary}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-[#9e5d26]">
                  อ่านรายละเอียด <ChevronRight className="size-3.5 transition group-hover:translate-x-0.5" />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Events section */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="font-display text-xl font-bold tracking-tight text-[#49372d]">กิจกรรมที่กำลังจะมาถึง</p>
            <p className="mt-1 text-xs text-[#6a5649]">วางแผนร่วมรับใช้และสามัคคีธรรมด้วยกัน</p>
          </div>
          <span className="rounded-full bg-[#e7f1fb] px-3 py-1 text-[11px] font-bold text-[#356792]">
            {events.length} กิจกรรม
          </span>
        </div>
        {events.length === 0 ? (
          <EmptyPanel type="events" />
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <article
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                tabIndex={0}
                role="button"
                aria-label={`ดูกิจกรรม: ${event.title}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedEvent(event);
                  }
                }}
                className="group flex cursor-pointer gap-4 rounded-[24px] border border-[#eee4d7] bg-white p-4 shadow-[0_5px_15px_rgba(94,70,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(94,70,42,0.08)] focus:outline-none focus:ring-2 focus:ring-[#bd7b42]"
              >
                <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#e9f3ff] text-[#3c6f9e]">
                  <CalendarDays className="size-5" />
                  <span className="mt-0.5 text-[11px] font-bold">{new Date(event.startsAt).getDate()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-[#4d392f] group-hover:text-[#9e5d26] transition-colors">
                    {event.title}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-[#3b6d9c]">{formatEventDate(event.startsAt)}</p>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#6a5649]">{event.summary}</p>
                  {event.location && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-[#6a5649]">
                      <MapPin className="size-3.5 text-[#bd7b42]" />
                      {event.location}
                    </p>
                  )}
                </div>
                <ChevronRight className="mt-1 size-5 shrink-0 text-[#8e7664] group-hover:text-[#9e5d26] transition-colors" />
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Radix Dialog for News details */}
      <Dialog open={!!selectedNews} onOpenChange={(open) => !open && setSelectedNews(null)}>
        <DialogContent className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[28px] border-[#eee4d7] bg-[#fffdf8] p-6 shadow-2xl">
          {selectedNews && (
            <>
              <DialogHeader className="space-y-2 text-left">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff3de] px-3 py-1 text-xs font-bold text-[#8d5e30]">
                    <Tag className="size-3.5" />
                    {categoryLabels[selectedNews.category]}
                  </span>
                  <span className="text-xs font-medium text-[#786455]">
                    {formatThaiDate(selectedNews.publishedAt ?? selectedNews.createdAt)}
                  </span>
                </div>
                <DialogTitle className="font-display text-2xl font-bold leading-tight text-[#4c392e]">
                  {selectedNews.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-[#6a5649]">
                  รายละเอียดข่าวสารและประกาศคริสตจักร
                </DialogDescription>
              </DialogHeader>

              <div className="mt-2 rounded-2xl border border-[#faecd3] bg-[#fff8eb] p-4 text-sm font-medium leading-6 text-[#755533]">
                <p className="mb-1 font-bold text-[#9e5d26]">สรุปสาระสำคัญ:</p>
                {selectedNews.summary}
              </div>

              <div className="mt-4 border-t border-[#f0e7dc] pt-4">
                <p className="mb-2 text-sm font-semibold text-[#5a463a]">เนื้อหาฉบับเต็ม:</p>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#4d392f]">
                  {selectedNews.body}
                </div>
              </div>

              <div className="mt-6 flex justify-end border-t border-[#f0e7dc] pt-4">
                <button
                  onClick={() => setSelectedNews(null)}
                  className="rounded-xl bg-[#bd7b42] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#a86a34] focus:outline-none focus:ring-2 focus:ring-[#bd7b42]"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Radix Dialog for Event details with .ics export */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[28px] border-[#eee4d7] bg-[#fffdf8] p-6 shadow-2xl">
          {selectedEvent && (
            <>
              <DialogHeader className="space-y-2 text-left">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-2xl bg-[#e9f3ff] text-[#3c6f9e]">
                    <CalendarDays className="size-6" />
                  </span>
                  <div>
                    <DialogTitle className="font-display text-xl font-bold text-[#4c392e]">
                      {selectedEvent.title}
                    </DialogTitle>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusPill status={selectedEvent.status} />
                    </div>
                  </div>
                </div>
                <DialogDescription className="text-xs text-[#6a5649]">
                  ข้อมูลและกำหนดการกิจกรรมคริสตจักร
                </DialogDescription>
              </DialogHeader>

              <div className="mt-3 space-y-2.5 rounded-2xl border border-[#eee4d7] bg-[#fdfaf4] p-4 text-xs text-[#5a463a]">
                <div className="flex items-center gap-2">
                  <Clock3 className="size-4 text-[#bd7b42]" />
                  <span className="font-bold">เริ่ม:</span> {formatEventDate(selectedEvent.startsAt)}
                </div>
                {selectedEvent.endsAt && (
                  <div className="flex items-center gap-2">
                    <Clock3 className="size-4 text-[#bd7b42]" />
                    <span className="font-bold">สิ้นสุด:</span> {formatEventDate(selectedEvent.endsAt)}
                  </div>
                )}
                {selectedEvent.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-[#bd7b42]" />
                    <span className="font-bold">สถานที่:</span> {selectedEvent.location}
                  </div>
                )}
              </div>

              <div className="mt-4">
                <p className="mb-1 text-sm font-semibold text-[#5a463a]">สรุปกิจกรรม:</p>
                <p className="text-sm leading-6 text-[#6a5649]">{selectedEvent.summary}</p>
              </div>

              {selectedEvent.description && (
                <div className="mt-4 border-t border-[#f0e7dc] pt-4">
                  <p className="mb-2 text-sm font-semibold text-[#5a463a]">รายละเอียดเพิ่มเติม:</p>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#4d392f]">
                    {selectedEvent.description}
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#f0e7dc] pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadICS(selectedEvent)}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#e5d6c2] bg-white px-4 py-2.5 text-xs font-bold text-[#8d5e30] shadow-sm hover:bg-[#fff9f0] active:scale-95 transition"
                  >
                    <CalendarPlus className="size-4 text-[#bd7b42]" />
                    เพิ่มลงปฏิทิน (.ics)
                  </button>
                  {selectedEvent.registrationUrl && (
                    <a
                      href={selectedEvent.registrationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#2e7d52] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#256843]"
                    >
                      ลงทะเบียนเข้าร่วม <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="min-h-[44px] rounded-xl border border-[#e8dccb] px-5 py-2.5 text-xs font-bold text-[#6a5649] hover:bg-[#f8f3eb]"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminManager() {
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-bold text-[#5a463a]">
      {label}
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}

function SubmitButtons({
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

export default function Updates() {
  const { user, isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<"feed" | "manage">("feed");
  const canManage = user?.role === "admin";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbf7ee] p-6 text-center text-sm text-[#786455]">
        กำลังตรวจสอบบัญชีผู้ใช้...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fbf7ee] px-5 py-8">
        <div className="mx-auto max-w-lg">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#8d5e30] hover:underline">
            <ArrowLeft className="size-4" />
            กลับหน้าหลัก
          </Link>
          <div className="mt-16 rounded-[28px] border border-[#eadfce] bg-white p-8 text-center shadow-[0_12px_30px_rgba(94,70,42,0.07)]">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#f8eddb] text-[#bd7b42]">
              <Bell className="size-8" />
            </div>
            <h1 className="mt-5 font-display text-2xl font-bold text-[#4c392e]">ติดตามข่าวสารคริสตจักร</h1>
            <p className="mt-2 text-sm leading-6 text-[#6a5649]">
              เข้าสู่ระบบเพื่อดูประกาศ กิจกรรม และข้อมูลอัปเดตสำหรับสมาชิก
            </p>
            <button
              onClick={startLogin}
              className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#bd7b42] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#a86a34] active:scale-95 transition"
            >
              <UsersRound className="size-4" />
              เข้าสู่ระบบ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf7ee] pb-16 text-[#3a2d26]">
      <div className="mx-auto max-w-[1100px] px-5 py-6 sm:px-8 lg:py-10">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <Link
              href="/"
              className="inline-flex min-h-[36px] items-center gap-2 text-xs font-bold text-[#8d5e30] hover:underline"
            >
              <ArrowLeft className="size-4" />
              กลับหน้าหลัก
            </Link>
            <div className="mt-4 flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-2xl bg-[#e7f1fb] text-[#3c6f9e]">
                <Megaphone className="size-6" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold tracking-tight text-[#4b382e]">
                  ข่าวสาร & กิจกรรม
                </h1>
                <p className="mt-1 text-sm text-[#6a5649]">ติดตามสิ่งที่เกิดขึ้นในคริสตจักรบ้านแห่งพระคุณ</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#eee4d7] bg-white/75 px-3.5 py-2 text-xs text-[#5a463a]">
            <Sparkles className="size-4 text-[#bd7b42]" />
            <span>อัปเดตเพื่อการมีส่วนร่วมในชุมชน</span>
          </div>
        </header>

        <div className="mt-8 flex gap-2 rounded-2xl bg-[#f3eadf] p-1.5 sm:w-fit">
          <button
            onClick={() => setActiveTab("feed")}
            className={`min-h-[40px] rounded-xl px-5 py-2 text-sm font-bold transition-all ${
              activeTab === "feed" ? "bg-white text-[#8d5e30] shadow-sm" : "text-[#786455] hover:text-[#4c392e]"
            }`}
          >
            สำหรับสมาชิก
          </button>
          {canManage && (
            <button
              onClick={() => setActiveTab("manage")}
              className={`min-h-[40px] rounded-xl px-5 py-2 text-sm font-bold transition-all ${
                activeTab === "manage" ? "bg-white text-[#8d5e30] shadow-sm" : "text-[#786455] hover:text-[#4c392e]"
              }`}
            >
              <Settings2 className="mr-1.5 inline size-4" />
              จัดการเนื้อหา
            </button>
          )}
        </div>

        {activeTab === "feed" ? (
          <div className="mt-8">
            <MemberFeed />
          </div>
        ) : (
          <AdminManager />
        )}
      </div>
    </div>
  );
}

