import React, { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  ConfirmDialog,
  MoneyDisplay,
  StatusBadge,
} from "@/components/common/CommonUI";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Download,
  FileCheck,
  FileText,
  History,
  Landmark,
  Pencil,
  Printer,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";

export default function TransactionDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/transactions/:id");
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const txId = params?.id || "tx-1";
  const isIncome = !txId.includes("expense");

  // Realistic transaction detail mock
  const tx = {
    id: txId,
    refCode: `GL-2026-${txId.replace(/\D/g, "") || "0912"}`,
    title: isIncome ? "ถวายประจำสัปดาห์ (Sunday Offering)" : "ค่าอุปกรณ์นมัสการ",
    amount: isIncome ? 1000 : 2450,
    type: isIncome ? ("income" as const) : ("expense" as const),
    date: "12 กันยายน 2026 เวลา 10:30 น.",
    category: isIncome ? "ถวายทั่วไป" : "อุปกรณ์นมัสการ",
    fund: "บัญชีทั่วไป (เพื่อการดำเนินงาน)",
    ministry: isIncome ? "ฝ่ายการเงินคริสตจักร" : "พันธกิจนมัสการ",
    paymentMethod: "โอนเงินผ่านระบบธนาคาร (SCB Easy)",
    donorOrPayee: isIncome ? "ครอบครัวสมบูรณ์สุข (สมาชิก)" : "ห้างหุ้นส่วนจำกัด แสงเสียงสวรรค์",
    recordedBy: "อนุชา พรประสิทธิ์ (เหรัญญิก)",
    approvedBy: "ศจ.ดร. มานิตย์ มั่นคง (ศิษยาภิบาล)",
    status: "approved",
    notes: isIncome
      ? "ถวายขอบพระคุณพระเจ้าสำหรับพันธกิจวันอาทิตย์รอบเช้า"
      : "จัดซื้อสายสัญญาณไมโครโฟนและขาตั้งสำหรับเวทีนมัสการชุดใหม่",
    attachments: [
      {
        name: "slip_transfer_receipt.pdf",
        size: "245 KB",
        date: "12 ก.ย. 2026",
      },
      {
        name: "invoice_sound_equipment.jpg",
        size: "1.2 MB",
        date: "12 ก.ย. 2026",
      },
    ],
    auditLogs: [
      {
        action: "อนุมัติรายการเรียบร้อย",
        by: "ศจ.ดร. มานิตย์ มั่นคง (PASTOR)",
        time: "12 ก.ย. 2026 · 11:15 น.",
      },
      {
        action: "ตรวจสอบเอกสารหลักฐานผ่าน",
        by: "อนุชา พรประสิทธิ์ (TREASURER)",
        time: "12 ก.ย. 2026 · 10:45 น.",
      },
      {
        action: "บันทึกรายการเข้าสู่ระบบ",
        by: "อนุชา พรประสิทธิ์ (TREASURER)",
        time: "12 ก.ย. 2026 · 10:30 น.",
      },
    ],
  };

  const handleCancelConfirm = () => {
    setIsCancelling(true);
    setTimeout(() => {
      setIsCancelling(false);
      setCancelModalOpen(false);
      toast.success("ยกเลิกรายการเรียบร้อยแล้ว", {
        description: `รายการ ${tx.refCode} ถูกทำเครื่องหมายเป็นยกเลิก`,
      });
      setLocation("/transactions");
    }, 600);
  };

  return (
    <AppLayout
      activeRoute="/transactions"
      title="รายละเอียดรายการ"
      subtitle={`เลขอ้างอิง: ${tx.refCode}`}
      action={
        <button
          onClick={() => setLocation("/transactions")}
          className="px-3.5 py-2 rounded-2xl bg-[#FFF4DF] hover:bg-[#FBE9CD] text-[#70452E] text-xs font-bold border border-[#E9D9BF] flex items-center gap-1.5 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับหน้ารายการ</span>
        </button>
      }
    >
      {/* 1. Main Financial Header Card */}
      <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-[#E9D9BF] clay-card-shadow space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E9D9BF]/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#927D6D]">
                {tx.type === "income" ? "รายรับ (ถวาย)" : "รายจ่าย"}
              </span>
              <StatusBadge status={tx.status} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#38251B]">
              {tx.title}
            </h2>
            <p className="text-xs text-[#927D6D] flex items-center gap-1.5 pt-0.5">
              <Calendar className="w-3.5 h-3.5 text-[#E99A4A]" />
              <span>{tx.date}</span>
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-[#927D6D] block">จำนวนเงินสุทธิ</span>
            <MoneyDisplay amount={tx.amount} type={tx.type} size="xl" />
          </div>
        </div>

        {/* 2. Structured Financial Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-[#FFFDF8] p-4 rounded-2xl border border-[#E9D9BF]/70 space-y-1">
            <span className="text-xs text-[#927D6D] block">กองทุนบัญชี</span>
            <span className="text-sm font-bold text-[#70452E] flex items-center gap-1.5">
              <Landmark className="w-4 h-4 text-[#E99A4A]" />
              {tx.fund}
            </span>
          </div>

          <div className="bg-[#FFFDF8] p-4 rounded-2xl border border-[#E9D9BF]/70 space-y-1">
            <span className="text-xs text-[#927D6D] block">หมวดหมู่</span>
            <span className="text-sm font-bold text-[#38251B]">
              {tx.category}
            </span>
          </div>

          <div className="bg-[#FFFDF8] p-4 rounded-2xl border border-[#E9D9BF]/70 space-y-1">
            <span className="text-xs text-[#927D6D] block">พันธกิจที่เกี่ยวข้อง</span>
            <span className="text-sm font-bold text-[#38251B]">
              {tx.ministry}
            </span>
          </div>

          <div className="bg-[#FFFDF8] p-4 rounded-2xl border border-[#E9D9BF]/70 space-y-1">
            <span className="text-xs text-[#927D6D] block">ช่องทางการเงิน</span>
            <span className="text-sm font-bold text-[#38251B] flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-[#A8C978]" />
              {tx.paymentMethod}
            </span>
          </div>

          <div className="bg-[#FFFDF8] p-4 rounded-2xl border border-[#E9D9BF]/70 space-y-1">
            <span className="text-xs text-[#927D6D] block">
              {tx.type === "income" ? "ผู้ถวาย" : "ผู้รับเงิน / ร้านค้า"}
            </span>
            <span className="text-sm font-bold text-[#70452E] flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#85C1E9]" />
              {tx.donorOrPayee}
            </span>
          </div>

          <div className="bg-[#FFFDF8] p-4 rounded-2xl border border-[#E9D9BF]/70 space-y-1">
            <span className="text-xs text-[#927D6D] block">ผู้บันทึกรายการ</span>
            <span className="text-sm font-bold text-[#38251B] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#4F8B33]" />
              {tx.recordedBy}
            </span>
          </div>
        </div>

        {/* 3. Notes Section */}
        <div className="bg-[#FFF9EE] p-4 rounded-2xl border border-[#E9D9BF] space-y-1">
          <span className="text-xs font-bold text-[#70452E] block">
            หมายเหตุประกอบรายการ
          </span>
          <p className="text-xs text-[#38251B] leading-relaxed">{tx.notes}</p>
        </div>

        {/* 4. Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => toast.info("กำลังเตรียมพิมพ์ใบเสร็จ/ใบสำคัญจ่าย...")}
              className="px-4 py-2.5 rounded-2xl bg-[#FFF4DF] hover:bg-[#FBE9CD] text-[#70452E] text-xs font-bold border border-[#E9D9BF] flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-4 h-4 text-[#E99A4A]" />
              <span>พิมพ์ใบสำคัญ</span>
            </button>
            <button
              onClick={() => toast.info("เปิดโหมดแก้ไขข้อมูลรายการ")}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-[#FFF9EE] text-[#70452E] text-xs font-bold border border-[#E9D9BF] flex items-center gap-1.5 transition-all"
            >
              <Pencil className="w-4 h-4 text-[#85C1E9]" />
              <span>แก้ไขรายการ</span>
            </button>
          </div>

          <button
            onClick={() => setCancelModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-[#FFEBE5] hover:bg-[#F7D5CD] text-[#D45945] text-xs font-bold border border-[#F7D5CD] flex items-center gap-1.5 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>ยกเลิกรายการนี้</span>
          </button>
        </div>
      </div>

      {/* 5. Attachments Section */}
      <div className="bg-white rounded-[32px] p-6 border border-[#E9D9BF] clay-card-shadow space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#70452E] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#E99A4A]" />
            <span>เอกสารหลักฐานแนบ ({tx.attachments.length})</span>
          </h3>
          <span className="text-xs text-[#927D6D]">สลิปโอน / ใบเสร็จรับเงิน</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tx.attachments.map((att, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-[#FFFDF8] border border-[#E9D9BF] flex items-center justify-between gap-3 hover:border-[#E99A4A] transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#FFF4DF] flex items-center justify-center text-[#E99A4A] shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#38251B] truncate">
                    {att.name}
                  </p>
                  <p className="text-[11px] text-[#927D6D]">
                    {att.size} · {att.date}
                  </p>
                </div>
              </div>
              <button
                onClick={() => toast.success(`ดาวน์โหลดไฟล์ ${att.name} สำเร็จ`)}
                className="w-8 h-8 rounded-xl bg-white border border-[#E9D9BF] flex items-center justify-center text-[#70452E] hover:bg-[#FFF4DF] transition-all shrink-0"
                aria-label="ดาวน์โหลดเอกสาร"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Audit History Section */}
      <div className="bg-white rounded-[32px] p-6 border border-[#E9D9BF] clay-card-shadow space-y-4">
        <h3 className="text-base font-bold text-[#70452E] flex items-center gap-2">
          <History className="w-4 h-4 text-[#A8C978]" />
          <span>ประวัติการตรวจสอบและการดำเนินการ (Audit History)</span>
        </h3>

        <div className="space-y-3">
          {tx.auditLogs.map((log, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 rounded-2xl bg-[#FFFDF8] border border-[#E9D9BF]/60 text-xs"
            >
              <div className="w-2 h-2 rounded-full bg-[#A8C978] mt-1.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#38251B]">{log.action}</p>
                <p className="text-[11px] text-[#927D6D] pt-0.5">
                  โดย {log.by} · {log.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reusable Confirm Dialog for Cancel */}
      <ConfirmDialog
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        title="ยืนยันการยกเลิกรายการ?"
        description="การยกเลิกจะปรับปรุงยอดเงินในกองทุนและบันทึกประวัติการยกเลิกไว้ในระบบ คุณแน่ใจหรือไม่ว่าต้องการดำเนินการต่อ?"
        confirmText="ยืนยันยกเลิกรายการ"
        variant="danger"
        onConfirm={handleCancelConfirm}
        isLoading={isCancelling}
      />
    </AppLayout>
  );
}
