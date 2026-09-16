import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { trpc } from "@/lib/trpc";
import { EmptyState, LoadingSkeleton } from "@/components/common/CommonUI";
import { MoneyDisplay } from "@/components/common/CommonUI";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  PieChart,
  Printer,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

export default function Reports() {
  const [reportType, setReportType] = useState<
    "cashflow" | "funds" | "budget" | "offerings"
  >("cashflow");
  const [selectedPeriod, setSelectedPeriod] = useState("2026-q3");

  const {
    data: monthlyFlow = [],
    isLoading,
    isError,
  } = trpc.finance.monthlyStats.useQuery({ months: 6 }, { retry: false });

  const maxVal =
    monthlyFlow.length > 0
      ? Math.max(...monthlyFlow.map(m => Math.max(m.income, m.expense)))
      : 0;

  const handleExportPDF = () => {
    toast.success("กำลังสร้างรายงาน PDF สรุปงบการเงินสำหรับคณะธรรมกิจ...");
  };

  const handleExportExcel = () => {
    toast.success("ส่งออกข้อมูล Excel ทางบัญชีเรียบร้อย");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-[#FFF4DF] border border-[#E9D9BF] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#DCECC5] text-[#70452E]">
              <BarChart3 className="w-3.5 h-3.5 text-[#A8C978]" />
              ศูนย์รายงานและวิเคราะห์การเงินคริสตจักร
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-[#38251B]">
              รายงานทางการเงิน (Financial Reports)
            </h1>
            <p className="text-sm text-[#70452E]/80 max-w-xl">
              สรุปงบรายรับ-รายจ่าย รายงานกองทุน และการใช้งบประมาณ
              พร้อมนำเสนอในการประชุมมัคนายกและสมาชิกอย่างถูกต้องและโปร่งใส
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-[#E9D9BF] text-[#70452E] hover:bg-[#FFF9EE] text-sm font-medium shadow-sm transition-colors"
            >
              <FileText className="w-4 h-4 text-rose-600" />
              <span>รายงาน PDF</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#E99A4A] hover:bg-[#d88939] text-white text-sm font-medium shadow-sm transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>ส่งออก Excel</span>
            </button>
          </div>
        </div>

        {/* Period Selector & Report Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1">
            <button
              onClick={() => setReportType("cashflow")}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                reportType === "cashflow"
                  ? "bg-[#E99A4A] text-white shadow-sm"
                  : "bg-white border border-[#E9D9BF] text-[#70452E] hover:bg-[#FFF4DF]/50"
              }`}
            >
              กระแสเงินสด & รายรับ-รายจ่าย
            </button>
            <button
              onClick={() => setReportType("funds")}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                reportType === "funds"
                  ? "bg-[#E99A4A] text-white shadow-sm"
                  : "bg-white border border-[#E9D9BF] text-[#70452E] hover:bg-[#FFF4DF]/50"
              }`}
            >
              ยอดคงเหลือกองทุน
            </button>
            <button
              onClick={() => setReportType("budget")}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                reportType === "budget"
                  ? "bg-[#E99A4A] text-white shadow-sm"
                  : "bg-white border border-[#E9D9BF] text-[#70452E] hover:bg-[#FFF4DF]/50"
              }`}
            >
              งบประมาณเทียบจ่ายจริง
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Calendar className="w-4 h-4 text-[#70452E]/70" />
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#E9D9BF] bg-white text-xs font-semibold text-[#38251B] focus:outline-none"
            >
              <option value="2026-q3">ไตรมาสที่ 3/2026 (ก.ค. - ก.ย.)</option>
              <option value="2026-q2">ไตรมาสที่ 2/2026 (เม.ย. - มิ.ย.)</option>
              <option value="2026-year">ประจำปีงบประมาณ 2026</option>
            </select>
          </div>
        </div>

        {/* Visual Comparison Chart */}
        <div className="bg-white rounded-3xl border border-[#E9D9BF] p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E9D9BF]/50 pb-4">
            <div>
              <h3 className="text-lg font-bold text-[#38251B]">
                เปรียบเทียบรายรับและรายจ่าย (6 เดือนล่าสุด)
              </h3>
              <p className="text-xs text-[#70452E]/70">
                ยอดเงินแสดงเป็นบาท (THB) แยกตามเดือนที่บันทึก
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-[#38251B]">
                <div className="w-3 h-3 rounded-md bg-[#A8C978]" />
                <span>รายรับ (เงินถวาย)</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#38251B]">
                <div className="w-3 h-3 rounded-md bg-[#F7B6A6]" />
                <span>รายจ่าย</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Bars */}
          {isLoading ? (
            <LoadingSkeleton count={1} height="h-64" />
          ) : isError ? (
            <p className="py-16 text-center text-sm text-[#B3261E]">
              โหลดข้อมูลรายงานไม่สำเร็จ กรุณาลองใหม่อีกครั้ง
            </p>
          ) : monthlyFlow.length === 0 ? (
            <p className="py-16 text-center text-sm text-[#927D6D]">
              ยังไม่มีข้อมูลรายรับและรายจ่ายสำหรับช่วงเวลานี้
            </p>
          ) : (
            <div className="grid grid-cols-6 gap-2 sm:gap-6 pt-4 h-64 items-end">
              {monthlyFlow.map((m, idx) => {
                const incomeHeight = (m.income / maxVal) * 100;
                const expenseHeight = (m.expense / maxVal) * 100;

                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center h-full justify-end group"
                  >
                    <div className="flex items-end gap-1 sm:gap-2 w-full justify-center h-48">
                      {/* Income Bar */}
                      <div
                        style={{ height: `${incomeHeight}%` }}
                        className="w-4 sm:w-8 bg-[#A8C978] rounded-t-lg transition-all duration-500 group-hover:brightness-95 relative"
                        title={`รายรับ: ฿${m.income.toLocaleString()}`}
                      />
                      {/* Expense Bar */}
                      <div
                        style={{ height: `${expenseHeight}%` }}
                        className="w-4 sm:w-8 bg-[#F7B6A6] rounded-t-lg transition-all duration-500 group-hover:brightness-95 relative"
                        title={`รายจ่าย: ฿${m.expense.toLocaleString()}`}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-[#70452E] mt-3 whitespace-nowrap">
                      {m.month}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Financial Summary Table */}
        <div className="bg-white rounded-3xl border border-[#E9D9BF] overflow-hidden shadow-sm">
          <div className="p-5 border-b border-[#E9D9BF]">
            <h3 className="text-base font-bold text-[#38251B]">
              สรุปงบการเงินไตรมาส 3/2026 (Statement of Activities)
            </h3>
          </div>

          <table className="w-full text-left text-sm text-[#38251B]">
            <thead className="bg-[#FFF9EE] text-xs font-semibold text-[#70452E] border-b border-[#E9D9BF]">
              <tr>
                <th className="py-3.5 px-6">รายการ</th>
                <th className="py-3.5 px-6 text-right">งบประมาณที่ตั้งไว้</th>
                <th className="py-3.5 px-6 text-right">เกิดขึ้นจริง</th>
                <th className="py-3.5 px-6 text-right">ผลต่าง (Variance)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9D9BF]/40 text-xs">
              <tr className="bg-[#FFF4DF]/20 font-bold text-[#38251B]">
                <td className="py-3 px-6" colSpan={4}>
                  รายรับ (Inflows)
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-6 pl-8 text-[#70452E]">
                  เงินถวายสิบลด (Tithes)
                </td>
                <td className="py-2.5 px-6 text-right">฿180,000</td>
                <td className="py-2.5 px-6 text-right font-medium text-emerald-700">
                  ฿195,400
                </td>
                <td className="py-2.5 px-6 text-right text-emerald-700">
                  +฿15,400
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-6 pl-8 text-[#70452E]">
                  เงินถวายทั่วไปประจำสัปดาห์
                </td>
                <td className="py-2.5 px-6 text-right">฿60,000</td>
                <td className="py-2.5 px-6 text-right font-medium text-emerald-700">
                  ฿64,200
                </td>
                <td className="py-2.5 px-6 text-right text-emerald-700">
                  +฿4,200
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-6 pl-8 text-[#70452E]">
                  เงินถวายพันธกิจและมิชชัน
                </td>
                <td className="py-2.5 px-6 text-right">฿40,000</td>
                <td className="py-2.5 px-6 text-right font-medium text-emerald-700">
                  ฿38,700
                </td>
                <td className="py-2.5 px-6 text-right text-rose-600">
                  -฿1,300
                </td>
              </tr>

              <tr className="bg-[#FFF4DF]/20 font-bold text-[#38251B]">
                <td className="py-3 px-6" colSpan={4}>
                  รายจ่าย (Outflows)
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-6 pl-8 text-[#70452E]">
                  ค่าสาธารณูปโภค (น้ำ ไฟ อินเทอร์เน็ต)
                </td>
                <td className="py-2.5 px-6 text-right">฿30,000</td>
                <td className="py-2.5 px-6 text-right font-medium text-amber-800">
                  ฿28,500
                </td>
                <td className="py-2.5 px-6 text-right text-emerald-700">
                  +฿1,500
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-6 pl-8 text-[#70452E]">
                  พันธกิจและการประกาศ
                </td>
                <td className="py-2.5 px-6 text-right">฿80,000</td>
                <td className="py-2.5 px-6 text-right font-medium text-amber-800">
                  ฿74,000
                </td>
                <td className="py-2.5 px-6 text-right text-emerald-700">
                  +฿6,000
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-6 pl-8 text-[#70452E]">
                  สงเคราะห์และสวัสดิการ
                </td>
                <td className="py-2.5 px-6 text-right">฿25,000</td>
                <td className="py-2.5 px-6 text-right font-medium text-amber-800">
                  ฿22,400
                </td>
                <td className="py-2.5 px-6 text-right text-emerald-700">
                  +฿2,600
                </td>
              </tr>

              <tr className="bg-[#DCECC5]/30 font-bold text-sm text-[#38251B]">
                <td className="py-3.5 px-6">ยอดรายรับสุทธิ (Net Surplus)</td>
                <td className="py-3.5 px-6 text-right">฿145,000</td>
                <td className="py-3.5 px-6 text-right text-emerald-800">
                  ฿173,400
                </td>
                <td className="py-3.5 px-6 text-right text-emerald-800">
                  +฿28,400
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
