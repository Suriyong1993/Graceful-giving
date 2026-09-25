import type { CountingStatus } from "@shared/counting";
import { TABS, type TabId } from "../utils";

export function TabBar({
  tab,
  onTabChange,
  status,
}: {
  tab: TabId;
  onTabChange: (t: TabId) => void;
  status: CountingStatus | undefined;
}) {
  const editable = status === "counting";
  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold transition-colors ${
              tab === id
                ? "bg-[#12325C] text-white shadow-sm"
                : "border border-[#DDE5F0] bg-white text-[#475569] hover:bg-[#F6F8FC]"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {!editable && tab !== "summary" && tab !== "bank" && (
        <p className="rounded-2xl border border-[#FCD9A0] bg-[#FEF3C7] p-4 text-sm text-[#92400E]">
          รอบนี้ส่งนับแล้ว จึงแก้ไขซองและผลนับไม่ได้ ถ้าต้องแก้ ให้เหรัญญิกกด
          “ส่งกลับไปนับใหม่” ในแท็บสรุป
        </p>
      )}
    </>
  );
}
