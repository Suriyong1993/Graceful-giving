import React from "react";
import { SignIn } from "@clerk/clerk-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Sprout } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) setLocation("/");
  }, [loading, isAuthenticated, setLocation]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center brand-navy-gradient px-4 py-10 overflow-hidden">
      {/* Ambient amber glows — pure decoration, hidden from assistive tech */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-[#F59E0B]/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-16 size-96 rounded-full bg-[#38BDF8]/15 blur-3xl"
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
            <p className="mt-1 text-sm text-white/60">
              ระบบบัญชีการเงินคริสตจักร
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-[0_24px_60px_-24px_rgba(12,27,51,0.55)] sm:p-8">
          {/* Clerk Sign-In component — handles all auth providers */}
          <SignIn
            routing="hash"
            signUpUrl="/register"
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
        </div>

        <p className="mt-6 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Grace-giving · All for His Glory
        </p>
      </div>
    </div>
  );
}
