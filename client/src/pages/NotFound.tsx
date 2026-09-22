import { ArrowLeft, BookOpen, Compass, Home } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#fbf7ee] p-4 text-[#3a2d26]">
      <div className="w-full max-w-md rounded-xl border border-[#efe2d1] bg-card p-8 sm:p-10 text-center shadow-xs">
        <div className="mx-auto mb-6 grid size-20 place-items-center rounded-3xl bg-[#fdf2e2] text-[#bd7b42]">
          <Compass className="size-10 animate-pulse" strokeWidth={1.75} />
        </div>

        <p className="font-display text-4xl font-bold tracking-tight text-[#bd7b42]">
          404
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-[#4c392e]">
          ไม่พบหน้าที่คุณต้องการ
        </h1>

        <p className="mt-3 text-sm leading-6 text-[#6a5649]">
          หน้าที่คุณกำลังค้นหาอาจถูกย้าย ลบออก หรือพิมพ์ที่อยู่ URL ไม่ถูกต้อง
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => setLocation("/")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#bd7b42] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#a86a34]"
          >
            <Home className="size-4" />
            กลับหน้าหลัก
          </button>
          <Link
            href="/updates"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e5d8c8] bg-[#fffcf7] px-6 py-3 text-sm font-bold text-[#6a5649] transition hover:bg-[#f5eee3]"
          >
            <BookOpen className="size-4 text-[#bd7b42]" />
            ข่าวสาร & กิจกรรม
          </Link>
        </div>
      </div>
    </div>
  );
}
