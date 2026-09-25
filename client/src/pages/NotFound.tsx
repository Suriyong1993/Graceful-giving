import { ArrowLeft, BookOpen, Compass, Home } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center brand-navy-gradient px-4 py-12 overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-10 size-72 rounded-full bg-[#F59E0B]/20 blur-3xl"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white p-8 text-center shadow-[0_24px_60px_-24px_rgba(12,27,51,0.55)] sm:p-10">
        <div className="mx-auto mb-6 grid size-20 place-items-center rounded-2xl bg-[#FEF3C7] text-[#B45309]">
          <Compass className="size-10" strokeWidth={1.75} />
        </div>

        <p className="font-display text-5xl font-bold tracking-tight text-[#12325C]">
          404
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-[#0C1B33]">
          ไม่พบหน้าที่คุณต้องการ
        </h1>

        <p className="mt-3 text-sm leading-6 text-[#475569]">
          หน้าที่คุณกำลังค้นหาอาจถูกย้าย ลบออก หรือพิมพ์ที่อยู่ URL ไม่ถูกต้อง
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => setLocation("/")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#12325C] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#0F2947]"
          >
            <Home className="size-4" />
            กลับหน้าหลัก
          </button>
          <Link
            href="/updates"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DDE5F0] bg-[#FFFFFF] px-6 py-3 text-sm font-bold text-[#475569] transition hover:bg-[#EEF2F8]"
          >
            <BookOpen className="size-4 text-[#B45309]" />
            ข่าวสาร & กิจกรรม
          </Link>
        </div>
      </div>
    </div>
  );
}
