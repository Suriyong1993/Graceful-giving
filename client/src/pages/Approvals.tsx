import React, { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  EmptyState,
  MoneyDisplay,
  StatusBadge,
} from "@/components/common/CommonUI";
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  User,
  XCircle,
  FileText,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

export default function Approvals() {
  const [activeTab, setActiveTab] = useState<
    "pending" | "approved" | "rejected"
  >("pending");
  const [selectedReqId, setSelectedReqId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const {
    data: withdrawalsData,
    isLoading,
    refetch,
  } = trpc.withdrawals.list.useQuery(undefined, { retry: false });

  const approveMutation = trpc.withdrawals.approve.useMutation({
    onSuccess: (_data, variables) => {
      toast.success(
        variables.action === "approved"
          ? "อนุมัติคำขอเบิกจ่ายเรียบร้อยแล้ว"
          : "ปฏิเสธคำขอเบิกจ่ายเรียบร้อยแล้ว"
      );
      void refetch();
    },
    onError: error => {
      toast.error("ดำเนินการคำขอเบิกไม่สำเร็จ", { description: error.message });
    },
  });

  const requests = useMemo(
    () =>
      (withdrawalsData ?? []).map(withdrawal => ({
        id: withdrawal.id,
        purpose: withdrawal.purpose,
        amount: Number(withdrawal.amount),
        status: withdrawal.status,
        date: withdrawal.requestDate || withdrawal.createdAt,
        requester: "ไม่ระบุผู้ยื่นคำขอ",
        fund: "ไม่ระบุกองทุน",
        details: withdrawal.details || "ไม่มีรายละเอียดเพิ่มเติม",
      })),
    [withdrawalsData]
  );
  const selectedReq = requests.find(request => request.id === selectedReqId);

  const filteredRequests = useMemo(() => {
    return requests.filter(r => r.status === activeTab);
  }, [requests, activeTab]);

  const handleApprove = (id: number) => {
    if (approveMutation.isPending) return;
    if (!window.confirm("ยืนยันการอนุมัติคำขอเบิกจ่ายนี้หรือไม่")) return;
    approveMutation.mutate({ id, action: "approved", note: "" });
  };

  const handleReject = () => {
    if (approveMutation.isPending) return;
    if (!rejectReason.trim()) {
      toast.error("กรุณาระบุเหตุผลในการไม่อนุมัติ");
      return;
    }
    if (selectedReq) {
      approveMutation.mutate(
        {
          id: selectedReq.id,
          action: "rejected",
          note: rejectReason.trim(),
        },
        {
          onSuccess: () => {
            setSelectedReqId(null);
            setRejectReason("");
          },
        }
      );
    }
  };

  // Skeleton loading component
  const TableSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-[#DDE5F0] p-4 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-6 w-20 bg-[#DDE5F0]/40 rounded-full animate-pulse" />
            <div className="h-6 w-16 bg-[#DDE5F0]/40 rounded-full animate-pulse" />
            <div className="h-6 w-16 bg-[#DDE5F0]/40 rounded-full animate-pulse" />
          </div>
          <div className="h-5 w-3/4 bg-[#DDE5F0]/40 rounded-lg mb-2 animate-pulse" />
          <div className="h-4 w-1/2 bg-[#DDE5F0]/40 rounded-lg animate-pulse" />
        </div>
      ))}
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-[#EEF2F8] border border-[#DDE5F0] rounded-3xl p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1.5 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#B9E6D0] text-[#1E4470]">
              <ShieldCheck className="w-3 h-3 text-[#34D399]" />
              ระบบควบคุมภายในและการลงนามอนุมัติ
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-[#0C1B33]">
              การอนุมัติการเบิกจ่าย
            </h1>
            <p className="text-xs text-[#1E4470]/80 max-w-lg">
              ตรวจสอบคำขอเบิกงบประมาณ วัตถุประสงค์ และเอกสารประกอบ
            </p>
          </div>
        </div>

        {/* Compact Status Tabs */}
        <div
          role="tablist"
          aria-label="สถานะคำขอเบิกจ่าย"
          className="flex items-center gap-1.5 bg-[#F6F8FC] border border-[#DDE5F0] rounded-2xl p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "pending"}
            onClick={() => setActiveTab("pending")}
            className={`flex-1 px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "pending"
                ? "bg-white text-[#0C1B33] shadow-sm"
                : "text-[#1E4470]/70 hover:text-[#0C1B33] hover:bg-[#EEF2F8]"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-[#D97706]" />
            <span>รอดำเนินการ</span>
            <span className="bg-[#D97706]/10 text-[#D97706] px-1.5 py-0.5 rounded-full text-[10px]">
              {requests.filter(r => r.status === "pending").length}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "approved"}
            onClick={() => setActiveTab("approved")}
            className={`flex-1 px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "approved"
                ? "bg-white text-[#0C1B33] shadow-sm"
                : "text-[#1E4470]/70 hover:text-[#0C1B33] hover:bg-[#EEF2F8]"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>อนุมัติแล้ว</span>
            <span className="bg-emerald-600/10 text-emerald-600 px-1.5 py-0.5 rounded-full text-[10px]">
              {requests.filter(r => r.status === "approved").length}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "rejected"}
            onClick={() => setActiveTab("rejected")}
            className={`flex-1 px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "rejected"
                ? "bg-white text-[#0C1B33] shadow-sm"
                : "text-[#1E4470]/70 hover:text-[#0C1B33] hover:bg-[#EEF2F8]"
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>ไม่อนุมัติ</span>
            <span className="bg-rose-600/10 text-rose-600 px-1.5 py-0.5 rounded-full text-[10px]">
              {requests.filter(r => r.status === "rejected").length}
            </span>
          </button>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <TableSkeleton />
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            title="ไม่มีคำขอในหมวดหมู่นี้"
            description="คำขอเบิกจ่ายทั้งหมดได้รับการตรวจสอบและดำเนินการเรียบร้อยแล้ว"
          />
        ) : (
          <>
            {/* Desktop: Compact Table */}
            <div className="hidden lg:block bg-white rounded-2xl border border-[#DDE5F0] shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F6F8FC] border-b border-[#DDE5F0]">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#1E4470]">
                      คำขอ
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#1E4470]">
                      ผู้ขอ
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#1E4470]">
                      วันที่
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#1E4470]">
                      ยอดเงิน
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#1E4470]">
                      สถานะ
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[#1E4470]">
                      การดำเนินการ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map(req => (
                    <tr
                      key={req.id}
                      className="border-b border-[#DDE5F0]/50 hover:bg-[#F6F8FC]/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-[#1E4470]/60 bg-[#F6F8FC] px-1.5 py-0.5 rounded border border-[#DDE5F0]/60">
                              REQ-{req.id}
                            </span>
                            <span className="text-[10px] font-medium text-[#1E4470] bg-[#EEF2F8] px-1.5 py-0.5 rounded border border-[#DDE5F0]/60">
                              {req.fund}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-[#0C1B33] line-clamp-1">
                            {req.purpose}
                          </p>
                          <p className="text-[10px] text-[#1E4470]/70 line-clamp-1">
                            {req.details}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-[#1E4470]">
                          <User className="w-3 h-3 text-[#D97706]" />
                          <span className="line-clamp-1">{req.requester}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-[#1E4470]">
                          <Calendar className="w-3 h-3 text-[#64748B]" />
                          <span>
                            {new Date(req.date).toLocaleDateString("th-TH", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <MoneyDisplay
                          amount={req.amount}
                          type="expense"
                          size="sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={
                            req.status === "pending"
                              ? "pending"
                              : req.status === "approved"
                                ? "completed"
                                : "failed"
                          }
                        />
                      </td>
                      <td className="px-4 py-3">
                        {req.status === "pending" && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedReqId(req.id);
                                setRejectReason("");
                              }}
                              disabled={approveMutation.isPending}
                              className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold transition-colors min-w-[60px] disabled:opacity-50"
                              aria-label="ไม่อนุมัติ"
                            >
                              ไม่อนุมัติ
                            </button>
                            <button
                              onClick={() => handleApprove(req.id)}
                              disabled={approveMutation.isPending}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors shadow-sm min-w-[60px] disabled:opacity-50"
                              aria-label="อนุมัติ"
                            >
                              อนุมัติ
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: Card Layout */}
            <div className="lg:hidden space-y-3">
              {filteredRequests.map(req => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-[#DDE5F0] p-4 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-mono text-[#1E4470]/60 bg-[#F6F8FC] px-1.5 py-0.5 rounded border border-[#DDE5F0]/60">
                          REQ-{req.id}
                        </span>
                        <StatusBadge
                          status={
                            req.status === "pending"
                              ? "pending"
                              : req.status === "approved"
                                ? "completed"
                                : "failed"
                          }
                        />
                      </div>
                      <h3 className="text-sm font-bold text-[#0C1B33] mb-1 line-clamp-1">
                        {req.purpose}
                      </h3>
                      <p className="text-[11px] text-[#1E4470]/70 line-clamp-2">
                        {req.details}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <MoneyDisplay
                        amount={req.amount}
                        type="expense"
                        size="sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-[#1E4470]/70 mb-3 pb-3 border-b border-[#DDE5F0]/40">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-[#D97706]" />
                      {req.requester}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#64748B]" />
                      {new Date(req.date).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>

                  {req.status === "pending" && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setSelectedReqId(req.id);
                          setRejectReason("");
                        }}
                        disabled={approveMutation.isPending}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors disabled:opacity-50"
                        aria-label="ไม่อนุมัติ"
                      >
                        ไม่อนุมัติ
                      </button>
                      <button
                        onClick={() => handleApprove(req.id)}
                        disabled={approveMutation.isPending}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
                        aria-label="อนุมัติ"
                      >
                        อนุมัติ
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Reject Reason Dialog */}
        <Dialog
          open={selectedReq !== undefined}
          onOpenChange={open => {
            if (!open && !approveMutation.isPending) {
              setSelectedReqId(null);
              setRejectReason("");
            }
          }}
        >
          <DialogContent
            className="bg-white rounded-3xl border-[#DDE5F0] p-5"
            onEscapeKeyDown={event => {
              if (approveMutation.isPending) event.preventDefault();
            }}
          >
            <DialogHeader>
              <DialogTitle className="text-base text-[#0C1B33]">
                ระบุเหตุผลที่ไม่อนุมัติ
              </DialogTitle>
              <DialogDescription className="text-xs text-[#1E4470]/80">
                เหตุผลนี้จะถูกบันทึกพร้อมผลการปฏิเสธคำขอ
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 text-xs">
              <label
                htmlFor="rejection-reason"
                className="font-semibold text-[#0C1B33]"
              >
                เหตุผลที่ไม่อนุมัติ
              </label>
              <textarea
                id="rejection-reason"
                rows={3}
                required
                autoFocus
                disabled={approveMutation.isPending}
                placeholder="ระบุข้อมูลที่ต้องแก้ไขหรือเหตุผล..."
                value={rejectReason}
                onChange={event => setRejectReason(event.target.value)}
                className="w-full p-3 rounded-2xl border border-[#DDE5F0] text-xs text-[#0C1B33] focus:outline-none focus:border-rose-400 disabled:opacity-60"
              />
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setSelectedReqId(null)}
                disabled={approveMutation.isPending}
                className="px-4 py-2 rounded-xl border border-[#DDE5F0] text-xs font-medium text-[#1E4470] disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={approveMutation.isPending}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-50"
              >
                {approveMutation.isPending
                  ? "กำลังบันทึก..."
                  : "ยืนยันไม่อนุมัติ"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
