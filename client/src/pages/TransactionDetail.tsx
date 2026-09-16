import React, { useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  EmptyState,
  LoadingSkeleton,
  MoneyDisplay,
  StatusBadge,
} from "@/components/common/CommonUI";
import { ArrowLeft, Calendar, CreditCard, Landmark, User } from "lucide-react";

export default function TransactionDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/transactions/:id");
  const txId = params?.id;
  const isOffering = txId?.startsWith("offering-") ?? false;
  const isExpense = txId?.startsWith("expense-") ?? false;
  const recordId = Number(txId?.split("-")[1]);
  const hasValidId = Number.isInteger(recordId) && recordId > 0;
  const offeringQuery = trpc.offerings.getById.useQuery(
    { id: recordId },
    { enabled: isOffering && hasValidId, retry: false }
  );
  const expenseQuery = trpc.expenses.getById.useQuery(
    { id: recordId },
    { enabled: isExpense && hasValidId, retry: false }
  );

  const transaction = useMemo(() => {
    if (isOffering) {
      const item = offeringQuery.data;
      if (!item) return null;
      return {
        id: txId,
        refCode: `OFF-${item.id}`,
        title:
          item.category === "tithe"
            ? "ถวายสิบลด"
            : item.category === "mission"
              ? "ถวายพันธกิจ"
              : "ถวายทั่วไป",
        amount: item.amount,
        type: "income" as const,
        date: item.receiptDate,
        category: item.category,
        fund: item.fundId ? `กองทุน #${item.fundId}` : "ไม่ระบุกองทุน",
        paymentMethod: item.method,
        donorOrPayee: item.donorName || "ผู้ถวายนิรนาม",
        status: "approved",
        notes: item.notes,
      };
    }
    if (isExpense) {
      const item = expenseQuery.data;
      if (!item) return null;
      return {
        id: txId,
        refCode: `EXP-${item.id}`,
        title: item.description,
        amount: item.amount,
        type: "expense" as const,
        date: item.expenseDate,
        category: item.category,
        fund: item.fundId ? `กองทุน #${item.fundId}` : "ไม่ระบุกองทุน",
        paymentMethod: "ไม่ระบุ",
        donorOrPayee: item.payee || "ไม่ระบุผู้รับเงิน",
        status: item.status,
        notes: null,
      };
    }
    return null;
  }, [expenseQuery.data, isExpense, isOffering, offeringQuery.data]);

  const loading = offeringQuery.isLoading || expenseQuery.isLoading;
  return (
    <AppLayout
      activeRoute="/transactions"
      title="รายละเอียดรายการ"
      subtitle={
        transaction
          ? `เลขอ้างอิง: ${transaction.refCode}`
          : "ตรวจสอบข้อมูลจากระบบ"
      }
      action={
        <button
          onClick={() => setLocation("/transactions")}
          className="min-h-11 px-3.5 py-2 rounded-2xl bg-[#FFF4DF] text-[#70452E] text-xs font-bold border border-[#E9D9BF] flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับหน้ารายการ</span>
        </button>
      }
    >
      {loading ? (
        <LoadingSkeleton count={3} />
      ) : !transaction ? (
        <EmptyState
          title="ไม่พบรายการธุรกรรม"
          description="รายการนี้ไม่มีอยู่ในข้อมูลที่คุณมีสิทธิ์เข้าถึง หรืออาจถูกลบไปแล้ว"
          actionText="กลับหน้ารายการ"
          onAction={() => setLocation("/transactions")}
        />
      ) : (
        <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-[#E9D9BF] clay-card-shadow space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E9D9BF]/60">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#927D6D]">
                  {transaction.type === "income" ? "รายรับ (ถวาย)" : "รายจ่าย"}
                </span>
                <StatusBadge status={transaction.status} />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#38251B]">
                {transaction.title}
              </h2>
              <p className="text-xs text-[#927D6D] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#E99A4A]" />
                {new Date(transaction.date).toLocaleString("th-TH")}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs text-[#927D6D] block">
                จำนวนเงินสุทธิ
              </span>
              <MoneyDisplay
                amount={transaction.amount}
                type={transaction.type}
                size="xl"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Detail
              label="กองทุนบัญชี"
              value={transaction.fund}
              icon={<Landmark className="w-4 h-4 text-[#E99A4A]" />}
            />
            <Detail label="หมวดหมู่" value={transaction.category} />
            <Detail
              label="ช่องทางการเงิน"
              value={transaction.paymentMethod}
              icon={<CreditCard className="w-4 h-4 text-[#A8C978]" />}
            />
            <Detail
              label={
                transaction.type === "income"
                  ? "ผู้ถวาย"
                  : "ผู้รับเงิน / ร้านค้า"
              }
              value={transaction.donorOrPayee}
              icon={<User className="w-4 h-4 text-[#85C1E9]" />}
            />
            <Detail label="เลขอ้างอิง" value={transaction.refCode} />
          </div>
          {transaction.notes && (
            <div className="rounded-2xl bg-[#FFFDF8] border border-[#E9D9BF]/70 p-4">
              <p className="text-xs text-[#927D6D]">หมายเหตุ</p>
              <p className="text-sm text-[#38251B] mt-1">{transaction.notes}</p>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}

function Detail({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-[#FFFDF8] p-4 rounded-2xl border border-[#E9D9BF]/70 space-y-1">
      <span className="text-xs text-[#927D6D] block">{label}</span>
      <span className="text-sm font-bold text-[#70452E] flex items-center gap-1.5">
        {icon}
        {value}
      </span>
    </div>
  );
}
