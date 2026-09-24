import React from "react";
import { SignUp } from "@clerk/clerk-react";
import { Sprout } from "lucide-react";
import { LegalLinks } from "@/pages/Legal";

export default function Register() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#FFFFFF] via-[#FAF8F5] to-[#F4F1ED] p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 space-y-2 text-center">
          <div className="relative mb-2 inline-flex size-16 items-center justify-center overflow-hidden rounded-2xl border border-[#B9530F]/30 bg-[#B9530F]/15 shadow-xs">
            <Sprout className="size-9 text-[#57504A]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1F1A17]">
            Grace<span className="text-[#B9530F]">-giving</span>
          </h1>
          <p className="text-sm text-[#57504A]">สมัครบัญชีใหม่</p>
        </div>

        <SignUp
          routing="hash"
          signInUrl="/login"
          fallbackRedirectUrl="/"
          forceRedirectUrl="/"
          appearance={{
            variables: {
              colorPrimary: "#B9530F",
              colorBackground: "#FFFFFF",
              borderRadius: "1rem",
            },
          }}
        />
        <LegalLinks />
      </div>
    </div>
  );
}
