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
  const { data, isLoading } = trpc.updates.adminList.useQuery(undefined, {
    retry: false,
  });
  const createNews = trpc.updates.createNews.useMutation({
    onSuccess: async () => {
      await utils.updates.adminList.invalidate();
      await utils.updates.feed.invalidate();
      toast.success("?????????????????????");
      setNewsOpen(false);
    },
  });
  const createEvent = trpc.updates.createEvent.useMutation({
    onSuccess: async () => {
      await utils.updates.adminList.invalidate();
      await utils.updates.feed.invalidate();
      toast.success("?????????????????????");
      setEventOpen(false);
    },
  });
  const updateNews = trpc.updates.updateNews.useMutation({
    onSuccess: async () => {
      await utils.updates.adminList.invalidate();
      await utils.updates.feed.invalidate();
      toast.success("??????????????????????");
      setNewsOpen(false);
      setEditingNewsId(null);
    },
  });
  const updateEvent = trpc.updates.updateEvent.useMutation({
    onSuccess: async () => {
      await utils.updates.adminList.invalidate();
      await utils.updates.feed.invalidate();
      toast.success("??????????????????????");
      setEventOpen(false);
      setEditingEventId(null);
    },
  });
  const setNewsStatus = trpc.updates.setNewsStatus.useMutation({
    onSuccess: async () => {
      await utils.updates.adminList.invalidate();
      await utils.updates.feed.invalidate();
      toast.success("????????????????????????????");
    },
  });
  const setEventStatus = trpc.updates.setEventStatus.useMutation({
    onSuccess: async () => {
      await utils.updates.adminList.invalidate();
      await utils.updates.feed.invalidate();
      toast.success("????????????????????????????");
    },
  });
  const deleteNews = trpc.updates.deleteNews.useMutation({
    onSuccess: async () => {
      await utils.updates.adminList.invalidate();
      await utils.updates.feed.invalidate();
      toast.success("??????????????????");
      setDeletingNews(null);
    },
  });
  const deleteEvent = trpc.updates.deleteEvent.useMutation({
    onSuccess: async () => {
      await utils.updates.adminList.invalidate();
      await utils.updates.feed.invalidate();
      toast.success("??????????????????");
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
  }>({
    title: "",
    summary: "",
    body: "",
    category: "announcement",
    status: "draft",
  });

  const [eventForm, setEventForm] = useState<{
    title: string;
    summary: string;
    description: string;
    startsAt: string;
    endsAt: string;
    location: string;
    registrationUrl: string;
    status: "draft" | "published" | "cancelled";
  }>({
    title: "",
    summary: "",
    description: "",
    startsAt: "",
    endsAt: "",
    location: "",
    registrationUrl: "",
    status: "draft",
  });

  const filteredNews = useMemo(() => {
    const list = data?.news ?? [];
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q)
    );
  }, [data?.news, query]);

  const filteredEvents = useMemo(() => {
    const list = data?.events ?? [];
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q)
    );
  }, [data?.events, query]);

  const handleNews = (event: FormEvent) => {
    event.preventDefault();
    if (editingNewsId) updateNews.mutate({ id: editingNewsId, ...newsForm });
    else createNews.mutate(newsForm);
  };

  const handleEvent = (event: FormEvent) => {
    event.preventDefault();
    if (
      eventForm.endsAt &&
      new Date(eventForm.endsAt) < new Date(eventForm.startsAt)
    ) {
      toast.error("???-??????????? ??????????????????????-????????????");
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
    setNewsForm({
      title: "",
      summary: "",
      body: "",
      category: "announcement",
      status: "draft",
    });
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
    <section className="mt-10 rounded-2xl border border-[#DCE4F0] bg-[#FFFFFF] p-5 sm:p-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Settings2 className="size-5 text-[#B45309]" />
            <h2 className="font-display text-xl font-bold tracking-tight text-[#465A75]">
              ?????????????
            </h2>
          </div>
          <p className="mt-1 text-sm text-[#5A6B85]">
            ??????????????????????????????????????????
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={openNewNews}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#12325C] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0F2947] shadow-sm active:scale-95 transition"
          >
            <Plus className="size-4" /> ???????????
          </button>
          <button
            onClick={openNewEvent}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[#DCE4F0] bg-white px-4 py-2.5 text-xs font-bold text-[#92400E] hover:bg-[#F6F8FC] shadow-sm active:scale-95 transition"
          >
            <CalendarDays className="size-4" /> ???????????
          </button>
        </div>
      </div>

      <div className="mt-4 relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#64748B]" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="???????????????????????????..."
          className="w-full rounded-2xl border border-[#DCE4F0] bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-[#465A75] focus:border-[#B45309] focus:outline-none"
        />
      </div>

      {isLoading ? (
        <div className="mt-5 h-20 animate-pulse rounded-2xl bg-white/70" />
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {/* Admin News List */}
          <div className="rounded-2xl border border-[#DCE4F0] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-[#465A75]">??????????????</p>
              <span className="text-xs font-semibold text-[#64748B]">
                {filteredNews.length} ??????
              </span>
            </div>
            {filteredNews.length ? (
              <div className="max-h-[380px] overflow-y-auto divide-y divide-[#DCE4F0] pr-1">
                {filteredNews.map(item => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#FEF3C7] text-[#B45309]">
                        <Megaphone className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#465A75]">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-[#64748B]">
                          {formatThaiDate(item.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        aria-label={`???????????? ${item.title}`}
                        className="grid min-h-[36px] min-w-[36px] place-items-center rounded-lg text-[#92400E] hover:bg-[#FEF3C7]"
                        onClick={() => beginNewsEdit(item)}
                      >
                        <PencilLine className="size-4" />
                      </button>
                      <button
                        aria-label={`????????? ${item.title}`}
                        className="grid min-h-[36px] min-w-[36px] place-items-center rounded-lg text-[#DC2626] hover:bg-[#FEF2F2]"
                        onClick={() => setDeletingNews(item)}
                      >
                        <Trash2 className="size-4" />
                      </button>
                      <StatusPill status={item.status} />
                      {item.status === "draft" && (
                        <button
                          className="min-h-[36px] px-2 text-xs font-bold text-[#047857] hover:underline"
                          onClick={() =>
                            setNewsStatus.mutate({
                              id: item.id,
                              status: "published",
                            })
                          }
                        >
                          ???????
                        </button>
                      )}
                      {item.status === "published" && (
                        <button
                          className="min-h-[36px] px-2 text-xs font-bold text-[#991B1B] hover:underline"
                          onClick={() =>
                            setNewsStatus.mutate({
                              id: item.id,
                              status: "archived",
                            })
                          }
                        >
                          ????????
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-xs text-[#64748B]">
                ????????????
              </p>
            )}
          </div>

          {/* Admin Events List */}
          <div className="rounded-2xl border border-[#DCE4F0] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-[#465A75]">??????????????</p>
              <span className="text-xs font-semibold text-[#64748B]">
                {filteredEvents.length} ??????
              </span>
            </div>
            {filteredEvents.length ? (
              <div className="max-h-[380px] overflow-y-auto divide-y divide-[#DCE4F0] pr-1">
                {filteredEvents.map(item => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#EFF6FF] text-[#1D4ED8]">
                        <CalendarDays className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#465A75]">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-[#1D4ED8]">
                          {formatEventDate(item.startsAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        aria-label={`???????????? ${item.title}`}
                        className="grid min-h-[36px] min-w-[36px] place-items-center rounded-lg text-[#1D4ED8] hover:bg-[#EFF6FF]"
                        onClick={() => beginEventEdit(item)}
                      >
                        <PencilLine className="size-4" />
                      </button>
                      <button
                        aria-label={`????????? ${item.title}`}
                        className="grid min-h-[36px] min-w-[36px] place-items-center rounded-lg text-[#DC2626] hover:bg-[#FEF2F2]"
                        onClick={() => setDeletingEvent(item)}
                      >
                        <Trash2 className="size-4" />
                      </button>
                      <StatusPill status={item.status} />
                      {item.status === "draft" && (
                        <button
                          className="min-h-[36px] px-2 text-xs font-bold text-[#047857] hover:underline"
                          onClick={() =>
                            setEventStatus.mutate({
                              id: item.id,
                              status: "published",
                            })
                          }
                        >
                          ???????
                        </button>
                      )}
                      {item.status === "published" && (
                        <button
                          className="min-h-[36px] px-2 text-xs font-bold text-[#991B1B] hover:underline"
                          onClick={() =>
                            setEventStatus.mutate({
                              id: item.id,
                              status: "cancelled",
                            })
                          }
                        >
                          ??????
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-xs text-[#64748B]">
                ????????????
              </p>
            )}
          </div>
        </div>
      )}

      {/* Admin News Create/Edit Dialog */}
      <Dialog open={newsOpen} onOpenChange={setNewsOpen}>
        <DialogContent className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border-[#DCE4F0] bg-[#FFFFFF] p-6 shadow-2xl">
          <form onSubmit={handleNews}>
            <DialogHeader className="text-left">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-[#FEF3C7] text-[#B45309]">
                  <Megaphone className="size-5" />
                </span>
                <div>
                  <DialogTitle className="font-display text-xl font-bold text-[#465A75]">
                    {editingNewsId ? "????????????" : "????????????????"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-[#5A6B85]">
                    ??????????????????????????????????????????
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="mt-5 space-y-4">
              <Field label="?????????????">
                <input
                  required
                  maxLength={180}
                  value={newsForm.title}
                  onChange={event =>
                    setNewsForm({ ...newsForm, title: event.target.value })
                  }
                  placeholder="???? ???????????????????????????"
                  className="w-full rounded-xl border border-[#DCE4F0] px-3.5 py-2.5 text-sm text-[#465A75] focus:border-[#B45309] focus:outline-none"
                />
              </Field>
              <Field label="???????? ?">
                <input
                  required
                  maxLength={280}
                  value={newsForm.summary}
                  onChange={event =>
                    setNewsForm({ ...newsForm, summary: event.target.value })
                  }
                  placeholder="??????????????????????????????"
                  className="w-full rounded-xl border border-[#DCE4F0] px-3.5 py-2.5 text-sm text-[#465A75] focus:border-[#B45309] focus:outline-none"
                />
              </Field>
              <Field label="??????????">
                <textarea
                  required
                  rows={5}
                  value={newsForm.body}
                  onChange={event =>
                    setNewsForm({ ...newsForm, body: event.target.value })
                  }
                  placeholder="??????????????????????..."
                  className="w-full rounded-xl border border-[#DCE4F0] px-3.5 py-2.5 text-sm text-[#465A75] focus:border-[#B45309] focus:outline-none"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="????????">
                  <select
                    value={newsForm.category}
                    onChange={event =>
                      setNewsForm({
                        ...newsForm,
                        category: event.target
                          .value as typeof newsForm.category,
                      })
                    }
                    className="w-full rounded-xl border border-[#DCE4F0] bg-white px-3.5 py-2.5 text-sm text-[#465A75]"
                  >
                    <option value="announcement">??????</option>
                    <option value="ministry">???????</option>
                    <option value="finance">???????</option>
                    <option value="pastoral">?????????</option>
                  </select>
                </Field>
                <Field label="?????">
                  <select
                    value={newsForm.status}
                    onChange={event =>
                      setNewsForm({
                        ...newsForm,
                        status: event.target.value as typeof newsForm.status,
                      })
                    }
                    className="w-full rounded-xl border border-[#DCE4F0] bg-white px-3.5 py-2.5 text-sm text-[#465A75]"
                  >
                    <option value="draft">????????</option>
                    <option value="published">????????????</option>
                    <option value="archived">????????</option>
                  </select>
                </Field>
              </div>
            </div>
            <SubmitButtons
              pending={createNews.isPending || updateNews.isPending}
              onCancel={() => setNewsOpen(false)}
              label={editingNewsId ? "??????????????" : "?????????????"}
            />
          </form>
        </DialogContent>
      </Dialog>

      {/* Admin Event Create/Edit Dialog */}
      <Dialog open={eventOpen} onOpenChange={setEventOpen}>
        <DialogContent className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border-[#DCE4F0] bg-[#FFFFFF] p-6 shadow-2xl">
          <form onSubmit={handleEvent}>
            <DialogHeader className="text-left">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-[#EFF6FF] text-[#1D4ED8]">
                  <CalendarDays className="size-5" />
                </span>
                <div>
                  <DialogTitle className="font-display text-xl font-bold text-[#465A75]">
                    {editingEventId ? "????????????" : "????????????????"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-[#5A6B85]">
                    ???????????????????????????????
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="mt-5 space-y-4">
              <Field label="???????????">
                <input
                  required
                  maxLength={180}
                  value={eventForm.title}
                  onChange={event =>
                    setEventForm({ ...eventForm, title: event.target.value })
                  }
                  placeholder="???? ??????????????????????????"
                  className="w-full rounded-xl border border-[#DCE4F0] px-3.5 py-2.5 text-sm text-[#465A75] focus:border-[#B45309] focus:outline-none"
                />
              </Field>
              <Field label="???????? ?">
                <input
                  required
                  maxLength={280}
                  value={eventForm.summary}
                  onChange={event =>
                    setEventForm({ ...eventForm, summary: event.target.value })
                  }
                  placeholder="?????????????????????????????"
                  className="w-full rounded-xl border border-[#DCE4F0] px-3.5 py-2.5 text-sm text-[#465A75] focus:border-[#B45309] focus:outline-none"
                />
              </Field>
              <Field label="??????????">
                <textarea
                  required
                  rows={4}
                  value={eventForm.description}
                  onChange={event =>
                    setEventForm({
                      ...eventForm,
                      description: event.target.value,
                    })
                  }
                  placeholder="?????????????????..."
                  className="w-full rounded-xl border border-[#DCE4F0] px-3.5 py-2.5 text-sm text-[#465A75] focus:border-[#B45309] focus:outline-none"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="??????????????????">
                  <input
                    required
                    type="datetime-local"
                    value={eventForm.startsAt}
                    onChange={event =>
                      setEventForm({
                        ...eventForm,
                        startsAt: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-[#DCE4F0] px-3.5 py-2.5 text-sm text-[#465A75] focus:border-[#B45309] focus:outline-none"
                  />
                </Field>
                <Field label="??????? (?????)">
                  <input
                    type="datetime-local"
                    value={eventForm.endsAt}
                    onChange={event =>
                      setEventForm({ ...eventForm, endsAt: event.target.value })
                    }
                    className="w-full rounded-xl border border-[#DCE4F0] px-3.5 py-2.5 text-sm text-[#465A75] focus:border-[#B45309] focus:outline-none"
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="???????">
                  <input
                    value={eventForm.location}
                    onChange={event =>
                      setEventForm({
                        ...eventForm,
                        location: event.target.value,
                      })
                    }
                    placeholder="???? ??????????????"
                    className="w-full rounded-xl border border-[#DCE4F0] px-3.5 py-2.5 text-sm text-[#465A75] focus:border-[#B45309] focus:outline-none"
                  />
                </Field>
                <Field label="??????????????">
                  <input
                    type="url"
                    value={eventForm.registrationUrl}
                    onChange={event =>
                      setEventForm({
                        ...eventForm,
                        registrationUrl: event.target.value,
                      })
                    }
                    placeholder="https://..."
                    className="w-full rounded-xl border border-[#DCE4F0] px-3.5 py-2.5 text-sm text-[#465A75] focus:border-[#B45309] focus:outline-none"
                  />
                </Field>
              </div>
              <Field label="?????">
                <select
                  value={eventForm.status}
                  onChange={event =>
                    setEventForm({
                      ...eventForm,
                      status: event.target.value as typeof eventForm.status,
                    })
                  }
                  className="w-full rounded-xl border border-[#DCE4F0] bg-white px-3.5 py-2.5 text-sm text-[#465A75]"
                >
                  <option value="draft">????????</option>
                  <option value="published">????????????</option>
                  <option value="cancelled">??????</option>
                </select>
              </Field>
            </div>
            <SubmitButtons
              pending={createEvent.isPending || updateEvent.isPending}
              onCancel={() => setEventOpen(false)}
              label={editingEventId ? "??????????????" : "?????????????"}
            />
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete News Confirmation Dialog */}
      <Dialog
        open={!!deletingNews}
        onOpenChange={open => !open && setDeletingNews(null)}
      >
        <DialogContent className="w-full max-w-sm rounded-2xl border-[#DCE4F0] bg-[#FFFFFF] p-6 shadow-2xl">
          {deletingNews && (
            <>
              <DialogHeader className="text-left">
                <div className="flex items-center gap-3 text-[#DC2626]">
                  <div className="grid size-11 place-items-center rounded-2xl bg-[#FEF2F2]">
                    <AlertTriangle className="size-6" />
                  </div>
                  <div>
                    <DialogTitle className="font-display text-lg font-bold text-[#465A75]">
                      ??????????????????
                    </DialogTitle>
                    <DialogDescription className="text-xs text-[#5A6B85]">
                      ???????????????????????????????????
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <p className="mt-3 rounded-xl bg-[#FEF2F2] p-3 text-xs font-semibold text-[#7F1D1D]">
                ????????? &ldquo;{deletingNews.title}&rdquo; ??????????????????
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingNews(null)}
                  className="min-h-[44px] rounded-xl border border-[#DCE4F0] py-2.5 text-xs font-bold text-[#5A6B85] hover:bg-[#F6F8FC]"
                >
                  ??????
                </button>
                <button
                  type="button"
                  disabled={deleteNews.isPending}
                  onClick={() => deleteNews.mutate({ id: deletingNews.id })}
                  className="min-h-[44px] rounded-xl bg-[#DC2626] py-2.5 text-xs font-bold text-white hover:bg-[#991B1B] disabled:opacity-60"
                >
                  {deleteNews.isPending ? "???????..." : "????????"}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Event Confirmation Dialog */}
      <Dialog
        open={!!deletingEvent}
        onOpenChange={open => !open && setDeletingEvent(null)}
      >
        <DialogContent className="w-full max-w-sm rounded-2xl border-[#DCE4F0] bg-[#FFFFFF] p-6 shadow-2xl">
          {deletingEvent && (
            <>
              <DialogHeader className="text-left">
                <div className="flex items-center gap-3 text-[#DC2626]">
                  <div className="grid size-11 place-items-center rounded-2xl bg-[#FEF2F2]">
                    <AlertTriangle className="size-6" />
                  </div>
                  <div>
                    <DialogTitle className="font-display text-lg font-bold text-[#465A75]">
                      ??????????????????
                    </DialogTitle>
                    <DialogDescription className="text-xs text-[#5A6B85]">
                      ???????????????????????????????????
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <p className="mt-3 rounded-xl bg-[#FEF2F2] p-3 text-xs font-semibold text-[#7F1D1D]">
                ???????????????? &ldquo;{deletingEvent.title}&rdquo; ????????
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingEvent(null)}
                  className="min-h-[44px] rounded-xl border border-[#DCE4F0] py-2.5 text-xs font-bold text-[#5A6B85] hover:bg-[#F6F8FC]"
                >
                  ??????
                </button>
                <button
                  type="button"
                  disabled={deleteEvent.isPending}
                  onClick={() => deleteEvent.mutate({ id: deletingEvent.id })}
                  className="min-h-[44px] rounded-xl bg-[#DC2626] py-2.5 text-xs font-bold text-white hover:bg-[#991B1B] disabled:opacity-60"
                >
                  {deleteEvent.isPending ? "???????..." : "????????"}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs font-bold text-[#465A75]">
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
        className="min-h-[44px] rounded-xl border border-[#DCE4F0] py-3 text-sm font-bold text-[#5A6B85] hover:bg-[#F6F8FC]"
      >
        ??????
      </button>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#12325C] py-3 text-sm font-bold text-white hover:bg-[#0F2947] disabled:opacity-60 shadow-sm"
      >
        {pending ? (
          <Clock3 className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
        {pending ? "???????????..." : label}
      </button>
    </div>
  );
}
