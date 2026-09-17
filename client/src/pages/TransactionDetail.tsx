import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  EmptyState,
  LoadingSkeleton,
  MoneyDisplay,
  StatusBadge,
} from "@/components/common/CommonUI";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Landmark,
  Pencil,
  Ban,
  User,
} from "lucide-react";
import { toast } from "sonner";
import {
  confirmDiscardChanges,
  useUnsavedChanges,
} from "@/hooks/useUnsavedChanges";

export default function TransactionDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/transactions/:id");
  const txId = params?.id;
  const isOffering = txId?.startsWith("offering-") ?? false;
  const isExpense = txId?.startsWith("expense-") ?? false;
  const recordId = Number(txId?.split("-")[1]);
  const hasValidId = Number.isInteger(recordId) && recordId > 0;
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState("");
  const [editText, setEditText] = useState("");
  const [baselineAmount, setBaselineAmount] = useState("");
  const [baselineText, setBaselineText] = useState("");
  const utils = trpc.useUtils();
  const deleteOffering = trpc.offerings.delete.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.offerings.list.invalidate(),
        utils.finance.summary.invalidate(),
        utils.finance.monthlyStats.invalidate(),
      ]);
      toast.success("ยกเลิกรายการถวายเรียบร้อยแล้ว");
      setLocation("/transactions");
    },
    onError: error => toast.error(error.message || "ยกเลิกรายการถวายไม่สำเร็จ"),
  });
  const deleteExpense = trpc.expenses.delete.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.expenses.list.invalidate(),
        utils.finance.summary.invalidate(),
        utils.finance.monthlyStats.invalidate(),
      ]);
      toast.success("ยกเลิกรายการรายจ่ายเรียบร้อยแล้ว");
      setLocation("/transactions");
    },
    onError: error =>
      toast.error(error.message || "ยกเลิกรายการรายจ่ายไม่สำเร็จ"),
  });
  const updateOffering = trpc.offerings.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.offerings.getById.invalidate({ id: recordId }),
        utils.offerings.list.invalidate(),
        utils.finance.summary.invalidate(),
        utils.finance.monthlyStats.invalidate(),
      ]);
      setIsEditing(false);
      toast.success("แก้ไขรายการถวายเรียบร้อยแล้ว");
    },
    onError: error => toast.error(error.message || "แก้ไขรายการถวายไม่สำเร็จ"),
  });
  const updateExpense = trpc.expenses.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.expenses.getById.invalidate({ id: recordId }),
        utils.expenses.list.invalidate(),
        utils.finance.summary.invalidate(),
        utils.finance.monthlyStats.invalidate(),
      ]);
      setIsEditing(false);
      toast.success("แก้ไขรายการรายจ่ายเรียบร้อยแล้ว");
    },
    onError: error =>
      toast.error(error.message || "แก้ไขรายการรายจ่ายไม่สำเร็จ"),
  });
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
  useEffect(() => {
    if (transaction) {
      const amount = String(transaction.amount);
      const text =
        transaction.type === "income"
          ? transaction.notes || ""
          : transaction.title;
      setEditAmount(amount);
      setEditText(text);
      setBaselineAmount(amount);
      setBaselineText(text);
    }
  }, [transaction]);
  const isDirty =
    isEditing && (editAmount !== baselineAmount || editText !== baselineText);
  useUnsavedChanges(isDirty);
  const submitEdit = (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(editAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("กรุณาระบุจำนวนเงินที่ถูกต้อง");
      return;
    }
    if (isOffering)
      updateOffering.mutate({
        id: recordId,
        amount,
        notes: editText.trim() || null,
      });
    if (isExpense)
      updateExpense.mutate({
        id: recordId,
        amount,
        description: editText.trim() || undefined,
      });
  };
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
        <div className="flex items-center gap-2">
          {transaction && (
            <button
              onClick={() => {
                if (isEditing && !confirmDiscardChanges(isDirty)) return;
                setIsEditing(value => !value);
              }}
              className="min-h-11 px-3.5 py-2 rounded-2xl bg-[#EAF5E4] text-[#4F8B33] text-xs font-bold border border-[#A8C978] flex items-center gap-1.5"
            >
              <Pencil className="w-4 h-4" />
              <span>{isEditing ? "ยกเลิก" : "แก้ไข"}</span>
            </button>
          )}
          {transaction && (
            <button
              onClick={() => {
                if (
                  !window.confirm(
                    "ต้องการยกเลิกรายการนี้หรือไม่? ข้อมูลจะไม่ถูกลบถาวร แต่ยอดกองทุนจะถูกปรับกลับ"
                  )
                )
                  return;
                if (isOffering) deleteOffering.mutate({ id: recordId });
                if (isExpense) deleteExpense.mutate({ id: recordId });
              }}
              disabled={deleteOffering.isPending || deleteExpense.isPending}
              className="min-h-11 px-3.5 py-2 rounded-2xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Ban className="w-4 h-4" />
              <span>ยกเลิกรายการ</span>
            </button>
          )}
          <button
            onClick={() => {
              if (confirmDiscardChanges(isDirty)) setLocation("/transactions");
            }}
            className="min-h-11 px-3.5 py-2 rounded-2xl bg-[#FFF4DF] text-[#70452E] text-xs font-bold border border-[#E9D9BF] flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้ารายการ</span>
          </button>
        </div>
      }
    >
      {loading ? (
        <LoadingSkeleton count={3} />
      ) : !transaction ? (
        <EmptyState
          title="ไม่พบรายการธุรกรรม"
          description="รายการนี้ไม่มีอยู่ในข้อมูลที่คุณมีสิทธิ์เข้าถึง หรืออาจถูกยกเลิกไปแล้ว"
          actionText="กลับหน้ารายการ"
          onAction={() => setLocation("/transactions")}
        />
      ) : (
        <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-[#E9D9BF] clay-card-shadow space-y-6">
          {isEditing && (
            <form
              onSubmit={submitEdit}
              className="rounded-2xl bg-[#FFF9EE] border border-[#E9D9BF] p-4 space-y-3"
            >
              <p className="text-sm font-bold text-[#38251B]">
                แก้ไขข้อมูลรายการ
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-[#70452E]">
                  จำนวนเงิน
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={editAmount}
                    onChange={event => setEditAmount(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#E9D9BF] p-3 text-sm"
                  />
                </label>
                <label className="text-xs font-semibold text-[#70452E]">
                  {isOffering ? "หมายเหตุ" : "รายละเอียดรายการ"}
                  <input
                    value={editText}
                    onChange={event => setEditText(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#E9D9BF] p-3 text-sm"
                  />
                </label>
              </div>
              <button
                disabled={updateOffering.isPending || updateExpense.isPending}
                className="rounded-xl bg-[#4F8B33] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                บันทึกการแก้ไข
              </button>
            </form>
          )}
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
