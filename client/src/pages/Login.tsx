import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { Illustration } from "@/components/Illustration";
import { ArrowRight, ShieldCheck, Sprout } from "lucide-react";

/**
 * Sign-in is handled by the church OAuth server. There is no local password
 * form, because the API exposes no password login — a form here could only
 * pretend to work.
 */
export default function Login() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) setLocation("/");
  }, [loading, isAuthenticated, setLocation]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#FFFDF8] via-[#FFF9EE] to-[#FFF4DF] p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 space-y-2 text-center">
          <div className="relative mb-2 inline-flex size-16 items-center justify-center overflow-hidden rounded-[24px] border border-[#E99A4A]/30 bg-[#E99A4A]/15 shadow-xs">
            <Sprout className="size-9 text-[#70452E]" />
            <div className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#A8C978]">
              <span className="text-[11px] font-bold text-white">✝</span>
            </div>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#38251B]">
            Grace <span className="text-[#E99A4A]">Ledger</span>
          </h1>
          <p className="text-sm text-[#674F42]">ระบบบัญชีการเงินคริสตจักร</p>
        </div>

        <div className="space-y-5 rounded-[32px] border border-[#E9D9BF] bg-white p-6 shadow-sm sm:p-8">
          <div className="mx-auto size-24 overflow-hidden rounded-3xl border border-[#E9D9BF] bg-[#FFF4DF] p-1">
            <Illustration
              src="/illustrations/bible_cross.jpg"
              alt="พระคัมภีร์และกางเขน"
              className="size-full rounded-2xl object-cover"
              width={96}
              height={96}
            />
          </div>

          <div className="space-y-1 text-center">
            <h2 className="text-lg font-bold text-[#38251B]">เข้าสู่ระบบ</h2>
            <p className="text-sm leading-relaxed text-[#674F42]">
              ใช้บัญชีที่คริสตจักรออกให้
              ระบบจะพาไปยืนยันตัวตนที่หน้าเข้าสู่ระบบกลาง
              แล้วกลับมาที่นี่โดยอัตโนมัติ
            </p>
          </div>

          <button
            type="button"
            onClick={() => startLogin()}
            disabled={loading}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#E99A4A] py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#DE8640] disabled:opacity-50"
          >
            <span>{loading ? "กำลังตรวจสอบบัญชี…" : "เข้าสู่ระบบ"}</span>
            <ArrowRight className="size-4" />
          </button>

          <div className="flex items-start gap-2 rounded-2xl border border-[#E9D9BF] bg-[#FFF9EE] p-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#4F8B33]" />
            <p className="text-sm leading-relaxed text-[#674F42]">
              ข้อมูลการเงินเปิดให้เฉพาะผู้ที่ได้รับสิทธิ์
              หากเข้าสู่ระบบแล้วยังไม่เห็นเมนูการเงิน
              กรุณาติดต่อผู้ดูแลระบบของคริสตจักร
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-[#674F42]">
          ยังไม่มีบัญชี?{" "}
          <button
            type="button"
            onClick={() => setLocation("/register")}
            className="font-bold text-[#E99A4A] underline-offset-2 hover:underline"
          >
            วิธีขอเปิดบัญชี
          </button>
        </p>
      </div>
    </div>
  );
}
