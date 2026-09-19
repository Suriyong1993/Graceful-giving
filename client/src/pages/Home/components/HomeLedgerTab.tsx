import { Download, Heart, Landmark, Plus, Search } from "lucide-react";
import { Illustration } from "@/components/Illustration";
import type { TransactionItem } from "../types";
import { fmtBaht, fmtThaiDate } from "../utils";

interface HomeLedgerTabProps {
  allTransactions: TransactionItem[];
  filteredTransactions: TransactionItem[];
  searchTerm: string;
  onSearchChange: (v: string) => void;
  categoryFilter: string;
  onCategoryChange: (v: string) => void;
  ledgerTab: "all" | "offerings" | "expenses" | "withdrawals";
  onLedgerTabChange: (tab: "all" | "offerings" | "expenses" | "withdrawals") => void;
  onExportCSV: () => void;
  onOpenOffering: () => void;
}

export function HomeLedgerTab({
  allTransactions, filteredTransactions, searchTerm, onSearchChange,
  ledgerTab, onLedgerTabChange, onExportCSV, onOpenOffering,
}: HomeLedgerTabProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[28px] p-5 md:p-6 border border-[#E9D9BF] clay-card-shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#70452E]">สมุดบัญชีการเงิน</h2>
            <p className="text-xs text-[#927D6D]">บันทึกรายการรายรับ-รายจ่ายของคริสตจักรอย่างโปร่งใส</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onExportCSV} className="px-3.5 py-2 rounded-xl bg-[#FFF4DF] hover:bg-[#FBE9CD] text-[#70452E] text-xs font-bold border border-[#E9D9BF] flex items-center gap-1.5 transition-all focus-visible:ring-2 focus-visible:ring-[#E99A4A]">
              <Download className="w-3.5 h-3.5" /><span>ส่งออก CSV</span>
            </button>
            <button onClick={onOpenOffering} className="px-4 py-2 rounded-xl bg-[#E99A4A] text-white text-xs font-bold flex items-center gap-1.5 clay-button-shadow hover:bg-[#DE8640] transition-all">
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" /><span>บันทึกใหม่</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#FFF9EE] border border-[#E9D9BF] mb-4">
          <button onClick={() => onLedgerTabChange("all")} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${ledgerTab === "all" ? "bg-white text-[#70452E] shadow-2xs" : "text-[#927D6D]"}`}>
            ทั้งหมด ({allTransactions.length})
          </button>
          <button onClick={() => onLedgerTabChange("offerings")} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${ledgerTab === "offerings" ? "bg-[#EAF5E4] text-[#4F8B33] shadow-2xs" : "text-[#927D6D]"}`}>
            รายรับถวาย
          </button>
          <button onClick={() => onLedgerTabChange("expenses")} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${ledgerTab === "expenses" ? "bg-[#FFEBE5] text-[#D45945] shadow-2xs" : "text-[#927D6D]"}`}>
            รายจ่าย
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="w-4 h-4 text-[#927D6D] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input type="text" value={searchTerm} onChange={e => onSearchChange(e.target.value)} placeholder="ค้นหารายการ, หมวดหมู่ หรือผู้ถวาย..." className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#FFFDF8] border border-[#E9D9BF] text-xs md:text-sm focus:outline-none focus:border-[#E99A4A]" />
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-24 h-24 rounded-[24px] overflow-hidden bg-[#FFF4DF] p-1 border border-[#E9D9BF] shadow-xs">
              <Illustration src="/illustrations/offering_box.jpg" alt="กล่องถวาย" className="w-full h-full object-cover rounded-[20px]" width={96} height={96} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#70452E]">ยังไม่มีรายการถวาย</h3>
              <p className="text-xs text-[#927D6D] max-w-xs mx-auto">เริ่มบันทึกการถวายรายการแรกของคริสตจักรของคุณเพื่อความโปร่งใสและเป็นระเบียบ</p>
            </div>
            <button onClick={onOpenOffering} className="px-5 py-2.5 rounded-full bg-[#E99A4A] text-white text-xs font-bold clay-button-shadow hover:bg-[#DE8640] transition-all flex items-center gap-1.5">
              <Plus className="w-4 h-4" /><span>บันทึกการถวายรายการแรก</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#F0E6D8]/60">
            {filteredTransactions.map(tx => {
              const isIncome = tx.type === "income";
              const IconComp = tx.icon || (isIncome ? Heart : Landmark);
              return (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full ${tx.tone} flex items-center justify-center shrink-0`}>
                      <IconComp className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#38251B] truncate">{tx.title}</p>
                      <p className="text-[11px] text-[#927D6D]">{typeof tx.date === "string" ? tx.date : fmtThaiDate(tx.date)} · {tx.subCategory}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm md:text-base font-black ${isIncome ? "text-[#1b5e3a]" : "text-[#c7382d]"}`}>
                      {isIncome ? "+" : "-"}{fmtBaht(tx.amount)}
                    </p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF4DF] text-[#70452E] font-medium">{tx.category}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
