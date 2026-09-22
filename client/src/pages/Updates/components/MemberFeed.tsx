import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  Clock3,
  ExternalLink,
  MapPin,
  Tag,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  categoryLabels,
  downloadICS,
  EmptyPanel,
  formatEventDate,
  formatThaiDate,
  NewsCategory,
  StatusPill,
} from "./updatesUtils";

export function MemberFeed() {
  const { data, isLoading, error, refetch } = trpc.updates.feed.useQuery(
    undefined,
    { retry: false }
  );
  const news = data?.news ?? [];
  const events = data?.events ?? [];

  type NewsItem = NonNullable<typeof data>["news"][number];
  type EventItem = NonNullable<typeof data>["events"][number];

  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [newsCategoryFilter, setNewsCategoryFilter] = useState<
    "all" | NewsCategory
  >("all");

  const filteredNews = useMemo(() => {
    if (newsCategoryFilter === "all") return news;
    return news.filter(item => item.category === newsCategoryFilter);
  }, [news, newsCategoryFilter]);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-44 animate-pulse rounded-xl bg-card/70" />
        <div className="h-44 animate-pulse rounded-xl bg-card/70" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-[#f5c6cb] bg-[#fff0eb] p-6 text-center text-sm text-[#8a3928]">
        <p className="font-bold text-[#9e3825]">
          ไม่สามารถโหลดข้อมูลข่าวสารได้ในขณะนี้
        </p>
        <p className="mt-1 text-xs text-[#704d44]">
          {error.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย"}
        </p>
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
            <p className="font-display text-xl font-bold tracking-tight text-[#49372d]">
              ข่าวสารล่าสุด
            </p>
            <p className="mt-1 text-xs text-[#6a5649]">
              ประกาศและเรื่องราวพระคุณจากคริสตจักร
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#f8eddb] px-3 py-1 text-[11px] font-bold text-[#8d5e30]">
              {filteredNews.length} รายการ
            </span>
          </div>
        </div>

        {/* Category tabs for news */}
        <div
          className="mb-4 flex flex-wrap gap-1.5"
          role="tablist"
          aria-label="กรองหมวดหมู่ข่าวสาร"
        >
          {(
            ["all", "announcement", "ministry", "finance", "pastoral"] as const
          ).map(cat => (
            <button
              key={cat}
              role="tab"
              aria-selected={newsCategoryFilter === cat}
              onClick={() => setNewsCategoryFilter(cat)}
              className={`min-h-11 rounded-full px-3.5 py-2 text-xs font-bold transition-all ${
                newsCategoryFilter === cat
                  ? "bg-[#bd7b42] text-white shadow-sm"
                  : "bg-card/80 text-[#6a5649] hover:bg-card hover:text-[#49372d] border border-[#e8dccb]"
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
            {filteredNews.map(item => (
              <article
                key={item.id}
                onClick={() => setSelectedNews(item)}
                tabIndex={0}
                role="button"
                aria-label={`ดูข่าวสาร: ${item.title}`}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedNews(item);
                  }
                }}
                className="group cursor-pointer rounded-xl border border-[#eee4d7] bg-card p-5 shadow-xs transition focus:outline-none focus:ring-2 focus:ring-[#bd7b42]"
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
                <p className="mt-2 text-sm leading-6 text-[#6a5649] line-clamp-3">
                  {item.summary}
                </p>
                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-[#9e5d26]">
                  อ่านรายละเอียด{" "}
                  <ChevronRight className="size-3.5 transition" />
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
            <p className="font-display text-xl font-bold tracking-tight text-[#49372d]">
              กิจกรรมที่กำลังจะมาถึง
            </p>
            <p className="mt-1 text-xs text-[#6a5649]">
              วางแผนร่วมรับใช้และสามัคคีธรรมด้วยกัน
            </p>
          </div>
          <span className="rounded-full bg-[#e7f1fb] px-3 py-1 text-[11px] font-bold text-[#356792]">
            {events.length} กิจกรรม
          </span>
        </div>
        {events.length === 0 ? (
          <EmptyPanel type="events" />
        ) : (
          <div className="space-y-3">
            {events.map(event => (
              <article
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                tabIndex={0}
                role="button"
                aria-label={`ดูกิจกรรม: ${event.title}`}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedEvent(event);
                  }
                }}
                className="group flex cursor-pointer gap-4 rounded-xl border border-[#eee4d7] bg-card p-4 shadow-xs transition focus:outline-none focus:ring-2 focus:ring-[#bd7b42]"
              >
                <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#e9f3ff] text-[#3c6f9e]">
                  <CalendarDays className="size-5" />
                  <span className="mt-0.5 text-[11px] font-bold">
                    {new Date(event.startsAt).getDate()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-[#4d392f] group-hover:text-[#9e5d26] transition-colors">
                    {event.title}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-[#3b6d9c]">
                    {formatEventDate(event.startsAt)}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#6a5649]">
                    {event.summary}
                  </p>
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
      <Dialog
        open={!!selectedNews}
        onOpenChange={open => !open && setSelectedNews(null)}
      >
        <DialogContent className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border-[#eee4d7] bg-[#fffdf8] p-6 shadow-xs">
          {selectedNews && (
            <>
              <DialogHeader className="space-y-2 text-left">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff3de] px-3 py-1 text-xs font-bold text-[#8d5e30]">
                    <Tag className="size-3.5" />
                    {categoryLabels[selectedNews.category]}
                  </span>
                  <span className="text-xs font-medium text-[#786455]">
                    {formatThaiDate(
                      selectedNews.publishedAt ?? selectedNews.createdAt
                    )}
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
                <p className="mb-2 text-sm font-semibold text-[#5a463a]">
                  เนื้อหาฉบับเต็ม:
                </p>
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
      <Dialog
        open={!!selectedEvent}
        onOpenChange={open => !open && setSelectedEvent(null)}
      >
        <DialogContent className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border-[#eee4d7] bg-[#fffdf8] p-6 shadow-xs">
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
                  <span className="font-bold">เริ่ม:</span>{" "}
                  {formatEventDate(selectedEvent.startsAt)}
                </div>
                {selectedEvent.endsAt && (
                  <div className="flex items-center gap-2">
                    <Clock3 className="size-4 text-[#bd7b42]" />
                    <span className="font-bold">สิ้นสุด:</span>{" "}
                    {formatEventDate(selectedEvent.endsAt)}
                  </div>
                )}
                {selectedEvent.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-[#bd7b42]" />
                    <span className="font-bold">สถานที่:</span>{" "}
                    {selectedEvent.location}
                  </div>
                )}
              </div>

              <div className="mt-4">
                <p className="mb-1 text-sm font-semibold text-[#5a463a]">
                  สรุปกิจกรรม:
                </p>
                <p className="text-sm leading-6 text-[#6a5649]">
                  {selectedEvent.summary}
                </p>
              </div>

              {selectedEvent.description && (
                <div className="mt-4 border-t border-[#f0e7dc] pt-4">
                  <p className="mb-2 text-sm font-semibold text-[#5a463a]">
                    รายละเอียดเพิ่มเติม:
                  </p>
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
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#e5d6c2] bg-card px-4 py-2.5 text-xs font-bold text-[#8d5e30] shadow-sm hover:bg-[#fff9f0] active:scale-95 transition"
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
