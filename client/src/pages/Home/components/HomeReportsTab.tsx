import { Download } from "lucide-react";
import {
  Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { fmtBaht } from "../utils";

interface HomeReportsTabProps {
  /**
   * Monthly stats as returned by `finance.monthlyStats` ({ month, income, expense }).
   * The recharts `dataKey`s below are unchanged from the original page — kept
   * as-is so this split does not alter the rendered chart.
   */
  chartData: Array<{ month: string; income: number; expense: number }>;
  fundAccounts: Array<{ id: number; name: string; balance: string }>;
  onExportCSV: () => void;
}

export function HomeReportsTab({ chartData, fundAccounts, onExportCSV }: HomeReportsTabProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[28px] p-5 md:p-6 border border-[#E9D9BF] clay-card-shadow flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[#70452E]">รายงานการเงินคริสตจักร</h2>
          <p className="text-xs text-[#927D6D]">วิเคราะห์แนวโน้มรายรับ-รายจ่ายเพื่อวางแผนพันธกิจ</p>
        </div>
        <button onClick={onExportCSV} className="px-3.5 py-2 rounded-xl bg-[#FFF4DF] text-[#70452E] text-xs font-bold border border-[#E9D9BF] flex items-center gap-1.5 hover:bg-[#FBE9CD] transition-all">
          <Download className="w-4 h-4" /><span>ดาวน์โหลด CSV</span>
        </button>
      </div>

      <div className="bg-white rounded-[28px] p-5 md:p-6 border border-[#E9D9BF] clay-card-shadow space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#38251B]">แนวโน้มรายรับ - รายจ่าย 5 เดือนล่าสุด</h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-[#4F8B33] font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#A8C978]" /> รายรับ
            </span>
            <span className="flex items-center gap-1 text-[#C26B1E] font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E99A4A]" /> รายจ่าย
            </span>
          </div>
        </div>
        {chartData.length === 0 ? (
          <p className="py-16 text-center text-sm text-[#927D6D]">ยังไม่มีข้อมูลแนวโน้มการเงินสำหรับช่วงเวลานี้</p>
        ) : (
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#927D6D" fontSize={12} tickLine={false} />
                <YAxis stroke="#927D6D" fontSize={11} tickLine={false} tickFormatter={v => `฿${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: 16, border: "1px solid #E9D9BF", boxShadow: "0 4px 12px rgba(112,69,46,0.08)" }}
                  formatter={(val: number) => [fmtBaht(val), ""]}
                />
                <Bar dataKey="รายรับ" fill="#A8C978" radius={[8, 8, 0, 0]} />
                <Bar dataKey="รายจ่าย" fill="#E99A4A" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[28px] p-5 md:p-6 border border-[#E9D9BF] clay-card-shadow space-y-3">
        <h3 className="text-sm font-bold text-[#38251B]">ยอดเงินในแต่ละกองทุน (Fund Accounts)</h3>
        <div className="divide-y divide-[#F0E6D8]/60">
          {fundAccounts.length === 0 && (
            <p className="py-8 text-center text-sm text-[#927D6D]">ยังไม่มีข้อมูลกองทุนจากระบบ</p>
          )}
          {fundAccounts.map(fa => (
            <div key={fa.id} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: "#A8C978" }} />
                <span className="text-sm font-bold text-[#38251B]">{fa.name}</span>
              </div>
              <span className="text-sm font-extrabold text-[#1b5e3a]">{fmtBaht(Number(fa.balance))}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}