import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Swal } from "@/lib/sweetalert";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Inbox,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  UserCheck,
  Building,
  Calendar,
  CreditCard,
  Copy,
  RefreshCw,
  Search,
  Check,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Link2,
  UploadCloud,
  QrCode,
  ArrowRight,
  BookOpen,
  Image as ImageIcon,
  HelpCircle,
  X,
  Zap,
} from "lucide-react";
import { OFFERING_CATEGORIES, type OfferingCategory } from "@shared/categories";

type InboxStatus =
  | "all"
  | "needs_review"
  | "matched"
  | "extracted"
  | "pending"
  | "duplicate"
  | "approved"
  | "rejected"
  | "failed";

const STATUS_LABELS: Record<string, { text: string; bg: string; textCol: string; border: string }> = {
  pending: { text: "รอดึงข้อมูล", bg: "bg-stone-100", textCol: "text-stone-700", border: "border-stone-300" },
  processing: { text: "กำลังอ่านสลิป", bg: "bg-amber-50", textCol: "text-amber-700", border: "border-amber-200" },
  extracted: { text: "อ่านข้อมูลแล้ว", bg: "bg-blue-50", textCol: "text-blue-700", border: "border-blue-200" },
  needs_review: { text: "ต้องตรวจสอบ", bg: "bg-amber-500/10", textCol: "text-amber-700", border: "border-amber-400" },
  matched: { text: "พร้อมอนุมัติ", bg: "bg-emerald-500/10", textCol: "text-emerald-700", border: "border-emerald-400" },
  duplicate: { text: "สลิปซ้ำ", bg: "bg-purple-500/10", textCol: "text-purple-700", border: "border-purple-300" },
  approved: { text: "อนุมัติแล้ว", bg: "bg-emerald-500/15", textCol: "text-emerald-800", border: "border-emerald-500/30" },
  rejected: { text: "ปฏิเสธ", bg: "bg-rose-500/10", textCol: "text-rose-700", border: "border-rose-300" },
  failed: { text: "อ่านสลิปล้มเหลว", bg: "bg-rose-100", textCol: "text-rose-800", border: "border-rose-300" },
};

export default function GivingInbox() {
  const [, setLocation] = useLocation();
  const [selectedStatus, setSelectedStatus] = useState<InboxStatus>("needs_review");
  const [selectedSlipId, setSelectedSlipId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLineInfoModal, setShowLineInfoModal] = useState(false);

  // Upload Form State
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadDonorName, setUploadDonorName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  // Queries
  const statsQuery = trpc.givingInbox.stats.useQuery(undefined, {
    refetchInterval: 10000,
  });

  const slipsQuery = trpc.givingInbox.list.useQuery({
    status: selectedStatus,
    limit: 100,
  });

  const selectedSlipQuery = trpc.givingInbox.getById.useQuery(
    { id: selectedSlipId ?? 0 },
    { enabled: !!selectedSlipId }
  );

  const fundsQuery = trpc.finance.accounts.useQuery();
  const membersQuery = trpc.members.list.useQuery();

  // Mutations
  const approveMutation = trpc.givingInbox.approve.useMutation({
    onSuccess: () => {
      toast.success("อนุมัติและบันทึกเงินถวายเรียบร้อยแล้ว");
      utils.givingInbox.invalidate();
      utils.finance.invalidate();

      // Auto-advance to next slip
      const currentList = slipsQuery.data ?? [];
      const currentIndex = currentList.findIndex(s => s.id === selectedSlipId);
      if (currentIndex >= 0 && currentIndex < currentList.length - 1) {
        handleSelectSlip(currentList[currentIndex + 1]);
      } else {
        setSelectedSlipId(null);
      }
    },
    onError: err => {
      Swal.error("เกิดข้อผิดพลาด", err.message);
    },
  });

  const rejectMutation = trpc.givingInbox.reject.useMutation({
    onSuccess: () => {
      toast.success("ปฏิเสธสลิปเรียบร้อยแล้ว");
      utils.givingInbox.invalidate();
      setSelectedSlipId(null);
    },
    onError: err => {
      Swal.error("เกิดข้อผิดพลาด", err.message);
    },
  });

  const uploadSlipMutation = trpc.givingInbox.uploadSlip.useMutation({
    onSuccess: data => {
      toast.success("อัปโหลดสลิปสำเร็จ! ระบบกำลังดึงข้อมูลด้วย AI");
      utils.givingInbox.invalidate();
      setShowUploadModal(false);
      setUploadPreview(null);
      setUploadDonorName("");
      setSelectedStatus("all");
      setSelectedSlipId(data.slipId);
    },
    onError: err => {
      Swal.error("อัปโหลดไม่สำเร็จ", err.message);
    },
  });

  const linkMemberMutation = trpc.givingInbox.linkMember.useMutation({
    onSuccess: () => {
      toast.success("เชื่อมโยงสมาชิกกับ LINE สำเร็จ สลิปอื่นๆ จะถูกจับคู่อัตโนมัติ");
      utils.givingInbox.invalidate();
      utils.members.invalidate();
    },
    onError: err => {
      toast.error(err.message);
    },
  });

  const rescanMutation = trpc.givingInbox.rescan.useMutation({
    onSuccess: () => {
      toast.success("AI สแกนและสกัดข้อมูลสลิปเรียบร้อยแล้ว");
      utils.givingInbox.invalidate();
    },
    onError: err => {
      toast.error(err.message || "ไม่สามารถสแกนสลิปได้");
    },
  });

  const handleRescan = (id: number) => {
    rescanMutation.mutate({ id });
  };

  // Local edit form state when viewing detail
  const currentSlip = selectedSlipQuery.data;
  const [editAmount, setEditAmount] = useState<string>("");
  const [editFundId, setEditFundId] = useState<number | undefined>(undefined);
  const [editCategory, setEditCategory] = useState<OfferingCategory>("general");
  const [editMemberId, setEditMemberId] = useState<number | null>(null);
  const [editReviewNote, setEditReviewNote] = useState<string>("");

  const handleSelectSlip = (slip: any) => {
    setSelectedSlipId(slip.id);
    setEditAmount(slip.approvedAmount || slip.extractedAmount || "");
    setEditFundId(slip.fundId || (fundsQuery.data?.[0]?.id ?? undefined));
    setEditCategory("general");
    setEditMemberId(slip.matchedMemberId || null);
    setEditReviewNote(slip.reviewNote || "");
  };

  const handleApprove = async () => {
    if (!currentSlip) return;
    const amountNum = parseFloat(editAmount);
    if (!amountNum || amountNum <= 0) {
      Swal.error("ยอดเงินไม่ถูกต้อง", "กรุณาระบุจำนวนเงินที่มากกว่า 0 บาท");
      return;
    }
    if (!editFundId) {
      Swal.error("ยังไม่ได้เลือกกองทุน", "กรุณาเลือกบัญชีกองทุนที่ต้องการนำเงินเข้า");
      return;
    }

    const confirmed = await Swal.confirm(
      "ยืนยันการอนุมัติการถวาย",
      `คุณกำลังจะอนุมัติเงินถวายจำนวน ${amountNum.toLocaleString()} บาท จาก ${
        currentSlip.matchedMemberName || currentSlip.extractedSenderName || currentSlip.lineDisplayName || "ผู้ถวาย"
      } เข้ากองทุนที่เลือก`,
      "อนุมัติและบันทึก"
    );

    if (!confirmed) return;

    approveMutation.mutate({
      slipId: currentSlip.id,
      amount: amountNum,
      fundId: editFundId,
      category: editCategory,
      memberId: editMemberId,
      donorName: currentSlip.matchedMemberName || currentSlip.extractedSenderName,
      reviewNote: editReviewNote,
      receiptDate: currentSlip.extractedDate ? new Date(currentSlip.extractedDate) : new Date(),
    });
  };

  const handleQuickApprove = async (e: React.MouseEvent, slip: any) => {
    e.stopPropagation();
    const amountNum = parseFloat(slip.extractedAmount || "0");
    const defaultFundId = fundsQuery.data?.[0]?.id;

    if (!amountNum || amountNum <= 0 || !defaultFundId) {
      handleSelectSlip(slip);
      return;
    }

    const confirmed = await Swal.confirm(
      "อนุมัติด่วน?",
      `อนุมัติเงินถวาย ฿${amountNum.toLocaleString()} จาก ${
        slip.matchedMemberName || slip.extractedSenderName
      } เข้า ${fundsQuery.data?.[0]?.name}`,
      "อนุมัติทันที"
    );

    if (!confirmed) return;

    approveMutation.mutate({
      slipId: slip.id,
      amount: amountNum,
      fundId: defaultFundId,
      category: "general",
      memberId: slip.matchedMemberId,
      donorName: slip.matchedMemberName || slip.extractedSenderName,
      receiptDate: slip.extractedDate ? new Date(slip.extractedDate) : new Date(),
    });
  };

  const handleReject = async () => {
    if (!currentSlip) return;
    const confirmed = await Swal.confirm(
      "ปฏิเสธสลิปนี้?",
      "กรุณาระบุเหตุผลการปฏิเสธ (เช่น รูปไม่ชัด, ข้อมูลไม่ถูกต้อง หรือรายการซ้ำ)",
      "ปฏิเสธสลิป"
    );

    if (!confirmed) return;

    const reason = prompt("ระบุเหตุผลการปฏิเสธสลิป:") || "ข้อมูลไม่ถูกต้องหรือไม่ตรงตามเงื่อนไข";
    rejectMutation.mutate({
      slipId: currentSlip.id,
      reason,
    });
  };

  const handleLinkMember = () => {
    if (!currentSlip?.lineUserId || !editMemberId) {
      toast.error("กรุณาเลือกสมาชิกก่อนเชื่อมโยง");
      return;
    }
    linkMemberMutation.mutate({
      lineUserId: currentSlip.lineUserId,
      memberId: editMemberId,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WEBP)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setUploadPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = () => {
    if (!uploadPreview) {
      toast.error("กรุณาเลือกรูปภาพสลิป");
      return;
    }

    uploadSlipMutation.mutate({
      base64Data: uploadPreview,
      donorName: uploadDonorName.trim() || undefined,
    });
  };

  const filteredSlips = (slipsQuery.data ?? []).filter(slip => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      slip.lineDisplayName?.toLowerCase().includes(q) ||
      slip.extractedSenderName?.toLowerCase().includes(q) ||
      slip.matchedMemberName?.toLowerCase().includes(q) ||
      slip.extractedRef?.toLowerCase().includes(q) ||
      String(slip.extractedAmount).includes(q)
    );
  });

  const stats = statsQuery.data as any;
  const totalSlips = stats?.total ?? 0;

  return (
    <AppLayout
      activeRoute="/giving/inbox"
      title="กล่องสลิปการถวาย (Giving Inbox)"
      subtitle="ตรวจสอบและอนุมัติสลิปการถวายจาก LINE Official Account ด้วย AI"
      action={
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. Link to Offerings Book */}
          <button
            type="button"
            onClick={() => setLocation("/offerings")}
            className="px-3.5 py-2 rounded-2xl bg-white border border-[#E9D9BF] text-[#70452E] hover:bg-[#FFF4DF] text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
            title="ดูสมุดบัญชีเงินถวายที่อนุมัติแล้ว"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#E99A4A]" />
            <span className="hidden sm:inline">สมุดบัญชีถวาย</span>
          </button>

          {/* 2. LINE Info / QR Modal */}
          <button
            type="button"
            onClick={() => setShowLineInfoModal(true)}
            className="px-3.5 py-2 rounded-2xl bg-white border border-[#E9D9BF] text-[#70452E] hover:bg-[#FFF4DF] text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
            title="ข้อมูลการเชื่อมต่อ LINE และ QR Code"
          >
            <QrCode className="w-3.5 h-3.5 text-[#4F8B33]" />
            <span className="hidden sm:inline">LINE บอท</span>
          </button>

          {/* 3. Manual Test Upload Button */}
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 rounded-2xl bg-[#E99A4A] hover:bg-[#DE8640] text-white text-xs font-black clay-button-shadow transition-all flex items-center gap-1.5 shadow-xs"
          >
            <UploadCloud className="w-4 h-4" />
            <span>อัปโหลดสลิป</span>
          </button>

          {/* 4. Refresh Button */}
          <button
            type="button"
            onClick={() => {
              utils.givingInbox.invalidate();
              toast.info("กำลังรีเฟรชข้อมูลและประมวลผลคิวสลิป...");
            }}
            className="p-2 rounded-2xl bg-white border border-[#E9D9BF] text-[#70452E] hover:bg-[#FFF4DF] transition-all shadow-2xs"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* ── Stat Summary Tabs ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          <button
            onClick={() => setSelectedStatus("needs_review")}
            className={`p-4 rounded-2xl border transition-all text-left ${
              selectedStatus === "needs_review"
                ? "bg-amber-50 border-amber-400 shadow-sm ring-2 ring-amber-400/20"
                : "bg-white/80 border-[#E9D9BF] hover:bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800">ต้องตรวจสอบ</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-700 mt-1">
              {stats?.needs_review ?? 0}
            </div>
          </button>

          <button
            onClick={() => setSelectedStatus("matched")}
            className={`p-4 rounded-2xl border transition-all text-left ${
              selectedStatus === "matched"
                ? "bg-emerald-50 border-emerald-400 shadow-sm ring-2 ring-emerald-400/20"
                : "bg-white/80 border-[#E9D9BF] hover:bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800">พร้อมอนุมัติ</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {stats?.matched ?? 0}
            </div>
          </button>

          <button
            onClick={() => setSelectedStatus("duplicate")}
            className={`p-4 rounded-2xl border transition-all text-left ${
              selectedStatus === "duplicate"
                ? "bg-purple-50 border-purple-400 shadow-sm ring-2 ring-purple-400/20"
                : "bg-white/80 border-[#E9D9BF] hover:bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-800">สลิปซ้ำ</span>
              <ShieldAlert className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-purple-700 mt-1">
              {stats?.duplicate ?? 0}
            </div>
          </button>

          <button
            onClick={() => setSelectedStatus("approved")}
            className={`p-4 rounded-2xl border transition-all text-left ${
              selectedStatus === "approved"
                ? "bg-stone-100 border-stone-400 shadow-sm ring-2 ring-stone-400/20"
                : "bg-white/80 border-[#E9D9BF] hover:bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700">อนุมัติแล้ว</span>
              <Check className="w-4 h-4 text-stone-600" />
            </div>
            <div className="text-2xl font-black text-stone-700 mt-1">
              {stats?.approved ?? 0}
            </div>
          </button>

          <button
            onClick={() => setSelectedStatus("all")}
            className={`p-4 rounded-2xl border transition-all text-left col-span-2 sm:col-span-1 ${
              selectedStatus === "all"
                ? "bg-[#FFF4DF] border-[#E99A4A] shadow-sm ring-2 ring-[#E99A4A]/20"
                : "bg-white/80 border-[#E9D9BF] hover:bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#70452E]">สลิปทั้งหมด</span>
              <Inbox className="w-4 h-4 text-[#70452E]" />
            </div>
            <div className="text-2xl font-black text-[#38251B] mt-1">
              {stats?.total ?? 0}
            </div>
          </button>
        </div>

        {/* ── If Total Slips is 0: Show Warm Onboarding Guide Card ── */}
        {totalSlips === 0 && !slipsQuery.isLoading && (
          <div className="bg-gradient-to-br from-white via-[#FFFDF9] to-[#FFF4DF] rounded-3xl border-2 border-[#E9D9BF] p-6 sm:p-8 shadow-sm">
            <div className="max-w-3xl mx-auto space-y-6 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-5">
                <div className="w-16 h-16 rounded-3xl bg-[#4F8B33]/15 border-2 border-[#4F8B33]/30 flex items-center justify-center text-[#4F8B33] shrink-0">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#38251B]">
                    ยินดีต้อนรับสู่ระบบ LINE Slip AI 🌿
                  </h3>
                  <p className="text-sm text-[#70452E]/80 mt-1">
                    ระบบพร้อมรับภาพสลิปจากสมาชิกผ่าน LINE เพื่อสกัดข้อมูล ตรวจสอบยอดเงิน และให้เหรัญญิกอนุมัติ
                  </p>
                </div>
              </div>

              {/* 3 Simple Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-white border border-[#E9D9BF] space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-[#E99A4A]/20 text-[#D47012] font-black text-sm flex items-center justify-center">
                    1
                  </div>
                  <h4 className="font-bold text-sm text-[#38251B]">สมาชิกส่งสลิปทาง LINE</h4>
                  <p className="text-xs text-[#70452E]/70 leading-relaxed">
                    สมาชิกโอนเงินเข้าบัญชีคริสตจักร แล้วส่งรูปสลิปเข้ามาในห้องแชท LINE OA
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#E9D9BF] space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-[#4F8B33]/20 text-[#4F8B33] font-black text-sm flex items-center justify-center">
                    2
                  </div>
                  <h4 className="font-bold text-sm text-[#38251B]">AI อ่านข้อมูลอัตโนมัติ</h4>
                  <p className="text-xs text-[#70452E]/70 leading-relaxed">
                    ระบบดึงยอดเงิน วันที่ บัญชี ตรวจสลิปซ้ำ และจับคู่สมาชิกคริสตจักรทันที
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#E9D9BF] space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-[#D47012]/20 text-[#D47012] font-black text-sm flex items-center justify-center">
                    3
                  </div>
                  <h4 className="font-bold text-sm text-[#38251B]">เหรัญญิกกดอนุมัติ</h4>
                  <p className="text-xs text-[#70452E]/70 leading-relaxed">
                    ตรวจสอบความถูกต้อง และกดอนุมัติเพื่อบันทึกเข้าสมุดบัญชีเงินถวายทันที
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="px-6 py-3 rounded-2xl bg-[#E99A4A] hover:bg-[#DE8640] text-white font-black text-sm shadow-md transition-all flex items-center gap-2"
                >
                  <UploadCloud className="w-4 h-4" /> ทดลองอัปโหลดสลิปจากเครื่องเดี๋ยวนี้
                </button>
                <button
                  type="button"
                  onClick={() => setShowLineInfoModal(true)}
                  className="px-5 py-3 rounded-2xl bg-white border border-[#E9D9BF] text-[#70452E] hover:bg-[#FFF4DF] font-bold text-sm transition-all flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4 text-[#4F8B33]" /> ดูวิธีเชื่อมต่อ LINE OA
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Main Layout: Slips List + Detail Split View ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: List (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Search and Filters */}
            <div className="bg-white rounded-2xl border border-[#E9D9BF] p-3 shadow-2xs flex items-center gap-2">
              <Search className="w-4 h-4 text-[#70452E]/60 ml-2" />
              <input
                type="text"
                placeholder="ค้นหาชื่อผู้โอน, สมาชิก, ยอดเงิน..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-sm bg-transparent border-0 focus:outline-none text-[#38251B]"
              />
            </div>

            {/* Slips Cards */}
            {slipsQuery.isLoading ? (
              <div className="p-12 text-center text-sm text-[#70452E]/60 bg-white rounded-3xl border border-[#E9D9BF]">
                กำลังโหลดรายการสลิป...
              </div>
            ) : filteredSlips.length === 0 ? (
              <div className="p-12 text-center text-[#70452E]/70 bg-white rounded-3xl border border-[#E9D9BF] space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600/50 mx-auto" />
                <p className="font-bold">ไม่มีรายการสลิปในหมวดนี้</p>
                <p className="text-xs text-[#70452E]/60 max-w-xs mx-auto">
                  สลิปใหม่ที่ส่งเข้า LINE หรืออัปโหลดทดสอบจะปรากฏที่นี่
                </p>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FFF4DF] border border-[#E9D9BF] text-[#70452E] text-xs font-bold hover:bg-[#FBE9CD] transition-all"
                >
                  <UploadCloud className="w-3.5 h-3.5" /> อัปโหลดสลิปทดสอบ
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1">
                {filteredSlips.map(slip => {
                  const statusConf = STATUS_LABELS[slip.status] || {
                    text: slip.status,
                    bg: "bg-stone-100",
                    textCol: "text-stone-700",
                    border: "border-stone-200",
                  };
                  const isSelected = slip.id === selectedSlipId;

                  return (
                    <div
                      key={slip.id}
                      onClick={() => handleSelectSlip(slip)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-[#FFF4DF] border-[#E99A4A] shadow-md ring-2 ring-[#E99A4A]/20"
                          : "bg-white border-[#E9D9BF] hover:bg-[#FFFDF9] hover:border-[#E99A4A]/50 shadow-2xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {slip.signedImageUrl ? (
                            <img
                              src={slip.signedImageUrl}
                              alt="สลิป"
                              className="w-14 h-14 object-cover rounded-xl border border-[#E9D9BF] shrink-0 bg-stone-100"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-stone-100 border border-[#E9D9BF] flex items-center justify-center text-stone-400 shrink-0">
                              <CreditCard className="w-6 h-6" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-base text-[#38251B] truncate">
                              {slip.matchedMemberName || slip.extractedSenderName || slip.lineDisplayName || "ผู้ถวาย"}
                            </div>
                            <div className="text-xs text-[#70452E]/70 flex items-center gap-1.5 mt-0.5 truncate">
                              <span>{slip.lineDisplayName || "ผู้ใช้"}</span>
                              {slip.extractedBank && (
                                <>
                                  <span>•</span>
                                  <span>{slip.extractedBank}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-lg font-black text-[#D47012]">
                            {slip.extractedAmount
                              ? `฿${Number(slip.extractedAmount).toLocaleString("th-TH", {
                                  minimumFractionDigits: 2,
                                })}`
                              : "—"}
                          </div>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border mt-1 ${statusConf.bg} ${statusConf.textCol} ${statusConf.border}`}
                          >
                            {statusConf.text}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#E9D9BF]/50 text-xs text-[#70452E]/60">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {slip.extractedDate
                            ? new Date(slip.extractedDate).toLocaleDateString("th-TH", {
                                day: "numeric",
                                month: "short",
                                year: "2-digit",
                              })
                            : new Date(slip.createdAt).toLocaleDateString("th-TH")}
                        </span>

                        {/* Quick Approve Button for High-confidence Matched Slips */}
                        {slip.status === "matched" && (
                          <button
                            type="button"
                            onClick={e => handleQuickApprove(e, slip)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition-all"
                            title="อนุมัติด่วนด้วยข้อมูลที่จับคู่ได้"
                          >
                            <Zap className="w-3 h-3" /> อนุมัติด่วน
                          </button>
                        )}

                        {slip.status !== "matched" && slip.extractedRef && (
                          <span className="font-mono text-[11px] truncate max-w-[130px]">
                            Ref: {slip.extractedRef}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Slip Detail & Review Form (7 cols on lg) */}
          <div className="lg:col-span-7">
            {!selectedSlipId || !currentSlip ? (
              <div className="p-12 text-center bg-white/70 rounded-3xl border-2 border-dashed border-[#E9D9BF] text-[#70452E]/60 space-y-3 min-h-[420px] flex flex-col items-center justify-center">
                <Inbox className="w-12 h-12 text-[#E99A4A]/50" />
                <div className="font-bold text-base">เลือกสลิปจากรายการด้านซ้าย</div>
                <p className="text-xs max-w-sm">
                  เพื่อตรวจสอบข้อมูลที่ AI สกัด จับคู่สมาชิก และอนุมัติบันทึกเป็นรายการเงินถวาย
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-[#E9D9BF] p-6 shadow-sm space-y-6 animate-in fade-in duration-150">
                {/* Header of Detail */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E9D9BF]">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-[#38251B]">
                        ตรวจสอบสลิป #{currentSlip.id}
                      </h2>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          STATUS_LABELS[currentSlip.status]?.bg
                        } ${STATUS_LABELS[currentSlip.status]?.textCol} ${
                          STATUS_LABELS[currentSlip.status]?.border
                        }`}
                      >
                        {STATUS_LABELS[currentSlip.status]?.text || currentSlip.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#70452E]/70 mt-1">
                      ส่งเข้ามาเมื่อ: {new Date(currentSlip.createdAt).toLocaleString("th-TH")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentSlip.signedImageUrl && (
                      <a
                        href={currentSlip.signedImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl border border-[#E9D9BF] bg-[#FFF4DF] text-xs font-bold text-[#70452E] hover:bg-[#FBE9CD] flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> ดูภาพเต็ม
                      </a>
                    )}
                    {currentSlip.status !== "approved" && currentSlip.status !== "rejected" && (
                      <button
                        type="button"
                        onClick={() => handleRescan(currentSlip.id)}
                        disabled={rescanMutation.isPending}
                        className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-xs font-bold text-amber-800 hover:bg-amber-100 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        title="ให้ Google Gemini AI สแกนอ่านข้อมูลสลิปนี้ใหม่"
                      >
                        <Sparkles className={`w-3.5 h-3.5 text-amber-600 ${rescanMutation.isPending ? "animate-spin" : ""}`} />
                        {rescanMutation.isPending ? "กำลังอ่านข้อมูล..." : "สแกน AI ใหม่"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Duplicate Warning */}
                {currentSlip.status === "duplicate" && (
                  <div className="p-4 rounded-2xl bg-purple-50 border-2 border-purple-300 text-purple-900 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <ShieldAlert className="w-5 h-5 text-purple-600" />
                      ตรวจพบสลิปซ้ำ (Duplicate Detected)
                    </div>
                    <p className="text-xs leading-relaxed text-purple-800">
                      {currentSlip.lastErrorMessage ||
                        "สลิปนี้มีหมายเลขอ้างอิง, รูปภาพ หรือรายการธุรกรรมที่ตรงกับข้อมูลที่มีอยู่แล้วในระบบ"}
                    </p>
                  </div>
                )}

                {/* Grid: Image + AI Extracted Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {/* Slip Image */}
                  <div className="rounded-2xl border border-[#E9D9BF] overflow-hidden bg-stone-50 max-h-[360px] flex items-center justify-center p-2">
                    {currentSlip.signedImageUrl ? (
                      <img
                        src={currentSlip.signedImageUrl}
                        alt="สลิปการโอนเงิน"
                        className="max-h-[340px] w-auto object-contain rounded-xl shadow-xs"
                      />
                    ) : (
                      <div className="py-16 text-xs text-stone-400">ไม่มีรูปภาพสลิป</div>
                    )}
                  </div>

                  {/* AI Extracted Fields & Confidence */}
                  <div className="space-y-3 bg-[#FFFDF9] border border-[#E9D9BF] p-4 rounded-2xl text-xs">
                    <div className="font-bold text-sm text-[#38251B] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#E99A4A]" /> ข้อมูลที่ AI อ่านได้
                    </div>

                    <div className="space-y-2 text-[#523D2E]">
                      <div className="flex justify-between items-center py-1 border-b border-[#E9D9BF]/40">
                        <span className="text-[#70452E]/70">ยอดเงิน:</span>
                        <div className="flex items-center gap-2 font-bold text-sm text-[#D47012]">
                          <span>
                            {currentSlip.extractedAmount
                              ? `฿${Number(currentSlip.extractedAmount).toLocaleString("th-TH", {
                                  minimumFractionDigits: 2,
                                })}`
                              : "อ่านไม่ได้"}
                          </span>
                          {currentSlip.extractedAmountConfidence && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              {(Number(currentSlip.extractedAmountConfidence) * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-[#E9D9BF]/40">
                        <span className="text-[#70452E]/70">วันที่โอน:</span>
                        <div className="flex items-center gap-2 font-medium">
                          <span>
                            {currentSlip.extractedDate
                              ? new Date(currentSlip.extractedDate).toLocaleString("th-TH")
                              : "—"}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-[#E9D9BF]/40">
                        <span className="text-[#70452E]/70">ชื่อผู้โอน:</span>
                        <span className="font-bold">{currentSlip.extractedSenderName || "—"}</span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-[#E9D9BF]/40">
                        <span className="text-[#70452E]/70">ธนาคาร:</span>
                        <span>{currentSlip.extractedBank || "—"}</span>
                      </div>

                      <div className="flex justify-between items-center py-1">
                        <span className="text-[#70452E]/70">หมายเลขอ้างอิง:</span>
                        <span className="font-mono">{currentSlip.extractedRef || "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review Form: Member, Fund, Amount, Category */}
                <div className="space-y-4 pt-4 border-t border-[#E9D9BF]">
                  <h3 className="font-bold text-sm text-[#38251B]">
                    บันทึกการตรวจสอบโดยเจ้าหน้าที่
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Member Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#70452E] flex items-center justify-between">
                        <span>สมาชิกผู้ถวาย</span>
                        {currentSlip.lineUserId && editMemberId && !currentSlip.lineUserId.startsWith("manual-") && (
                          <button
                            type="button"
                            onClick={handleLinkMember}
                            disabled={linkMemberMutation.isPending}
                            className="text-[11px] text-[#4F8B33] hover:underline flex items-center gap-1 font-semibold"
                          >
                            <Link2 className="w-3 h-3" /> เชื่อมโยง LINE ID
                          </button>
                        )}
                      </label>
                      <select
                        value={editMemberId ?? ""}
                        onChange={e => setEditMemberId(e.target.value ? Number(e.target.value) : null)}
                        disabled={currentSlip.status === "approved"}
                        className="w-full text-sm rounded-xl border border-[#E9D9BF] bg-white p-2.5 focus:ring-2 focus:ring-[#E99A4A] focus:outline-none"
                      >
                        <option value="">-- ไม่ระบุสมาชิก (ผู้ถวายนิรนาม) --</option>
                        {(membersQuery.data ?? []).map((m: any) => (
                          <option key={m.id} value={m.id}>
                            {m.name} {m.envelopeNo ? `(#${m.envelopeNo})` : ""}
                          </option>
                        ))}
                      </select>
                      {currentSlip.matchMethod && (
                        <p className="text-[11px] text-emerald-700">
                          จับคู่โดย: {currentSlip.matchMethod === "line_id" ? "LINE Account" : "ชื่อ"} (ความมั่นใจ{" "}
                          {(Number(currentSlip.matchedConfidence ?? 1) * 100).toFixed(0)}%)
                        </p>
                      )}
                    </div>

                    {/* Fund Account */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#70452E]">
                        เข้ากองทุน <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={editFundId ?? ""}
                        onChange={e => setEditFundId(Number(e.target.value))}
                        disabled={currentSlip.status === "approved"}
                        className="w-full text-sm rounded-xl border border-[#E9D9BF] bg-white p-2.5 focus:ring-2 focus:ring-[#E99A4A] focus:outline-none font-medium"
                      >
                        {(fundsQuery.data ?? []).map((f: any) => (
                          <option key={f.id} value={f.id}>
                            {f.name} (คงเหลือ ฿{Number(f.balance).toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Amount */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#70452E]">
                        ยอดเงิน (บาท) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editAmount}
                        onChange={e => setEditAmount(e.target.value)}
                        disabled={currentSlip.status === "approved"}
                        className="w-full text-base font-black text-[#D47012] rounded-xl border border-[#E9D9BF] bg-white p-2.5 focus:ring-2 focus:ring-[#E99A4A] focus:outline-none"
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#70452E]">ประเภทการถวาย</label>
                      <select
                        value={editCategory}
                        onChange={e => setEditCategory(e.target.value as OfferingCategory)}
                        disabled={currentSlip.status === "approved"}
                        className="w-full text-sm rounded-xl border border-[#E9D9BF] bg-white p-2.5 focus:ring-2 focus:ring-[#E99A4A] focus:outline-none"
                      >
                        {OFFERING_CATEGORIES.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#70452E]">หมายเหตุการตรวจสอบ</label>
                    <input
                      type="text"
                      placeholder="บันทึกเพิ่มเติมของเจ้าหน้าที่ (ถ้ามี)"
                      value={editReviewNote}
                      onChange={e => setEditReviewNote(e.target.value)}
                      disabled={currentSlip.status === "approved"}
                      className="w-full text-sm rounded-xl border border-[#E9D9BF] bg-white p-2.5 focus:ring-2 focus:ring-[#E99A4A] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Actions Button Bar */}
                {currentSlip.status !== "approved" && currentSlip.status !== "rejected" ? (
                  <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#E9D9BF]">
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={rejectMutation.isPending}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-2xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-sm transition-all"
                    >
                      ปฏิเสธสลิป
                    </button>

                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={approveMutation.isPending}
                      className="w-full sm:w-auto px-8 py-2.5 rounded-2xl bg-[#4F8B33] hover:bg-[#3f7028] text-white font-black text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> อนุมัติและบันทึกเงินถวาย
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-600 flex items-center justify-between">
                    <span>
                      รายการนี้ได้รับการ
                      {currentSlip.status === "approved" ? "อนุมัติแล้ว" : "ปฏิเสธแล้ว"}
                      {currentSlip.approvedOfferingId && ` (Offering #${currentSlip.approvedOfferingId})`}
                    </span>
                    {currentSlip.reviewedAt && (
                      <span>เมื่อ: {new Date(currentSlip.reviewedAt).toLocaleString("th-TH")}</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal: Manual / Test Slip Upload ── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border-2 border-[#E9D9BF] p-6 max-w-lg w-full space-y-5 shadow-2xl relative">
            <button
              onClick={() => {
                setShowUploadModal(false);
                setUploadPreview(null);
              }}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#E99A4A]/20 text-[#D47012] flex items-center justify-center">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#38251B]">อัปโหลดสลิปทดสอบ / ด้วยตนเอง</h3>
                <p className="text-xs text-[#70452E]/70">
                  เลือกรูปสลิปจากคอมพิวเตอร์ เพื่อให้ AI ดึงข้อมูลและนำเข้ากล่องสลิปทันที
                </p>
              </div>
            </div>

            {/* Dropzone Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                uploadPreview
                  ? "border-[#E99A4A] bg-[#FFF9EE]"
                  : "border-[#E9D9BF] hover:border-[#E99A4A] bg-stone-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {uploadPreview ? (
                <div className="space-y-3">
                  <img
                    src={uploadPreview}
                    alt="ตัวอย่างสลิป"
                    className="max-h-48 mx-auto rounded-xl object-contain shadow-xs"
                  />
                  <p className="text-xs text-[#D47012] font-bold">คลิกเพื่อเปลี่ยนรูปภาพ</p>
                </div>
              ) : (
                <div className="space-y-2 py-4">
                  <ImageIcon className="w-10 h-10 text-stone-400 mx-auto" />
                  <p className="font-bold text-sm text-[#38251B]">คลิกเพื่อเลือกไฟล์รูปสลิป</p>
                  <p className="text-xs text-[#70452E]/60">รองรับไฟล์ JPG, PNG, WEBP</p>
                </div>
              )}
            </div>

            {/* Optional donor name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#70452E]">
                ชื่อผู้ถวาย (ระบุเพิ่มเติมหรือไม่ก็ได้)
              </label>
              <input
                type="text"
                placeholder="เช่น นายสมชาย สุขใจ"
                value={uploadDonorName}
                onChange={e => setUploadDonorName(e.target.value)}
                className="w-full text-sm rounded-xl border border-[#E9D9BF] p-2.5 focus:ring-2 focus:ring-[#E99A4A] focus:outline-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadPreview(null);
                }}
                className="px-5 py-2.5 rounded-2xl border border-[#E9D9BF] text-[#70452E] font-bold text-sm hover:bg-stone-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleUploadSubmit}
                disabled={!uploadPreview || uploadSlipMutation.isPending}
                className="px-6 py-2.5 rounded-2xl bg-[#E99A4A] hover:bg-[#DE8640] text-white font-black text-sm shadow-md disabled:opacity-50 flex items-center gap-2"
              >
                {uploadSlipMutation.isPending ? "กำลังประมวลผล..." : "ส่งให้ AI อ่านสลิป"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: LINE Bot Setup & Info ── */}
      {showLineInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border-2 border-[#E9D9BF] p-6 max-w-lg w-full space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowLineInfoModal(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#4F8B33]/20 text-[#4F8B33] flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#38251B]">ข้อมูลการเชื่อมต่อ LINE Official Account</h3>
                <p className="text-xs text-[#70452E]/70">
                  รายละเอียดสำหรับการแอดบอทและการตั้งค่าระบบ
                </p>
              </div>
            </div>

            {/* Webhook URL Box */}
            <div className="bg-stone-50 border border-[#E9D9BF] p-3.5 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#70452E]">
                <span>Webhook URL สำหรับ LINE Developers</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText("https://graceful-giving.vercel.app/api/line/webhook");
                    toast.success("คัดลอก Webhook URL แล้ว");
                  }}
                  className="text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Copy className="w-3.5 h-3.5" /> คัดลอก
                </button>
              </div>
              <div className="font-mono text-xs bg-white p-2 rounded-xl border border-[#E9D9BF] text-[#38251B] break-all select-all">
                https://graceful-giving.vercel.app/api/line/webhook
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-3 text-xs text-[#523D2E]">
              <div className="font-bold text-sm text-[#38251B]">วิธีใช้งานสำหรับสมาชิก:</div>
              <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed">
                <li>เปิดห้องแชทของ LINE Official Account ประจำคริสตจักร</li>
                <li>ถ่ายรูปหรือส่งรูปสลิปการโอนเงินเข้ามาในห้องแชท</li>
                <li>ระบบจะตอบกลับว่าได้รับสลิปแล้ว และนำส่งเข้ามาที่กล่องข้อความนี้โดยอัตโนมัติ</li>
              </ol>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowLineInfoModal(false)}
                className="px-6 py-2.5 rounded-2xl bg-[#E99A4A] text-white font-bold text-sm shadow-xs hover:bg-[#DE8640]"
              >
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
