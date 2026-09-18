import React from "react";
import { useLocation } from "wouter";
import { Sprout, UserPlus } from "lucide-react";

/**
 * Public self-registration is closed: accounts are issued by the church
 * administrator and roles are assigned in Settings. This page states that
 * plainly rather than offering a form that cannot create an account.
 */
export default function Register() {
  const [, setLocation] = useLocation();

  const steps = [
    "ติดต่อผู้ดูแลระบบหรือเหรัญญิกของคริสตจักร เพื่อขอเปิดบัญชีผู้ใช้",
    "ผู้ดูแลระบบสร้างบัญชีและกำหนดบทบาทให้ เช่น ผู้นับเงิน เหรัญญิก หรือศิษยาภิบาล",
    "เมื่อได้รับบัญชีแล้ว กลับมาที่หน้าเข้าสู่ระบบเพื่อเริ่มใช้งาน",
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#FFFDF8] via-[#FFF9EE] to-[#FFF4DF] p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 space-y-2 text-center">
          <div className="relative mb-2 inline-flex size-16 items-center justify-center overflow-hidden rounded-[24px] border border-[#E99A4A]/30 bg-[#E99A4A]/15 shadow-xs">
            <Sprout className="size-9 text-[#70452E]" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#38251B]">
            Grace <span className="text-[#E99A4A]">Ledger</span>
          </h1>
        </div>

        <div className="space-y-5 rounded-[32px] border border-[#E9D9BF] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-[#FFF4DF] p-3 text-[#E99A4A]">
              <UserPlus className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#38251B]">
                การเปิดบัญชีทำโดยผู้ดูแลระบบ
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-[#674F42]">
                ระบบนี้เก็บข้อมูลการเงินของคริสตจักร
                จึงไม่เปิดให้สมัครสมาชิกเองผ่านหน้าเว็บ
              </p>
            </div>
          </div>

          <ol className="space-y-3">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#FFF4DF] text-sm font-bold text-[#70452E]">
                  {index + 1}
                </span>
                <span className="text-sm leading-relaxed text-[#674F42]">
                  {step}
                </span>
              </li>
            ))}
          </ol>

          <button
            type="button"
            onClick={() => setLocation("/login")}
            className="min-h-11 w-full rounded-2xl bg-[#E99A4A] py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#DE8640]"
          >
            ไปหน้าเข้าสู่ระบบ
          </button>
        </div>
      </div>
    </div>
  );
}
