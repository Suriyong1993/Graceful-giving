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
  CheckCircle2,
  HandCoins,
  Loader2,
  ReceiptText,
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
        method === "โอนเงิน" || method === "QR พร้อมเพย์"
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
  const amountNumber = Number(amount || 0);
  const selectedFund = funds.find(f => String(f.id) === fundId);
  const selectedMethodLabel =
    method === "เงินสด"
      ? "รับเป็นเงินสด"
      : method === "เช็ค"
        ? "รับเป็นเช็ค"
        : "รับผ่านบัญชี/QR";

  return (
    <AppLayout
      activeRoute="/offerings"
      title="บันทึกถวาย"
      subtitle="บันทึกรายการเงินถวายเข้าสู่บัญชีและกองทุนคริสตจักร"
      action={
        <button
          onClick={goBack}
          className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-2xl border border-[#E9D9BF] bg-[#FFF4DF] px-3.5 py-2 text-xs font-bold text-[#70452E] transition-colors hover:bg-[#FBE9CD] focus-visible:ring-2 focus-visible:ring-[#E99A4A]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFF9EE]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ดูรายการทั้งหมด</span>
        </button>
      }
    >
      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
        {/* Hero Card with offering_box.jpg */}
        <div className="rounded-[28px] border border-[#E9D9BF] bg-white p-5 clay-card-shadow sm:p-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="size-16 shrink-0 overflow-hidden rounded-2xl border border-[#E9D9BF] bg-[#FFF4DF] p-1 sm:size-20 sm:rounded-[24px]">
            <Illustration
              src="/illustrations/offering_box.jpg"
              alt="กล่องถวาย"
                className="h-full w-full rounded-xl object-cover sm:rounded-[18px]"
              width={96}
              height={96}
            />
          </div>
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-bold text-[#70452E]">Grace Giving</p>
              <h2 className="text-xl font-black leading-tight text-[#38251B] sm:text-2xl">
                สลิปถวายทรัพย์ที่ตรวจสอบง่ายตั้งแต่ก่อนกดบันทึก
            </h2>
              <p className="text-xs leading-5 text-[#674F42] sm:text-sm sm:leading-6">
              "พระเจ้าทรงรักผู้ที่ให้ด้วยใจยินดี" —
              ทุกยอดการถวายจะถูกบันทึกอย่างถูกต้องและโปร่งใสเพื่อการงานของพระเจ้า
            </p>
          </div>
        </div>
        </div>

        {/* Main Step Form Card */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-[28px] border border-[#E9D9BF] bg-white p-5 clay-card-shadow sm:p-6 md:p-7"
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
                  aria-pressed={category === cat.id}
                  className={`min-h-12 rounded-2xl border px-3 py-2.5 text-center text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:ring-[#E99A4A]/45 ${
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
            <label htmlFor="offering-amount" className="text-xs font-bold text-[#70452E] block">
              2. ระบุจำนวนเงิน (บาท)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-[#1b5e3a]">
                ฿
              </span>
              <input
                id="offering-amount"
                type="number"
                required
                min="1"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="min-h-14 w-full rounded-2xl border border-[#E9D9BF] bg-[#FFFDF8] py-3.5 pl-12 pr-4 text-3xl font-black tabular-nums text-[#1b5e3a] placeholder:text-[#A8C978]/70 focus:border-[#E99A4A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E99A4A]/35"
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
            <label htmlFor="offering-fund" className="text-xs font-bold text-[#70452E] block">
              3. เข้ากองทุน
            </label>
            <select
              id="offering-fund"
              required
              value={fundId}
              onChange={e => setFundId(e.target.value)}
              className="min-h-12 w-full rounded-2xl border border-[#E9D9BF] bg-[#FFFDF8] px-3.5 py-3 text-base text-[#38251B] focus:border-[#E99A4A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E99A4A]/35 sm:text-sm"
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
            <label id="offering-method-label" className="text-xs font-bold text-[#70452E] block">
              4. วิธีการรับเงิน
            </label>
            <div id="offering-method" role="group" aria-labelledby="offering-method-label" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {paymentMethods.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  aria-pressed={method === m}
                  className={`min-h-11 rounded-2xl border px-3 py-2.5 text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:ring-[#E99A4A]/45 ${
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
                className="min-h-12 w-full rounded-2xl border border-[#E9D9BF] bg-[#FFFDF8] px-3.5 py-3 text-base text-[#38251B] focus:border-[#E99A4A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E99A4A]/35 sm:text-sm"
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
                className="min-h-12 w-full rounded-2xl border border-[#E9D9BF] bg-[#FFFDF8] px-3.5 py-3 text-base text-[#38251B] placeholder:text-[#927D6D] focus:border-[#E99A4A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E99A4A]/35 disabled:cursor-not-allowed disabled:opacity-55 sm:text-sm"
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
              className="w-full resize-none rounded-2xl border border-[#E9D9BF] bg-[#FFFDF8] p-3.5 text-base text-[#38251B] placeholder:text-[#927D6D] focus:border-[#E99A4A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E99A4A]/35 sm:text-sm"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#E99A4A] px-4 py-3 text-sm font-bold text-white clay-button-shadow transition-colors hover:bg-[#DE8640] focus-visible:ring-2 focus-visible:ring-[#E99A4A]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <HandCoins className="h-5 w-5" />
            )}
            <span>
              {createMutation.isPending
                ? "กำลังบันทึก..."
                : "ยืนยันบันทึกการถวาย"}
            </span>
          </button>
        </form>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="overflow-hidden rounded-[28px] border border-[#E9D9BF] bg-white clay-card-shadow">
            <div className="border-b border-[#E9D9BF] bg-[#FFFDF8] p-5">
              <div className="flex items-center gap-2 text-[#70452E]">
                <ReceiptText className="h-4 w-4 text-[#E99A4A]" />
                <p className="text-xs font-bold">สลิปสรุปยอด</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#674F42]">
                ตรวจรายละเอียดก่อนบันทึก ระบบจะเก็บรายการเข้ากองทุนที่เลือก
              </p>
            </div>
            <div className="space-y-4 p-5">
              <div className="rounded-3xl border border-[#D2EAC7] bg-[#EAF5E4] p-4">
                <p className="text-xs font-bold text-[#4F8B33]">ยอดถวาย</p>
                <p className="mt-1 text-3xl font-black tabular-nums text-[#1b5e3a]">
                  ฿{amountNumber > 0 ? amountNumber.toLocaleString("th-TH") : "0"}
                </p>
              </div>

              <dl className="space-y-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[#927D6D]">ประเภท</dt>
                  <dd className="text-right font-bold text-[#38251B]">
                    {offeringCategoryLabel(category)}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[#927D6D]">กองทุน</dt>
                  <dd className="text-right font-bold text-[#38251B]">
                    {selectedFund?.name || "ยังไม่ได้เลือก"}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[#927D6D]">ช่องทาง</dt>
                  <dd className="text-right font-bold text-[#38251B]">
                    {selectedMethodLabel}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[#927D6D]">วันที่</dt>
                  <dd className="text-right font-bold text-[#38251B]">
                    {new Intl.DateTimeFormat("th-TH", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }).format(new Date(date))}
                  </dd>
                </div>
              </dl>

              <div className="rounded-2xl border border-[#E9D9BF] bg-[#FFF9EE] p-3 text-xs leading-5 text-[#674F42]">
                หลังจากยืนยัน ระบบจะแสดงสลิปบันทึกสำเร็จอีกครั้ง พร้อมยอดและช่องทางรับเงิน
              </div>
            </div>
          </div>
        </aside>
      </div>

      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="max-w-sm rounded-[28px] border-[#E9D9BF] bg-[#FFFDF8] p-0 text-[#38251B]">
          <div className="border-b border-[#E9D9BF] bg-white p-5 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-[#D2EAC7] bg-[#EAF5E4] text-[#4F8B33]">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <DialogHeader className="mt-4">
              <DialogTitle className="text-xl font-black text-[#38251B]">
                บันทึกการถวายเรียบร้อยแล้ว
              </DialogTitle>
            </DialogHeader>
            <p className="mt-2 text-xs leading-5 text-[#674F42]">
              ขอพระเจ้าทรงอวยพระพรทุกน้ำใจที่มอบให้เพื่อพันธกิจของพระองค์
            </p>
          </div>

          <div className="p-5">
            <div className="rounded-3xl border border-[#E9D9BF] bg-white p-4 text-sm">
              <div className="mb-4 rounded-2xl border border-[#D2EAC7] bg-[#EAF5E4] p-3">
                <p className="text-xs font-bold text-[#4F8B33]">ยอดถวายที่บันทึก</p>
                <p className="mt-1 text-2xl font-black tabular-nums text-[#1b5e3a]">
                  ฿{Number(amount).toLocaleString("th-TH")}
                </p>
              </div>
              <p className="flex justify-between gap-3 py-1.5">
                <span className="text-[#927D6D]">ประเภท:</span>
                <span className="font-bold text-[#70452E]">
                  {offeringCategoryLabel(category)}
                </span>
              </p>
              <p className="flex justify-between gap-3 py-1.5">
                <span className="text-[#927D6D]">กองทุน:</span>
                <span className="text-right font-bold text-[#70452E]">
                  {selectedFund?.name || "บัญชีทั่วไป"}
                </span>
              </p>
              <p className="flex justify-between gap-3 py-1.5">
                <span className="text-[#927D6D]">ช่องทาง:</span>
                <span className="font-medium text-[#70452E]">{method}</span>
              </p>
            </div>

            <button
              onClick={() => {
                setIsSuccessOpen(false);
                setLocation("/offerings");
              }}
              className="mt-4 flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#A8C978] px-4 py-3 text-sm font-bold text-[#1f4f27] transition-colors hover:bg-[#96C764] focus-visible:ring-2 focus-visible:ring-[#A8C978]/60"
            >
              ดูรายการถวายทั้งหมด
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
