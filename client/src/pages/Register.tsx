import React from "react";
import { SignUp } from "@clerk/clerk-react";
import { Sprout } from "lucide-react";
import { LegalLinks } from "@/pages/Legal";

export default function Register() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center brand-navy-gradient px-4 py-10 overflow-hidden">
      {/* Ambient amber glows — pure decoration, hidden from assistive tech */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-[#F59E0B]/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-[#38BDF8]/15 blur-3xl"
      />

      <div className="relative w-full max-w-md">
        <div className="mb-6 space-y-4 text-center">
          <div className="relative mx-auto mb-1 inline-flex size-16 items-center justify-center overflow-hidden rounded-2xl bg-[#F59E0B] shadow-lg amber-glow">
            <Sprout className="size-9 text-[#0C1B33]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Grace <span className="text-[#FBBF24]">Ledger</span>
            </h1>
            <p className="mt-1 text-sm text-white/60">สมัครบัญชีใหม่</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-[0_24px_60px_-24px_rgba(12,27,51,0.55)] sm:p-8">
          <SignUp
            routing="hash"
            signInUrl="/login"
            fallbackRedirectUrl="/"
            forceRedirectUrl="/"
            appearance={{
              variables: {
                colorPrimary: "#12325C",
                colorBackground: "#FFFFFF",
                colorText: "#0C1B33",
                colorTextSecondary: "#475569",
                borderRadius: "0.75rem",
              },
            }}
          />
          <LegalLinks />
        </div>

        <p className="mt-6 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Grace-giving · All for His Glory
        </p>
      </div>
    </div>
  );
}
