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
  Calendar,
  CheckCircle2,
  FileUp,
  HandCoins,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  OFFERING_CATEGORIES,
  offeringCategoryLabel,
  type OfferingCategory,
} from "@shared/categories";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function NewOffering() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  // Real funds from the database; ids are never assumed.
  const fundsQuery = trpc.finance.accounts.useQuery(undefined, {
    retry: false,
  });
  const funds = fundsQuery.data ?? [];

  // Form State
  const [category, setCategory] = useState<OfferingCategory>("general");
  const [amount, setAmount] = useState("");
  const [fundId, setFundId] = useState("");
  const [method, setMethod] = useState("เงินสด");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [donorName, setDonorName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const isDirty =
    !isSuccessOpen &&
    Boolean(
      amount ||
        notes ||
        donorName ||
        isAnonymous ||
        fundId ||
        category !== "general" ||
        method !== "เงินสด"
    );
  useUnsavedChanges(isDirty);
  const goBack = () => {
    if (confirmDiscardChanges(isDirty)) {
      setLocation("/offerings");
    }
  };

  const createMutation = trpc.offerings.create.useMutation({
    onSuccess: () => {
      setIsSuccessOpen(true);
      void Promise.all([
        utils.offerings.list.invalidate(),
        utils.finance.summary.invalidate(),
        utils.finance.monthlyStats.invalidate(),
      ]);
      toast.success("บันทึกการถวายเรียบร้อยแล้ว");
    },
    onError: error => {
      toast.error("บันทึกการถวายไม่สำเร็จ", { description: error.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast.error("กรุณาระบุจำนวนเงินที่ถูกต้อง");
      return;
    }
    if (!fundId) {
      toast.error("กรุณาเลือกกองทุนก่อนบันทึก");
      return;
    }

    createMutation.mutate({
      category,
      amount: Number(amount),
      fundId: Number(fundId),
      method:
        method === "โอน" || method === "QR"
          ? "transfer"
          : method === "เช็ค"
            ? "check"
            : "cash",
      notes: notes || undefined,
    });
  };

  const categories = OFFERING_CATEGORIES;

  const quickAmounts = [100, 300, 500, 1000, 2000, 5000];

  const paymentMethods = ["เงินสด", "โอนเงิน", "QR พร้อมเพย์", "เช็ค"];

  return (
    <AppLayout
      activeRoute="/offerings"
      title="บันทึกถวาย"
      subtitle="บันทึกรายการเงินถวายเข้าสู่บัญชีและกองทุนคริสตจักร"
      action={
        <button
          onClick={goBack}
          className="px-3.5 py-2 rounded-2xl bg-[#FFF4DF] hover:bg-[#FBE9CD] text-[#70452E] text-xs font-bold border border-[#E9D9BF] flex items-center gap-1.5 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ดูรายการทั้งหมด</span>
        </button>
      }
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Hero Card with offering_box.jpg */}
        <div className="bg-gradient-to-r from-[#FFFDF8] via-[#FFF8EC] to-[#FFF1DE] rounded-[32px] p-6 border border-[#E9D9BF] shadow-xs flex items-center gap-5">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[24px] overflow-hidden bg-white p-1 border border-[#E9D9BF] shadow-xs shrink-0">
            <Illustration
              src="/illustrations/offering_box.jpg"
              alt="กล่องถวาย"
              className="w-full h-full object-cover rounded-[20px]"
              width={96}
              height={96}
            />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#70452E]">
              การถวายด้วยความยินดี
            </h2>
            <p className="text-xs text-[#927D6D] leading-relaxed">
              "พระเจ้าทรงรักผู้ที่ให้ด้วยใจยินดี" —
              ทุกยอดการถวายจะถูกบันทึกอย่างถูกต้องและโปร่งใสเพื่อการงานของพระเจ้า
            </p>
          </div>
        </div>

        {/* Main Step Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-[32px] p-6 sm:p-8 border border-[#E9D9BF] clay-card-shadow space-y-6"
        >
          {/* 1. ประเภทถวาย */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-[#70452E] block">
              1. เลือกประเภทการถวาย
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-3 rounded-2xl border text-xs font-bold text-center transition-all ${
                    category === cat.id
                      ? "bg-[#FFF4DF] border-[#E99A4A] text-[#70452E] shadow-2xs"
                      : "bg-white border-[#E9D9BF] text-[#70452E]/80 hover:bg-[#FFF9EE]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. จำนวนเงิน + Shortcuts */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-[#70452E] block">
              2. ระบุจำนวนเงิน (บาท)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-[#1b5e3a]">
                ฿
              </span>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-[#FFFDF8] border border-[#E9D9BF] text-2xl font-black text-[#1b5e3a] focus:outline-none focus:border-[#E99A4A]"
              />
            </div>

            {/* Shortcut Chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              {quickAmounts.map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(String(q))}
                  className="px-3.5 py-1.5 rounded-full bg-[#FFF4DF] hover:bg-[#FBE9CD] text-xs font-bold text-[#70452E] border border-[#E9D9BF] transition-all"
                >
                  +฿{q.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* 3. กองทุน */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-[#70452E] block">
              3. เข้ากองทุน
            </label>
            <select
              required
              value={fundId}
              onChange={e => setFundId(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[#FFFDF8] border border-[#E9D9BF] text-xs sm:text-sm text-[#38251B] focus:outline-none focus:border-[#E99A4A]"
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
            {funds.length === 0 && (
              <p className="text-xs text-[#D45945]">
                ยังไม่มีกองทุนในระบบ ต้องสร้างกองทุนก่อนบันทึกการถวาย
              </p>
            )}
          </div>

          {/* 4. วิธีรับเงิน */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-[#70452E] block">
              4. วิธีการรับเงิน
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {paymentMethods.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all ${
                    method === m
                      ? "bg-[#EAF5E4] border-[#A8C978] text-[#4F8B33] shadow-2xs"
                      : "bg-white border-[#E9D9BF] text-[#70452E]/80 hover:bg-[#FFF9EE]"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* 5. วันที่ & รายละเอียดเพิ่มเติม */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#70452E] block">
                วันที่รับเงิน
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[#FFFDF8] border border-[#E9D9BF] text-xs text-[#38251B]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#70452E] block">
                ชื่อผู้ถวาย (ถ้ามี)
              </label>
              <input
                type="text"
                disabled={isAnonymous}
                value={donorName}
                onChange={e => setDonorName(e.target.value)}
                placeholder={
                  isAnonymous
                    ? "ถวายโดยไม่เปิดเผยนาม"
                    : "ชื่อ-นามสกุล หรือครอบครัว"
                }
                className="w-full p-3 rounded-2xl bg-[#FFFDF8] border border-[#E9D9BF] text-xs text-[#38251B] disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="anon"
              checked={isAnonymous}
              onChange={e => {
                setIsAnonymous(e.target.checked);
                if (e.target.checked) setDonorName("");
              }}
              className="rounded text-[#E99A4A] focus:ring-[#E99A4A] w-4 h-4 border-[#E9D9BF]"
            />
            <label
              htmlFor="anon"
              className="text-xs text-[#70452E] cursor-pointer"
            >
              ไม่ระบุชื่อผู้ถวาย (ถวายโดยไม่เปิดเผยนาม)
            </label>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#70452E] block">
              หมายเหตุ / คำอธิษฐานขอบพระคุณ
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="เช่น ถวายขอบพระคุณสำหรับวันเกิด, พันธกิจเด็ก"
              className="w-full p-3 rounded-2xl bg-[#FFFDF8] border border-[#E9D9BF] text-xs text-[#38251B]"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full py-4 rounded-2xl bg-[#E99A4A] hover:bg-[#DE8640] text-white font-bold text-sm clay-button-shadow transition-all flex items-center justify-center gap-2"
          >
            <HandCoins className="w-5 h-5" />
            <span>
              {createMutation.isPending
                ? "กำลังบันทึก..."
                : "ยืนยันบันทึกการถวาย"}
            </span>
          </button>
        </form>
      </div>

      {/* Success Celebration Dialog */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="max-w-sm bg-[#FFFDF8] border-[#E9D9BF] rounded-[32px] p-6 text-center text-[#38251B] space-y-4">
          <div className="w-20 h-20 mx-auto rounded-3xl overflow-hidden border border-[#E9D9BF] shadow-xs p-1 bg-[#EAF5E4]">
            <Illustration
              src="/illustrations/income_hand_heart.jpg"
              alt="ถวายสำเร็จ"
              className="w-full h-full object-cover rounded-2xl"
              width={80}
              height={80}
            />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-[#70452E]">
              บันทึกการถวายเรียบร้อยแล้ว
            </h3>
            <p className="text-xs text-[#927D6D] mt-1">
              "ขอพระเจ้าทรงอวยพระพรและตอบแทนทุกน้ำใจที่ท่านได้มอบให้เพื่อพันธกิจของพระองค์"
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFF4DF] border border-[#E9D9BF] text-xs text-left space-y-1.5">
            <p className="flex justify-between">
              <span className="text-[#927D6D]">ประเภท:</span>
              <span className="font-bold text-[#70452E]">
                {offeringCategoryLabel(category)}
              </span>
            </p>
            <p className="flex justify-between">
              <span className="text-[#927D6D]">จำนวนเงิน:</span>
              <span className="font-black text-[#1b5e3a]">
                ฿{Number(amount).toLocaleString()}
              </span>
            </p>
            <p className="flex justify-between">
              <span className="text-[#927D6D]">ช่องทาง:</span>
              <span className="font-medium text-[#70452E]">{method}</span>
            </p>
          </div>

          <button
            onClick={() => {
              setIsSuccessOpen(false);
              setLocation("/offerings");
            }}
            className="w-full py-3.5 rounded-2xl bg-[#A8C978] hover:bg-[#96C764] text-white font-bold text-sm clay-button-shadow transition-all"
          >
            ดูรายการถวายทั้งหมด
          </button>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
