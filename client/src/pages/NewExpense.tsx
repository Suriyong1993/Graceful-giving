import React, { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { AppLayout } from "@/components/layout/AppLayout";
import { Illustration } from "@/components/Illustration";
import {
  confirmDiscardChanges,
  useUnsavedChanges,
} from "@/hooks/useUnsavedChanges";
import {
  ArrowLeft,
  Building,
  CheckCircle2,
  Cross,
  FileText,
  GraduationCap,
  HeartHandshake,
  Plus,
  Receipt,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@shared/categories";

export default function NewExpense() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<ExpenseCategory>("utilities");
  const [description, setDescription] = useState("");
  const [payee, setPayee] = useState("");
  const [fundId, setFundId] = useState<number | null>(null);
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const isDirty =
    !showSuccessModal &&
    Boolean(
      amount ||
        description ||
        payee ||
        details ||
        fundId ||
        category !== "utilities"
    );
  useUnsavedChanges(isDirty);
  const goBack = async () => {
    if (await confirmDiscardChanges(isDirty)) setLocation("/expenses");
  };

  const createExpenseMutation = trpc.expenses.create.useMutation({
    onSuccess: () => {
      setIsSubmitting(false);
      setShowSuccessModal(true);
      void Promise.all([
        utils.expenses.list.invalidate(),
        utils.finance.summary.invalidate(),
        utils.finance.monthlyStats.invalidate(),
      ]);
      toast.success("บันทึกรายการรายจ่ายเรียบร้อยแล้ว");
    },
    onError: err => {
      setIsSubmitting(false);
      setShowSuccessModal(false);
      toast.error(
        err.message || "บันทึกรายการรายจ่ายไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(/,/g, ""));
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("กรุณาระบุจำนวนเงินที่ถูกต้อง");
      return;
    }
    if (!description.trim()) {
      toast.error("กรุณาระบุชื่อรายการหรือคำอธิบายรายจ่าย");
      return;
    }
    if (!fundId) {
      toast.error("กรุณาเลือกกองทุนก่อนบันทึก");
      return;
    }

    setIsSubmitting(true);
    createExpenseMutation.mutate({
      amount: numAmount,
      category,
      description: description.trim(),
      details: details.trim() || undefined,
      fundId,
      payee: payee.trim() || undefined,
      expenseDate: new Date(expenseDate),
    });
  };

  const amountPresets = [500, 1000, 2500, 5000, 10000];

  const handlePreset = (val: number) => {
    setAmount(val.toLocaleString("th-TH"));
  };

  const categoryIcons: Record<string, { icon: typeof Zap; desc: string }> = {
    utilities: { icon: Zap, desc: "ค่าน้ำ ค่าไฟ อินเทอร์เน็ต" },
    ministry: { icon: Users, desc: "รวี กิจกรรม ค่าย กลุ่มแคร์" },
    welfare: { icon: HeartHandshake, desc: "เยี่ยมเยียน ผู้ยากไร้ ชุมชน" },
    worship: { icon: GraduationCap, desc: "อุปกรณ์เสียง ลิขสิทธิ์เพลง" },
    building: { icon: Building, desc: "ซ่อมบำรุง บูรณะ ปรับปรุง" },
    pastoral: { icon: Cross, desc: "ค่าตอบแทนและพันธกิจอภิบาล" },
    admin: { icon: Receipt, desc: "อุปกรณ์สำนักงาน เอกสาร ภาษี" },
    other: { icon: FileText, desc: "เบ็ดเตล็ดและอื่น ๆ" },
  };

  const categories = EXPENSE_CATEGORIES.map(categoryOption => ({
    id: categoryOption.id,
    label: categoryOption.label,
    icon: categoryIcons[categoryOption.id]?.icon ?? FileText,
    desc: categoryIcons[categoryOption.id]?.desc ?? "",
  }));

  // Real funds from the database; no balances are invented here.
  const fundsQuery = trpc.finance.accounts.useQuery(undefined, {
    retry: false,
  });
  const funds = fundsQuery.data ?? [];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={goBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#1E4470] hover:text-[#0C1B33] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้ารายการรายจ่าย</span>
          </button>
          <span className="text-xs text-[#1E4470]/60 bg-[#EEF2F8] border border-[#DDE5F0] px-3 py-1 rounded-full font-medium">
            ใบเบิกจ่าย / ใบสำคัญจ่าย
          </span>
        </div>

        {/* Hero Visual Card */}
        <div className="bg-[#EEF2F8] border border-[#DDE5F0] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FDA4AF]/30 text-[#1E4470]">
              <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
              บันทึกการใช้จ่ายคริสตจักร
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-[#0C1B33]">
              บันทึกรายจ่ายใหม่
            </h1>
            <p className="text-sm text-[#1E4470]/80 max-w-lg">
              บันทึกใบเสร็จ ค่าใช้จ่ายโครงการ หรือการเบิกจ่ายงบประมาณ
              พร้อมแนบหลักฐานเพื่อความโปร่งใสของคริสตจักร
            </p>
          </div>
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden shadow-inner flex-shrink-0 bg-white/60 p-1">
            <Illustration
              src="/illustrations/expense_hand_coin.jpg"
              alt="Record expense"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Amount & Presets */}
          <div className="bg-white border border-[#DDE5F0] rounded-3xl p-6 md:p-8 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-[#0C1B33] flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#D97706]" />
              1. จำนวนเงินและหมวดหมู่
            </h2>

            {/* Amount Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#0C1B33]">
                จำนวนเงิน (บาท) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-[#1E4470]/50">
                  ฿
                </span>
                <input
                  type="text"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-[#DDE5F0] focus:border-[#D97706] focus:outline-none bg-[#F6F8FC]/30 text-3xl font-bold text-[#0C1B33] placeholder:text-[#1E4470]/30"
                />
              </div>

              {/* Amount Quick Presets */}
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="text-xs text-[#1E4470]/70 py-1">
                  จำนวนเงินแนะนำ:
                </span>
                {amountPresets.map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handlePreset(val)}
                    className="px-3 py-1 rounded-xl bg-[#EEF2F8] hover:bg-[#B9E6D0] border border-[#DDE5F0] text-xs font-semibold text-[#1E4470] transition-colors"
                  >
                    +฿{val.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Grid */}
            <div className="space-y-2 pt-2">
              <label className="text-sm font-semibold text-[#0C1B33]">
                หมวดหมู่รายจ่าย <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {categories.map(cat => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-[#D97706] bg-[#EEF2F8] shadow-sm ring-2 ring-[#D97706]/20"
                          : "border-[#DDE5F0] hover:bg-[#F6F8FC]/50 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            isSelected
                              ? "bg-[#12325C] text-white"
                              : "bg-[#EEF2F8] text-[#1E4470]"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-[#D97706]" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#0C1B33]">
                          {cat.label}
                        </p>
                        <p className="text-[10px] text-[#1E4470]/70 line-clamp-1">
                          {cat.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: Expense Details & Fund Allocation */}
          <div className="bg-white border border-[#DDE5F0] rounded-3xl p-6 md:p-8 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-[#0C1B33] flex items-center gap-2">
              <Building className="w-5 h-5 text-[#34D399]" />
              2. ข้อมูลรายการและกองทุนที่จัดสรร
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-semibold text-[#0C1B33]">
                  ชื่อรายการ / คำอธิบายรายจ่าย{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ค่าไฟฟ้าประจำเดือน, อุปกรณ์รวีวารศึกษา..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-[#DDE5F0] focus:border-[#D97706] focus:outline-none bg-[#F6F8FC]/20 text-sm font-medium text-[#0C1B33]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0C1B33]">
                  ผู้รับเงิน / ร้านค้า / องค์กร
                </label>
                <input
                  type="text"
                  placeholder="เช่น การไฟฟ้านครหลวง, บจก. ซาวด์..."
                  value={payee}
                  onChange={e => setPayee(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-[#DDE5F0] focus:border-[#D97706] focus:outline-none bg-[#F6F8FC]/20 text-sm text-[#0C1B33]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0C1B33]">
                  ตัดจ่ายจากกองทุน <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={fundId ?? ""}
                  onChange={e => setFundId(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-2xl border border-[#DDE5F0] focus:border-[#D97706] focus:outline-none bg-[#F6F8FC]/20 text-sm font-medium text-[#0C1B33]"
                >
                  <option value="" disabled>
                    — เลือกกองทุน —
                  </option>
                  {funds.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0C1B33]">
                  วันที่ทำรายการ
                </label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={e => setExpenseDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-[#DDE5F0] focus:border-[#D97706] focus:outline-none bg-[#F6F8FC]/20 text-sm text-[#0C1B33]"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-semibold text-[#0C1B33]">
                  หมายเหตุเพิ่มเติม / วัตถุประสงค์
                </label>
                <textarea
                  rows={2}
                  placeholder="ระบุรายละเอียดเพิ่มเติมสำหรับการตรวจสอบบัญชี..."
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-[#DDE5F0] focus:border-[#D97706] focus:outline-none bg-[#F6F8FC]/20 text-sm text-[#0C1B33]"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#EEF2F8] border border-[#DDE5F0] rounded-2xl p-4 text-sm text-[#1E4470]">
            การแนบไฟล์หลักฐานยังไม่เปิดใช้งานในระบบนี้
            กรุณาบันทึกเลขที่ใบเสร็จหรือใบแจ้งหนี้ในช่องด้านบน
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={goBack}
              className="px-6 py-3 rounded-2xl border border-[#DDE5F0] bg-white text-[#1E4470] hover:bg-[#EEF2F8]/50 font-medium text-sm transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 rounded-2xl bg-[#12325C] hover:bg-[#0F2947] text-white font-semibold text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? "กำลังบันทึก..." : "บันทึกรายจ่าย"}</span>
            </button>
          </div>
        </form>

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-[#DDE5F0] max-w-md w-full max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain p-6 md:p-8 text-center space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-[#B9E6D0] flex items-center justify-center text-[#1E4470] mx-auto">
                <CheckCircle2 className="w-8 h-8 text-[#1E4470]" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-[#0C1B33]">
                  บันทึกรายจ่ายสำเร็จ!
                </h3>
                <p className="text-sm text-[#1E4470]/80">
                  รายการรายจ่ายถูกบันทึกลงสมุดบัญชีคริสตจักรเรียบร้อยแล้ว
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#EEF2F8]/60 border border-[#DDE5F0] text-left space-y-2 text-xs text-[#1E4470]">
                <div className="flex justify-between">
                  <span className="text-[#1E4470]/70">รายการ:</span>
                  <span className="font-semibold text-[#0C1B33]">
                    {description}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#1E4470]/70">จำนวนเงิน:</span>
                  <span className="font-bold text-red-600 text-sm">
                    -฿
                    {parseFloat(amount.replace(/,/g, "") || "0").toLocaleString(
                      "th-TH",
                      { minimumFractionDigits: 2 }
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#1E4470]/70">ผู้รับเงิน:</span>
                  <span className="font-medium text-[#0C1B33]">
                    {payee || "ทั่วไป"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#1E4470]/70">วันที่:</span>
                  <span className="text-[#0C1B33]">
                    {new Date(expenseDate).toLocaleDateString("th-TH")}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setAmount("");
                    setDescription("");
                    setPayee("");
                  }}
                  className="w-full py-3 rounded-2xl bg-[#12325C] text-white font-medium text-sm hover:bg-[#0F2947] transition-colors shadow-sm"
                >
                  บันทึกรายจ่ายรายการถัดไป
                </button>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setLocation("/expenses");
                  }}
                  className="w-full py-2.5 rounded-2xl border border-[#DDE5F0] text-[#1E4470] font-medium text-sm hover:bg-[#EEF2F8]/50 transition-colors"
                >
                  กลับสู่หน้ารายการรายจ่าย
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
