import type { CountingStatus } from "@shared/counting";
import type { AppRouter } from "../../../../../server/routers";
import type { inferRouterOutputs } from "@trpc/server";
import type { reconcile } from "@shared/counting";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type CountingDetail = NonNullable<RouterOutputs["counting"]["get"]>;
type Recon = ReturnType<typeof reconcile>;
import { fmtBaht } from "../utils";
import { Variance } from "./Variance";

export interface SummaryTabProps {
  detail: CountingDetail;
  sessionId: number;
  status: CountingStatus | undefined;
  r: Recon;
  varianceNote: string;
  setVarianceNote: (v: string) => void;
  unapproved: CountingDetail["deductions"];
  submitCount: {
    mutate: (input: { id: number }) => void;
    isPending: boolean;
  };
  reopenCount: {
    mutate: (input: { id: number }) => void;
    isPending: boolean;
  };
  verify: {
    mutate: (input: { id: number }) => void;
    isPending: boolean;
  };
  post: {
    mutate: (input: { id: number; varianceNote: string | undefined }) => void;
    isPending: boolean;
  };
  close: {
    mutate: (input: { id: number }) => void;
    isPending: boolean;
  };
}

export function SummaryTab(props: SummaryTabProps) {
  const {
    detail,
    sessionId,
    status,
    r,
    varianceNote,
    setVarianceNote,
    unapproved,
    submitCount,
    reopenCount,
    verify,
    post,
    close,
  } = props;
  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-3xl border border-[#DDE5F0] bg-white shadow-sm">
        <h2 className="border-b border-[#DDE5F0] p-4 font-bold text-[#0C1B33]">
          ตารางกระทบยอด
        </h2>
        <dl className="divide-y divide-[#DCE4F0]">
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
              <dt className="text-sm text-[#475569]">{row.label}</dt>
              <dd className="text-sm font-bold tabular-nums text-[#0C1B33]">
                {row.value}
              </dd>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 bg-[#F6F8FC] p-4">
            <dt className="text-sm font-bold text-[#0C1B33]">
              ผลต่างเงินสด (นับได้ − ซองเงินสด)
            </dt>
            <dd>
              <Variance amount={r.cashVariance} />
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 bg-[#F6F8FC] p-4">
            <dt className="text-sm font-bold text-[#0C1B33]">
              ผลต่างเงินโอน (เข้าบัญชี − ซองโอน)
            </dt>
            <dd>
              <Variance amount={r.transferVariance} />
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 bg-[#F6F8FC] p-4">
            <dt className="text-sm font-bold text-[#0C1B33]">
              ผลต่างการฝาก (ฝากจริง − ที่ต้องนำฝาก)
            </dt>
            <dd>
              <Variance amount={r.depositVariance} />
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-t-2 border-[#DDE5F0] p-4">
            <dt className="font-bold text-[#0C1B33]">
              นับเงินสดได้ − หักเบิก = ยอดนำฝาก
            </dt>
            <dd className="text-sm font-bold tabular-nums text-[#0C1B33]">
              {fmtBaht(r.countedCashTotal)} − {fmtBaht(r.deductionTotal)} ={" "}
              {fmtBaht(r.expectedDeposit)}
            </dd>
          </div>
        </dl>
      </div>

      {!r.isBalanced && (
        <div className="rounded-3xl border border-[#FCD9A0] bg-[#FEF3C7] p-5">
          <h3 className="font-bold text-[#92400E]">ยอดยังไม่ตรงกัน</h3>
          <p className="mt-1 text-sm text-[#92400E]">
            ปิดรอบได้เมื่อยอดตรง หรือบันทึกคำอธิบายผลต่างไว้เป็นหลักฐาน
          </p>
          <textarea
            rows={2}
            value={varianceNote}
            onChange={e => setVarianceNote(e.target.value)}
            placeholder="เช่น เงินสดขาด 20 บาท นับซ้ำสองครั้งแล้ว แจ้งที่ประชุมมัคนายกวันที่…"
            className="mt-3 w-full rounded-xl border border-[#DDE5F0] bg-white p-3 text-sm text-[#0C1B33]"
          />
          {detail.session.varianceNote && (
            <p className="mt-2 text-sm text-[#475569]">
              คำอธิบายที่บันทึกไว้: {detail.session.varianceNote}
            </p>
          )}
        </div>
      )}

      {unapproved.length > 0 && (
        <p className="rounded-2xl border border-[#FECACA] bg-[#FEE2E2] p-4 text-sm font-bold text-[#991B1B]">
          มีรายการหักเบิกที่ยังไม่ได้รับอนุมัติ {unapproved.length} รายการ —
          ต้องอนุมัติก่อนลงบัญชี
        </p>
      )}

      <div className="rounded-3xl border border-[#DDE5F0] bg-white p-5 shadow-sm">
        <h3 className="font-bold text-[#0C1B33]">ดำเนินการกับรอบนี้</h3>
        <p className="mt-1 text-sm text-[#475569]">
          ลำดับงาน: นับ → ส่งตรวจ → ตรวจสอบ → ลงบัญชี → ปิดรอบ
          (ผู้นับไม่สามารถตรวจสอบรอบของตัวเองได้)
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {status === "counting" && (
            <button
              type="button"
              onClick={() => submitCount.mutate({ id: sessionId })}
              disabled={submitCount.isPending}
              className="min-h-11 rounded-2xl bg-[#12325C] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              ส่งนับให้ตรวจสอบ
            </button>
          )}
          {(status === "counted" || status === "verified") && (
            <button
              type="button"
              onClick={() => reopenCount.mutate({ id: sessionId })}
              disabled={reopenCount.isPending}
              className="min-h-11 rounded-2xl border border-[#DDE5F0] bg-[#EEF2F8] px-5 py-2.5 text-sm font-bold text-[#475569] disabled:opacity-50"
            >
              ส่งกลับไปนับใหม่
            </button>
          )}
          {status === "counted" && (
            <button
              type="button"
              onClick={() => verify.mutate({ id: sessionId })}
              disabled={verify.isPending}
              className="min-h-11 rounded-2xl bg-[#047857] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
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
                unapproved.length > 0 ||
                (!r.isBalanced &&
                  !varianceNote.trim() &&
                  !detail.session.varianceNote)
              }
              className="min-h-11 rounded-2xl bg-[#065F46] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              ลงบัญชีเข้าระบบ
            </button>
          )}
          {status === "posted" && (
            <button
              type="button"
              onClick={() => close.mutate({ id: sessionId })}
              disabled={close.isPending}
              className="min-h-11 rounded-2xl bg-[#475569] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              ปิดรอบถาวร
            </button>
          )}
          {status === "closed" && (
            <p className="text-sm font-bold text-[#047857]">
              รอบนี้ปิดเรียบร้อยแล้ว ข้อมูลถูกล็อกเพื่อการตรวจสอบ
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
