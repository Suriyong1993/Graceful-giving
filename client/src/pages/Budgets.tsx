import React, { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { MoneyDisplay } from "@/components/common/CommonUI";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building,
  CheckCircle2,
  ChevronRight,
  Cross,
  DollarSign,
  GraduationCap,
  HeartHandshake,
  Laptop,
  Music,
  PieChart,
  Plus,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export default function Budgets() {
  const [, setLocation] = useLocation();
  const [selectedYear, setSelectedYear] = useState("2026");
  const [filterQuarter, setFilterQuarter] = useState("all");
  const [showNewBudgetModal, setShowNewBudgetModal] = useState(false);

  const budgetItems = useMemo(() => {
    return [
      {
        id: 1,
        ministry: "ฝ่ายนมัสการและดนตรี (Worship)",
        icon: Music,
        allocated: 120000,
        spent: 78500,
        leader: "คุณธนพัฒน์",
        status: "normal",
        notes: "รวมค่าบำรุงรักษาเครื่องดนตรีและลิขสิทธิ์เพลงนมัสการ",
      },
      {
        id: 2,
        ministry: "ฝ่ายรวีวารศึกษาและเด็ก (Children)",
        icon: GraduationCap,
        allocated: 90000,
        spent: 54200,
        leader: "คุณศิริพร",
        status: "normal",
        notes: "สื่อการสอน VBS และขนมประจำวันอาทิตย์",
      },
      {
        id: 3,
        ministry: "ฝ่ายเยาวชน (Youth Ministry)",
        icon: Users,
        allocated: 150000,
        spent: 128000,
        leader: "อ.ทวีเกียรติ",
        status: "warning",
        notes: "ค่ายเยาวชนภาคฤดูร้อนและกิจกรรมกลุ่มแคร์",
      },
      {
        id: 4,
        ministry: "ฝ่ายพันธกิจและประกาศ (Mission & Outreach)",
        icon: Cross,
        allocated: 350000,
        spent: 245000,
        leader: "อ.ประสิทธิ์",
        status: "normal",
        notes: "สนับสนุนศิษยาภิบาลท้องถิ่น 3 คริสตจักรลูก",
      },
      {
        id: 5,
        ministry: "ฝ่ายสงเคราะห์และชุมชน (Benevolence)",
        icon: HeartHandshake,
        allocated: 100000,
        spent: 62000,
        leader: "คุณวรรณา",
        status: "normal",
        notes: "ถุงยังชีพสัญจรและกองทุนสงเคราะห์ผู้สูงอายุ",
      },
      {
        id: 6,
        ministry: "ฝ่ายอาคารและบำรุงรักษา (Facilities)",
        icon: Building,
        allocated: 480000,
        spent: 442000,
        leader: "คุณสมชาย",
        status: "alert",
        notes: "รวมค่าสาธารณูปโภค ค่าน้ำ ค่าไฟ และซ่อมแซมแอร์",
      },
      {
        id: 7,
        ministry: "ฝ่ายสื่อมัลติมีเดียและเทคโนโลยี (Media & IT)",
        icon: Laptop,
        allocated: 160000,
        spent: 105000,
        leader: "คุณวิทวัส",
        status: "normal",
        notes: "ระบบถ่ายทอดสดและเซิร์ฟเวอร์ฐานข้อมูล",
      },
      {
        id: 8,
        ministry: "ฝ่ายบริหารและบุคลากร (Staff & Admin)",
        icon: BarChart3,
        allocated: 720000,
        spent: 490000,
        leader: "คุณมาลี (เหรัญญิก)",
        status: "normal",
        notes: "เงินเดือนศิษยาภิบาล เจ้าหน้าที่ และประกันสังคม",
      },
    ];
  }, []);

  const totalAllocated = useMemo(
    () => budgetItems.reduce((acc, curr) => acc + curr.allocated, 0),
    [budgetItems]
  );
  const totalSpent = useMemo(
    () => budgetItems.reduce((acc, curr) => acc + curr.spent, 0),
    [budgetItems]
  );
  const totalRemaining = totalAllocated - totalSpent;
  const overallPercentage = Math.round((totalSpent / totalAllocated) * 100);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-[#FFF4DF] border border-[#E9D9BF] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#DCECC5] text-[#70452E]">
              <PieChart className="w-3.5 h-3.5 text-[#A8C978]" />
              การวางแผนงบประมาณประจำปี
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-[#38251B]">
              งบประมาณพันธกิจ (Church Budgets)
            </h1>
            <p className="text-sm text-[#70452E]/80 max-w-xl">
              ติดตามการใช้จ่ายจริงเทียบกับงบประมาณที่คณะมัคนายกอนุมัติ
              เพื่อการบริหารพระคลังของพระเจ้าอย่างคุ้มค่าและเกิดผลสูงสุด
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2.5 rounded-2xl border border-[#E9D9BF] bg-white font-semibold text-[#38251B] text-sm shadow-sm focus:outline-none"
            >
              <option value="2026">ปีงบประมาณ 2026 (2569)</option>
              <option value="2025">ปีงบประมาณ 2025 (2568)</option>
            </select>
            <button
              onClick={() => setShowNewBudgetModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#E99A4A] hover:bg-[#d88939] text-white font-medium text-sm shadow-sm transition-all whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>จัดสรรงบใหม่</span>
            </button>
          </div>
        </div>

        {/* Global Progress & Summary Metrics */}
        <div className="bg-white border border-[#E9D9BF] rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-xs text-[#70452E]/70 font-semibold uppercase tracking-wider">
                งบประมาณรวมทั้งปี
              </p>
              <p className="text-3xl font-extrabold text-[#38251B]">
                ฿{totalAllocated.toLocaleString()}
              </p>
              <p className="text-xs text-[#70452E]/60">8 ฝ่ายพันธกิจ</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-[#70452E]/70 font-semibold uppercase tracking-wider">
                เบิกจ่ายแล้วจริง (YTD)
              </p>
              <p className="text-3xl font-extrabold text-amber-800">
                ฿{totalSpent.toLocaleString()}
              </p>
              <p className="text-xs text-amber-700/80 font-medium">
                คิดเป็น {overallPercentage}% ของงบทั้งปี
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-[#70452E]/70 font-semibold uppercase tracking-wider">
                งบประมาณคงเหลือ
              </p>
              <p className="text-3xl font-extrabold text-emerald-700">
                ฿{totalRemaining.toLocaleString()}
              </p>
              <p className="text-xs text-emerald-800/80 font-medium">
                พร้อมใช้ในไตรมาสที่ 4
              </p>
            </div>
          </div>

          {/* Global Visual Progress Bar */}
          <div className="space-y-2 pt-2 border-t border-[#E9D9BF]/50">
            <div className="flex justify-between text-xs font-semibold text-[#38251B]">
              <span>ความคืบหน้าการเบิกจ่ายงบประมาณรวม</span>
              <span>{overallPercentage}% / 100%</span>
            </div>
            <div className="w-full h-4 bg-[#FFF4DF] rounded-full overflow-hidden p-0.5 border border-[#E9D9BF]">
              <div
                className="h-full bg-gradient-to-r from-[#A8C978] to-[#E99A4A] rounded-full transition-all duration-700"
                style={{ width: `${overallPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Ministry Budget Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {budgetItems.map((item) => {
            const Icon = item.icon;
            const percent = Math.round((item.spent / item.allocated) * 100);
            const remaining = item.allocated - item.spent;

            const isHigh = percent >= 90;
            const isWarning = percent >= 75 && percent < 90;

            return (
              <div
                key={item.id}
                onClick={() => setLocation(`/budgets/${item.id}`)}
                className="bg-white rounded-3xl border border-[#E9D9BF] p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#FFF4DF] flex items-center justify-center text-[#E99A4A] group-hover:scale-105 transition-transform">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#38251B] text-base group-hover:text-[#E99A4A] transition-colors">
                          {item.ministry}
                        </h3>
                        <p className="text-xs text-[#70452E]/70">
                          ผู้รับผิดชอบ: {item.leader}
                        </p>
                      </div>
                    </div>

                    {isHigh ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">
                        <AlertTriangle className="w-3 h-3" />
                        ใกล้เต็มงบ
                      </span>
                    ) : isWarning ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                        ควรระวัง
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        ปกติ
                      </span>
                    )}
                  </div>

                  {/* Amounts */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-2xl bg-[#FFF9EE] border border-[#E9D9BF]/60">
                      <p className="text-[11px] text-[#70452E]/60 font-medium">
                        งบที่ได้รับอนุมัติ
                      </p>
                      <p className="text-lg font-bold text-[#38251B] mt-0.5">
                        ฿{item.allocated.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#FFF9EE] border border-[#E9D9BF]/60">
                      <p className="text-[11px] text-[#70452E]/60 font-medium">
                        ใช้จ่ายไปแล้ว
                      </p>
                      <p className="text-lg font-bold text-amber-800 mt-0.5">
                        ฿{item.spent.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-[#70452E]/80">
                      <span>คงเหลือ ฿{remaining.toLocaleString()}</span>
                      <span className="font-bold text-[#38251B]">{percent}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-[#FFF4DF] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isHigh
                            ? "bg-rose-500"
                            : isWarning
                              ? "bg-amber-500"
                              : "bg-[#A8C978]"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-[#70452E]/60 line-clamp-1 italic">
                    {item.notes}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="pt-4 mt-3 border-t border-[#E9D9BF]/40 flex items-center justify-between text-xs font-semibold text-[#70452E] group-hover:text-[#E99A4A]">
                  <span>ดูรายละเอียดโครงการและรายการเบิกจ่าย</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

        {/* New Budget Allocation Modal */}
        {showNewBudgetModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-[#E9D9BF] max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-[#E9D9BF] pb-3">
                <h3 className="text-lg font-bold text-[#38251B]">
                  จัดสรรงบประมาณฝ่ายงาน
                </h3>
                <button
                  onClick={() => setShowNewBudgetModal(false)}
                  className="text-[#70452E]/60 hover:text-[#38251B] text-xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-[#38251B]">เลือกฝ่ายพันธกิจ</label>
                  <select className="w-full px-3 py-2.5 rounded-xl border border-[#E9D9BF] bg-white font-medium text-[#38251B] mt-1">
                    <option>ฝ่ายนมัสการและดนตรี</option>
                    <option>ฝ่ายรวีวารศึกษาและเด็ก</option>
                    <option>ฝ่ายเยาวชน</option>
                    <option>ฝ่ายพันธกิจและประกาศ</option>
                    <option>ฝ่ายสงเคราะห์และชุมชน</option>
                    <option>ฝ่ายอาคารและสถานที่</option>
                    <option>ฝ่ายสื่อและไอที</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-[#38251B]">ปีงบประมาณ</label>
                  <input
                    type="text"
                    defaultValue="2026"
                    className="w-full px-3 py-2 rounded-xl border border-[#E9D9BF] font-medium mt-1"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#38251B]">วงเงินงบประมาณที่จัดสรร (บาท)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E9D9BF] text-base font-bold text-[#38251B] mt-1"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#38251B]">หมายเหตุการอนุมัติมติที่ประชุม</label>
                  <textarea
                    rows={2}
                    placeholder="ระบุครั้งที่ประชุมมัคนายกที่อนุมัติ..."
                    className="w-full px-3 py-2 rounded-xl border border-[#E9D9BF] mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowNewBudgetModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E9D9BF] text-xs font-medium text-[#70452E]"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => {
                    toast.success("บันทึกการจัดสรรงบประมาณสำเร็จ");
                    setShowNewBudgetModal(false);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#E99A4A] text-white text-xs font-semibold hover:bg-[#d88939]"
                >
                  บันทึกงบประมาณ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
