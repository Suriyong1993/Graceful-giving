import React from "react";
import { Check } from "lucide-react";

export const fmtBaht = (n: number) =>
  `฿${n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Shows a variance with its sign and the Thai word for over or short. */
export function Variance({ amount }: { amount: number }) {
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
