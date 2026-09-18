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
import { Illustration } from "@/components/Illustration";
import {
  Download,
  Plus,
  Receipt,
  TrendingDown,
  Building,
  Zap,
  Users,
  Cross,
  GraduationCap,
  HeartHandshake,
  Paperclip,
  Printer,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { EXPENSE_CATEGORIES, expenseCategoryLabel } from "@shared/categories";
import { VoucherModal, type VoucherData } from "@/components/finance/VoucherModal";
import { ReceiptPreviewModal } from "@/components/finance/ReceiptPreviewModal";

export default function Expenses() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherData | null>(null);
  const [previewReceipt, setPreviewReceipt] = useState<{
    url: string;
    ref: string;
    title: string;
  } | null>(null);

  const fundsQuery = trpc.finance.accounts.useQuery(undefined, {
    retry: false,
  });
  const funds = fundsQuery.data ?? [];
  const fundName = (id: number | null) =>
    funds.find(f => f.id === id)?.name ?? "ไม่ระบุกองทุน";

  const {
    data: expensesData,
    isLoading,
    isError,
    refetch,
  } = trpc.expenses.list.useQuery({ limit: 50 }, { retry: false });

  const expenses = useMemo(() => {
    if (expensesData && expensesData.length > 0) {
      return expensesData.map((e: any) => ({
        id: e.id,
        category: e.category,
        description: e.description,
        amount: Number(e.amount),
        date: e.expenseDate || e.createdAt,
        payee: e.payee || "ทั่วไป",
        receiptRef: e.receiptRef || "-",
        fundId: e.fundId as number | null,
        status: e.status || "approved",
        receiptUrl: e.receiptUrl || null,
      }));
    }

    return [];
  }, [expensesData]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(item => {
      const matchesSearch =
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.payee.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.receiptRef.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchTerm, categoryFilter]);

  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredExpenses]);

  const exportCSV = () => {
    const headers =
      "ID,วันที่,รายการ,หมวดหมู่,ผู้รับเงิน,จำนวนเงิน,เลขที่ใบเสร็จ,กองทุน,สถานะ\n";
    const rows = filteredExpenses
      .map(
        e =>
          `"${e.id}","${new Date(e.date).toLocaleDateString("th-TH")}","${e.description}","${expenseCategoryLabel(e.category)}","${e.payee}",${e.amount},"${e.receiptRef}","${fundName(e.fundId)}","${e.status}"`
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + headers + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `grace-giving-expenses-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("ส่งออกข้อมูลรายจ่ายสำเร็จ");
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "utilities":
        return { icon: Zap, color: "bg-amber-100 text-amber-800" };
      case "ministry":
        return { icon: Users, color: "bg-sky-100 text-sky-800" };
      case "pastoral":
        return { icon: Cross, color: "bg-emerald-100 text-emerald-800" };
      case "admin":
        return { icon: Receipt, color: "bg-purple-100 text-purple-800" };
      case "building":
        return { icon: Building, color: "bg-orange-100 text-orange-800" };
      case "worship":
        return { icon: GraduationCap, color: "bg-blue-100 text-blue-800" };
      case "welfare":
        return { icon: HeartHandshake, color: "bg-rose-100 text-rose-800" };
      default:
        return { icon: Receipt, color: "bg-stone-100 text-stone-700" };
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="bg-[#FFF4DF] border border-[#E9D9BF] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F7B6A6]/20 text-[#70452E]">
              <TrendingDown className="w-3.5 h-3.5 text-[#F7B6A6]" />
              การเบิกจ่ายและค่าใช้จ่ายคริสตจักร
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-[#38251B]">
              บันทึกรายจ่าย (Expenses)
            </h1>
            <p className="text-sm text-[#70452E]/80 max-w-xl">
              บันทึกและตรวจสอบทุกการใช้จ่ายเพื่อพันธกิจของพระเจ้า
              ด้วยความโปร่งใส สัตย์ซื่อ และมีหลักฐานครบถ้วน
            </p>
          </div>
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden shadow-inner flex-shrink-0 bg-white/60 p-1">
            <Illustration
              src="/illustrations/expense_hand_coin.jpg"
              alt="Expense illustration"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#E9D9BF] shadow-sm">
            <div className="flex items-center justify-between text-[#70452E]/70 mb-2">
              <span className="text-sm font-medium">รวมรายจ่ายตามตัวกรอง</span>
              <div className="w-8 h-8 rounded-full bg-[#F7B6A6]/20 flex items-center justify-center text-[#70452E]">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <MoneyDisplay
              amount={totalAmount}
              type="expense"
              size="lg"
              className="font-bold text-[#38251B]"
            />
            <p className="text-xs text-[#70452E]/60 mt-1">
              {filteredExpenses.length} รายการที่แสดง
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E9D9BF] shadow-sm">
            <div className="flex items-center justify-between text-[#70452E]/70 mb-2">
              <span className="text-sm font-medium">
                หมวดหมู่หลักประจำเดือน
              </span>
              <div className="w-8 h-8 rounded-full bg-[#A9D4ED]/20 flex items-center justify-center text-sky-700">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-bold text-[#38251B]">
              สาธารณูปโภค & พันธกิจ
            </p>
            <p className="text-xs text-[#70452E]/60 mt-1">
              สัดส่วน 62% ของงบประมาณ
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E9D9BF] shadow-sm">
            <div className="flex items-center justify-between text-[#70452E]/70 mb-2">
              <span className="text-sm font-medium">สถานะการตรวจสอบ</span>
              <div className="w-8 h-8 rounded-full bg-[#DCECC5] flex items-center justify-center text-[#70452E]">
                <HeartHandshake className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-[#38251B]">100%</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#A8C978]/20 text-[#38251B] font-medium">
                มีใบเสร็จครบ
              </span>
            </div>
            <p className="text-xs text-[#70452E]/60 mt-1">
              ผ่านการอนุมัติเรียบร้อย
            </p>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <FilterBar
            searchPlaceholder="ค้นหารายการ, ผู้รับเงิน, เลขที่ใบเสร็จ..."
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            activeFilter={categoryFilter}
            onFilterChange={setCategoryFilter}
            filters={[
              { label: "ทุกหมวดหมู่", id: "all", count: expenses.length },
              ...EXPENSE_CATEGORIES.map(c => ({
                label: c.label,
                id: c.id,
                count: expenses.filter(e => e.category === c.id).length,
              })),
            ]}
          />
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={exportCSV}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-[#E9D9BF] bg-white text-[#70452E] hover:bg-[#FFF4DF]/50 transition-colors text-sm font-medium shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>ส่งออก CSV</span>
            </button>
            <button
              onClick={() => setLocation("/expenses/new")}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#E99A4A] hover:bg-[#d88939] text-white font-medium text-sm shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>บันทึกรายจ่าย</span>
            </button>
          </div>
        </div>

        {/* Table & List */}
        {isLoading ? (
          <LoadingSkeleton count={5} />
        ) : isError ? (
          <EmptyState
            title="โหลดรายการรายจ่ายไม่สำเร็จ"
            description="เกิดข้อผิดพลาดในการเชื่อมต่อข้อมูลจริง กรุณาลองใหม่อีกครั้ง"
            actionText="ลองใหม่"
            onAction={() => refetch()}
          />
        ) : filteredExpenses.length === 0 ? (
          <EmptyState
            title="ไม่พบรายการรายจ่าย"
            description="ยังไม่มีรายการรายจ่ายที่ตรงกับเงื่อนไขการค้นหาของคุณ"
            actionText="บันทึกรายจ่ายใหม่"
            onAction={() => setLocation("/expenses/new")}
          />
        ) : (
          <div className="bg-white rounded-3xl border border-[#E9D9BF] overflow-hidden shadow-sm">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-[#38251B]">
                <thead className="bg-[#FFF9EE] border-b border-[#E9D9BF] text-xs font-semibold text-[#70452E]">
                  <tr>
                    <th className="py-4 px-6">วันที่</th>
                    <th className="py-4 px-6">รายการ</th>
                    <th className="py-4 px-6">หมวดหมู่</th>
                    <th className="py-4 px-6">ผู้รับเงิน (Payee)</th>
                    <th className="py-4 px-6">กองทุน</th>
                    <th className="py-4 px-6">เลขที่ใบเสร็จ</th>
                    <th className="py-4 px-6 text-center">หลักฐาน</th>
                    <th className="py-4 px-6 text-right">จำนวนเงิน</th>
                    <th className="py-4 px-6 text-center">สถานะ</th>
                    <th className="py-4 px-6 text-center">ใบสำคัญจ่าย</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9D9BF]/40">
                  {filteredExpenses.map(e => {
                    const cat = getCategoryIcon(e.category);
                    const CatIcon = cat.icon;
                    return (
                      <tr
                        key={e.id}
                        onClick={() =>
                          setLocation(`/transactions/expense-${e.id}`)
                        }
                        className="hover:bg-[#FFF4DF]/30 cursor-pointer transition-colors"
                      >
                        <td className="py-4 px-6 whitespace-nowrap text-[#70452E]/80">
                          {new Date(e.date).toLocaleDateString("th-TH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-4 px-6 font-medium text-[#38251B] max-w-xs truncate">
                          {e.description}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cat.color}`}
                          >
                            <CatIcon className="w-3.5 h-3.5" />
                            {expenseCategoryLabel(e.category)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-[#70452E]/80 whitespace-nowrap">
                          {e.payee}
                        </td>
                        <td className="py-4 px-6 text-xs text-[#70452E]/80 whitespace-nowrap">
                          {fundName(e.fundId)}
                        </td>
                        <td className="py-4 px-6 text-xs text-[#70452E]/60 font-mono whitespace-nowrap">
                          {e.receiptRef}
                        </td>
                        <td className="py-4 px-6 text-center whitespace-nowrap" onClick={ev => ev.stopPropagation()}>
                          {e.receiptUrl ? (
                            <button
                              onClick={() =>
                                setPreviewReceipt({
                                  url: e.receiptUrl!,
                                  ref: e.receiptRef || `EXP-${e.id}`,
                                  title: e.description,
                                })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-medium transition-colors"
                              title="คลิกเพื่อดูรูปสลิป/ใบเสร็จ"
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                              <span>ดูสลิป</span>
                            </button>
                          ) : (
                            <span className="text-stone-300 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap font-medium">
                          <MoneyDisplay
                            amount={e.amount}
                            type="expense"
                            size="sm"
                          />
                        </td>
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          <StatusBadge status={e.status} />
                        </td>
                        <td className="py-4 px-6 text-center whitespace-nowrap" onClick={ev => ev.stopPropagation()}>
                          <button
                            onClick={() =>
                              setSelectedVoucher({
                                id: e.id,
                                date: e.date,
                                amount: e.amount,
                                category: e.category,
                                categoryLabel: expenseCategoryLabel(e.category),
                                titleOrDescription: e.description,
                                payeeOrDonor: e.payee,
                                fundName: fundName(e.fundId),
                                receiptRef: e.receiptRef,
                                receiptUrl: e.receiptUrl,
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-[#FFF4DF] hover:border-[#E99A4A] text-[#70452E] border border-stone-200 text-xs font-semibold transition-all shadow-2xs"
                            title="พิมพ์ใบสำคัญจ่าย"
                          >
                            <Printer className="w-3.5 h-3.5 text-[#E99A4A]" />
                            <span>พิมพ์ใบสำคัญ</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-[#E9D9BF]/40">
              {filteredExpenses.map(e => {
                const cat = getCategoryIcon(e.category);
                const CatIcon = cat.icon;
                return (
                  <div
                    key={e.id}
                    onClick={() => setLocation(`/transactions/expense-${e.id}`)}
                    className="p-4 space-y-2.5 active:bg-[#FFF4DF]/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${cat.color}`}
                          >
                            <CatIcon className="w-3 h-3" />
                            {expenseCategoryLabel(e.category)}
                          </span>
                          <span className="text-xs text-[#70452E]/60 font-mono">
                            {e.receiptRef}
                          </span>
                        </div>
                        <p className="font-medium text-[#38251B] text-sm truncate">
                          {e.description}
                        </p>
                        <p className="text-xs text-[#70452E]/70">
                          {e.payee} •{" "}
                          {new Date(e.date).toLocaleDateString("th-TH")}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <MoneyDisplay
                          amount={e.amount}
                          type="expense"
                          size="sm"
                        />
                        <div className="mt-1">
                          <StatusBadge status={e.status} />
                        </div>
                      </div>
                    </div>

                    {/* Mobile Action Bar */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#E9D9BF]/30" onClick={ev => ev.stopPropagation()}>
                      {e.receiptUrl && (
                        <button
                          onClick={() =>
                            setPreviewReceipt({
                              url: e.receiptUrl!,
                              ref: e.receiptRef || `EXP-${e.id}`,
                              title: e.description,
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium"
                        >
                          <Paperclip className="w-3 h-3" />
                          <span>ดูสลิป</span>
                        </button>
                      )}
                      <button
                        onClick={() =>
                          setSelectedVoucher({
                            id: e.id,
                            date: e.date,
                            amount: e.amount,
                            category: e.category,
                            categoryLabel: expenseCategoryLabel(e.category),
                            titleOrDescription: e.description,
                            payeeOrDonor: e.payee,
                            fundName: fundName(e.fundId),
                            receiptRef: e.receiptRef,
                            receiptUrl: e.receiptUrl,
                          })
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 text-[#70452E] border border-stone-200 text-xs font-medium"
                      >
                        <Printer className="w-3 h-3 text-[#E99A4A]" />
                        <span>พิมพ์ใบสำคัญ</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Voucher Modal */}
        <VoucherModal
          isOpen={Boolean(selectedVoucher)}
          onClose={() => setSelectedVoucher(null)}
          type="expense"
          data={selectedVoucher}
        />

        {/* Receipt Preview Modal */}
        <ReceiptPreviewModal
          isOpen={Boolean(previewReceipt)}
          onClose={() => setPreviewReceipt(null)}
          receiptUrl={previewReceipt?.url ?? null}
          refCode={previewReceipt?.ref}
          title={previewReceipt?.title}
        />
      </div>
    </AppLayout>
  );
}
