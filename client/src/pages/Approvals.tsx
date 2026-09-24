import React, { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc, type RouterOutputs } from "@/lib/trpc";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  EmptyState,
  MoneyDisplay,
  StatusBadge,
} from "@/components/common/CommonUI";
import { Banknote, CheckCircle2, Clock, User, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Swal } from "@/lib/sweetalert";
import { useAuth } from "@/_core/hooks/useAuth";
import { canManageFinance } from "@shared/roles";
import { NativeSelect } from "@/components/ui/native-select";

type WithdrawalItem = RouterOutputs["withdrawals"]["list"][number];

export interface ApprovalRequest {
  id: number;
  purpose: string;
  amount: number;
  status: string;
  date: string | Date;
  requester: string;
  requestedBy: number;
  fund: string;
  fundId: number | null;
  details: string;
  approvedBy: number | null;
  requiredApprovals: number | null;
}

export default function Approvals() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<
    "pending" | "approved" | "disbursed" | "rejected"
  >("pending");
  const { user } = useAuth();
  const canPay = canManageFinance(user);
  // Same roles the server accepts in withdrawals.approve.
  const canApprove =
    user?.role === "admin" ||
    user?.churchRole === "SUPER_ADMIN" ||
    user?.churchRole === "TREASURER";
  const fundsQuery = trpc.finance.accounts.useQuery(undefined, {
    retry: false,
  });
  const [selectedReq, setSelectedReq] = useState<ApprovalRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  const {
    data: withdrawalsData,
    isLoading,
    refetch,
  } = trpc.withdrawals.list.useQuery(undefined, { retry: false });

  const approveMutation = trpc.withdrawals.approve.useMutation({
    onSuccess: result => {
      toast.success(
        result.status === "approved"
          ? "อนุมัติคำขอเบิกจ่ายแล้ว"
          : result.status === "rejected"
            ? "ปฏิเสธคำขอเบิกจ่ายแล้ว"
            : "บันทึกการอนุมัติคนแรกแล้ว รอผู้อนุมัติคนที่สอง"
      );
      refetch();
    },
    onError: error => {
      toast.error("ดำเนินการคำขอเบิกไม่สำเร็จ", { description: error.message });
    },
  });

  const disburseMutation = trpc.withdrawals.disburse.useMutation({
    onSuccess: () => {
      toast.success("จ่ายเงินและบันทึกรายจ่ายแล้ว");
      refetch();
    },
    onError: error => {
      toast.error("จ่ายเงินไม่สำเร็จ", { description: error.message });
    },
  });

  // Older requests were saved without a fund; the payer names it here.
  const [payFund, setPayFund] = useState<Record<number, number>>({});

  const handleDisburse = async (req: ApprovalRequest) => {
    const fundId = req.fundId ?? payFund[req.id];
    if (!fundId) {
      toast.error("เลือกกองทุนที่จะจ่ายก่อน");
      return;
    }
    const fundName =
      (fundsQuery.data ?? []).find(f => f.id === fundId)?.name ?? req.fund;
    const confirmed = await Swal.confirm(
      "ยืนยันการจ่ายเงิน",
      `ระบบจะบันทึกรายจ่าย ${req.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท จาก${fundName} และหักยอดกองทุนทันที ทำซ้ำไม่ได้`
    );
    if (confirmed)
      disburseMutation.mutate(
        req.fundId ? { id: req.id } : { id: req.id, fundId }
      );
  };

  const requests = useMemo(() => {
    if (withdrawalsData && withdrawalsData.length > 0) {
      return withdrawalsData.map(
        (w: WithdrawalItem): ApprovalRequest => ({
          id: w.id,
          purpose: w.purpose,
          amount: Number(w.amount),
          status: w.status,
          date: w.requestDate || w.createdAt,
          requester: w.requesterName ?? `ผู้ใช้ #${w.requestedBy}`,
          requestedBy: w.requestedBy,
          approvedBy: w.approvedBy,
          requiredApprovals: w.requiredApprovals,
          fund:
            (fundsQuery.data ?? []).find(f => f.id === w.fundId)?.name ??
            "ไม่ระบุกองทุน",
          fundId: w.fundId,
          details: w.details || "",
        })
      );
    }

    return [];
  }, [withdrawalsData, fundsQuery.data]);

  const filteredRequests = useMemo(() => {
    return requests.filter(r => r.status === activeTab);
  }, [requests, activeTab]);

  const handleApprove = (id: number) => {
    approveMutation.mutate({ id, action: "approved" });
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error("กรุณาระบุเหตุผลในการไม่อนุมัติ");
      return;
    }
    if (selectedReq) {
      approveMutation.mutate({
        id: selectedReq.id,
        action: "rejected",
        note: rejectReason.trim(),
      });
    }
    setShowRejectModal(false);
    setRejectReason("");
  };

  return (
    <AppLayout
      title="การอนุมัติเบิกจ่าย"
      subtitle="ตรวจสอบคำขอเบิกเงิน วัตถุประสงค์ และเอกสารประกอบก่อนอนุมัติ"
      action={
        <button
          onClick={() => setLocation("/withdrawals/new")}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#B9530F] px-4 text-sm font-semibold text-white hover:bg-[#A34A0C]"
        >
          <Banknote className="size-4" />
          ยื่นคำขอเบิกเงิน
        </button>
      }
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-1 no-scrollbar">
          <button
            onClick={() => setActiveTab("pending")}
            className={`min-h-11 shrink-0 whitespace-nowrap px-4 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === "pending"
                ? "bg-[#F4F1ED] text-foreground border border-[#E4DED7]"
                : "text-[#736A63] hover:text-foreground"
            }`}
          >
            <Clock className="w-4 h-4 text-primary" />
            <span>
              รอดำเนินการ ({requests.filter(r => r.status === "pending").length}
              )
            </span>
          </button>
          <button
            onClick={() => setActiveTab("approved")}
            className={`min-h-11 shrink-0 whitespace-nowrap px-4 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === "approved"
                ? "bg-[#F4F1ED] text-foreground border border-[#E4DED7]"
                : "text-[#736A63] hover:text-foreground"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              อนุมัติแล้ว (
              {requests.filter(r => r.status === "approved").length})
            </span>
          </button>
          <button
            onClick={() => setActiveTab("disbursed")}
            className={`min-h-11 shrink-0 whitespace-nowrap px-4 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === "disbursed"
                ? "bg-[#F4F1ED] text-foreground border border-[#E4DED7]"
                : "text-[#736A63] hover:text-foreground"
            }`}
          >
            <span>
              จ่ายแล้ว ({requests.filter(r => r.status === "disbursed").length})
            </span>
          </button>
          <button
            onClick={() => setActiveTab("rejected")}
            className={`min-h-11 shrink-0 whitespace-nowrap px-4 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === "rejected"
                ? "bg-[#F4F1ED] text-foreground border border-[#E4DED7]"
                : "text-[#736A63] hover:text-foreground"
            }`}
          >
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>
              ไม่อนุมัติ ({requests.filter(r => r.status === "rejected").length}
              )
            </span>
          </button>
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <EmptyState
            title="ไม่มีคำขอในหมวดหมู่นี้"
            description="คำขอเบิกจ่ายทั้งหมดได้รับการตรวจสอบและดำเนินการเรียบร้อยแล้ว"
          />
        ) : (
          <div className="space-y-4">
            {filteredRequests.map(req => (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-[#E4DED7] p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-[#736A63] bg-background px-2.5 py-0.5 rounded-full border border-[#E4DED7]">
                      REQ-2026-00{req.id}
                    </span>
                    <span className="text-xs font-medium text-[#57504A] bg-[#F4F1ED] px-2.5 py-0.5 rounded-full border border-[#E4DED7]/60">
                      {req.fund}
                    </span>
                    <StatusBadge
                      status={
                        req.status === "pending"
                          ? "pending"
                          : req.status === "approved"
                            ? "approved"
                            : req.status === "disbursed"
                              ? "posted"
                              : "rejected"
                      }
                      label={
                        req.status === "disbursed" ? "จ่ายเงินแล้ว" : undefined
                      }
                    />
                  </div>

                  <h3 className="text-base font-bold text-foreground">
                    {req.purpose}
                  </h3>

                  {req.details && (
                    <p className="text-xs text-[#736A63] leading-relaxed">
                      {req.details}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-[#736A63] pt-1">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-primary" />
                      {req.requester}
                    </span>
                    <span>•</span>
                    <span>
                      ยื่นคำขอเมื่อ{" "}
                      {new Date(req.date).toLocaleDateString("th-TH")}
                    </span>
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-[#E4DED7]/40 flex-shrink-0">
                  <div className="text-left md:text-right">
                    <p className="text-xs text-[#736A63]">ยอดขอเบิก</p>
                    <MoneyDisplay
                      amount={req.amount}
                      type="expense"
                      size="md"
                    />
                  </div>

                  {req.status === "approved" && canPay && !req.fundId && (
                    <NativeSelect
                      aria-label="กองทุนที่จะจ่าย"
                      value={payFund[req.id] ?? ""}
                      onChange={e =>
                        setPayFund(prev => ({
                          ...prev,
                          [req.id]: Number(e.target.value),
                        }))
                      }
                    >
                      <option value="" disabled>
                        เลือกกองทุนที่จะจ่าย
                      </option>
                      {(fundsQuery.data ?? []).map(f => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </NativeSelect>
                  )}

                  {req.status === "approved" && canPay && (
                    <button
                      onClick={() => handleDisburse(req)}
                      disabled={disburseMutation.isPending}
                      className="min-h-11 px-5 py-2 rounded-xl bg-[#B9530F] hover:bg-[#A34A0C] text-white text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      {disburseMutation.isPending
                        ? "กำลังบันทึก…"
                        : "จ่ายเงินและบันทึกรายจ่าย"}
                    </button>
                  )}

                  {req.status === "pending" &&
                    req.approvedBy !== null &&
                    req.requiredApprovals === 2 && (
                      <p className="text-xs font-semibold text-amber-600">
                        อนุมัติแล้ว 1 จาก 2 คน รอผู้อนุมัติคนที่สอง
                      </p>
                    )}

                  {req.status === "pending" && user?.id === req.requestedBy && (
                    <p className="text-xs text-[#736A63]">
                      คำขอของคุณ ต้องให้ผู้อื่นอนุมัติ
                    </p>
                  )}

                  {req.status === "pending" &&
                    canApprove &&
                    user?.id !== req.requestedBy &&
                    user?.id !== req.approvedBy && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedReq(req);
                            setShowRejectModal(true);
                          }}
                          className="min-h-11 px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors"
                        >
                          ไม่อนุมัติ
                        </button>
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="min-h-11 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-sm"
                        >
                          อนุมัติคำขอ
                        </button>
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reject Reason Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-[#E4DED7] max-w-md w-full max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-[#E4DED7] pb-3">
                <h3 className="text-lg font-bold text-foreground">
                  ระบุเหตุผลที่ไม่อนุมัติ
                </h3>
                <button
                  onClick={() => setShowRejectModal(false)}
                  type="button"
                  aria-label="ปิด"
                  className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-xl text-xl font-bold text-[#736A63] hover:bg-[#F4F1ED] hover:text-foreground"
                >
                  ×
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <p className="text-[#736A63]">
                  คำขอนี้จะถูกปฏิเสธ และระบบจะส่งการแจ้งเตือนไปยังผู้ยื่นคำขอ
                </p>
                <textarea
                  rows={3}
                  required
                  placeholder="เช่น เอกสารใบเสนอราคาไม่ครบถ้วน, เกินงบประมาณที่จัดสรรไว้..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-[#E4DED7] text-xs text-foreground focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E4DED7] text-xs font-medium text-[#57504A]"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleReject}
                  className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
                >
                  ยืนยันไม่อนุมัติ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
