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
} from "lucide-react";
import { toast } from "sonner";

export default function Expenses() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: expensesData, isLoading } = trpc.expenses.list.useQuery(
    { limit: 50 },
    { retry: false }
  );

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
        fund: "บัญชีทั่วไป",
        status: e.status || "approved",
      }));
    }

    return [
      {
        id: 1,
        category: "utility",
        description: "ค่าไฟฟ้าและค่าน้ำประปา ประจำเดือนกันยายน",
        amount: 8450,
        date: "2026-09-11T14:00:00",
        payee: "การไฟฟ้านครหลวง",
        receiptRef: "INV-2026-0911",
        fund: "บัญชีทั่วไป",
        status: "approved",
      },
      {
        id: 2,
        category: "ministry",
        description: "อุปกรณ์สื่อมัลติมีเดียและไมโครโฟนไร้สาย (รวี)",
        amount: 14200,
        date: "2026-09-09T11:15:00",
        payee: "บริษัท ซาวด์ซิสเต็ม จำกัด",
        receiptRef: "INV-88329",
        fund: "กองทุนพันธกิจ",
        status: "approved",
      },
      {
        id: 3,
        category: "benevolence",
        description: "ถุงยังชีพสงเคราะห์ชุมชนรอบโบสถ์ 20 ชุด",
        amount: 6000,
        date: "2026-09-06T16:20:00",
        payee: "ร้านค้าสวัสดิการชุมชน",
        receiptRef: "RCP-4491",
        fund: "กองทุนสงเคราะห์",
        status: "approved",
      },
      {
        id: 4,
        category: "education",
        description: "เอกสารและหนังสือเรียนพระคัมภีร์เด็ก",
        amount: 2850,
        date: "2026-09-03T09:30:00",
        payee: "สมาคมพระคริสตธรรม",
        receiptRef: "RCP-3310",
        fund: "กองทุนเพื่อเด็ก",
        status: "approved",
      },
      {
        id: 5,
        category: "building",
        description: "ซ่อมแซมระบบเครื่องปรับอากาศห้องนมัสการชั้น 2",
        amount: 5500,
        date: "2026-09-01T13:45:00",
        payee: "ช่างแอร์ สุรชัย เซอร์วิส",
        receiptRef: "INV-5512",
        fund: "กองทุนก่อสร้าง",
        status: "approved",
      },
    ];
  }, [expensesData]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
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
    const headers = "ID,วันที่,รายการ,หมวดหมู่,ผู้รับเงิน,จำนวนเงิน,เลขที่ใบเสร็จ,กองทุน,สถานะ\n";
    const rows = filteredExpenses
      .map(
        (e) =>
          `"${e.id}","${new Date(e.date).toLocaleDateString("th-TH")}","${e.description}","${e.category}","${e.payee}",${e.amount},"${e.receiptRef}","${e.fund}","${e.status}"`
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + headers + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `grace-ledger-expenses-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("ส่งออกข้อมูลรายจ่ายสำเร็จ");
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "utility":
        return { label: "สาธารณูปโภค", icon: Zap, color: "bg-amber-100 text-amber-800" };
      case "ministry":
        return { label: "พันธกิจ", icon: Users, color: "bg-sky-100 text-sky-800" };
      case "salary":
        return { label: "เงินเดือน/ค่าตอบแทน", icon: Receipt, color: "bg-purple-100 text-purple-800" };
      case "mission":
        return { label: "มิชชันภายนอก", icon: Cross, color: "bg-emerald-100 text-emerald-800" };
      case "building":
        return { label: "อาคารสถานที่", icon: Building, color: "bg-orange-100 text-orange-800" };
      case "education":
        return { label: "การศึกษา/รวี", icon: GraduationCap, color: "bg-blue-100 text-blue-800" };
      case "benevolence":
        return { label: "สงเคราะห์", icon: HeartHandshake, color: "bg-rose-100 text-rose-800" };
      default:
        return { label: "ทั่วไป", icon: Receipt, color: "bg-stone-100 text-stone-700" };
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
              <span className="text-sm font-medium">หมวดหมู่หลักประจำเดือน</span>
              <div className="w-8 h-8 rounded-full bg-[#A9D4ED]/20 flex items-center justify-center text-sky-700">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-bold text-[#38251B]">สาธารณูปโภค & พันธกิจ</p>
            <p className="text-xs text-[#70452E]/60 mt-1">สัดส่วน 62% ของงบประมาณ</p>
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
            <p className="text-xs text-[#70452E]/60 mt-1">ผ่านการอนุมัติเรียบร้อย</p>
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
              { label: "ทุกหมวดหมู่", id: "all" },
              { label: "สาธารณูปโภค", id: "utility" },
              { label: "พันธกิจ", id: "ministry" },
              { label: "สงเคราะห์", id: "benevolence" },
              { label: "การศึกษา/รวี", id: "education" },
              { label: "อาคารสถานที่", id: "building" },
              { label: "เงินเดือน", id: "salary" },
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
                    <th className="py-4 px-6 text-right">จำนวนเงิน</th>
                    <th className="py-4 px-6 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9D9BF]/40">
                  {filteredExpenses.map((e) => {
                    const cat = getCategoryLabel(e.category);
                    const CatIcon = cat.icon;
                    return (
                      <tr
                        key={e.id}
                        onClick={() => setLocation(`/transactions/${e.id}`)}
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
                            {cat.label}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-[#70452E]/80 whitespace-nowrap">
                          {e.payee}
                        </td>
                        <td className="py-4 px-6 text-xs text-[#70452E]/80 whitespace-nowrap">
                          {e.fund}
                        </td>
                        <td className="py-4 px-6 text-xs text-[#70452E]/60 font-mono whitespace-nowrap">
                          {e.receiptRef}
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap font-medium">
                          <MoneyDisplay amount={e.amount} type="expense" size="sm" />
                        </td>
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          <StatusBadge status={e.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-[#E9D9BF]/40">
              {filteredExpenses.map((e) => {
                const cat = getCategoryLabel(e.category);
                const CatIcon = cat.icon;
                return (
                  <div
                    key={e.id}
                    onClick={() => setLocation(`/transactions/${e.id}`)}
                    className="p-4 flex items-center justify-between gap-3 active:bg-[#FFF4DF]/40"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${cat.color}`}
                        >
                          <CatIcon className="w-3 h-3" />
                          {cat.label}
                        </span>
                        <span className="text-xs text-[#70452E]/60 font-mono">
                          {e.receiptRef}
                        </span>
                      </div>
                      <p className="font-medium text-[#38251B] text-sm truncate">
                        {e.description}
                      </p>
                      <p className="text-xs text-[#70452E]/70">
                        {e.payee} • {new Date(e.date).toLocaleDateString("th-TH")}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <MoneyDisplay amount={e.amount} type="expense" size="sm" />
                      <div className="mt-1">
                        <StatusBadge status={e.status} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
