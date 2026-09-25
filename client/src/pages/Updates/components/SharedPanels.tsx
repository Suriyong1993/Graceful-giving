import { CalendarDays, Megaphone } from "lucide-react";

export function EmptyPanel({ type }: { type: "news" | "events" }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#DCE4F0] bg-white/65 px-6 py-12 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#FEF3C7] text-[#B45309]">
        {type === "news" ? (
          <Megaphone className="size-7" strokeWidth={1.5} />
        ) : (
          <CalendarDays className="size-7" strokeWidth={1.5} />
        )}
      </div>
      <p className="mt-4 text-base font-bold text-[#465A75]">
        {type === "news"
          ? "ยังไม่มีข่าวสารเผยแพร่"
          : "ยังไม่มีกิจกรรมที่กำลังจะมาถึง"}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-[#5A6B85]">
        {type === "news"
          ? "เมื่อมีประกาศใหม่ สมาชิกจะเห็นได้ที่หน้านี้ทันที"
          : "กิจกรรมของคริสตจักรจะแสดงที่นี่เพื่อให้สมาชิกวางแผนได้ง่ายขึ้น"}
      </p>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const styles =
    status === "published"
      ? "bg-[#ECFDF5] text-[#047857]"
      : status === "cancelled" || status === "archived"
        ? "bg-[#FEE2E2] text-[#991B1B]"
        : "bg-[#FEF3C7] text-[#92400E]";
  const label =
    status === "published"
      ? "เผยแพร่แล้ว"
      : status === "cancelled"
        ? "ยกเลิก"
        : status === "archived"
          ? "เก็บถาวร"
          : "ฉบับร่าง";
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${styles}`}
    >
      {label}
    </span>
  );
}
