import { BookOpen, Home } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-page p-4 text-ink">
      <div className="w-full max-w-md rounded-xl border border-line bg-card p-8 sm:p-10 text-center shadow-xs">
        <p className="font-display text-4xl font-bold tracking-tight text-brand">
          404
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-ink-2">
          ไม่พบหน้าที่คุณต้องการ
        </h1>

        <p className="mt-3 text-sm leading-6 text-ink-2">
          หน้าที่คุณกำลังค้นหาอาจถูกย้าย ลบออก หรือพิมพ์ที่อยู่ URL ไม่ถูกต้อง
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => setLocation("/")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-ink-3"
          >
            <Home className="size-4" />
            กลับหน้าหลัก
          </button>
          <Link
            href="/updates"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-page px-6 py-3 text-sm font-bold text-ink-2 transition hover:bg-sunken"
          >
            <BookOpen className="size-4 text-brand" />
            ข่าวสาร & กิจกรรม
          </Link>
        </div>
      </div>
    </div>
  );
}
