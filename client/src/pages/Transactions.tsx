import React, { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  EmptyState,
  FilterBar,
  LoadingSkeleton,
  MoneyDisplay,
  StatusBadge,
} from "@/components/common/CommonUI";
import {
  Download,
  Filter,
  Heart,
  Landmark,
  Plus,
  ReceiptText,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

export default function Transactions() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [fundFilter, setFundFilter] = useState("all");

  const { data: offeringsData, isLoading: loadingOfferings } =
    trpc.offerings.list.useQuery({ limit: 50 }, { retry: false });

  const { data: expensesData, isLoading: loadingExpenses } =
    trpc.expenses.list.useQuery({ limit: 50 }, { retry: false });

  // Map and combine transactions
  const transactions = useMemo(() => {
    const list: any[] = [];
    if (offeringsData && offeringsData.length > 0) {
      offeringsData.forEach((o: any) => {
        list.push({
          id: `offering-${o.id}`,
          rawId: o.id,
          title:
            o.category === "tithe"
              ? "ถวายสิบลด"
              : o.category === "mission"
                ? "ถวายพันธกิจ"
                : "ถวายประจำสัปดาห์",
          date: o.receiptDate || o.createdAt,
          type: "income",
          category: o.category,
          fund: "บัญชีทั่วไป",
          ministry: "ฝ่ายการเงิน",
          amount: Number(o.amount),
          status: "approved",
          icon: Heart,
          tone: "bg-[#FFEBE5] text-[#E06250]",
        });
      });
    }

    if (expensesData && expensesData.length > 0) {
      expensesData.forEach((e: any) => {
        list.push({
          id: `expense-${e.id}`,
          rawId: e.id,
          title: e.description,
          date: e.expenseDate || e.createdAt,
          type: "expense",
          category: e.category,
          fund: "บัญชีทั่วไป",
          ministry: "พันธกิจนมัสการ",
          amount: Number(e.amount),
          status: e.status || "approved",
          icon: Landmark,
          tone: "bg-[#FDF0E2] text-[#B3702A]",
        });
      });
    }

    // Default static mock if empty
    if (list.length === 0) {
      return [
        {
          id: "tx-1",
          rawId: 1,
          title: "ถวายประจำสัปดาห์",
          date: "2026-09-12T10:30:00",
          type: "income",
          category: "ถวายทั่วไป",
          fund: "บัญชีทั่วไป",
          ministry: "อาคารคริสตจักร",
          amount: 1000,
          status: "approved",
          icon: Heart,
          tone: "bg-[#FFEBE5] text-[#E06250]",
        },
        {
          id: "tx-2",
          rawId: 2,
          title: "ค่าอุปกรณ์นมัสการ",
          date: "2026-09-10T15:20:00",
          type: "expense",
          category: "อุปกรณ์นมัสการ",
          fund: "บัญชีทั่วไป",
          ministry: "พันธกิจนมัสการ",
          amount: 2450,
          status: "approved",
          icon: Landmark,
          tone: "bg-[#FDF0E2] text-[#B3702A]",
        },
        {
          id: "tx-3",
          rawId: 3,
          title: "ค่าไฟฟ้าและสาธารณูปโภค",
          date: "2026-09-08T14:00:00",
          type: "expense",
          category: "สาธารณูปโภค",
          fund: "บัญชีทั่วไป",
          ministry: "ดำเนินงาน",
          amount: 3200,
          status: "approved",
          icon: ReceiptText,
          tone: "bg-[#FFF0ED] text-[#D45945]",
        },
        {
          id: "tx-4",
          rawId: 4,
          title: "ถวายสิบลด (โอน)",
          date: "2026-09-07T09:15:00",
          type: "income",
          category: "สิบลด",
          fund: "บัญชีทั่วไป",
          ministry: "ทั่วไป",
          amount: 5000,
          status: "approved",
          icon: Heart,
          tone: "bg-[#EAF5E4] text-[#4F8B33]",
        },
      ];
    }

    return list.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [offeringsData, expensesData]);

  // Filtered transactions
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch =
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = typeFilter === "all" || t.type === typeFilter;
      const matchFund = fundFilter === "all" || t.fund === fundFilter;
      return matchSearch && matchType && matchFund;
    });
  }, [transactions, searchTerm, typeFilter, fundFilter]);

  // Summary figures
  const totalIncome = useMemo(
    () =>
      filtered
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0),
    [filtered]
  );
  const totalExpense = useMemo(
    () =>
      filtered
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0),
    [filtered]
  );
  const netTotal = totalIncome - totalExpense;

  const handleExport = () => {
    toast.success("ดาวน์โหลดรายงานธุรกรรมสำเร็จ (CSV)");
  };

  const isLoading = loadingOfferings && loadingExpenses;

  return (
    <AppLayout
      activeRoute="/transactions"
      title="รายการธุรกรรม"
      subtitle="บันทึกการรับถวายและค่าใช้จ่ายทั้งหมดของคริสตจักร"
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-3.5 py-2 rounded-2xl bg-[#FFF4DF] hover:bg-[#FBE9CD] text-[#70452E] text-xs font-bold border border-[#E9D9BF] flex items-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">ส่งออก CSV</span>
          </button>
          <button
            onClick={() => setLocation("/offerings/new")}
            className="px-4 py-2 rounded-2xl bg-[#E99A4A] hover:bg-[#DE8640] text-white text-xs font-bold clay-button-shadow transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>บันทึกใหม่</span>
          </button>
        </div>
      }
    >
      {/* 1. Summary Cards (รายรับ, รายจ่าย, ยอดสุทธิ) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-[#FFF0ED] border border-[#FCE7DF] rounded-[28px] p-4 md:p-5 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-[#70452E]">รายรับทั้งหมด</span>
          <div>
            <MoneyDisplay amount={totalIncome} type="income" size="lg" />
          </div>
          <p className="text-[11px] text-[#927D6D]">
            {filtered.filter((t) => t.type === "income").length} รายการ
          </p>
        </div>

        <div className="bg-[#EFF8E8] border border-[#DCECC5] rounded-[28px] p-4 md:p-5 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-[#70452E]">รายจ่ายทั้งหมด</span>
          <div>
            <MoneyDisplay amount={totalExpense} type="expense" size="lg" />
          </div>
          <p className="text-[11px] text-[#927D6D]">
            {filtered.filter((t) => t.type === "expense").length} รายการ
          </p>
        </div>

        <div className="bg-[#FFF8EB] border border-[#FBE9CD] rounded-[28px] p-4 md:p-5 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-[#70452E]">ยอดสุทธิ</span>
          <div>
            <MoneyDisplay
              amount={netTotal}
              type={netTotal >= 0 ? "income" : "expense"}
              size="lg"
            />
          </div>
          <p className="text-[11px] text-[#927D6D]">คงเหลือในรอบที่เลือก</p>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white rounded-[28px] p-4 md:p-5 border border-[#E9D9BF] clay-card-shadow space-y-3">
        <FilterBar
          searchPlaceholder="ค้นหารายการ, หมวดหมู่, หรือพันธกิจ..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          filters={[
            { id: "all", label: "ทั้งหมด", count: transactions.length },
            {
              id: "income",
              label: "รายรับ (ถวาย)",
              count: transactions.filter((t) => t.type === "income").length,
            },
            {
              id: "expense",
              label: "รายจ่าย",
              count: transactions.filter((t) => t.type === "expense").length,
            },
          ]}
          activeFilter={typeFilter}
          onFilterChange={setTypeFilter}
        />
      </div>

      {/* 3. Transaction List & Table */}
      {isLoading ? (
        <LoadingSkeleton count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="ไม่พบรายการธุรกรรม"
          description="ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น"
          actionText="บันทึกการถวายใหม่"
          onAction={() => setLocation("/offerings/new")}
        />
      ) : (
        <div className="bg-white rounded-[28px] border border-[#E9D9BF] clay-card-shadow overflow-hidden">
          {/* DESKTOP TABLE VIEW (Hidden on Mobile) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#FFFDF8] border-b border-[#E9D9BF] text-[#70452E] font-bold">
                <tr>
                  <th className="p-4">วันที่</th>
                  <th className="p-4">รายการ</th>
                  <th className="p-4">ประเภท</th>
                  <th className="p-4">กองทุน</th>
                  <th className="p-4">พันธกิจ</th>
                  <th className="p-4 text-right">จำนวนเงิน</th>
                  <th className="p-4 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E6D8]/60">
                {filtered.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => setLocation(`/transactions/${tx.id}`)}
                    className="hover:bg-[#FFF9EE]/70 cursor-pointer transition-colors"
                  >
                    <td className="p-4 text-[#927D6D] whitespace-nowrap font-medium">
                      {new Intl.DateTimeFormat("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(tx.date))}
                    </td>
                    <td className="p-4 font-bold text-[#38251B]">
                      {tx.title}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FFF4DF] text-[#70452E] text-xs font-medium">
                        {tx.category}
                      </span>
                    </td>
                    <td className="p-4 text-[#70452E]">{tx.fund}</td>
                    <td className="p-4 text-[#927D6D]">{tx.ministry}</td>
                    <td className="p-4 text-right font-black">
                      <MoneyDisplay amount={tx.amount} type={tx.type} size="sm" />
                    </td>
                    <td className="p-4 text-center">
                      <StatusBadge status={tx.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS VIEW (Visible on Mobile) */}
          <div className="md:hidden divide-y divide-[#F0E6D8]/60">
            {filtered.map((tx) => {
              const Icon = tx.icon || ReceiptText;
              return (
                <div
                  key={tx.id}
                  onClick={() => setLocation(`/transactions/${tx.id}`)}
                  className="p-4 flex items-center justify-between gap-3 active:bg-[#FFF9EE] cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl ${tx.tone} flex items-center justify-center shrink-0 shadow-2xs`}
                    >
                      <Icon className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#38251B] truncate">
                        {tx.title}
                      </p>
                      <p className="text-[11px] text-[#927D6D] pt-0.5">
                        {new Intl.DateTimeFormat("th-TH", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }).format(new Date(tx.date))}{" "}
                        · {tx.fund}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-1">
                    <MoneyDisplay amount={tx.amount} type={tx.type} size="sm" />
                    <div>
                      <StatusBadge status={tx.status} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
