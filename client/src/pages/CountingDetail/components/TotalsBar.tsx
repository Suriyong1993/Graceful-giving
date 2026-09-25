import { MoneyDisplay } from "@/components/common/CommonUI";
import type { reconcile } from "@shared/counting";
import { Variance } from "./Variance";

type Recon = ReturnType<typeof reconcile>;

export function TotalsBar({ r }: { r: Recon }) {
  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div className="rounded-2xl border border-[#DDE5F0] bg-white p-4 shadow-2xs">
        <p className="text-sm text-[#475569]">ยอดถวายตามซอง</p>
        <MoneyDisplay amount={r.offeringTotal} type="income" size="lg" />
      </div>
      <div className="rounded-2xl border border-[#DDE5F0] bg-white p-4 shadow-2xs">
        <p className="text-sm text-[#475569]">นับเงินสดได้</p>
        <MoneyDisplay amount={r.countedCashTotal} size="lg" />
        <div className="mt-1 text-sm">
          <Variance amount={r.cashVariance} />
        </div>
      </div>
      <div className="rounded-2xl border border-[#DDE5F0] bg-white p-4 shadow-2xs">
        <p className="text-sm text-[#475569]">หักเบิก</p>
        <MoneyDisplay amount={r.deductionTotal} type="expense" size="lg" />
      </div>
      <div className="rounded-2xl border border-[#DDE5F0] bg-white p-4 shadow-2xs">
        <p className="text-sm text-[#475569]">ต้องนำฝาก</p>
        <MoneyDisplay amount={r.expectedDeposit} size="lg" />
        <div className="mt-1 text-sm">
          <Variance amount={r.depositVariance} />
        </div>
      </div>
    </section>
  );
}
