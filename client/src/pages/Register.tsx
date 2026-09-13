import React, { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Sprout, Building2, User, Mail, Lock, Phone, ArrowRight, Check } from "lucide-react";

export default function Register() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    churchName: "",
    adminName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!formData.churchName || !formData.adminName) {
        toast.error("กรุณากรอกข้อมูลคริสตจักรและชื่อผู้ดูแล");
        return;
      }
      setStep(2);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("สร้างบัญชีคริสตจักรสำเร็จ!", {
        description: "เริ่มต้นการตั้งค่าระบบ 8 ขั้นตอนสำหรับคริสตจักรของคุณ",
      });
      setLocation("/setup");
    }, 600);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFDF8] via-[#FFF9EE] to-[#FFF4DF] flex flex-col justify-center items-center p-4 selection:bg-[#F7B6A6]/30">
      <div className="w-full max-w-md">
        {/* Branding & Logo */}
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-[22px] bg-[#E99A4A]/15 border border-[#E99A4A]/30 mb-1 relative overflow-hidden shadow-xs">
            <Sprout className="w-8 h-8 text-[#70452E]" />
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#A8C978] flex items-center justify-center">
              <span className="text-[9px] text-white font-bold">✝</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-[#38251B] tracking-tight font-display">
              Grace
            </span>
            <span className="text-2xl sm:text-3xl font-black text-[#E99A4A] tracking-tight font-display">
              Ledger
            </span>
          </div>
          <p className="text-xs text-[#927D6D]">
            ลงทะเบียนคริสตจักรเพื่อเริ่มต้นใช้งานระบบการเงินโปร่งใส
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="flex items-center gap-1.5">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= 1
                  ? "bg-[#E99A4A] text-white shadow-2xs"
                  : "bg-white text-[#927D6D] border border-[#E9D9BF]"
              }`}
            >
              {step > 1 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "1"}
            </div>
            <span className="text-xs font-bold text-[#70452E]">ข้อมูลคริสตจักร</span>
          </div>
          <div className="w-8 h-0.5 bg-[#E9D9BF]" />
          <div className="flex items-center gap-1.5">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 2
                  ? "bg-[#E99A4A] text-white shadow-2xs"
                  : "bg-white text-[#927D6D] border border-[#E9D9BF]"
              }`}
            >
              2
            </div>
            <span className="text-xs font-bold text-[#70452E]">บัญชีผู้ดูแล</span>
          </div>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-[#E9D9BF] clay-card-shadow space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#70452E] block">
                    ชื่อคริสตจักร
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-[#927D6D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={formData.churchName}
                      onChange={(e) =>
                        setFormData({ ...formData, churchName: e.target.value })
                      }
                      placeholder="เช่น คริสตจักรพระคุณสมบูรณ์ กรุงเทพฯ"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FFFDF8] border border-[#E9D9BF] text-xs sm:text-sm text-[#38251B] focus:outline-none focus:border-[#E99A4A]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#70452E] block">
                    ชื่อผู้ดูแลระบบ / ศิษยาภิบาล / เหรัญญิก
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#927D6D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={formData.adminName}
                      onChange={(e) =>
                        setFormData({ ...formData, adminName: e.target.value })
                      }
                      placeholder="ชื่อ-นามสกุลของคุณ"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FFFDF8] border border-[#E9D9BF] text-xs sm:text-sm text-[#38251B] focus:outline-none focus:border-[#E99A4A]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#70452E] block">
                    เบอร์โทรศัพท์ติดต่อ
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#927D6D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="081-234-5678"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FFFDF8] border border-[#E9D9BF] text-xs sm:text-sm text-[#38251B] focus:outline-none focus:border-[#E99A4A]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-[#E99A4A] hover:bg-[#DE8640] text-white font-bold text-sm clay-button-shadow transition-all flex items-center justify-center gap-2 mt-4"
                >
                  <span>ถัดไป: ข้อมูลเข้าสู่ระบบ</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#70452E] block">
                    อีเมลสำหรับเข้าสู่ระบบ
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#927D6D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="pastor@church.org"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FFFDF8] border border-[#E9D9BF] text-xs sm:text-sm text-[#38251B] focus:outline-none focus:border-[#E99A4A]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#70452E] block">
                    รหัสผ่าน
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#927D6D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      placeholder="อย่างน้อย 8 ตัวอักษร"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FFFDF8] border border-[#E9D9BF] text-xs sm:text-sm text-[#38251B] focus:outline-none focus:border-[#E99A4A]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#70452E] block">
                    ยืนยันรหัสผ่าน
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#927D6D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder="กรอกรหัสผ่านอีกครั้ง"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FFFDF8] border border-[#E9D9BF] text-xs sm:text-sm text-[#38251B] focus:outline-none focus:border-[#E99A4A]"
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3.5 rounded-2xl bg-[#FFF4DF] text-[#70452E] font-bold text-xs border border-[#E9D9BF] transition-all"
                  >
                    ← ย้อนกลับ
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-2 py-3.5 rounded-2xl bg-[#E99A4A] hover:bg-[#DE8640] text-white font-bold text-sm clay-button-shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>{isLoading ? "กำลังสร้างบัญชี..." : "สร้างบัญชีคริสตจักร"}</span>
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Login Link */}
          <div className="text-center pt-2 border-t border-[#E9D9BF]/60">
            <p className="text-xs text-[#927D6D]">
              มีบัญชีคริสตจักรอยู่แล้ว?{" "}
              <button
                type="button"
                onClick={() => setLocation("/login")}
                className="font-bold text-[#E99A4A] hover:underline"
              >
                เข้าสู่ระบบ
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
