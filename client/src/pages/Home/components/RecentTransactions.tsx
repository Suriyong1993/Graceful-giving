import { ChevronRight, Heart } from "lucide-react";

export interface TransactionItem {
  id: string;
  rawId: number;
  title: string;
  date: string | Date;
  type: "income" | "expense";
  category: string;
  subCategory: string;
  amount: number;
  tone: string;
  icon: typeof Heart;
}

interface RecentTransactionsProps {
  allTransactions: TransactionItem[];
  onViewAll: () => void;
  fmtBaht: (n: number) => string;
  fmtThaiDate: (d: Date | string) => string;
}

export function RecentTransactions({
  allTransactions,
  onViewAll,
  fmtBaht,
  fmtThaiDate,
}: RecentTransactionsProps) {
  return (
    <section
      aria-label="รายการธุรกรรมล่าสุด"
      className="bg-white rounded-[28px] sm:rounded-[36px] p-6 sm:p-8 border-2 border-[#E9D9BF] shadow-xs space-y-4 w-full"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-black text-[#2C1810]">
          รายการล่าสุด
        </h2>
        <button
          onClick={onViewAll}
          className="min-h-11 -mr-2 px-2 text-sm sm:text-base font-black text-[#B85E0E] hover:underline flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-[#D47012]"
        >
          <span>ดูทั้งหมด</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="divide-y-2 divide-[#F0E6D8]/60">
        {allTransactions.length === 0 && (
          <p className="py-8 text-center text-sm sm:text-base text-[#4A2E1B] font-bold">
            ยังไม่มีรายการธุรกรรมล่าสุดจากระบบ
          </p>
        )}
        {allTransactions.slice(0, 4).map(tx => {
          const IconComponent = tx.icon || Heart;
          const isIncome = tx.type === "income";
          return (
            <div
              key={tx.id}
              className="py-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className={`w-12 h-12 rounded-2xl ${tx.tone} flex items-center justify-center shrink-0`}
                >
                  <IconComponent className="w-6 h-6 stroke-[2.4]" />
                </div>
                <div className="min-w-0">
                  <p className="text-base sm:text-lg font-black text-[#2C1810] leading-tight truncate">
                    {tx.title}
                  </p>
                  <p className="text-xs sm:text-sm text-[#4A2E1B] font-bold pt-0.5">
                    {/* The API returns receiptDate/expenseDate as ISO strings,
                        so the old `typeof === "string"` branch printed
                        "2026-09-20T12:52:36.967Z" straight into the row.
                        Format every value, whatever its type. */}
                    {fmtThaiDate(tx.date)}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p
                  className={`text-base sm:text-xl font-black ${isIncome ? "text-[#155724]" : "text-[#9E2D12]"}`}
                >
                  {isIncome ? "+" : "-"}
                  {fmtBaht(tx.amount)}
                </p>
                <p className="text-xs sm:text-sm text-[#4A2E1B] font-bold">
                  {tx.subCategory}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
