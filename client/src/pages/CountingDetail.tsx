import React, { useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  MoneyDisplay,
  StatusBadge,
} from "@/components/common/CommonUI";
import { THB_DENOMINATIONS, reconcile } from "@shared/counting";
import {
  ArrowLeft,
  Banknote,
  BookCheck,
  Calculator,
  Check,
  Landmark,
  Scissors,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

type TabId = "envelopes" | "cash" | "bank" | "deductions" | "summary";

const TABS: Array<{ id: TabId; label: string; icon: typeof Banknote }> = [
  { id: "envelopes", label: "ซองถวาย", icon: Banknote },
  { id: "cash", label: "นับเงินสด", icon: Calculator },
  { id: "bank", label: "เงินโอน / นำฝาก", icon: Landmark },
  { id: "deductions", label: "หักเบิก", icon: Scissors },
  { id: "summary", label: "สรุป & ปิดรอบ", icon: BookCheck },
];

const CATEGORIES = [
  { id: "general", label: "ถวายทั่วไป" },
  { id: "tithe", label: "สิบลด" },
  { id: "mission", label: "พันธกิจ" },
  { id: "building", label: "สร้างอาคาร" },
  { id: "welfare", label: "สงเคราะห์" },
  { id: "special", label: "ถวายพิเศษ" },
] as const;

const EXPENSE_CATEGORIES = [
  { id: "utilities", label: "สาธารณูปโภค" },
  { id: "ministry", label: "พันธกิจ" },
  { id: "worship", label: "นมัสการและดนตรี" },
  { id: "building", label: "อาคารสถานที่" },
  { id: "welfare", label: "สงเคราะห์" },
  { id: "pastoral", label: "ศิษยาภิบาล" },
  { id: "admin", label: "บริหารและธุรการ" },
  { id: "other", label: "อื่น ๆ" },
] as const;

const fmtBaht = (n: number) =>
  `฿${n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Shows a variance with its sign and the Thai word for over or short. */
function Variance({ amount }: { amount: number }) {
  if (amount === 0) {
    return (
      <span className="inline-flex items-center gap-1 font-bold text-[#4F8B33]">
        <Check className="h-4 w-4" />
        ตรงกัน
      </span>
    );
  }
  const over = amount > 0;
  return (
    <span
      className={`font-bold tabular-nums ${over ? "text-[#C26B1E]" : "text-[#D45945]"}`}
    >
      {over ? "เกิน " : "ขาด "}
      {fmtBaht(Math.abs(amount))}
    </span>
  );
}

export default function CountingDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const sessionId = Number(params.id);
  const utils = trpc.useUtils();
  const [tab, setTab] = useState<TabId>("envelopes");

  const detailQuery = trpc.counting.get.useQuery(
    { id: sessionId },
    { enabled: Number.isInteger(sessionId) && sessionId > 0, retry: false }
  );
  const fundsQuery = trpc.finance.accounts.useQuery(undefined, {
    retry: false,
  });
  const membersQuery = trpc.members.list.useQuery(undefined, { retry: false });

  const funds = fundsQuery.data ?? [];
  const members = membersQuery.data ?? [];

  /** Every write refreshes the ledger figures this session feeds. */
  const refreshAll = async () => {
    await Promise.all([
      utils.counting.get.invalidate({ id: sessionId }),
      utils.counting.list.invalidate(),
      utils.finance.accounts.invalidate(),
      utils.finance.summary.invalidate(),
      utils.finance.monthlyStats.invalidate(),
      utils.offerings.list.invalidate(),
      utils.expenses.list.invalidate(),
    ]);
  };

  const onError = (verb: string) => (error: { message: string }) =>
    toast.error(`${verb}ไม่สำเร็จ`, { description: error.message });

  const addEnvelope = trpc.counting.addEnvelope.useMutation({
    onSuccess: () => void refreshAll(),
    onError: onError("บันทึกซอง"),
  });
  const removeEnvelope = trpc.counting.removeEnvelope.useMutation({
    onSuccess: () => void refreshAll(),
    onError: onError("ลบซอง"),
  });
  const setCashCount = trpc.counting.setCashCount.useMutation({
    onSuccess: () => void refreshAll(),
    onError: onError("บันทึกผลนับ"),
  });
  const addBankRecord = trpc.counting.addBankRecord.useMutation({
    onSuccess: () => void refreshAll(),
    onError: onError("บันทึกรายการธนาคาร"),
  });
  const matchPassbook = trpc.counting.matchPassbook.useMutation({
    onSuccess: () => void refreshAll(),
    onError: onError("กระทบสมุดบัญชี"),
  });
  const addDeduction = trpc.counting.addDeduction.useMutation({
    onSuccess: () => void refreshAll(),
    onError: onError("บันทึกรายการหักเบิก"),
  });
  const approveDeduction = trpc.counting.approveDeduction.useMutation({
    onSuccess: () => void refreshAll(),
    onError: onError("อนุมัติรายการหักเบิก"),
  });
  const removeDeduction = trpc.counting.removeDeduction.useMutation({
    onSuccess: () => void refreshAll(),
    onError: onError("ลบรายการหักเบิก"),
  });
  const submitCount = trpc.counting.submitCount.useMutation({
    onSuccess: () => {
      void refreshAll();
      toast.success("ส่งนับให้ตรวจสอบแล้ว");
    },
    onError: onError("ส่งนับ"),
  });
  const reopenCount = trpc.counting.reopenCount.useMutation({
    onSuccess: () => {
      void refreshAll();
      toast.success("ส่งกลับไปนับใหม่แล้ว");
    },
    onError: onError("ส่งกลับไปนับใหม่"),
  });
  const verify = trpc.counting.verify.useMutation({
    onSuccess: () => {
      void refreshAll();
      toast.success("ตรวจสอบรอบเรียบร้อยแล้ว");
    },
    onError: onError("ตรวจสอบรอบ"),
  });
  const post = trpc.counting.post.useMutation({
    onSuccess: result => {
      void refreshAll();
      toast.success("ลงบัญชีเรียบร้อยแล้ว", {
        description: `บันทึกถวาย ${result.offeringCount} รายการ และรายจ่าย ${result.deductionCount} รายการ`,
      });
    },
    onError: onError("ลงบัญชี"),
  });
  const close = trpc.counting.close.useMutation({
    onSuccess: () => {
      void refreshAll();
      toast.success("ปิดรอบเรียบร้อยแล้ว");
    },
    onError: onError("ปิดรอบ"),
  });

  // ── Envelope entry form ──────────────────────────────────────────────────
  const [envelopeNo, setEnvelopeNo] = useState("");
  const [memberId, setMemberId] = useState("");
  const [donorName, setDonorName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [category, setCategory] = useState<string>("general");
  const [fundId, setFundId] = useState("");
  const [method, setMethod] = useState<"cash" | "transfer" | "check">("cash");
  const [amount, setAmount] = useState("");
  const amountRef = useRef<HTMLInputElement>(null);

  // ── Deduction form ───────────────────────────────────────────────────────
  const [dPurpose, setDPurpose] = useState("");
  const [dReason, setDReason] = useState("");
  const [dPaidTo, setDPaidTo] = useState("");
  const [dAmount, setDAmount] = useState("");
  const [dCategory, setDCategory] = useState<string>("other");
  const [dFundId, setDFundId] = useState("");

  // ── Bank form ────────────────────────────────────────────────────────────
  const [bType, setBType] = useState<"transfer_in" | "cash_deposit">(
    "cash_deposit"
  );
  const [bAmount, setBAmount] = useState("");
  const [bName, setBName] = useState("");
  const [bRef, setBRef] = useState("");

  // ── Variance note ────────────────────────────────────────────────────────
  const [varianceNote, setVarianceNote] = useState("");

  /** Live totals while the counters type, from the same function the server uses. */
  const [draftCounts, setDraftCounts] = useState<Record<string, string>>({});

  const detail = detailQuery.data;
  const status = detail?.session.status;
  const editable = status === "counting";

  const liveReconciliation = useMemo(() => {
    if (!detail) return null;
    const cashRows = THB_DENOMINATIONS.map(d => {
      const key = `${d.value}-${d.kind}`;
      const draft = draftCounts[key];
      const saved = detail.cashCounts.find(
        row => row.denomination === d.value && row.kind === d.kind
      );
      const quantity =
        draft !== undefined && draft !== ""
          ? Number(draft)
          : (saved?.quantity ?? 0);
      return {
        denomination: d.value,
        kind: d.kind,
        quantity: Number.isFinite(quantity) ? quantity : 0,
      };
    });
    return reconcile({
      envelopes: detail.envelopes,
      cashCounts: cashRows,
      deductions: detail.deductions,
      bankRecords: detail.bankRecords,
    });
  }, [detail, draftCounts]);

  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    return (
      <AppLayout title="ไม่พบรอบนับเงินถวาย">
        <EmptyState
          title="รหัสรอบไม่ถูกต้อง"
          description="ลิงก์ที่เปิดไม่ถูกต้อง กรุณากลับไปเลือกรอบจากรายการ"
          actionText="กลับหน้ารอบนับเงินถวาย"
          onAction={() => setLocation("/counting")}
        />
      </AppLayout>
    );
  }

  if (detailQuery.isLoading) {
    return (
      <AppLayout title="รอบนับเงินถวาย">
        <LoadingSkeleton count={4} />
      </AppLayout>
    );
  }

  if (detailQuery.isError) {
    return (
      <AppLayout title="รอบนับเงินถวาย">
        <ErrorState
          title="โหลดรอบนับเงินถวายไม่สำเร็จ"
          description={detailQuery.error.message}
          onRetry={() => detailQuery.refetch()}
        />
      </AppLayout>
    );
  }

  if (!detail || !liveReconciliation) {
    return (
      <AppLayout title="ไม่พบรอบนับเงินถวาย">
        <EmptyState
          title="ไม่พบรอบนี้"
          description="รอบนับเงินถวายนี้ไม่มีอยู่ในระบบ"
          actionText="กลางหน้ารอบนับเงินถวาย"
          onAction={() => setLocation("/counting")}
        />
      </AppLayout>
    );
  }

  const r = liveReconciliation;
  const serviceDate = new Intl.DateTimeFormat("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(detail.session.serviceDate));

  const submitEnvelope = (event: React.FormEvent) => {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("กรุณาระบุจำนวนเงินที่ถูกต้อง");
      return;
    }
    if (!fundId) {
      toast.error("กรุณาเลือกกองทุน");
      return;
    }
    addEnvelope.mutate(
      {
        sessionId,
        envelopeNo: envelopeNo.trim() || undefined,
        memberId: memberId ? Number(memberId) : undefined,
        donorName: donorName.trim() || undefined,
        isAnonymous,
        category: category as "general",
        fundId: Number(fundId),
        method,
        amount: value,
      },
      {
        onSuccess: () => {
          // Keep fund, category and method for the next envelope in the stack.
          setEnvelopeNo("");
          setMemberId("");
          setDonorName("");
          setIsAnonymous(false);
          setAmount("");
          amountRef.current?.focus();
        },
      }
    );
  };

  const unapprovedDeductions = detail.deductions.filter(d => !d.approvedBy);

  return (
    <AppLayout
      activeRoute="/counting"
      title="รอบนับเงินถวาย"
      subtitle={serviceDate}
      action={
        <div className="flex items-center gap-2">
          <StatusBadge status={detail.session.status} />
          <button
            type="button"
            onClick={() => setLocation("/counting")}
            className="min-h-11 inline-flex items-center gap-1.5 rounded-2xl border border-[#E9D9BF] bg-[#FFF4DF] px-3.5 py-2 text-xs font-bold text-[#674F42]"
          >
            <ArrowLeft className="h-4 w-4" />
            ทุกรอบ
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Running totals stay visible on every tab. */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#E9D9BF] bg-white p-4 shadow-2xs">
            <p className="text-sm text-[#674F42]">ยอดถวายตามซอง</p>
            <MoneyDisplay amount={r.offeringTotal} type="income" size="lg" />
          </div>
          <div className="rounded-2xl border border-[#E9D9BF] bg-white p-4 shadow-2xs">
            <p className="text-sm text-[#674F42]">นับเงินสดได้</p>
            <MoneyDisplay amount={r.countedCashTotal} size="lg" />
            <div className="mt-1 text-sm">
              <Variance amount={r.cashVariance} />
            </div>
          </div>
          <div className="rounded-2xl border border-[#E9D9BF] bg-white p-4 shadow-2xs">
            <p className="text-sm text-[#674F42]">หักเบิก</p>
            <MoneyDisplay amount={r.deductionTotal} type="expense" size="lg" />
          </div>
          <div className="rounded-2xl border border-[#E9D9BF] bg-white p-4 shadow-2xs">
            <p className="text-sm text-[#674F42]">ต้องนำฝาก</p>
            <MoneyDisplay amount={r.expectedDeposit} size="lg" />
            <div className="mt-1 text-sm">
              <Variance amount={r.depositVariance} />
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold transition-colors ${
                tab === id
                  ? "bg-[#E99A4A] text-white shadow-sm"
                  : "border border-[#E9D9BF] bg-white text-[#674F42] hover:bg-[#FFF9EE]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {!editable && tab !== "summary" && tab !== "bank" && (
          <p className="rounded-2xl border border-[#F6E1BF] bg-[#FFF3DF] p-4 text-sm text-[#8A5A1E]">
            รอบนี้ส่งนับแล้ว จึงแก้ไขซองและผลนับไม่ได้ ถ้าต้องแก้ ให้เหรัญญิกกด
            “ส่งกลับไปนับใหม่” ในแท็บสรุป
          </p>
        )}

        {/* ── Tab: envelopes ────────────────────────────────────────────── */}
        {tab === "envelopes" && (
          <section className="space-y-4">
            {editable && (
              <form
                onSubmit={submitEnvelope}
                className="rounded-3xl border border-[#E9D9BF] bg-white p-5 shadow-sm md:p-6"
              >
                <h2 className="mb-4 font-bold text-[#38251B]">บันทึกซองถวาย</h2>
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="text-sm font-semibold text-[#674F42]">
                    เลขซอง
                    <input
                      value={envelopeNo}
                      onChange={e => setEnvelopeNo(e.target.value)}
                      placeholder="เช่น 012 (เว้นว่างได้)"
                      className="mt-1 w-full rounded-xl border border-[#E9D9BF] p-3 text-sm font-normal text-[#38251B]"
                    />
                  </label>
                  <label className="text-sm font-semibold text-[#674F42]">
                    สมาชิก
                    <select
                      value={memberId}
                      onChange={e => setMemberId(e.target.value)}
                      disabled={isAnonymous}
                      className="mt-1 w-full rounded-xl border border-[#E9D9BF] p-3 text-sm font-normal text-[#38251B] disabled:opacity-50"
                    >
                      <option value="">— ไม่ระบุสมาชิก —</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.envelopeNo ? `[${m.envelopeNo}] ` : ""}
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-semibold text-[#674F42]">
                    ชื่อผู้ถวาย (ถ้าไม่ใช่สมาชิก)
                    <input
                      value={donorName}
                      onChange={e => setDonorName(e.target.value)}
                      disabled={isAnonymous}
                      placeholder={
                        isAnonymous ? "ไม่เปิดเผยนาม" : "ชื่อ-นามสกุล"
                      }
                      className="mt-1 w-full rounded-xl border border-[#E9D9BF] p-3 text-sm font-normal text-[#38251B] disabled:opacity-50"
                    />
                  </label>
                  <label className="text-sm font-semibold text-[#674F42]">
                    ประเภทถวาย
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#E9D9BF] p-3 text-sm font-normal text-[#38251B]"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-semibold text-[#674F42]">
                    เข้ากองทุน *
                    <select
                      required
                      value={fundId}
                      onChange={e => setFundId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#E9D9BF] p-3 text-sm font-normal text-[#38251B]"
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
                  </label>
                  <label className="text-sm font-semibold text-[#674F42]">
                    ช่องทาง
                    <select
                      value={method}
                      onChange={e => setMethod(e.target.value as typeof method)}
                      className="mt-1 w-full rounded-xl border border-[#E9D9BF] p-3 text-sm font-normal text-[#38251B]"
                    >
                      <option value="cash">เงินสด</option>
                      <option value="transfer">เงินโอน</option>
                      <option value="check">เช็ค</option>
                    </select>
                  </label>
                  <label className="text-sm font-semibold text-[#674F42]">
                    จำนวนเงิน (บาท) *
                    <input
                      ref={amountRef}
                      type="number"
                      required
                      min="0.25"
                      step="0.25"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="mt-1 w-full rounded-xl border border-[#E9D9BF] p-3 text-base font-bold tabular-nums text-[#1b5e3a]"
                    />
                  </label>
                  <div className="flex items-end gap-2">
                    <label className="flex items-center gap-2 text-sm text-[#674F42]">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={e => {
                          setIsAnonymous(e.target.checked);
                          if (e.target.checked) {
                            setMemberId("");
                            setDonorName("");
                          }
                        }}
                        className="size-4 rounded border-[#E9D9BF]"
                      />
                      ไม่ระบุนาม
                    </label>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={addEnvelope.isPending || !fundId}
                      className="min-h-11 w-full rounded-2xl bg-[#4F8B33] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {addEnvelope.isPending ? "กำลังบันทึก…" : "เพิ่มซอง"}
                    </button>
                  </div>
                </div>
                {funds.length === 0 && (
                  <p className="mt-3 text-sm text-[#D45945]">
                    ยังไม่มีกองทุนในระบบ ต้องสร้างกองทุนก่อนบันทึกซองถวาย
                  </p>
                )}
              </form>
            )}

            <div className="overflow-hidden rounded-3xl border border-[#E9D9BF] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E9D9BF] p-4">
                <h2 className="font-bold text-[#38251B]">
                  ซองในรอบนี้ ({detail.envelopes.length})
                </h2>
                <span className="text-sm font-bold text-[#674F42]">
                  รวม {fmtBaht(r.offeringTotal)}
                </span>
              </div>
              {detail.envelopes.length === 0 ? (
                <p className="p-8 text-center text-sm text-[#674F42]">
                  ยังไม่มีซองในรอบนี้
                </p>
              ) : (
                <ul className="divide-y divide-[#F0E6D8]">
                  {detail.envelopes.map(envelope => {
                    const member = members.find(
                      m => m.id === envelope.memberId
                    );
                    const who = envelope.isAnonymous
                      ? "ไม่ระบุนาม"
                      : (member?.name ?? envelope.donorName ?? "ไม่ระบุชื่อ");
                    const categoryLabel =
                      CATEGORIES.find(c => c.id === envelope.category)?.label ??
                      envelope.category;
                    const fundName =
                      funds.find(f => f.id === envelope.fundId)?.name ??
                      "ไม่ระบุกองทุน";
                    return (
                      <li
                        key={envelope.id}
                        className="flex items-center justify-between gap-4 p-4"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-[#38251B]">
                            {envelope.envelopeNo
                              ? `ซอง ${envelope.envelopeNo} · `
                              : ""}
                            {who}
                          </p>
                          <p className="text-sm text-[#674F42]">
                            {categoryLabel} · {fundName} ·{" "}
                            {envelope.method === "cash"
                              ? "เงินสด"
                              : envelope.method === "transfer"
                                ? "เงินโอน"
                                : "เช็ค"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <MoneyDisplay
                            amount={envelope.amount}
                            type="income"
                          />
                          {editable && (
                            <button
                              type="button"
                              aria-label="ลบซองนี้"
                              onClick={() =>
                                removeEnvelope.mutate({
                                  id: envelope.id,
                                  sessionId,
                                })
                              }
                              disabled={removeEnvelope.isPending}
                              className="flex size-11 items-center justify-center rounded-xl text-[#D45945] hover:bg-[#FFEBE5] disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        )}

        {/* ── Tab: cash count ──────────────────────────────────────────── */}
        {tab === "cash" && (
          <section className="space-y-4">
            <div className="overflow-hidden rounded-3xl border border-[#E9D9BF] bg-white shadow-sm">
              <div className="border-b border-[#E9D9BF] p-4">
                <h2 className="font-bold text-[#38251B]">
                  ใบนับธนบัตรและเหรียญ
                </h2>
                <p className="mt-1 text-sm text-[#674F42]">
                  กรอกจำนวนใบหรือเหรียญ ระบบคูณและรวมยอดให้ทันที
                </p>
              </div>
              <ul className="divide-y divide-[#F0E6D8]">
                {THB_DENOMINATIONS.map(denomination => {
                  const key = `${denomination.value}-${denomination.kind}`;
                  const saved = detail.cashCounts.find(
                    row =>
                      row.denomination === denomination.value &&
                      row.kind === denomination.kind
                  );
                  const draft = draftCounts[key];
                  const quantity =
                    draft !== undefined ? draft : String(saved?.quantity ?? "");
                  const subtotal = denomination.value * (Number(quantity) || 0);
                  return (
                    <li
                      key={key}
                      className="flex items-center gap-3 p-3 md:p-4"
                    >
                      <span className="w-28 shrink-0 text-sm font-bold text-[#38251B] md:w-40">
                        {denomination.label}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        disabled={!editable}
                        value={quantity}
                        onChange={e =>
                          setDraftCounts(prev => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        onBlur={e => {
                          if (!editable) return;
                          const next = Number(e.target.value || 0);
                          if (!Number.isFinite(next) || next < 0) return;
                          if (next === (saved?.quantity ?? 0)) return;
                          setCashCount.mutate({
                            sessionId,
                            denomination: denomination.value,
                            kind: denomination.kind,
                            quantity: next,
                          });
                        }}
                        placeholder="0"
                        aria-label={`จำนวน ${denomination.label}`}
                        className="w-24 rounded-xl border border-[#E9D9BF] p-2.5 text-right text-base font-bold tabular-nums text-[#38251B] disabled:opacity-60"
                      />
                      <span className="ml-auto text-right text-sm font-bold tabular-nums text-[#674F42]">
                        {fmtBaht(subtotal)}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="flex items-center justify-between border-t-2 border-[#E9D9BF] bg-[#FFF9EE] p-4">
                <div>
                  <p className="font-bold text-[#38251B]">รวมนับได้</p>
                  <p className="text-sm text-[#674F42]">
                    เทียบซองเงินสด {fmtBaht(r.envelopeCashTotal)}
                  </p>
                </div>
                <div className="text-right">
                  <MoneyDisplay amount={r.countedCashTotal} size="xl" />
                  <div className="mt-1">
                    <Variance amount={r.cashVariance} />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Tab: bank ────────────────────────────────────────────────── */}
        {tab === "bank" && (
          <section className="space-y-4">
            <form
              onSubmit={event => {
                event.preventDefault();
                const value = Number(bAmount);
                if (!Number.isFinite(value) || value <= 0) {
                  toast.error("กรุณาระบุจำนวนเงินที่ถูกต้อง");
                  return;
                }
                addBankRecord.mutate(
                  {
                    sessionId,
                    type: bType,
                    amount: value,
                    transferredByName: bName.trim() || undefined,
                    bankRef: bRef.trim() || undefined,
                  },
                  {
                    onSuccess: () => {
                      setBAmount("");
                      setBName("");
                      setBRef("");
                    },
                  }
                );
              }}
              className="rounded-3xl border border-[#E9D9BF] bg-white p-5 shadow-sm md:p-6"
            >
              <h2 className="mb-4 font-bold text-[#38251B]">
                บันทึกรายการธนาคาร
              </h2>
              <div className="grid gap-4 md:grid-cols-4">
                <label className="text-sm font-semibold text-[#674F42]">
                  ประเภท
                  <select
                    value={bType}
                    onChange={e => setBType(e.target.value as typeof bType)}
                    className="mt-1 w-full rounded-xl border border-[#E9D9BF] p-3 text-sm font-normal text-[#38251B]"
                  >
                    <option value="cash_deposit">นำเงินสดเข้าฝาก</option>
                    <option value="transfer_in">สมาชิกโอนเข้าบัญชี</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-[#674F42]">
                  จำนวนเงิน *
                  <input
                    type="number"
                    required
                    min="0.25"
                    step="0.25"
                    value={bAmount}
                    onChange={e => setBAmount(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#E9D9BF] p-3 text-base font-bold tabular-nums text-[#38251B]"
                  />
                </label>
                <label className="text-sm font-semibold text-[#674F42]">
                  ผู้โอน
                  <input
                    value={bName}
                    onChange={e => setBName(e.target.value)}
                    placeholder="เว้นว่างได้ถ้าเป็นการนำฝาก"
                    className="mt-1 w-full rounded-xl border border-[#E9D9BF] p-3 text-sm font-normal text-[#38251B]"
                  />
                </label>
                <label className="text-sm font-semibold text-[#674F42]">
                  เลขอ้างอิง
                  <input
                    value={bRef}
                    onChange={e => setBRef(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#E9D9BF] p-3 font-mono text-sm font-normal text-[#38251B]"
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={addBankRecord.isPending}
                className="mt-4 min-h-11 rounded-2xl bg-[#4F8B33] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {addBankRecord.isPending ? "กำลังบันทึก…" : "เพิ่มรายการ"}
              </button>
            </form>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-[#E9D9BF] bg-white p-4">
                <p className="text-sm text-[#674F42]">เงินโอนเข้าบัญชีจริง</p>
                <MoneyDisplay
                  amount={r.actualTransferIn}
                  type="income"
                  size="lg"
                />
                <p className="mt-1 text-sm text-[#674F42]">
                  เทียบซองโอน {fmtBaht(r.envelopeTransferTotal)}
                </p>
                <div className="mt-1">
                  <Variance amount={r.transferVariance} />
                </div>
              </div>
              <div className="rounded-2xl border border-[#E9D9BF] bg-white p-4">
                <p className="text-sm text-[#674F42]">นำเงินสดเข้าฝากจริง</p>
                <MoneyDisplay amount={r.actualCashDeposit} size="lg" />
                <p className="mt-1 text-sm text-[#674F42]">
                  ต้องนำฝาก {fmtBaht(r.expectedDeposit)}
                </p>
                <div className="mt-1">
                  <Variance amount={r.depositVariance} />
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-[#E9D9BF] bg-white shadow-sm">
              <h2 className="border-b border-[#E9D9BF] p-4 font-bold text-[#38251B]">
                รายการธนาคาร ({detail.bankRecords.length})
              </h2>
              {detail.bankRecords.length === 0 ? (
                <p className="p-8 text-center text-sm text-[#674F42]">
                  ยังไม่มีรายการธนาคารในรอบนี้
                </p>
              ) : (
                <ul className="divide-y divide-[#F0E6D8]">
                  {detail.bankRecords.map(record => (
                    <li
                      key={record.id}
                      className="flex items-center justify-between gap-4 p-4"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-[#38251B]">
                          {record.type === "cash_deposit"
                            ? "นำเงินสดเข้าฝาก"
                            : "สมาชิกโอนเข้าบัญชี"}
                        </p>
                        <p className="text-sm text-[#674F42]">
                          {record.transferredByName || "ไม่ระบุผู้โอน"}
                          {record.bankRef ? ` · ${record.bankRef}` : ""}
                        </p>
                        <p className="mt-1 text-sm">
                          {record.passbookMatched ? (
                            <span className="font-bold text-[#4F8B33]">
                              กระทบสมุดบัญชีแล้ว
                            </span>
                          ) : (
                            <span className="text-[#C26B1E]">
                              ยังไม่กระทบสมุดบัญชี
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <MoneyDisplay amount={record.amount} />
                        {!record.passbookMatched && (
                          <button
                            type="button"
                            onClick={() =>
                              matchPassbook.mutate({
                                id: record.id,
                                passbookDate: new Date(),
                              })
                            }
                            disabled={matchPassbook.isPending}
                            className="min-h-11 rounded-xl border border-[#A8C978] bg-[#EAF5E4] px-3 py-2 text-xs font-bold text-[#4F8B33] disabled:opacity-50"
                          >
                            กระทบสมุด
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {/* ── Tab: deductions ──────────────────────────────────────────── */}
        {tab === "deductions" && (
          <section className="space-y-4">
            <p className="rounded-2xl border border-[#E9D9BF] bg-[#FFF9EE] p-4 text-sm text-[#674F42]">
              เงินที่เบิกจากถุงถวายก่อนนำฝาก ยอดถวายจะไม่หายจากระบบ —
              ระบบตรวจว่า นับเงินสดได้ − หักเบิก = ยอดนำฝาก
            </p>

            {editable && (
              <form
                onSubmit={event => {
                  event.preventDefault();
                  const value = Number(dAmount);
                  if (!Number.isFinite(value) || value <= 0) {
                    toast.error("กรุณาระบุจำนวนเงินที่ถูกต้อง");
                    return;
                  }
                  if (!dFundId) {
                    toast.error("กรุณาเลือกกองทุนที่ตัดรายการนี้");
                    return;
                  }
                  addDeduction.mutate(
                    {
                      sessionId,
                      purpose: dPurpose.trim(),
                      reason: dReason.trim(),
                      amount: value,
                      paidTo: dPaidTo.trim(),
                      category: dCategory as "other",
                      fundId: Number(dFundId),
                    },
                    {
                      onSuccess: () => {
                        setDPurpose("");
                        setDReason("");
                        setDPaidTo("");
                        setDAmount("");
                      },
                    }
                  );
                }}
                className="rounded-3xl border border-[#E9D9BF] bg-white p-5 shadow-sm md:p-6"
              >
                <h2 className="mb-4 font-bold text-[#38251B]">
                  บันทึกรายการหักเบิก
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-semibold text-[#674F42]">
                    รายการที่เบิก *
                    <input
                      required
                      minLength={2}
                      value={dPurpose}
                      onChange={e => setDPurpose(e.target.value)}
                      placeholder="เช่น ค่าน้ำดื่มวันอาทิตย์"
                      className="mt-1 w-full rounded-xl border border-[#E9D9BF] p-3 text-sm font-normal text-[#38251B]"
                    />
                  </label>
                  <label className="text-sm font-semibold text-[#674F42]">
                    เบิกให้ใคร *
                    <input
                      required
                      minLength={2}
                      value={dPaidTo}
                      onChange={e => setDPaidTo(e.target.value)}
                      placeholder="ชื่อผู้รับเงิน"
                      className="mt-1 w-full rounded-xl border border-[#E9D9BF] p-3 text-sm font-normal text-[#38251B]"
                    />
                  </label>
                  <label className="text-sm font-semibold text-[#674F42]">
                    จำนวนเงิน *
                    <input
                      type="number"
                      required
                      min="0.25"
                      step="0.25"
                      value={dAmount}
                      onChange={e => setDAmount(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#E9D9BF] p-3 text-base font-bold tabular-nums text-[#D45945]"
                    />
                  </label>
                  <label className="text-sm font-semibold text-[#674F42]">
                    หมวดหมู่รายจ่าย
                    <select
                      value={dCategory}
                      onChange={e => setDCategory(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#E9D9BF] p-3 text-sm font-normal text-[#38251B]"
                    >
                      {EXPENSE_CATEGORIES.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-semibold text-[#674F42]">
                    ตัดจากกองทุน *
                    <select
                      required
                      value={dFundId}
                      onChange={e => setDFundId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#E9D9BF] p-3 text-sm font-normal text-[#38251B]"
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
                  </label>
                  <label className="text-sm font-semibold text-[#674F42] md:col-span-2">
                    เหตุผล *
                    <textarea
                      required
                      minLength={2}
                      rows={2}
                      value={dReason}
                      onChange={e => setDReason(e.target.value)}
                      placeholder="อธิบายเหตุผลที่ต้องเบิกจากถุงถวายทันที"
                      className="mt-1 w-full rounded-xl border border-[#E9D9BF] p-3 text-sm font-normal text-[#38251B]"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={addDeduction.isPending || !dFundId}
                  className="mt-4 min-h-11 rounded-2xl bg-[#4F8B33] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  {addDeduction.isPending ? "กำลังบันทึก…" : "เพิ่มรายการเบิก"}
                </button>
              </form>
            )}

            <div className="overflow-hidden rounded-3xl border border-[#E9D9BF] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E9D9BF] p-4">
                <h2 className="font-bold text-[#38251B]">
                  รายการหักเบิก ({detail.deductions.length})
                </h2>
                <span className="text-sm font-bold text-[#D45945]">
                  รวม {fmtBaht(r.deductionTotal)}
                </span>
              </div>
              {detail.deductions.length === 0 ? (
                <p className="p-8 text-center text-sm text-[#674F42]">
                  ไม่มีการหักเบิกในรอบนี้ เงินถวายทั้งหมดจะถูกนำฝาก
                </p>
              ) : (
                <ul className="divide-y divide-[#F0E6D8]">
                  {detail.deductions.map(deduction => (
                    <li key={deduction.id} className="space-y-2 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-bold text-[#38251B]">
                            {deduction.purpose}
                          </p>
                          <p className="text-sm text-[#674F42]">
                            เบิกให้ {deduction.paidTo}
                          </p>
                          <p className="mt-1 text-sm text-[#674F42]">
                            {deduction.reason}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <MoneyDisplay
                            amount={deduction.amount}
                            type="expense"
                          />
                          {editable && (
                            <button
                              type="button"
                              aria-label="ลบรายการเบิกนี้"
                              onClick={() =>
                                removeDeduction.mutate({
                                  id: deduction.id,
                                  sessionId,
                                })
                              }
                              disabled={removeDeduction.isPending}
                              className="flex size-11 items-center justify-center rounded-xl text-[#D45945] hover:bg-[#FFEBE5] disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {deduction.approvedBy ? (
                          <StatusBadge status="approved" label="อนุมัติแล้ว" />
                        ) : (
                          <>
                            <StatusBadge status="pending" label="รออนุมัติ" />
                            <button
                              type="button"
                              onClick={() =>
                                approveDeduction.mutate({ id: deduction.id })
                              }
                              disabled={approveDeduction.isPending}
                              className="min-h-11 rounded-xl border border-[#A8C978] bg-[#EAF5E4] px-3 py-2 text-xs font-bold text-[#4F8B33] disabled:opacity-50"
                            >
                              อนุมัติรายการนี้
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {/* ── Tab: summary ─────────────────────────────────────────────── */}
        {tab === "summary" && (
          <section className="space-y-4">
            <div className="overflow-hidden rounded-3xl border border-[#E9D9BF] bg-white shadow-sm">
              <h2 className="border-b border-[#E9D9BF] p-4 font-bold text-[#38251B]">
                ตารางกระทบยอด
              </h2>
              <dl className="divide-y divide-[#F0E6D8]">
                {[
                  {
                    label: "ยอดถวายตามซอง (ทุกช่องทาง)",
                    value: fmtBaht(r.offeringTotal),
                  },
                  {
                    label: "— ซองเงินสด",
                    value: fmtBaht(r.envelopeCashTotal),
                  },
                  {
                    label: "— ซองเงินโอน",
                    value: fmtBaht(r.envelopeTransferTotal),
                  },
                  {
                    label: "— ซองเช็ค",
                    value: fmtBaht(r.envelopeCheckTotal),
                  },
                ].map(row => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-4 p-4"
                  >
                    <dt className="text-sm text-[#674F42]">{row.label}</dt>
                    <dd className="text-sm font-bold tabular-nums text-[#38251B]">
                      {row.value}
                    </dd>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-4 bg-[#FFF9EE] p-4">
                  <dt className="text-sm font-bold text-[#38251B]">
                    ผลต่างเงินสด (นับได้ − ซองเงินสด)
                  </dt>
                  <dd>
                    <Variance amount={r.cashVariance} />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 bg-[#FFF9EE] p-4">
                  <dt className="text-sm font-bold text-[#38251B]">
                    ผลต่างเงินโอน (เข้าบัญชี − ซองโอน)
                  </dt>
                  <dd>
                    <Variance amount={r.transferVariance} />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 bg-[#FFF9EE] p-4">
                  <dt className="text-sm font-bold text-[#38251B]">
                    ผลต่างการฝาก (ฝากจริง − ที่ต้องนำฝาก)
                  </dt>
                  <dd>
                    <Variance amount={r.depositVariance} />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-t-2 border-[#E9D9BF] p-4">
                  <dt className="font-bold text-[#38251B]">
                    นับเงินสดได้ − หักเบิก = ยอดนำฝาก
                  </dt>
                  <dd className="text-sm font-bold tabular-nums text-[#38251B]">
                    {fmtBaht(r.countedCashTotal)} − {fmtBaht(r.deductionTotal)}{" "}
                    = {fmtBaht(r.expectedDeposit)}
                  </dd>
                </div>
              </dl>
            </div>

            {!r.isBalanced && (
              <div className="rounded-3xl border border-[#F6E1BF] bg-[#FFF3DF] p-5">
                <h3 className="font-bold text-[#8A5A1E]">ยอดยังไม่ตรงกัน</h3>
                <p className="mt-1 text-sm text-[#8A5A1E]">
                  ปิดรอบได้เมื่อยอดตรง หรือบันทึกคำอธิบายผลต่างไว้เป็นหลักฐาน
                </p>
                <textarea
                  rows={2}
                  value={varianceNote}
                  onChange={e => setVarianceNote(e.target.value)}
                  placeholder="เช่น เงินสดขาด 20 บาท นับซ้ำสองครั้งแล้ว แจ้งที่ประชุมมัคนายกวันที่…"
                  className="mt-3 w-full rounded-xl border border-[#E9D9BF] bg-white p-3 text-sm text-[#38251B]"
                />
                {detail.session.varianceNote && (
                  <p className="mt-2 text-sm text-[#674F42]">
                    คำอธิบายที่บันทึกไว้: {detail.session.varianceNote}
                  </p>
                )}
              </div>
            )}

            {unapprovedDeductions.length > 0 && (
              <p className="rounded-2xl border border-[#F7D5CD] bg-[#FFEBE5] p-4 text-sm font-bold text-[#A33B2A]">
                มีรายการหักเบิกที่ยังไม่ได้รับอนุมัติ{" "}
                {unapprovedDeductions.length} รายการ — ต้องอนุมัติก่อนลงบัญชี
              </p>
            )}

            <div className="rounded-3xl border border-[#E9D9BF] bg-white p-5 shadow-sm">
              <h3 className="font-bold text-[#38251B]">ดำเนินการกับรอบนี้</h3>
              <p className="mt-1 text-sm text-[#674F42]">
                ลำดับงาน: นับ → ส่งตรวจ → ตรวจสอบ → ลงบัญชี → ปิดรอบ
                (ผู้นับไม่สามารถตรวจสอบรอบของตัวเองได้)
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {status === "counting" && (
                  <button
                    type="button"
                    onClick={() => submitCount.mutate({ id: sessionId })}
                    disabled={submitCount.isPending}
                    className="min-h-11 rounded-2xl bg-[#E99A4A] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                  >
                    ส่งนับให้ตรวจสอบ
                  </button>
                )}
                {(status === "counted" || status === "verified") && (
                  <button
                    type="button"
                    onClick={() => reopenCount.mutate({ id: sessionId })}
                    disabled={reopenCount.isPending}
                    className="min-h-11 rounded-2xl border border-[#E9D9BF] bg-[#FFF4DF] px-5 py-2.5 text-sm font-bold text-[#674F42] disabled:opacity-50"
                  >
                    ส่งกลับไปนับใหม่
                  </button>
                )}
                {status === "counted" && (
                  <button
                    type="button"
                    onClick={() => verify.mutate({ id: sessionId })}
                    disabled={verify.isPending}
                    className="min-h-11 rounded-2xl bg-[#4F8B33] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                  >
                    ตรวจสอบและรับรองยอด
                  </button>
                )}
                {status === "verified" && (
                  <button
                    type="button"
                    onClick={() =>
                      post.mutate({
                        id: sessionId,
                        varianceNote: varianceNote.trim() || undefined,
                      })
                    }
                    disabled={
                      post.isPending ||
                      unapprovedDeductions.length > 0 ||
                      (!r.isBalanced &&
                        !varianceNote.trim() &&
                        !detail.session.varianceNote)
                    }
                    className="min-h-11 rounded-2xl bg-[#1b5e3a] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                  >
                    ลงบัญชีเข้าระบบ
                  </button>
                )}
                {status === "posted" && (
                  <button
                    type="button"
                    onClick={() => close.mutate({ id: sessionId })}
                    disabled={close.isPending}
                    className="min-h-11 rounded-2xl bg-[#674F42] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                  >
                    ปิดรอบถาวร
                  </button>
                )}
                {status === "closed" && (
                  <p className="text-sm font-bold text-[#4F8B33]">
                    รอบนี้ปิดเรียบร้อยแล้ว ข้อมูลถูกล็อกเพื่อการตรวจสอบ
                  </p>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
