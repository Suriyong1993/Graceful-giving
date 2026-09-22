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
  Building,
  CheckCircle2,
  Cross,
  FileText,
  GraduationCap,
  HeartHandshake,
  Image as ImageIcon,
  Plus,
  Receipt,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@shared/categories";
import { NativeSelect } from "@/components/ui/native-select";
import { BackLink, Chip } from "@/components/common/CommonUI";
import { formatBaht } from "@/lib/format";

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
  const [receiptRef, setReceiptRef] = useState("");
  const [details, setDetails] = useState("");
  const [receiptFile, setReceiptFile] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string>("");
  const [receiptContentType, setReceiptContentType] = useState<string>("");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdExpenseId, setCreatedExpenseId] = useState<number | null>(null);
  const isDirty =
    !showSuccessModal &&
    Boolean(
      amount ||
        description ||
        payee ||
        receiptRef ||
        details ||
        receiptFile ||
        fundId ||
        category !== "utilities"
    );
  useUnsavedChanges(isDirty);
  const goBack = async () => {
    if (await confirmDiscardChanges(isDirty)) setLocation("/expenses");
  };

  const uploadReceiptMutation = trpc.expenses.uploadReceipt.useMutation({
    onSuccess: data => {
      setReceiptUrl(data.url);
      setIsUploading(false);
      toast.success("อัปโหลดใบเสร็จเรียบร้อยแล้ว");
    },
    onError: err => {
      setIsUploading(false);
      toast.error(err.message || "อัปโหลดไฟล์ไม่สำเร็จ กรุณาลองใหม่");
    },
  });

  const createExpenseMutation = trpc.expenses.create.useMutation({
    onSuccess: data => {
      setIsSubmitting(false);
      setCreatedExpenseId(data.id);
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
      receiptRef: receiptRef.trim() || undefined,
      receiptUrl: receiptUrl ?? undefined,
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

  const categories = EXPENSE_CATEGORIES.map(c => ({
    id: c.id,
    label: c.label,
    icon: categoryIcons[c.id]?.icon ?? FileText,
    desc: categoryIcons[c.id]?.desc ?? "",
  }));

  // Real funds from the database; no balances are invented here.
  const fundsQuery = trpc.finance.accounts.useQuery(undefined, {
    retry: false,
  });
  const funds = fundsQuery.data ?? [];

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("รองรับเฉพาะไฟล์ JPG, PNG, WEBP, GIF หรือ PDF เท่านั้น");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("ไฟล์ต้องมีขนาดไม่เกิน 10 MB");
      return;
    }

    setReceiptFileName(file.name);
    setReceiptContentType(file.type);
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Show preview immediately
      setReceiptFile(dataUrl);
      // Extract pure base64 (remove "data:...;base64," prefix)
      const base64Data = dataUrl.split(",")[1];
      uploadReceiptMutation.mutate({
        fileName: file.name,
        contentType: file.type,
        base64Data,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <BackLink label="กลับหน้ารายการรายจ่าย" onClick={goBack} />
          <span className="text-xs text-ink-2/60 bg-sunken border border-line px-3 py-1 rounded-full font-medium">
            ใบเบิกจ่าย / ใบสำคัญจ่าย
          </span>
        </div>

        {/* Hero Visual Card */}
        <div className="bg-sunken border border-line rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-danger-line/30 text-ink-2">
              บันทึกการใช้จ่ายคริสตจักร
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-ink">
              บันทึกรายจ่ายใหม่
            </h1>
            <p className="text-sm text-ink-2/80 max-w-lg">
              บันทึกใบเสร็จ ค่าใช้จ่ายโครงการ หรือการเบิกจ่ายงบประมาณ
              พร้อมแนบหลักฐานเพื่อความโปร่งใสของคริสตจักร
            </p>
          </div>
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden shadow-inner flex-shrink-0 bg-card/60 p-1">
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
          <div className="bg-card border border-line rounded-3xl p-6 md:p-8 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              1. จำนวนเงินและหมวดหมู่
            </h2>

            {/* Amount Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-ink">
                จำนวนเงิน (บาท) <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-ink-2/50">
                  ฿
                </span>
                <input
                  type="text"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-line focus:border-brand focus:outline-none bg-page/30 text-3xl font-bold text-ink placeholder:text-ink-2/30"
                />
              </div>

              {/* Amount Quick Presets */}
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="text-xs text-ink-2/70 py-1">
                  จำนวนเงินแนะนำ:
                </span>
                {amountPresets.map(val => (
                  <Chip key={val} onClick={() => handlePreset(val)}>
                    +{formatBaht(val, 0)}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Category Grid */}
            <div className="space-y-2 pt-2">
              <label className="text-sm font-semibold text-ink">
                หมวดหมู่รายจ่าย <span className="text-danger">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {categories.map(cat => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id as any)}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-brand bg-sunken shadow-sm ring-2 ring-brand/20"
                          : "border-line hover:bg-page/50 bg-card"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            isSelected
                              ? "bg-brand text-white"
                              : "bg-sunken text-ink-2"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-brand" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-ink">
                          {cat.label}
                        </p>
                        <p className="text-[10px] text-ink-2/70 line-clamp-1">
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
          <div className="bg-card border border-line rounded-3xl p-6 md:p-8 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              2. ข้อมูลรายการและกองทุนที่จัดสรร
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-semibold text-ink">
                  ชื่อรายการ / คำอธิบายรายจ่าย{" "}
                  <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ค่าไฟฟ้าประจำเดือน, อุปกรณ์รวีวารศึกษา..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-line focus:border-brand focus:outline-none bg-page/20 text-sm font-medium text-ink"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-ink">
                  ผู้รับเงิน / ร้านค้า / องค์กร
                </label>
                <input
                  type="text"
                  placeholder="เช่น การไฟฟ้านครหลวง, บจก. ซาวด์..."
                  value={payee}
                  onChange={e => setPayee(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-line focus:border-brand focus:outline-none bg-page/20 text-sm text-ink"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-ink">
                  ตัดจ่ายจากกองทุน <span className="text-danger">*</span>
                </label>
                <NativeSelect
                  required
                  value={fundId ?? ""}
                  onChange={e => setFundId(Number(e.target.value))}
                  className="bg-page/20 font-medium"
                >
                  <option value="" disabled>
                    เลือกกองทุน
                  </option>
                  {funds.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </NativeSelect>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-ink">
                  วันที่ทำรายการ
                </label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={e => setExpenseDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-line focus:border-brand focus:outline-none bg-page/20 text-sm text-ink"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-ink">
                  เลขที่ใบเสร็จ / ใบแจ้งหนี้ (ถ้ามี)
                </label>
                <input
                  type="text"
                  placeholder="เช่น INV-2026-0911, RCP-4412"
                  value={receiptRef}
                  onChange={e => setReceiptRef(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-line focus:border-brand focus:outline-none bg-page/20 text-sm font-mono text-ink"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-semibold text-ink">
                  หมายเหตุเพิ่มเติม / วัตถุประสงค์
                </label>
                <textarea
                  rows={2}
                  placeholder="ระบุรายละเอียดเพิ่มเติมสำหรับการตรวจสอบบัญชี..."
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-line focus:border-brand focus:outline-none bg-page/20 text-sm text-ink"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Receipt Attachment */}
          <div className="bg-card border border-line rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              3. แนบหลักฐานใบเสร็จ / สลิปโอนเงิน
            </h2>

            {isUploading ? (
              <div className="p-6 rounded-2xl bg-sunken/50 border border-line flex items-center gap-4">
                <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-ink">
                    กำลังอัปโหลดไฟล์...
                  </p>
                  <p className="text-xs text-ink-2/70">{receiptFileName}</p>
                </div>
              </div>
            ) : receiptFile ? (
              <div className="p-4 rounded-2xl bg-sunken/50 border border-line space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-card border border-line overflow-hidden flex-shrink-0">
                      {receiptContentType.startsWith("image/") ? (
                        <img
                          src={receiptFile}
                          alt="Receipt preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="w-6 h-6 text-brand" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {receiptUrl ? "อัปโหลดสำเร็จแล้ว" : "แนบไฟล์เรียบร้อย"}
                      </p>
                      <p className="text-xs text-ink-2/70 truncate max-w-[160px]">
                        {receiptFileName}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptFile(null);
                      setReceiptUrl(null);
                      setReceiptFileName("");
                    }}
                    className="text-xs text-danger hover:underline font-medium px-3 py-1.5"
                  >
                    ลบไฟล์
                  </button>
                </div>
                {receiptUrl && (
                  <a
                    href={receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-info hover:underline flex items-center gap-1"
                  >
                    <ImageIcon className="w-3 h-3" />
                    ดูใบเสร็จต้นฉบับ →
                  </a>
                )}
              </div>
            ) : (
              <label className="border-2 border-dashed border-line hover:border-brand rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-page/30 hover:bg-sunken/30 transition-colors">
                <div className="w-12 h-12 rounded-full bg-sunken flex items-center justify-center text-brand mb-3">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-ink">
                  คลิกเพื่ออัปโหลด หรือลากไฟล์มาวางที่นี่
                </p>
                <p className="text-xs text-ink-2/60 mt-1">
                  รองรับไฟล์ภาพ JPG, PNG, WEBP หรือเอกสาร PDF (ขนาดไม่เกิน 10
                  MB)
                </p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                  onChange={handleUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={goBack}
              className="px-6 py-3 rounded-2xl border border-line bg-card text-ink-2 hover:bg-sunken/50 font-medium text-sm transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-8 py-3 rounded-2xl bg-brand hover:bg-brand text-white font-semibold text-sm shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? "กำลังบันทึก..."
                  : isUploading
                    ? "กำลังอัปโหลด..."
                    : "บันทึกรายจ่าย"}
              </span>
            </button>
          </div>
        </form>

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-card rounded-3xl border border-line max-w-md w-full max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain p-6 md:p-8 text-center space-y-6 shadow-xs animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-success-soft flex items-center justify-center text-ink-2 mx-auto">
                <CheckCircle2 className="w-8 h-8 text-ink-2" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-ink">
                  บันทึกรายจ่ายสำเร็จ!
                </h3>
                <p className="text-sm text-ink-2/80">
                  รายการรายจ่ายถูกบันทึกลงสมุดบัญชีคริสตจักรเรียบร้อยแล้ว
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-sunken/60 border border-line text-left space-y-2 text-xs text-ink-2">
                <div className="flex justify-between">
                  <span className="text-ink-2/70">รายการ:</span>
                  <span className="font-semibold text-ink">{description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-2/70">จำนวนเงิน:</span>
                  <span className="font-bold text-danger text-sm">
                    -฿
                    {parseFloat(amount.replace(/,/g, "") || "0").toLocaleString(
                      "th-TH",
                      { minimumFractionDigits: 2 }
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-2/70">ผู้รับเงิน:</span>
                  <span className="font-medium text-ink">
                    {payee || "ทั่วไป"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-2/70">วันที่:</span>
                  <span className="text-ink">
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
                    setReceiptRef("");
                    setReceiptFile(null);
                  }}
                  className="w-full py-3 rounded-2xl bg-brand text-white font-medium text-sm hover:bg-brand transition-colors shadow-sm"
                >
                  บันทึกรายจ่ายรายการถัดไป
                </button>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setLocation("/expenses");
                  }}
                  className="w-full py-2.5 rounded-2xl border border-line text-ink-2 font-medium text-sm hover:bg-sunken/50 transition-colors"
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
