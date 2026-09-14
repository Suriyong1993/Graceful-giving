import React, { useState } from "react";
import { useLocation, useParams } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  EmptyState,
  MoneyDisplay,
  StatusBadge,
} from "@/components/common/CommonUI";
import {
  ArrowLeft,
  ArrowRightLeft,
  Building,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  History,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

export default function FundDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const fundId = Number(params.id) || 1;
  const [activeTab, setActiveTab] = useState<
    "transactions" | "governance" | "budget"
  >("transactions");
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Mock fund directory
  const fundInfo = {
    1: {
      name: "บัญชีทั่วไป (General Operating Fund)",
      code: "FD-001",
      balance: 285400,
      target: 300000,
      inflowMonth: 48200,
      outflowMonth: 32500,
      signers: [
        "อ.ประสิทธิ์ (ศิษยาภิบาล)",
        "คุณมาลี (เหรัญญิก)",
        "คุณสมชาย (มัคนายก)",
      ],
      description:
        "ใช้สำหรับค่าใช้จ่ายดำเนินงานประจำวัน ค่าน้ำ ค่าไฟ และบำรุงรักษาทั่วไปของคริสตจักร",
      budgetUtilization: 68,
    },
    2: {
      name: "กองทุนพันธกิจและประกาศ (Mission Fund)",
      code: "FD-002",
      balance: 120500,
      target: 150000,
      inflowMonth: 18500,
      outflowMonth: 14000,
      signers: ["อ.ประสิทธิ์ (ศิษยาภิบาล)", "คุณวิชัย (หัวหน้าพันธกิจ)"],
      description:
        "สนับสนุนผู้ประกาศ งานมิชชันต่างจังหวัด และการบุกเบิกคริสตจักรลูก",
      budgetUtilization: 77,
    },
    3: {
      name: "กองทุนก่อสร้างและพัฒนาอาคาร (Building Fund)",
      code: "FD-003",
      balance: 850000,
      target: 1200000,
      inflowMonth: 35000,
      outflowMonth: 5500,
      signers: ["คุณสมชาย (ประธานฝ่ายอาคาร)", "คุณมาลี (เหรัญญิก)"],
      description:
        "โครงการปรับปรุงอาคารเรียนรวีวารศึกษาและระบบระบายอากาศห้องนมัสการ",
      budgetUtilization: 25,
    },
    4: {
      name: "กองทุนสงเคราะห์และชุมชน (Benevolence Fund)",
      code: "FD-004",
      balance: 45000,
      target: 50000,
      inflowMonth: 8200,
      outflowMonth: 6000,
      signers: ["คุณวรรณา (ฝ่ายสงเคราะห์)", "คุณมาลี (เหรัญญิก)"],
      description:
        "ช่วยเหลือสมาชิกยามฉุกเฉิน ค่ารักษาพยาบาล และถุงยังชีพชุมชนรอบโบสถ์",
      budgetUtilization: 60,
    },
  }[fundId] || {
    name: "กองทุนคริสตจักร",
    code: `FD-00${fundId}`,
    balance: 50000,
    target: 80000,
    inflowMonth: 10000,
    outflowMonth: 5000,
    signers: ["ผู้รับผิดชอบพันธกิจ", "เหรัญญิก"],
    description: "กองทุนเพื่อพันธกิจเฉพาะของคริสตจักร",
    budgetUtilization: 50,
  };

  const fundTransactions = [
    {
      id: 101,
      date: "2026-09-12T10:30:00",
      description: "เงินถวายสิบลดและทั่วไปประจำสัปดาห์",
      type: "income",
      amount: 28500,
      ref: "OFF-20260912-001",
      recordedBy: "คุณมาลี",
    },
    {
      id: 102,
      date: "2026-09-11T14:00:00",
      description: "ชำระค่าไฟฟ้าและประปา ประจำเดือน",
      type: "expense",
      amount: 8450,
      ref: "EXP-20260911-002",
      recordedBy: "คุณสมชาย",
    },
    {
      id: 103,
      date: "2026-09-08T11:20:00",
      description: "เงินถวายสมทบพันธกิจพิเศษ",
      type: "income",
      amount: 15000,
      ref: "OFF-20260908-011",
      recordedBy: "คุณมาลี",
    },
    {
      id: 104,
      date: "2026-09-05T16:00:00",
      description: "เบิกจ่ายค่าอุปกรณ์สื่อมัลติมีเดีย",
      type: "expense",
      amount: 14200,
      ref: "EXP-20260905-004",
      recordedBy: "คุณวิชัย",
    },
  ];

  const exportStatement = () => {
    toast.success("ดาวน์โหลดสเตทเมนต์กองทุนเรียบร้อย");
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back Button & Code */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setLocation("/funds")}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#70452E] hover:text-[#38251B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้ารายการกองทุน</span>
          </button>
          <span className="font-mono text-xs text-[#70452E]/70 bg-[#FFF4DF] px-3 py-1 rounded-full border border-[#E9D9BF]">
            {fundInfo.code}
          </span>
        </div>

        {/* Fund Hero Card */}
        <div className="bg-[#FFF4DF] border border-[#E9D9BF] rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#DCECC5] text-[#70452E]">
                <Wallet className="w-3.5 h-3.5 text-[#A8C978]" />
                สถานะกองทุน: ปกติและคล่องตัว
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-[#38251B]">
                {fundInfo.name}
              </h1>
              <p className="text-sm text-[#70452E]/80 max-w-xl">
                {fundInfo.description}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowTransferModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-[#E9D9BF] text-[#70452E] hover:bg-[#FFF9EE] text-sm font-medium shadow-sm transition-colors"
              >
                <ArrowRightLeft className="w-4 h-4 text-[#E99A4A]" />
                <span>โอนเงินระหว่างกองทุน</span>
              </button>
              <button
                onClick={exportStatement}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#E99A4A] hover:bg-[#d88939] text-white text-sm font-medium shadow-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลด Statement</span>
              </button>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-white p-4 rounded-2xl border border-[#E9D9BF]/80 shadow-inner">
              <p className="text-xs text-[#70452E]/70 font-medium">
                ยอดคงเหลือสุทธิ
              </p>
              <p className="text-2xl font-bold text-[#38251B] mt-1">
                ฿
                {fundInfo.balance.toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                })}
              </p>
              <p className="text-[11px] text-[#70452E]/60 mt-0.5">
                เป้าหมายสำรอง ฿{fundInfo.target.toLocaleString()}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E9D9BF]/80 shadow-inner">
              <div className="flex items-center justify-between text-xs text-[#70452E]/70 font-medium">
                <span>รายรับเข้าเดือนนี้</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                +฿
                {fundInfo.inflowMonth.toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                })}
              </p>
              <p className="text-[11px] text-emerald-800/60 mt-0.5">
                เงินถวายและโอนเข้า
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E9D9BF]/80 shadow-inner">
              <div className="flex items-center justify-between text-xs text-[#70452E]/70 font-medium">
                <span>รายจ่ายออกเดือนนี้</span>
                <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
              </div>
              <p className="text-2xl font-bold text-rose-700 mt-1">
                -฿
                {fundInfo.outflowMonth.toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                })}
              </p>
              <p className="text-[11px] text-rose-800/60 mt-0.5">
                เบิกจ่ายตามพันธกิจ
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E9D9BF] pb-1">
          <button
            onClick={() => setActiveTab("transactions")}
            className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-colors ${
              activeTab === "transactions"
                ? "bg-[#FFF4DF] text-[#38251B] border border-[#E9D9BF]"
                : "text-[#70452E]/70 hover:text-[#38251B]"
            }`}
          >
            รายการเคลื่อนไหว (Transactions)
          </button>
          <button
            onClick={() => setActiveTab("governance")}
            className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-colors ${
              activeTab === "governance"
                ? "bg-[#FFF4DF] text-[#38251B] border border-[#E9D9BF]"
                : "text-[#70452E]/70 hover:text-[#38251B]"
            }`}
          >
            คณะกรรมการและผู้อนุมัติ (Governance)
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "transactions" && (
          <div className="bg-white rounded-3xl border border-[#E9D9BF] overflow-hidden shadow-sm">
            <div className="p-5 border-b border-[#E9D9BF] flex items-center justify-between">
              <h3 className="text-base font-bold text-[#38251B] flex items-center gap-2">
                <History className="w-4 h-4 text-[#E99A4A]" />
                สมุดบัญชีแยกประเภท (Ledger Entries)
              </h3>
              <span className="text-xs text-[#70452E]/60">
                {fundTransactions.length} รายการล่าสุด
              </span>
            </div>

            <div className="divide-y divide-[#E9D9BF]/40">
              {fundTransactions.map(tx => (
                <div
                  key={tx.id}
                  onClick={() => setLocation(`/transactions/${tx.id}`)}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-[#FFF4DF]/20 cursor-pointer transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                          tx.type === "income"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {tx.type === "income" ? "รับเข้า" : "ตัดจ่าย"}
                      </span>
                      <span className="text-xs font-mono text-[#70452E]/60">
                        {tx.ref}
                      </span>
                    </div>
                    <p className="font-semibold text-sm text-[#38251B]">
                      {tx.description}
                    </p>
                    <p className="text-xs text-[#70452E]/70">
                      {new Date(tx.date).toLocaleDateString("th-TH")} •
                      บันทึกโดย: {tx.recordedBy}
                    </p>
                  </div>
                  <div className="text-right">
                    <MoneyDisplay
                      amount={tx.amount}
                      type={tx.type as any}
                      size="sm"
                    />
                    <p className="text-[11px] text-[#70452E]/60 mt-1">
                      สมบูรณ์
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "governance" && (
          <div className="bg-white rounded-3xl border border-[#E9D9BF] p-6 md:p-8 space-y-6 shadow-sm">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#38251B] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                การกำกับดูแลและการอนุมัติกองทุน
              </h3>
              <p className="text-xs text-[#70452E]/70">
                การเบิกจ่ายจากกองทุนนี้ต้องได้รับความเห็นชอบจากผู้มีอำนาจลงนามอย่างน้อย
                2 ใน 3 ท่าน
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {fundInfo.signers.map((signer, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#FFF9EE] border border-[#E9D9BF] space-y-2"
                >
                  <div className="w-10 h-10 rounded-full bg-[#DCECC5] flex items-center justify-center text-[#70452E] font-bold text-sm">
                    {idx + 1}
                  </div>
                  <p className="font-semibold text-sm text-[#38251B]">
                    {signer}
                  </p>
                  <p className="text-xs text-[#70452E]/70">
                    ผู้มีอำนาจลงนามเบิกจ่าย
                  </p>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-[#FFF4DF]/50 border border-[#E9D9BF] text-xs text-[#70452E] leading-relaxed space-y-2">
              <p className="font-bold text-[#38251B]">ข้อกำหนดของกองทุน:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  การเบิกเกิน 10,000 บาท
                  ต้องแนบเอกสารเสนอโครงการต่อคณะกรรมการคริสตจักร
                </li>
                <li>
                  สรุปรายงานยอดเงินคงเหลือและใบเสร็จทุกสิ้นเดือนให้แก่ที่ประชุมมัคนายก
                </li>
                <li>
                  เงินถวายที่มีผู้ระบุเจาะจง
                  ห้ามโอนย้ายไปยังกองทุนอื่นโดยไม่ได้รับความยินยอม
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Transfer Fund Modal */}
        {showTransferModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-[#E9D9BF] max-w-md w-full max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-[#E9D9BF] pb-3">
                <h3 className="text-lg font-bold text-[#38251B]">
                  โอนเงินระหว่างกองทุน
                </h3>
                <button
                  onClick={() => setShowTransferModal(false)}
                  type="button"
                  aria-label="ปิด"
                  className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-xl text-xl font-bold text-[#70452E]/60 hover:bg-[#FFF4DF] hover:text-[#38251B]"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-[#38251B]">
                    โอนจากกองทุน
                  </label>
                  <input
                    type="text"
                    disabled
                    value={fundInfo.name}
                    className="w-full px-3 py-2 rounded-xl border border-[#E9D9BF] bg-[#FFF4DF]/30 font-medium text-[#38251B] mt-1"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#38251B]">
                    ไปยังกองทุน
                  </label>
                  <select className="w-full px-3 py-2 rounded-xl border border-[#E9D9BF] bg-white font-medium text-[#38251B] mt-1">
                    <option>บัญชีทั่วไป (General Operating Fund)</option>
                    <option>กองทุนพันธกิจและประกาศ (Mission Fund)</option>
                    <option>กองทุนก่อสร้างและพัฒนาอาคาร (Building Fund)</option>
                    <option>กองทุนสงเคราะห์และชุมชน (Benevolence Fund)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-[#38251B]">
                    จำนวนเงิน (บาท)
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl border border-[#E9D9BF] text-base font-bold mt-1"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#38251B]">
                    เหตุผลการโอน
                  </label>
                  <textarea
                    rows={2}
                    placeholder="ระบุวัตถุประสงค์ในการย้ายยอดเงิน..."
                    className="w-full px-3 py-2 rounded-xl border border-[#E9D9BF] mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E9D9BF] text-xs font-medium text-[#70452E]"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => {
                    toast.success("บันทึกการโอนเงินระหว่างกองทุนเรียบร้อย");
                    setShowTransferModal(false);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#E99A4A] text-white text-xs font-semibold hover:bg-[#d88939]"
                >
                  ยืนยันการโอน
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
