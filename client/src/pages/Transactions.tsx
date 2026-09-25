import React, { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  ErrorState,
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { offeringCategoryLabel } from "@shared/categories";

export default function Transactions() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const {
    data: offeringsData,
    isLoading: loadingOfferings,
    isError: offeringsError,
    refetch: refetchOfferings,
  } = trpc.offerings.list.useQuery({ limit: 50 }, { retry: false });

  const {
    data: expensesData,
    isLoading: loadingExpenses,
    isError: expensesError,
    refetch: refetchExpenses,
  } = trpc.expenses.list.useQuery({ limit: 50 }, { retry: false });

  type TransactionRow = {
    id: string;
    title: string;
    date: Date;
    type: "income" | "expense";
    category: string;
    fund: string;
    ministry: string;
    amount: number;
    status: Parameters<typeof StatusBadge>[0]["status"];
    icon: typeof Heart | typeof Landmark;
    tone: string;
  };

  const transactions = useMemo<TransactionRow[]>(() => {
    const list: TransactionRow[] = [];
    offeringsData?.forEach(offering => {
      list.push({
        id: `offering-${offering.id}`,
        title: offeringCategoryLabel(offering.category),
        date: offering.receiptDate,
        type: "income",
        category: offeringCategoryLabel(offering.category),
        fund: "ไม่ระบุกองทุน",
        ministry: "บันทึกทะเบียน",
        amount: Number(offering.amount),
        status: "completed",
        icon: Heart,
        tone: "bg-[#FEE2E2] text-[#DC2626]",
      });
    });

    expensesData?.forEach(expense => {
      list.push({
        id: `expense-${expense.id}`,
        title: expense.description,
        date: expense.expenseDate,
        type: "expense",
        category: expense.category,
        fund: "ไม่ระบุกองทุน",
        ministry: "บันทึกทะเบียน",
        amount: Number(expense.amount),
        status:
          expense.status === "pending"
            ? "pending"
            : expense.status === "rejected" || expense.status === "voided"
              ? "failed"
              : "completed",
        icon: Landmark,
        tone: "bg-[#FEF3C7] text-[#92400E]",
      });
    });

    return list.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [offeringsData, expensesData]);

  // Filtered transactions
  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch =
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = typeFilter === "all" || t.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [transactions, searchTerm, typeFilter]);

  // Summary figures
  const totalIncome = useMemo(
    () =>
      filtered
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0),
    [filtered]
  );
  const totalExpense = useMemo(
    () =>
      filtered
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0),
    [filtered]
  );
  const netTotal = totalIncome - totalExpense;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleTransactions = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleExport = () => {
    const escapeCsv = (value: string | number) =>
      `"${String(value).replaceAll('"', '""')}"`;
    const rows: (string | number)[][] = filtered.map(tx => [
      tx.date.toISOString().slice(0, 10),
      tx.type === "income" ? "รายรับ" : "รายจ่าย",
      tx.title,
      tx.category,
      tx.fund,
      tx.amount.toFixed(2),
    ]);
    const csv = [
      ["วันที่", "ประเภท", "รายการ", "หมวด", "กองทุน", "จำนวนเงิน"],
      ...rows,
    ]
      .map(row => row.map(escapeCsv).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `transactions-filtered-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(
      `ส่งออกรายการที่กรองแล้ว ${filtered.length} รายการเป็นไฟล์ CSV แล้ว`
    );
  };

  const updateFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  const isLoading = loadingOfferings || loadingExpenses;
  const isError = offeringsError || expensesError;

  return (
    <AppLayout
      activeRoute="/transactions"
      title="รายการธุรกรรม"
      subtitle="ข้อมูลรายการรับถวายและรายจ่ายจากทะเบียนล่าสุด (ไม่เกิน 50 รายการต่อประเภท)"
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-3.5 py-2 rounded-2xl bg-[#EEF2F8] hover:bg-[#FEF3C7] text-[#1E4470] text-xs font-bold border border-[#DDE5F0] flex items-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">ส่งออก CSV</span>
          </button>
          <button
            onClick={() => setLocation("/offerings/new")}
            className="px-4 py-2 rounded-2xl bg-[#12325C] hover:bg-[#0F2947] text-white text-xs font-bold clay-button-shadow transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>บันทึกใหม่</span>
          </button>
        </div>
      }
    >
      {/* 1. Summary Cards (รายรับ, รายจ่าย, ยอดสุทธิ) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-[#FEE2E2] border border-[#FEE2E2] rounded-2xl p-4 md:p-5 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-[#1E4470]">
            รายรับในผลที่กรอง
          </span>
          <div>
            <MoneyDisplay amount={totalIncome} type="income" size="lg" />
          </div>
          <p className="text-sm text-[#475569]">
            {filtered.filter(t => t.type === "income").length} รายการ
          </p>
        </div>

        <div className="bg-[#ECFDF5] border border-[#B9E6D0] rounded-2xl p-4 md:p-5 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-[#1E4470]">
            รายจ่ายในผลที่กรอง
          </span>
          <div>
            <MoneyDisplay amount={totalExpense} type="expense" size="lg" />
          </div>
          <p className="text-sm text-[#475569]">
            {filtered.filter(t => t.type === "expense").length} รายการ
          </p>
        </div>

        <div className="bg-[#FFF7ED] border border-[#FEF3C7] rounded-2xl p-4 md:p-5 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-[#1E4470]">ยอดสุทธิ</span>
          <div>
            <MoneyDisplay
              amount={netTotal}
              type={netTotal >= 0 ? "income" : "expense"}
              size="lg"
            />
          </div>
          <p className="text-sm text-[#475569]">
            ยอดสุทธิของ {filtered.length} รายการที่แสดงผล
          </p>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white rounded-2xl p-4 md:p-5 border border-[#DDE5F0] clay-card-shadow space-y-3">
        <FilterBar
          searchPlaceholder="ค้นหารายการ, หมวดหมู่, หรือพันธกิจ..."
          searchValue={searchTerm}
          onSearchChange={value => updateFilter(setSearchTerm, value)}
          filters={[
            { id: "all", label: "ทั้งหมด", count: transactions.length },
            {
              id: "income",
              label: "รายรับ (ถวาย)",
              count: transactions.filter(t => t.type === "income").length,
            },
            {
              id: "expense",
              label: "รายจ่าย",
              count: transactions.filter(t => t.type === "expense").length,
            },
          ]}
          activeFilter={typeFilter}
          onFilterChange={value => updateFilter(setTypeFilter, value)}
        />
      </div>

      {/* 3. Transaction List & Table */}
      {isLoading ? (
        <LoadingSkeleton count={5} />
      ) : isError ? (
        <ErrorState
          title="โหลดรายการธุรกรรมไม่สำเร็จ"
          description="เกิดข้อผิดพลาดในการเชื่อมต่อข้อมูลจริง กรุณาลองใหม่อีกครั้ง"
          onRetry={() => {
            void refetchOfferings();
            void refetchExpenses();
          }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="ไม่พบรายการธุรกรรม"
          description="ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น"
          actionText="บันทึกการถวายใหม่"
          onAction={() => setLocation("/offerings/new")}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-[#DDE5F0] clay-card-shadow overflow-hidden">
          {/* DESKTOP TABLE VIEW (Hidden on Mobile) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#FFFFFF] border-b border-[#DDE5F0] text-[#1E4470] font-bold">
                <tr>
                  <th className="p-4">วันที่</th>
                  <th className="p-4">รายการ</th>
                  <th className="p-4">ประเภท</th>
                  <th className="p-4">กองทุน</th>
                  <th className="p-4">พันธกิจ</th>
                  <th className="p-4 text-right">จำนวนเงิน</th>
                  <th className="p-4 text-center">สถานะ</th>
                  <th className="p-4 text-right">ดูรายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE4F0]/60">
                {visibleTransactions.map(tx => (
                  <tr
                    key={tx.id}
                    className="hover:bg-[#F6F8FC]/70 transition-colors"
                  >
                    <td className="p-4 text-[#64748B] whitespace-nowrap font-medium">
                      {new Intl.DateTimeFormat("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(tx.date))}
                    </td>
                    <td className="p-4 font-bold text-[#0C1B33]">{tx.title}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2F8] text-[#1E4470] text-xs font-medium">
                        {tx.category}
                      </span>
                    </td>
                    <td className="p-4 text-[#1E4470]">{tx.fund}</td>
                    <td className="p-4 text-[#64748B]">{tx.ministry}</td>
                    <td className="p-4 text-right font-bold">
                      <MoneyDisplay
                        amount={tx.amount}
                        type={tx.type}
                        size="sm"
                      />
                    </td>
                    <td className="p-4 text-center">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => setLocation(`/transactions/${tx.id}`)}
                        className="rounded-lg px-3 py-2 font-semibold text-[#1E4470] hover:bg-[#EEF2F8] focus-visible:outline-2 focus-visible:outline-offset-2"
                      >
                        ดูรายละเอียด
                        <span className="sr-only"> {tx.title}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS VIEW (Visible on Mobile) */}
          <div className="md:hidden divide-y divide-[#DCE4F0]/60">
            {visibleTransactions.map(tx => {
              const Icon = tx.icon || ReceiptText;
              return (
                <article
                  key={tx.id}
                  className="p-4 flex items-center justify-between gap-3 active:bg-[#F6F8FC]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl ${tx.tone} flex items-center justify-center shrink-0 shadow-2xs`}
                    >
                      <Icon className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#0C1B33] truncate">
                        {tx.title}
                      </p>
                      <p className="text-sm text-[#475569] pt-0.5">
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
                    <button
                      type="button"
                      onClick={() => setLocation(`/transactions/${tx.id}`)}
                      className="mt-1 rounded-lg px-2 py-1 text-xs font-semibold text-[#1E4470] hover:bg-[#EEF2F8]"
                    >
                      ดูรายละเอียด<span className="sr-only"> {tx.title}</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          {totalPages > 1 && (
            <nav
              aria-label="แบ่งหน้ารายการธุรกรรม"
              className="flex items-center justify-between border-t border-[#DDE5F0] bg-[#FFFFFF] px-4 py-3"
            >
              <button
                type="button"
                onClick={() => setPage(current => Math.max(1, current - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> ก่อนหน้า
              </button>
              <span className="text-xs text-[#1E4470]">
                หน้า {currentPage} จาก {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage(current => Math.min(totalPages, current + 1))
                }
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-40"
              >
                ถัดไป <ChevronRight className="h-4 w-4" />
              </button>
            </nav>
          )}
        </div>
      )}
    </AppLayout>
  );
}
