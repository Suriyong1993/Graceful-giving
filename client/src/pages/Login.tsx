import React from "react";
import { SignIn } from "@clerk/clerk-react";
import { useAuth } from "@/_core/hooks/useAuth";
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

        {/* Clerk Sign-In component — handles all auth providers */}
        <SignIn
          routing="hash"
          signUpUrl="/register"
          afterSignInUrl="/"
          appearance={{
            variables: {
              colorPrimary: "#E99A4A",
              colorBackground: "#FFFDF8",
              borderRadius: "1rem",
            },
          }}
        />
      </div>
    </div>
  );
}
