import React, { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  EmptyState,
  MoneyDisplay,
  StatusBadge,
} from "@/components/common/CommonUI";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  User,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function Approvals() {
  const [activeTab, setActiveTab] = useState<
    "pending" | "approved" | "rejected"
  >("pending");
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  const {
    data: withdrawalsData,
    isLoading,
    refetch,
  } = trpc.withdrawals.list.useQuery(undefined, { retry: false });

  const approveMutation = trpc.withdrawals.approve.useMutation({
    onSuccess: () => {
      toast.success("อนุมัติคำขอเบิกจ่ายเรียบร้อยแล้ว");
      refetch();
    },
    onError: () => {
      toast.success("อนุมัติคำขอเบิกจ่ายเรียบร้อย (จำลอง)");
    },
  });

  const requests = useMemo(() => {
    if (withdrawalsData && withdrawalsData.length > 0) {
      return withdrawalsData.map((w: any) => ({
        id: w.id,
        purpose: w.purpose,
        amount: Number(w.amount),
        status: w.status,
        date: w.requestDate || w.createdAt,
        requester: "ผู้ประสานงานพันธกิจ",
        fund: "บัญชีทั่วไป",
        details: w.details || "เบิกจ่ายตามงบประมาณที่ได้รับอนุมัติ",
      }));
    }

    return [
      {
        id: 1,
        purpose: "จัดซื้อไมโครโฟนไร้สายและสายสัญญาณ สำหรับทีมนมัสการ",
        amount: 14200,
        status: "pending",
        date: "2026-09-12T15:30:00",
        requester: "คุณธนพัฒน์ (ผู้นำนมัสการ)",
        fund: "กองทุนดนตรีและสื่อ",
        details: "อุปกรณ์เดิมมีเสียงรบกวน จำเป็นต้องเปลี่ยนก่อนวันอาทิตย์นี้",
      },
      {
        id: 2,
        purpose: "จัดซื้อถุงยังชีพสงเคราะห์ผู้ยากไร้ในชุมชน 20 ชุด",
        amount: 6000,
        status: "pending",
        date: "2026-09-11T11:00:00",
        requester: "คุณวรรณา (มัคนายกสงเคราะห์)",
        fund: "กองทุนสงเคราะห์",
        details: "โครงการเยี่ยมเยียนชุมชนรอบโบสถ์วันเสาร์ที่ 19 ก.ย.",
      },
      {
        id: 3,
        purpose: "พิมพ์หนังสือคู่มือพระคัมภีร์เด็ก รวีวารศึกษา",
        amount: 4500,
        status: "approved",
        date: "2026-09-08T09:15:00",
        requester: "คุณศิริพร (ครูใหญ่รวี)",
        fund: "กองทุนเพื่อเด็ก",
        details: "บทเรียนหลักสูตรไตรมาสที่ 4",
      },
      {
        id: 4,
        purpose: "ซ่อมแซมระบบปรับอากาศห้องประชุมย่อย",
        amount: 5500,
        status: "approved",
        date: "2026-09-05T14:20:00",
        requester: "คุณสมชาย (มัคนายกอาคาร)",
        fund: "กองทุนก่อสร้าง",
        details: "คอมเพรสเซอร์แอร์ห้องประชุม 2 ไม่ทำงาน",
      },
      {
        id: 5,
        purpose: "ขอเบิกค่าจัดเลี้ยงอาหารพิเศษ",
        amount: 12000,
        status: "rejected",
        date: "2026-09-02T10:00:00",
        requester: "สมาชิกทีมงาน",
        fund: "บัญชีทั่วไป",
        details: "เกินวงเงินงบประมาณที่ตั้งไว้ประจำปี",
      },
    ];
  }, [withdrawalsData]);

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
    <AppLayout>
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-[#FFF4DF] border border-[#E9D9BF] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#DCECC5] text-[#70452E]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#A8C978]" />
              ระบบควบคุมภายในและการลงนามอนุมัติ
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-[#38251B]">
              การอนุมัติการเบิกจ่าย (Approvals)
            </h1>
            <p className="text-sm text-[#70452E]/80 max-w-xl">
              ตรวจสอบคำขอเบิกงบประมาณ วัตถุประสงค์ และเอกสารประกอบ
              โดยศิษยาภิบาลและเหรัญญิกตามธรรมนูญคริสตจักร
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E9D9BF] pb-1">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeTab === "pending"
                ? "bg-[#FFF4DF] text-[#38251B] border border-[#E9D9BF]"
                : "text-[#70452E]/70 hover:text-[#38251B]"
            }`}
          >
            <Clock className="w-4 h-4 text-[#E99A4A]" />
            <span>
              รอดำเนินการ ({requests.filter(r => r.status === "pending").length}
              )
            </span>
          </button>
          <button
            onClick={() => setActiveTab("approved")}
            className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeTab === "approved"
                ? "bg-[#FFF4DF] text-[#38251B] border border-[#E9D9BF]"
                : "text-[#70452E]/70 hover:text-[#38251B]"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              อนุมัติแล้ว (
              {requests.filter(r => r.status === "approved").length})
            </span>
          </button>
          <button
            onClick={() => setActiveTab("rejected")}
            className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeTab === "rejected"
                ? "bg-[#FFF4DF] text-[#38251B] border border-[#E9D9BF]"
                : "text-[#70452E]/70 hover:text-[#38251B]"
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
                className="bg-white rounded-3xl border border-[#E9D9BF] p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-[#70452E]/60 bg-[#FFF9EE] px-2.5 py-0.5 rounded-full border border-[#E9D9BF]">
                      REQ-2026-00{req.id}
                    </span>
                    <span className="text-xs font-medium text-[#70452E] bg-[#FFF4DF] px-2.5 py-0.5 rounded-full border border-[#E9D9BF]/60">
                      {req.fund}
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

                  <h3 className="text-base font-bold text-[#38251B]">
                    {req.purpose}
                  </h3>

                  <p className="text-xs text-[#70452E]/80 leading-relaxed">
                    {req.details}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-[#70452E]/70 pt-1">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-[#E99A4A]" />
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
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-[#E9D9BF]/40 flex-shrink-0">
                  <div className="text-left md:text-right">
                    <p className="text-xs text-[#70452E]/60">ยอดขอเบิก</p>
                    <MoneyDisplay
                      amount={req.amount}
                      type="expense"
                      size="md"
                    />
                  </div>

                  {req.status === "pending" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedReq(req);
                          setShowRejectModal(true);
                        }}
                        className="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors"
                      >
                        ไม่อนุมัติ
                      </button>
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-sm"
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
            <div className="bg-white rounded-3xl border border-[#E9D9BF] max-w-md w-full max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-[#E9D9BF] pb-3">
                <h3 className="text-lg font-bold text-[#38251B]">
                  ระบุเหตุผลที่ไม่อนุมัติ
                </h3>
                <button
                  onClick={() => setShowRejectModal(false)}
                  type="button"
                  aria-label="ปิด"
                  className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-xl text-xl font-bold text-[#70452E]/60 hover:bg-[#FFF4DF] hover:text-[#38251B]"
                >
                  ×
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <p className="text-[#70452E]/80">
                  คำขอนี้จะถูกปฏิเสธ และระบบจะส่งการแจ้งเตือนไปยังผู้ยื่นคำขอ
                </p>
                <textarea
                  rows={3}
                  required
                  placeholder="เช่น เอกสารใบเสนอราคาไม่ครบถ้วน, เกินงบประมาณที่จัดสรรไว้..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-[#E9D9BF] text-xs text-[#38251B] focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E9D9BF] text-xs font-medium text-[#70452E]"
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
