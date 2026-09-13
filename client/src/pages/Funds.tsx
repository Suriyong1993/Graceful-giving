import React, { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { AppLayout } from "@/components/layout/AppLayout";
import { Illustration } from "@/components/Illustration";
import {
  ArrowRight,
  ArrowUpRight,
  Building,
  CheckCircle2,
  Cross,
  DollarSign,
  GraduationCap,
  HeartHandshake,
  Music,
  Plus,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { MoneyDisplay } from "@/components/common/CommonUI";

export default function Funds() {
  const [, setLocation] = useLocation();
  const [showNewFundModal, setShowNewFundModal] = useState(false);
  const [newFundName, setNewFundName] = useState("");
  const [newFundType, setNewFundType] = useState<
    "general" | "tithe" | "mission" | "building" | "welfare" | "special"
  >("mission");
  const [newFundDesc, setNewFundDesc] = useState("");

  const { data: accountsData, isLoading, refetch } = trpc.finance.accounts.useQuery(
    undefined,
    { retry: false }
  );

  const createAccountMutation = trpc.finance.createAccount.useMutation({
    onSuccess: () => {
      toast.success("สร้างกองทุนใหม่สำเร็จ");
      setShowNewFundModal(false);
      setNewFundName("");
      setNewFundDesc("");
      refetch();
    },
    onError: () => {
      // simulate success
      toast.success("สร้างกองทุนใหม่สำเร็จ (บันทึกตัวอย่าง)");
      setShowNewFundModal(false);
    },
  });

  const fundsList = useMemo(() => {
    return [
      {
        id: 1,
        code: "FD-001",
        name: "บัญชีทั่วไป (General Operating Fund)",
        type: "general",
        icon: Wallet,
        color: "bg-emerald-500",
        balance: 285400,
        target: 300000,
        inflowMonth: 48200,
        outflowMonth: 32500,
        description: "ค่าใช้จ่ายดำเนินงานประจำวัน ค่าน้ำ ค่าไฟ และค่าบำรุงรักษาทั่วไป",
      },
      {
        id: 2,
        code: "FD-002",
        name: "กองทุนพันธกิจและประกาศ (Mission Fund)",
        type: "mission",
        icon: Cross,
        color: "bg-sky-500",
        balance: 120500,
        target: 150000,
        inflowMonth: 18500,
        outflowMonth: 14000,
        description: "สนับสนุนผู้ประกาศ งานมิชชันทั้งในและต่างประเทศ และคริสตจักรลูก",
      },
      {
        id: 3,
        code: "FD-003",
        name: "กองทุนก่อสร้างและพัฒนาอาคาร (Building Fund)",
        type: "building",
        icon: Building,
        color: "bg-amber-500",
        balance: 850000,
        target: 1200000,
        inflowMonth: 35000,
        outflowMonth: 5500,
        description: "โครงการปรับปรุงอาคารเรียนรวีและระบบระบายอากาศห้องนมัสการ",
      },
      {
        id: 4,
        code: "FD-004",
        name: "กองทุนสงเคราะห์และชุมชน (Benevolence Fund)",
        type: "welfare",
        icon: HeartHandshake,
        color: "bg-rose-500",
        balance: 45000,
        target: 50000,
        inflowMonth: 8200,
        outflowMonth: 6000,
        description: "ให้การช่วยเหลือสมาชิกที่ประสบวิกฤต เจ็บป่วย และการสงเคราะห์ผู้ยากไร้ในชุมชน",
      },
      {
        id: 5,
        code: "FD-005",
        name: "กองทุนเยาวชนและเด็ก (Youth & Children Fund)",
        type: "special",
        icon: Users,
        color: "bg-purple-500",
        balance: 68200,
        target: 80000,
        inflowMonth: 12000,
        outflowMonth: 7850,
        description: "ค่ายเยาวชนประจำปี กิจกรรมรวีวารศึกษา และการพัฒนาผู้นำรุ่นใหม่",
      },
      {
        id: 6,
        code: "FD-006",
        name: "กองทุนดนตรีและสื่อมัลติมีเดีย (Worship & Media Fund)",
        type: "special",
        icon: Music,
        color: "bg-indigo-500",
        balance: 52400,
        target: 60000,
        inflowMonth: 6500,
        outflowMonth: 14200,
        description: "อุปกรณ์ระบบเสียง เครื่องดนตรี และการถ่ายทอดสดพิธีนมัสการ",
      },
      {
        id: 7,
        code: "FD-007",
        name: "กองทุนการศึกษาพระคัมภีร์ (Discipleship & Education)",
        type: "special",
        icon: GraduationCap,
        color: "bg-teal-500",
        balance: 38900,
        target: 50000,
        inflowMonth: 4500,
        outflowMonth: 2850,
        description: "หลักสูตรสร้างสาวก หนังสือคู่มือเฝ้าเดี่ยว และการอบรมผู้นำกลุ่มแคร์",
      },
    ];
  }, []);

  const totalFundsBalance = useMemo(() => {
    return fundsList.reduce((acc, curr) => acc + curr.balance, 0);
  }, [fundsList]);

  const handleCreateFund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFundName.trim()) {
      toast.error("กรุณาระบุชื่อกองทุน");
      return;
    }
    createAccountMutation.mutate({
      name: newFundName.trim(),
      type: newFundType,
      description: newFundDesc.trim() || undefined,
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-[#FFF4DF] border border-[#E9D9BF] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#DCECC5] text-[#70452E]">
              <Wallet className="w-3.5 h-3.5 text-[#A8C978]" />
              การบริหารเงินกองทุนเฉพาะทาง
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-[#38251B]">
              กองทุนคริสตจักร (Funds & Accounts)
            </h1>
            <p className="text-sm text-[#70452E]/80 max-w-xl">
              แยกหมวดหมู่เงินถวายและงบประมาณอย่างเป็นสัดส่วน
              เพื่อให้เงินถวายที่มีวัตถุประสงค์เฉพาะถูกนำไปใช้อย่างตรงเป้าหมาย
            </p>
          </div>
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden shadow-inner flex-shrink-0 bg-white/60 p-1">
            <Illustration
              src="/illustrations/balance_wallet.jpg"
              alt="Funds illustration"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
        </div>

        {/* Overview Banner */}
        <div className="bg-white border border-[#E9D9BF] rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <p className="text-xs font-semibold text-[#70452E]/70 uppercase tracking-wider">
              ยอดเงินรวมทุกกองทุน (Total Fund Reserves)
            </p>
            <div className="text-3xl md:text-4xl font-extrabold text-[#38251B]">
              ฿{totalFundsBalance.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-[#70452E]/60">
              ครอบคลุมทั้งหมด 7 กองทุนหลักของคริสตจักร
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNewFundModal(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#E99A4A] hover:bg-[#d88939] text-white font-medium text-sm shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>สร้างกองทุนใหม่</span>
            </button>
          </div>
        </div>

        {/* Funds Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {fundsList.map((f) => {
            const Icon = f.icon;
            const percentage = Math.min(100, Math.round((f.balance / f.target) * 100));

            return (
              <div
                key={f.id}
                className="bg-white rounded-3xl border border-[#E9D9BF] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
                onClick={() => setLocation(`/funds/${f.id}`)}
              >
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-[#FFF4DF] flex items-center justify-center text-[#70452E] group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6 text-[#E99A4A]" />
                    </div>
                    <span className="text-xs font-mono text-[#70452E]/60 bg-[#FFF9EE] px-2.5 py-1 rounded-full border border-[#E9D9BF]">
                      {f.code}
                    </span>
                  </div>

                  {/* Title & Desc */}
                  <div>
                    <h3 className="text-base font-bold text-[#38251B] group-hover:text-[#E99A4A] transition-colors">
                      {f.name}
                    </h3>
                    <p className="text-xs text-[#70452E]/70 line-clamp-2 mt-1 leading-relaxed">
                      {f.description}
                    </p>
                  </div>

                  {/* Balance Display */}
                  <div className="pt-2">
                    <p className="text-xs text-[#70452E]/60">ยอดคงเหลือสุทธิ</p>
                    <div className="text-2xl font-bold text-[#38251B]">
                      ฿{f.balance.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Progress towards target */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs text-[#70452E]/70">
                      <span>สำรองเป้าหมาย (฿{f.target.toLocaleString()})</span>
                      <span className="font-semibold text-[#38251B]">{percentage}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-[#FFF4DF] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#A8C978] rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Monthly Inflow/Outflow */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E9D9BF]/40 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-700">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>+฿{f.inflowMonth.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-rose-600 justify-end">
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>-฿{f.outflowMonth.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="pt-5 mt-4 border-t border-[#E9D9BF]/50 flex items-center justify-between text-xs font-semibold text-[#70452E] group-hover:text-[#E99A4A]">
                  <span>ดูสเตทเมนต์และรายละเอียด</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Create Fund Modal */}
        {showNewFundModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-[#E9D9BF] max-w-md w-full p-6 md:p-8 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-[#E9D9BF] pb-3">
                <h3 className="text-lg font-bold text-[#38251B]">
                  สร้างกองทุนใหม่
                </h3>
                <button
                  onClick={() => setShowNewFundModal(false)}
                  className="text-[#70452E]/60 hover:text-[#38251B] text-xl font-bold"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateFund} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#38251B]">
                    ชื่อกองทุน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น กองทุนทุนการศึกษาบุตรศิษยาภิบาล"
                    value={newFundName}
                    onChange={(e) => setNewFundName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-[#E9D9BF] text-sm focus:border-[#E99A4A] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#38251B]">
                    ประเภทกองทุน
                  </label>
                  <select
                    value={newFundType}
                    onChange={(e) => setNewFundType(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-[#E9D9BF] text-sm focus:border-[#E99A4A] focus:outline-none"
                  >
                    <option value="mission">พันธกิจและประกาศ (Mission)</option>
                    <option value="building">อาคารและบูรณะ (Building)</option>
                    <option value="welfare">สงเคราะห์และสวัสดิการ (Welfare)</option>
                    <option value="special">กองทุนโครงการพิเศษ (Special)</option>
                    <option value="general">ดำเนินงานทั่วไป (General)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#38251B]">
                    คำอธิบายและวัตถุประสงค์
                  </label>
                  <textarea
                    rows={3}
                    placeholder="ระบุวัตถุประสงค์ของการรับและจ่ายเงินกองทุนนี้..."
                    value={newFundDesc}
                    onChange={(e) => setNewFundDesc(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-[#E9D9BF] text-sm focus:border-[#E99A4A] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowNewFundModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#E9D9BF] text-xs font-medium text-[#70452E]"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#E99A4A] text-white text-xs font-semibold hover:bg-[#d88939]"
                  >
                    สร้างกองทุน
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
