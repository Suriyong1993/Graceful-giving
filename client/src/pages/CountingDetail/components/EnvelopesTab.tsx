import React, { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MoneyDisplay } from "@/components/common/CommonUI";
import { OFFERING_CATEGORIES, offeringCategoryLabel } from "@shared/categories";
import { fmtBaht } from "./countingUtils";
import { NativeSelect } from "@/components/ui/native-select";
import { trpc } from "@/lib/trpc";
import { formatThaiDate } from "@/lib/format";

interface EnvelopesTabProps {
  sessionId: number;
  editable: boolean;
  envelopes: Array<{
    id: number;
    sessionId: number;
    envelopeNo?: string | null;
    memberId?: number | null;
    donorName?: string | null;
    isAnonymous?: boolean | null;
    category: string;
    fundId?: number | null;
    method: "cash" | "transfer" | "check" | string;
    amount: number;
    linkedOfferingId?: number | null;
  }>;
  /**
   * The treasurer may link a transfer to its offering until the round is
   * posted, even after the count is locked: the amount must match, so the
   * counted totals do not change.
   */
  canLinkTransfers: boolean;
  funds: Array<{ id: number; name: string }>;
  members: Array<{ id: number; name: string; envelopeNo?: string | null }>;
  offeringTotal: number;
  addEnvelope: {
    mutate: (vars: any, options?: any) => void;
    isPending: boolean;
  };
  removeEnvelope: {
    mutate: (vars: { id: number; sessionId: number }) => void;
    isPending: boolean;
  };
}

export function EnvelopesTab({
  sessionId,
  editable,
  envelopes,
  funds,
  members,
  offeringTotal,
  addEnvelope,
  removeEnvelope,
  canLinkTransfers,
}: EnvelopesTabProps) {
  const utils = trpc.useUtils();
  const linkableQuery = trpc.counting.linkableTransfers.useQuery(
    { sessionId },
    { enabled: editable || canLinkTransfers, retry: false }
  );
  const linkedIds = new Set(
    envelopes.map(e => e.linkedOfferingId).filter(Boolean) as number[]
  );
  const freeTransfers = (linkableQuery.data ?? []).filter(
    t => !linkedIds.has(t.id)
  );
  const linkTransfer = trpc.counting.linkTransfer.useMutation({
    onSuccess: () =>
      Promise.all([
        utils.counting.get.invalidate({ id: sessionId }),
        utils.counting.linkableTransfers.invalidate({ sessionId }),
      ]),
    onError: error =>
      toast.error("ผูกรายการเงินโอนไม่สำเร็จ", { description: error.message }),
  });
  const transferLabel = (t: {
    id: number;
    amount: number;
    receiptDate: Date | string;
    reference: string | null;
    donorName: string | null;
  }) =>
    [
      `#${t.id}`,
      fmtBaht(t.amount),
      formatThaiDate(t.receiptDate),
      t.donorName,
      t.reference,
    ]
      .filter(Boolean)
      .join(" · ");
  const [envelopeNo, setEnvelopeNo] = useState("");
  const [memberId, setMemberId] = useState("");
  const [donorName, setDonorName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [category, setCategory] = useState<string>("general");
  const [fundId, setFundId] = useState("");
  const [method, setMethod] = useState<"cash" | "transfer" | "check">("cash");
  const [amount, setAmount] = useState("");
  const [linkedOfferingId, setLinkedOfferingId] = useState("");
  const linked = freeTransfers.find(t => t.id === Number(linkedOfferingId));
  const amountRef = useRef<HTMLInputElement>(null);

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
        linkedOfferingId:
          method === "transfer" && linkedOfferingId
            ? Number(linkedOfferingId)
            : undefined,
      },
      {
        onSuccess: () => {
          setEnvelopeNo("");
          setMemberId("");
          setDonorName("");
          setIsAnonymous(false);
          setAmount("");
          setLinkedOfferingId("");
          amountRef.current?.focus();
        },
      }
    );
  };

  return (
    <section className="space-y-4">
      {editable && (
        <form
          onSubmit={submitEnvelope}
          className="rounded-3xl border border-line bg-card p-5 shadow-sm md:p-6"
        >
          <h2 className="mb-4 font-bold text-foreground">บันทึกซองถวาย</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm font-semibold text-ink-2">
              เลขซอง
              <input
                value={envelopeNo}
                onChange={e => setEnvelopeNo(e.target.value)}
                placeholder="เช่น 012 (เว้นว่างได้)"
                className="mt-1 w-full rounded-xl border border-line p-3 text-sm font-normal text-foreground"
              />
            </label>
            <label className="text-sm font-semibold text-ink-2">
              สมาชิก
              <NativeSelect
                value={memberId}
                onChange={e => setMemberId(e.target.value)}
                disabled={isAnonymous}
                className="mt-1"
              >
                <option value="">ไม่ระบุสมาชิก</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.envelopeNo ? `[${m.envelopeNo}] ` : ""}
                    {m.name}
                  </option>
                ))}
              </NativeSelect>
            </label>
            <label className="text-sm font-semibold text-ink-2">
              ชื่อผู้ถวาย (ถ้าไม่ใช่สมาชิก)
              <input
                value={donorName}
                onChange={e => setDonorName(e.target.value)}
                disabled={isAnonymous}
                placeholder={isAnonymous ? "ไม่เปิดเผยนาม" : "ชื่อ-นามสกุล"}
                className="mt-1 w-full rounded-xl border border-line p-3 text-sm font-normal text-foreground disabled:opacity-50"
              />
            </label>
            <label className="text-sm font-semibold text-ink-2">
              ประเภทถวาย
              <NativeSelect
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="mt-1"
              >
                {OFFERING_CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </NativeSelect>
            </label>
            <label className="text-sm font-semibold text-ink-2">
              เข้ากองทุน *
              <NativeSelect
                required
                value={fundId}
                onChange={e => setFundId(e.target.value)}
                className="mt-1"
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
            </label>
            <label className="text-sm font-semibold text-ink-2">
              ช่องทาง
              <NativeSelect
                value={method}
                onChange={e => {
                  setMethod(e.target.value as typeof method);
                  setLinkedOfferingId("");
                }}
                className="mt-1"
              >
                <option value="cash">เงินสด</option>
                <option value="transfer">เงินโอน</option>
                <option value="check">เช็ค</option>
              </NativeSelect>
            </label>
            {method === "transfer" && (
              <label className="text-sm font-semibold text-ink-2 md:col-span-3">
                รายการเงินโอนที่รับแล้ว
                <NativeSelect
                  value={linkedOfferingId}
                  onChange={e => {
                    const id = e.target.value;
                    setLinkedOfferingId(id);
                    const t = freeTransfers.find(x => x.id === Number(id));
                    if (t) {
                      setAmount(String(t.amount));
                      if (t.fundId) setFundId(String(t.fundId));
                      setCategory(t.category);
                    }
                  }}
                  className="mt-1"
                >
                  <option value="">ยังไม่ผูก (ต้องผูกก่อนลงบัญชี)</option>
                  {freeTransfers.map(t => (
                    <option key={t.id} value={t.id}>
                      {transferLabel(t)}
                    </option>
                  ))}
                </NativeSelect>
                <span className="mt-1 block text-xs font-normal text-ink-3">
                  เงินโอนถูกบันทึกเข้าบัญชีแล้วเมื่ออนุมัติสลิป
                  ซองนี้จึงอ้างถึงรายการเดิม ไม่สร้างรายการใหม่
                  {freeTransfers.length === 0 &&
                    " ยังไม่มีรายการเงินโอนที่ผูกได้ ให้เหรัญญิกอนุมัติสลิปใน Giving Inbox ก่อน"}
                </span>
              </label>
            )}
            <label className="text-sm font-semibold text-ink-2">
              จำนวนเงิน (บาท) *
              <input
                ref={amountRef}
                type="number"
                inputMode="decimal"
                required
                min="0.25"
                step="0.25"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                readOnly={Boolean(linked)}
                placeholder="0.00"
                className="mt-1 w-full rounded-xl border border-line p-3 text-base font-bold tabular-nums text-success"
              />
            </label>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm text-ink-2">
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
                  className="size-4 rounded border-line"
                />
                ไม่ระบุนาม
              </label>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={addEnvelope.isPending || !fundId}
                className="min-h-11 w-full rounded-2xl bg-success px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {addEnvelope.isPending ? "กำลังบันทึก…" : "เพิ่มซอง"}
              </button>
            </div>
          </div>
          {funds.length === 0 && (
            <p className="mt-3 text-sm text-danger">
              ยังไม่มีกองทุนในระบบ ต้องสร้างกองทุนก่อนบันทึกซองถวาย
            </p>
          )}
        </form>
      )}

      <div className="overflow-hidden rounded-3xl border border-line bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-line p-4">
          <h2 className="font-bold text-foreground">
            ซองในรอบนี้ ({envelopes.length})
          </h2>
          <span className="text-sm font-bold text-ink-2">
            รวม {fmtBaht(offeringTotal)}
          </span>
        </div>
        {envelopes.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-2">
            ยังไม่มีซองในรอบนี้
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {envelopes.map(envelope => {
              const member = members.find(m => m.id === envelope.memberId);
              const who = envelope.isAnonymous
                ? "ไม่ระบุนาม"
                : (member?.name ?? envelope.donorName ?? "ไม่ระบุชื่อ");
              const categoryLabel = offeringCategoryLabel(envelope.category);
              const fundName =
                funds.find(f => f.id === envelope.fundId)?.name ??
                "ไม่ระบุกองทุน";
              return (
                <li
                  key={envelope.id}
                  className="flex items-center justify-between gap-4 p-4"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-foreground">
                      {envelope.envelopeNo
                        ? `ซอง ${envelope.envelopeNo} · `
                        : ""}
                      {who}
                    </p>
                    <p className="text-sm text-ink-2">
                      {categoryLabel} · {fundName} ·{" "}
                      {envelope.method === "cash"
                        ? "เงินสด"
                        : envelope.method === "transfer"
                          ? "เงินโอน"
                          : "เช็ค"}
                    </p>
                    {envelope.method === "transfer" &&
                      (envelope.linkedOfferingId ? (
                        <p className="text-xs text-success">
                          ผูกกับรายการเงินโอน #{envelope.linkedOfferingId}
                        </p>
                      ) : (
                        <div className="mt-1 space-y-1">
                          <p className="text-xs font-semibold text-warning">
                            ยังไม่ได้ผูกกับรายการเงินโอน
                            ลงบัญชีไม่ได้จนกว่าจะผูก
                          </p>
                          {canLinkTransfers && (
                            <NativeSelect
                              aria-label="ผูกกับรายการเงินโอน"
                              value=""
                              disabled={linkTransfer.isPending}
                              onChange={e =>
                                e.target.value &&
                                linkTransfer.mutate({
                                  sessionId,
                                  envelopeId: envelope.id,
                                  linkedOfferingId: Number(e.target.value),
                                })
                              }
                            >
                              <option value="">เลือกรายการเงินโอน</option>
                              {freeTransfers
                                .filter(t => t.amount === envelope.amount)
                                .map(t => (
                                  <option key={t.id} value={t.id}>
                                    {transferLabel(t)}
                                  </option>
                                ))}
                            </NativeSelect>
                          )}
                        </div>
                      ))}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <MoneyDisplay amount={envelope.amount} type="income" />
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
                        className="flex size-11 items-center justify-center rounded-xl text-danger hover:bg-danger-soft disabled:opacity-50"
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
  );
}
