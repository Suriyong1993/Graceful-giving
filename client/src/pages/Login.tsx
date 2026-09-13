import React, { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Illustration } from "@/components/Illustration";
import { Sprout, Lock, Mail, ArrowRight } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("เข้าสู่ระบบเรียบร้อยแล้ว", {
        description: "ยินดีต้อนรับสู่ Grace Ledger",
      });
      setLocation("/");
    }, 600);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("เข้าสู่ระบบด้วย Google สำเร็จ");
      setLocation("/");
    }, 600);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFDF8] via-[#FFF9EE] to-[#FFF4DF] flex flex-col justify-center items-center p-4 selection:bg-[#F7B6A6]/30">
      <div className="w-full max-w-md">
        {/* Branding & Logo */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[24px] bg-[#E99A4A]/15 border border-[#E99A4A]/30 mb-2 relative overflow-hidden shadow-xs">
            <Sprout className="w-9 h-9 text-[#70452E]" />
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#A8C978] flex items-center justify-center">
              <span className="text-[11px] text-white font-bold">✝</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-3xl font-black text-[#38251B] tracking-tight font-display">
              Grace
            </span>
            <span className="text-3xl font-black text-[#E99A4A] tracking-tight font-display">
              Ledger
            </span>
          </div>
          <p className="text-xs md:text-sm font-medium text-[#927D6D]">
            การเงินเชื่อมใจ เพื่อพันธกิจของพระเจ้า
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-[#E9D9BF] clay-card-shadow space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-extrabold text-[#70452E]">
              เข้าสู่ระบบ
            </h2>
            <p className="text-xs text-[#927D6D]">
              เข้าสู่ระบบเพื่อจัดการการเงินคริสตจักรอย่างโปร่งใส
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#70452E] block">
                อีเมล
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#927D6D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pastor@church.org"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FFFDF8] border border-[#E9D9BF] text-xs sm:text-sm text-[#38251B] focus:outline-none focus:border-[#E99A4A]"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#70452E] block">
                  รหัสผ่าน
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    toast.info("กรุณาติดต่อศิษยาภิบาลหรือผู้ดูแลระบบเพื่อรีเซ็ตรหัสผ่าน");
                  }}
                  className="text-[11px] font-medium text-[#E99A4A] hover:underline"
                >
                  ลืมรหัสผ่าน?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#927D6D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FFFDF8] border border-[#E9D9BF] text-xs sm:text-sm text-[#38251B] focus:outline-none focus:border-[#E99A4A]"
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded text-[#E99A4A] focus:ring-[#E99A4A] w-4 h-4 border-[#E9D9BF]"
              />
              <label htmlFor="rememberMe" className="text-xs text-[#70452E] cursor-pointer">
                จดจำการเข้าสู่ระบบ
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-[#E99A4A] hover:bg-[#DE8640] text-white font-bold text-sm clay-button-shadow transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              <span>{isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-[#E9D9BF] w-full" />
            <span className="bg-white px-3 text-[11px] text-[#927D6D] uppercase font-bold absolute">
              หรือ
            </span>
          </div>

          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-3 rounded-2xl bg-[#FFFDF8] hover:bg-[#FFF4DF] text-[#70452E] font-bold text-xs border border-[#E9D9BF] transition-all flex items-center justify-center gap-2.5 shadow-2xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>เข้าสู่ระบบด้วย Google</span>
          </button>

          {/* Register Link */}
          <div className="text-center pt-2">
            <p className="text-xs text-[#927D6D]">
              ยังไม่มีบัญชีคริสตจักร?{" "}
              <button
                type="button"
                onClick={() => setLocation("/register")}
                className="font-bold text-[#E99A4A] hover:underline"
              >
                สมัครใช้งาน
              </button>
            </p>
          </div>
        </div>

        {/* Footer Scripture */}
        <div className="text-center mt-8 space-y-1">
          <p className="text-xs text-[#70452E] font-medium">
            "ผู้ให้ด้วยใจยินดี พระเจ้าทรงรัก" — 2 โครินธ์ 9:7
          </p>
          <p className="font-script text-xs text-[#927D6D]/80">
            All for His Glory ♥
          </p>
        </div>
      </div>
    </div>
  );
}
