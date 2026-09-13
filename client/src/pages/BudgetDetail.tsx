import React, { useState } from "react";
import { useLocation, useParams } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { MoneyDisplay } from "@/components/common/CommonUI";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  Plus,
  TrendingDown,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export default function BudgetDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const budgetId = Number(params.id) || 1;

  const budgetInfo = {
    1: {
      name: "ฝ่ายนมัสการและดนตรี (Worship Ministry)",
      leader: "คุณธนพัฒน์ (ผู้นำนมัสการ)",
      allocated: 120000,
      spent: 78500,
      year: "2026",
      items: [
        { name: "บำรุงรักษาเครื่องดนตรีและสายสัญญาณ", allocated: 30000, spent: 18500 },
        { name: "ลิขสิทธิ์เพลงนมัสการ CCLI", allocated: 25000, spent: 25000 },
        { name: "สัมมนาพัฒนาทีมนมัสการและนักดนตรี", allocated: 35000, spent: 22000 },
        { name: "อุปกรณ์เสริมและไมโครโฟน", allocated: 30000, spent: 13000 },
      ],
      expenses: [
        { id: 11, desc: "ต่ออายุลิขสิทธิ์ CCLI ประจำปี 2026", amount: 25000, date: "2026-08-15" },
        { id: 12, desc: "ซ่อมบำรุงกลองชุดและเปลี่ยนหนังกลอง", amount: 8500, date: "2026-08-20" },
        { id: 13, desc: "ค่าวิทยากรอบรมเทคนิคการนำนมัสการ", amount: 15000, date: "2026-09-02" },
        { id: 14, desc: "สายสัญญาณไมค์ XLR 6 เส้น", amount: 4500, date: "2026-09-08" },
      ],
    },
    2: {
      name: "ฝ่ายรวีวารศึกษาและเด็ก (Children)",
      leader: "คุณศิริพร (ครูใหญ่รวี)",
      allocated: 90000,
      spent: 54200,
      year: "2026",
      items: [
        { name: "คู่มือบทเรียนและใบงานเด็ก", allocated: 40000, spent: 28500 },
        { name: "กิจกรรมวันเด็กและค่าย VBS", allocated: 30000, spent: 18000 },
        { name: "ของรางวัลและขนมประจำสัปดาห์", allocated: 20000, spent: 7700 },
      ],
      expenses: [
        { id: 21, desc: "สั่งซื้อหนังสือบทเรียนพระคัมภีร์ รวีไตรมาส 3", amount: 14250, date: "2026-07-10" },
        { id: 22, desc: "อุปกรณ์งานประดิษฐ์และสีระบาย", amount: 6500, date: "2026-08-12" },
      ],
    },
  }[budgetId] || {
    name: "ฝ่ายพันธกิจคริสตจักร",
    leader: "ผู้นำฝ่ายพันธกิจ",
    allocated: 100000,
    spent: 60000,
    year: "2026",
    items: [
      { name: "กิจกรรมหลักและโครงการ", allocated: 70000, spent: 45000 },
      { name: "เบ็ดเตล็ดและดำเนินงาน", allocated: 30000, spent: 15000 },
    ],
    expenses: [
      { id: 31, desc: "ค่าใช้จ่ายดำเนินงานโครงการ", amount: 15000, date: "2026-09-01" },
    ],
  };

  const remaining = budgetInfo.allocated - budgetInfo.spent;
  const percent = Math.round((budgetInfo.spent / budgetInfo.allocated) * 100);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setLocation("/budgets")}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#70452E] hover:text-[#38251B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้ารวมงบประมาณ</span>
          </button>
          <span className="text-xs text-[#70452E]/70 bg-[#FFF4DF] px-3 py-1 rounded-full border border-[#E9D9BF] font-semibold">
            ปีงบประมาณ {budgetInfo.year}
          </span>
        </div>

        {/* Budget Header Card */}
        <div className="bg-[#FFF4DF] border border-[#E9D9BF] rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#70452E]/70 uppercase tracking-wider">
                งบประมาณฝ่ายพันธกิจ
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-[#38251B]">
                {budgetInfo.name}
              </h1>
              <p className="text-xs text-[#70452E]/80">
                ผู้รับผิดชอบดูแล: <span className="font-semibold text-[#38251B]">{budgetInfo.leader}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  toast.success("ส่งคำขอปรับแผนงบประมาณไปยังเหรัญญิกเรียบร้อย");
                }}
                className="px-4 py-2.5 rounded-2xl bg-white border border-[#E9D9BF] text-[#70452E] hover:bg-[#FFF9EE] text-sm font-medium shadow-sm transition-colors"
              >
                ขอปรับแผนงบประมาณ
              </button>
              <button
                onClick={() => setLocation("/expenses/new")}
                className="px-4 py-2.5 rounded-2xl bg-[#E99A4A] hover:bg-[#d88939] text-white text-sm font-medium shadow-sm transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>เบิกจ่ายจากงบนี้</span>
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-white p-4 rounded-2xl border border-[#E9D9BF]/80 shadow-inner">
              <p className="text-xs text-[#70452E]/70">งบที่ได้รับอนุมัติทั้งปี</p>
              <p className="text-2xl font-bold text-[#38251B] mt-1">
                ฿{budgetInfo.allocated.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#E9D9BF]/80 shadow-inner">
              <p className="text-xs text-[#70452E]/70">เบิกจ่ายไปแล้ว</p>
              <p className="text-2xl font-bold text-amber-800 mt-1">
                ฿{budgetInfo.spent.toLocaleString()}
              </p>
              <p className="text-[11px] text-[#70452E]/60 mt-0.5">{percent}% ของงบ</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#E9D9BF]/80 shadow-inner">
              <p className="text-xs text-[#70452E]/70">งบคงเหลือสำหรับดำเนินงาน</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                ฿{remaining.toLocaleString()}
              </p>
              <p className="text-[11px] text-[#70452E]/60 mt-0.5">พร้อมใช้</p>
            </div>
          </div>
        </div>

        {/* Sub-item Line Breakdown */}
        <div className="bg-white rounded-3xl border border-[#E9D9BF] p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-[#38251B]">
            หมวดหมู่ย่อยและแผนการใช้จ่าย (Budget Line Items)
          </h3>

          <div className="space-y-3">
            {budgetInfo.items.map((line, idx) => {
              const linePct = Math.round((line.spent / line.allocated) * 100);
              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#FFF9EE] border border-[#E9D9BF]/60 space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-semibold text-sm text-[#38251B]">
                      {line.name}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-[#70452E]">
                      <span>ใช้ไป ฿{line.spent.toLocaleString()}</span>
                      <span>/</span>
                      <span className="font-bold text-[#38251B]">฿{line.allocated.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-[#E9D9BF]/50">
                    <div
                      className="h-full bg-[#A8C978] rounded-full"
                      style={{ width: `${linePct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expenses List */}
        <div className="bg-white rounded-3xl border border-[#E9D9BF] overflow-hidden shadow-sm">
          <div className="p-5 border-b border-[#E9D9BF] flex items-center justify-between">
            <h3 className="text-base font-bold text-[#38251B] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#E99A4A]" />
              ประวัติการเบิกจ่ายตามงบประมาณนี้
            </h3>
            <span className="text-xs text-[#70452E]/60">
              {budgetInfo.expenses.length} รายการ
            </span>
          </div>

          <div className="divide-y divide-[#E9D9BF]/40">
            {budgetInfo.expenses.map((exp) => (
              <div
                key={exp.id}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-[#FFF4DF]/20 transition-colors"
              >
                <div>
                  <p className="font-semibold text-sm text-[#38251B]">{exp.desc}</p>
                  <p className="text-xs text-[#70452E]/70 mt-0.5">
                    วันที่ {new Date(exp.date).toLocaleDateString("th-TH")}
                  </p>
                </div>
                <div className="text-right">
                  <MoneyDisplay amount={exp.amount} type="expense" size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
