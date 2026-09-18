import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Shield,
  Briefcase,
  TrendingUp,
  Clock,
  CheckCircle2,
  Lock,
  Bell,
  LogOut,
  Edit3,
  QrCode,
  Calendar,
  Receipt,
  HeartHandshake,
  ArrowRight,
  UserCheck,
  Building,
  Check,
  Sparkles,
  X,
  FileText,
  DollarSign,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

// ── Profile Specifications & Multi-role Data Models ───────────────────────────

interface ProfileModel {
  id: string;
  name: string;
  roles: string[];
  titles: string[];
  department: string;
  responsibilities: string[];
  permissions: {
    category: string;
    items: string[];
  }[];
  isFinancialRole: boolean;
}

const CHURCH_PROFILES_PRESETS: Record<string, ProfileModel> = {
  SUPER_ADMIN: {
    id: "suriyong",
    name: "พณ.ท่านหม่อมหลวงราชวงศ์สุริยงค์ บาลเพ็ชร",
    roles: ["SUPER_ADMIN"],
    titles: ["ผู้ดูแลระบบสูงสุด"],
    department: "ฝ่ายบริหารกลางและระบบสารสนเทศคริสตจักร",
    responsibilities: [
      "ดูแลระบบและโครงสร้างสถาปัตยกรรมทั้งหมด (CFOS)",
      "จัดการผู้ใช้งานและกำหนดสิทธิ์การเข้าถึงระบบ",
      "ตั้งค่าข้อมูลพื้นฐานและบัญชีคริสตจักร",
      "ตรวจสอบ Audit Logs และประวัติการทำรายการทุกฝ่าย",
      "เข้าถึงข้อมูลทุกส่วนตามสิทธิ์สูงสุดของระบบ",
    ],
    permissions: [
      {
        category: "การจัดการระบบและผู้ใช้งาน",
        items: [
          "สิทธิ์เต็มรูปแบบทุกฟังก์ชัน (Full System Access)",
          "จัดการบัญชีผู้ใช้งาน และกำหนดบทบาทสิทธิ์ (User & Role Management)",
          "ตรวจสอบบันทึกความปลอดภัยและ Audit Log ทั้งระบบ",
          "แก้ไขข้อมูลองค์กรและการเชื่อมต่อฐานข้อมูล",
        ],
      },
      {
        category: "การเงินและงบประมาณ",
        items: [
          "ดูรายงานและตรวจสอบการเงินทุกกองทุนแบบเรียลไทม์",
          "อนุมัติคำขอเบิกเงินและรายการพิเศษ",
          "ตรวจสอบรอบนับเงินถวายและสมุดบัญชีธนาคาร",
        ],
      },
    ],
    isFinancialRole: true,
  },

  PASTOR: {
    id: "sansern",
    name: "ศบ.อาจารย์สรรเสริญ ดวงจิตร",
    roles: ["PASTOR"],
    titles: ["ศิษยาภิบาล / ผู้นำฝ่ายวิญญาณ"],
    department: "คณะศิษยาภิบาลและผู้นำฝ่ายวิญญาณ",
    responsibilities: [
      "กำกับทิศทางและงานพันธกิจของคริสตจักร",
      "พิจารณาและอนุมัติโครงการตามอำนาจที่กำหนด",
      "ตรวจสอบภาพรวมด้านการเงินและงบประมาณพันธกิจ",
      "ติดตามการดำเนินงานของฝ่ายต่าง ๆ",
      "ดูแลด้านอภิบาล การเยี่ยมเยียน และสมาชิก",
      "ติดตามผลการดำเนินพันธกิจและแผนยุทธศาสตร์",
    ],
    permissions: [
      {
        category: "การนำฝ่ายวิญญาณและพันธกิจ",
        items: [
          "อนุมัติโครงการพันธกิจและกิจกรรมคริสตจักร",
          "กำกับดูแลการอภิบาลและรายชื่อสมาชิก",
          "เผยแพร่ข่าวสาร สารศิษยาภิบาล และประกาศทางการ",
        ],
      },
      {
        category: "การกำกับดูแลการเงิน",
        items: [
          "ดูรายงานภาพรวมรายรับ-รายจ่ายทางการเงิน",
          "อนุมัติคำของบประมาณและคำขอเบิกจ่ายโครงการ",
          "อนุมัติการหักเงินถวายสดเพื่อพันธกิจเร่งด่วน",
        ],
      },
    ],
    isFinancialRole: true,
  },

  TREASURER: {
    id: "sudarat",
    name: "สุดารัตน์ จิณเซ่ง",
    roles: ["TREASURER"],
    titles: ["เหรัญญิกคริสตจักร"],
    department: "ฝ่ายการเงินและบัญชีคริสตจักร",
    responsibilities: [
      "บันทึกรายรับและรายจ่ายทั้งหมดของคริสตจักร",
      "ตรวจสอบเงินถวายและรอบนับเงินในแต่ละสัปดาห์",
      "ตรวจสอบบัญชีธนาคารและยอดเงินคงเหลือ",
      "จัดการรายการเบิกจ่ายตามคำขอที่ได้รับอนุมัติ",
      "ตรวจสอบและติดตามการใช้งบประมาณรายกองทุน",
      "ออกใบเสร็จรับเงินถวายสำหรับสมาชิก",
      "จัดทำรายงานทางการเงินและงบดุลประจำเดือน/ปี",
    ],
    permissions: [
      {
        category: "ระบบการเงินและบัญชี",
        items: [
          "บันทึกและแก้ไขข้อมูลรายรับเงินถวายทุกประเภท",
          "บันทึกและจ่ายเงินตามรายการค่าใช้จ่าย",
          "ตรวจสอบรอบนับเงินถวาย (Verify Count Sheet)",
          "บันทึกข้อมูลนำฝากและกระทบยอดสมุดธนาคาร (Bank Passbook)",
          "ออกใบเสร็จรับเงินถวาย (Donation Receipts)",
          "ส่งออกรายงานการเงิน บัญชีกองทุน และงบดุล",
        ],
      },
    ],
    isFinancialRole: true,
  },

  TREASURER_DEACON: {
    id: "tassana",
    name: "อาจารย์ทัศนา ดวงจิตร",
    roles: ["TREASURER", "DEACON"],
    titles: ["เหรัญญิกคริสตจักร", "มัคนายก / คณะกรรมการ"],
    department: "คณะมัคนายก & ฝ่ายการเงินและบัญชี",
    responsibilities: [
      "บันทึกรายรับ-รายจ่าย และตรวจสอบยอดเงินถวาย",
      "จัดการรายการเบิกจ่ายและออกใบเสร็จเงินถวาย",
      "จัดทำรายงานทางการเงินและตรวจสอบงบประมาณ",
      "ดูแลและติดตามงานตามฝ่ายพันธกิจที่รับผิดชอบ",
      "ตรวจรับงานและติดตามโครงการพันธกิจ",
      "เสนอคำของบประมาณและเสนอรายการเบิกจ่ายของฝ่าย",
      "ตรวจสอบการใช้ทรัพยากรและทรัพย์สินของคริสตจักร",
    ],
    permissions: [
      {
        category: "สิทธิ์ฝ่ายการเงิน (TREASURER)",
        items: [
          "บันทึกเงินถวายและรายจ่าย",
          "ตรวจสอบและยืนยันรอบนับเงินถวาย",
          "กระทบยอดบัญชีธนาคารและออกใบเสร็จ",
          "จัดทำและดูรายงานงบการเงิน",
        ],
      },
      {
        category: "สิทธิ์มัคนายก / กรรมการ (DEACON)",
        items: [
          "เสนอคำของบประมาณและแผนการใช้จ่ายฝ่าย",
          "เสนอคำขอเบิกเงินโครงการที่รับผิดชอบ",
          "ตรวจรับพัสดุ งานจ้าง และโครงการพันธกิจ",
          "เข้าถึงรายงานเฉพาะส่วนงานของฝ่ายที่ดูแล",
        ],
      },
    ],
    isFinancialRole: true,
  },

  MEMBER: {
    id: "member",
    name: "สมาชิกคริสตจักรผู้ร่วมพันธกิจ",
    roles: ["MEMBER"],
    titles: ["สมาชิกคริสตจักร"],
    department: "คริสตจักรชีวิตสุขสันต์กาฬสินธุ์",
    responsibilities: [
      "มีส่วนร่วมในรอบนมัสการและกลุ่มแคร์",
      "ปรนนิบัติรับใช้พระเจ้าตามของประทานและตารางรับใช้",
      "ร่วมถวายสิบลดและถวายพิเศษตามความเชื่อ",
      "ติดตามข่าวสารและกิจกรรมของคริสตจักร",
    ],
    permissions: [
      {
        category: "สิทธิ์ส่วนบุคคลของสมาชิก (Member Self-Service)",
        items: [
          "ดูประวัติการถวายเฉพาะของตนเองอย่างปลอดภัย (Private History)",
          "ดูและดาวน์โหลดใบเสร็จรับเงินถวายของตนเอง",
          "ดูตารางการปรนนิบัติรับใช้ในรอบนมัสการ",
          "ดูข่าวสาร กิจกรรม และบทความหนุนใจ",
          "จัดการข้อมูลส่วนตัวและช่องทางติดต่อ",
        ],
      },
    ],
    isFinancialRole: false,
  },
};

const ROLE_BADGE_STYLE: Record<
  string,
  { bg: string; text: string; border: string; icon: string; label: string }
> = {
  SUPER_ADMIN: {
    bg: "bg-amber-100",
    text: "text-amber-900",
    border: "border-amber-300",
    icon: "👑",
    label: "ผู้ดูแลระบบสูงสุด",
  },
  PASTOR: {
    bg: "bg-blue-100",
    text: "text-blue-900",
    border: "border-blue-300",
    icon: "✝️",
    label: "ศิษยาภิบาล",
  },
  TREASURER: {
    bg: "bg-emerald-100",
    text: "text-emerald-900",
    border: "border-emerald-300",
    icon: "💰",
    label: "เหรัญญิกคริสตจักร",
  },
  DEACON: {
    bg: "bg-purple-100",
    text: "text-purple-900",
    border: "border-purple-300",
    icon: "🤝",
    label: "มัคนายก / คณะกรรมการ",
  },
  COUNTER: {
    bg: "bg-orange-100",
    text: "text-orange-900",
    border: "border-orange-300",
    icon: "📝",
    label: "ทีมนับเงินถวาย",
  },
  MEMBER: {
    bg: "bg-stone-100",
    text: "text-stone-800",
    border: "border-stone-300",
    icon: "👤",
    label: "สมาชิกคริสตจักร",
  },
};

export default function Profile() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  // Queries for live financial data
  const financeSummaryQuery = trpc.finance.summary.useQuery(undefined, {
    staleTime: 60_000,
  });
  const pendingApprovalsQuery = trpc.withdrawals.list.useQuery(
    { myOnly: false },
    { staleTime: 60_000 }
  );
  const notificationsQuery = trpc.notifications.list.useQuery(undefined, {
    staleTime: 30_000,
  });
  const churchProfileQuery = trpc.church.getProfile.useQuery(undefined, {
    staleTime: 60_000,
  });

  // State
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>("AUTO");
  const [showIdCardModal, setShowIdCardModal] = useState<boolean>(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>(user?.name || "");
  const [isSavingName, setIsSavingName] = useState<boolean>(false);

  // Determine current active profile model
  let activeProfile: ProfileModel;
  if (selectedPresetKey !== "AUTO" && CHURCH_PROFILES_PRESETS[selectedPresetKey]) {
    activeProfile = CHURCH_PROFILES_PRESETS[selectedPresetKey];
  } else {
    // Auto-resolve from real user data
    const userRole = user?.churchRole || "MEMBER";
    const userRoles = (user as any)?.roles || [userRole];

    // Check matching preset or construct dynamic
    if (userRoles.includes("SUPER_ADMIN") || user?.role === "admin") {
      activeProfile = {
        ...CHURCH_PROFILES_PRESETS.SUPER_ADMIN,
        name: user?.name || CHURCH_PROFILES_PRESETS.SUPER_ADMIN.name,
      };
    } else if (userRoles.includes("TREASURER") && userRoles.includes("DEACON")) {
      activeProfile = {
        ...CHURCH_PROFILES_PRESETS.TREASURER_DEACON,
        name: user?.name || CHURCH_PROFILES_PRESETS.TREASURER_DEACON.name,
      };
    } else if (userRoles.includes("TREASURER")) {
      activeProfile = {
        ...CHURCH_PROFILES_PRESETS.TREASURER,
        name: user?.name || CHURCH_PROFILES_PRESETS.TREASURER.name,
      };
    } else if (userRoles.includes("PASTOR")) {
      activeProfile = {
        ...CHURCH_PROFILES_PRESETS.PASTOR,
        name: user?.name || CHURCH_PROFILES_PRESETS.PASTOR.name,
      };
    } else {
      activeProfile = {
        ...CHURCH_PROFILES_PRESETS.MEMBER,
        name: user?.name || "สมาชิกคริสตจักร",
      };
    }
  }

  // Mutation to update user display name
  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("บันทึกการแก้ไขชื่อโปรไฟล์สำเร็จ");
      setShowEditProfileModal(false);
      void utils.auth.me.invalidate();
    },
    onError: err => {
      toast.error(err.message || "ไม่สามารถบันทึกได้");
    },
    onSettled: () => {
      setIsSavingName(false);
    },
  });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.error("กรุณาระบุชื่อ");
      return;
    }
    setIsSavingName(true);
    await updateProfileMutation.mutateAsync({ name: editName.trim() });
  };

  const churchName =
    churchProfileQuery.data?.name || "คริสตจักรชีวิตสุขสันต์กาฬสินธุ์";
  const pendingApprovalsCount =
    pendingApprovalsQuery.data?.filter(w => w.status === "pending").length || 0;
  const unreadCount =
    notificationsQuery.data?.filter(n => !n.readAt).length || 0;

  return (
    <AppLayout
      activeRoute="/profile"
      title="Profile"
      subtitle="โปรไฟล์และข้อมูลสิทธิ์การใช้งานส่วนบุคคลในระบบ CFOS"
    >
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Role Preset Switcher for testing all 5 specified church data models ── */}
        <div className="bg-white rounded-3xl border border-[#E9D9BF] p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#E99A4A]" />
              <span className="text-xs font-bold text-[#38251B]">
                สลับมุมมองโปรไฟล์ (Data Model Preview):
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedPresetKey("AUTO")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedPresetKey === "AUTO"
                    ? "bg-[#E99A4A] text-white shadow-xs"
                    : "bg-[#FFF4DF] text-[#70452E] hover:bg-[#FBE9CD]"
                }`}
              >
                บัญชีฉันจริง ({user?.name ? user.name.slice(0, 10) : "ฉัน"})
              </button>
              <button
                onClick={() => setSelectedPresetKey("SUPER_ADMIN")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedPresetKey === "SUPER_ADMIN"
                    ? "bg-[#E99A4A] text-white shadow-xs"
                    : "bg-[#FFF4DF] text-[#70452E] hover:bg-[#FBE9CD]"
                }`}
              >
                👑 พณ.ท่านสุริยงค์
              </button>
              <button
                onClick={() => setSelectedPresetKey("PASTOR")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedPresetKey === "PASTOR"
                    ? "bg-[#E99A4A] text-white shadow-xs"
                    : "bg-[#FFF4DF] text-[#70452E] hover:bg-[#FBE9CD]"
                }`}
              >
                ✝️ ศบ.สรรเสริญ
              </button>
              <button
                onClick={() => setSelectedPresetKey("TREASURER")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedPresetKey === "TREASURER"
                    ? "bg-[#E99A4A] text-white shadow-xs"
                    : "bg-[#FFF4DF] text-[#70452E] hover:bg-[#FBE9CD]"
                }`}
              >
                💰 สุดารัตน์
              </button>
              <button
                onClick={() => setSelectedPresetKey("TREASURER_DEACON")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedPresetKey === "TREASURER_DEACON"
                    ? "bg-[#E99A4A] text-white shadow-xs"
                    : "bg-[#FFF4DF] text-[#70452E] hover:bg-[#FBE9CD]"
                }`}
              >
                💰+🤝 อ.ทัศนา (หลายบทบาท)
              </button>
              <button
                onClick={() => setSelectedPresetKey("MEMBER")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedPresetKey === "MEMBER"
                    ? "bg-[#E99A4A] text-white shadow-xs"
                    : "bg-[#FFF4DF] text-[#70452E] hover:bg-[#FBE9CD]"
                }`}
              >
                👤 สมาชิกทั่วไป
              </button>
            </div>
          </div>
        </div>

        {/* ── PROFILE HERO: Large Circular Avatar + Name + Badges ──────────────── */}
        <section className="bg-white rounded-3xl border border-[#E9D9BF] p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {/* Large Circular Avatar */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-[#FCE9CE] to-[#E99A4A]/25 border-4 border-white shadow-md flex items-center justify-center text-[#70452E] font-black text-3xl sm:text-4xl select-none">
                {activeProfile.name.slice(0, 1) || "ศ"}
              </div>
              <div className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-[#A8C978] border-2 border-white flex items-center justify-center shadow-xs">
                <Check className="w-4 h-4 text-white stroke-[3]" />
              </div>
            </div>

            {/* Name, Roles, and Department */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-[#38251B] tracking-tight break-words">
                    {activeProfile.name}
                  </h2>
                </div>
                <p className="text-sm font-semibold text-[#70452E] flex items-center justify-center sm:justify-start gap-1.5">
                  <Building className="w-4 h-4 text-[#E99A4A]" />
                  <span>{activeProfile.titles.join(" • ")}</span>
                </p>
                <p className="text-xs text-[#927D6D]">
                  {churchName} — {activeProfile.department}
                </p>
              </div>

              {/* Multiple Role Badges side by side */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                {activeProfile.roles.map(r => {
                  const style = ROLE_BADGE_STYLE[r] || ROLE_BADGE_STYLE.MEMBER;
                  return (
                    <span
                      key={r}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${style.bg} ${style.text} ${style.border} shadow-2xs`}
                    >
                      <span>{style.icon}</span>
                      <span>{style.label}</span>
                      <span className="font-mono text-[10px] opacity-75">
                        ({r})
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Large Primary Action Buttons ─────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 pt-6 border-t border-[#E9D9BF]/60">
            <button
              onClick={() => setShowIdCardModal(true)}
              className="w-full min-h-12 py-3 px-5 rounded-2xl bg-[#FFF4DF] hover:bg-[#FBE9CD] text-[#70452E] font-bold text-sm border border-[#E9D9BF] shadow-xs flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
            >
              <QrCode className="w-4 h-4 text-[#E99A4A]" />
              <span>ดูโปรไฟล์ / บัตรประจำตัวคริสตจักร</span>
            </button>
            <button
              onClick={() => {
                setEditName(activeProfile.name);
                setShowEditProfileModal(true);
              }}
              className="w-full min-h-12 py-3 px-5 rounded-2xl bg-[#E99A4A] hover:bg-[#DE8640] text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
            >
              <Edit3 className="w-4 h-4 stroke-[2.5]" />
              <span>แก้ไขโปรไฟล์</span>
            </button>
          </div>
        </section>

        {/* ── CARD 1: สิทธิ์การใช้งาน (Aggregated Permissions) ─────────────── */}
        <section className="bg-white rounded-3xl border border-[#E9D9BF] p-6 sm:p-8 space-y-5 shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-[#E9D9BF]/60 pb-4">
            <h3 className="text-base sm:text-lg font-bold text-[#38251B] flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-emerald-600" />
              <span>สิทธิ์การใช้งาน (Aggregated Permissions)</span>
            </h3>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              รวม {activeProfile.permissions.reduce((acc, p) => acc + p.items.length, 0)} สิทธิ์
            </span>
          </div>

          <div className="space-y-4">
            {activeProfile.permissions.map((group, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-[#FFF9EE] border border-[#E9D9BF]/70 space-y-3"
              >
                <p className="font-bold text-sm text-[#38251B] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{group.category}</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#674F42]">
                  {group.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CARD 2: หน้าที่รับผิดชอบ (Assigned Responsibilities) ──────────── */}
        <section className="bg-white rounded-3xl border border-[#E9D9BF] p-6 sm:p-8 space-y-5 shadow-sm">
          <div className="border-b border-[#E9D9BF]/60 pb-4">
            <h3 className="text-base sm:text-lg font-bold text-[#38251B] flex items-center gap-2.5">
              <Briefcase className="w-5 h-5 text-[#E99A4A]" />
              <span>หน้าที่รับผิดชอบตามตำแหน่ง (Responsibilities)</span>
            </h3>
            <p className="text-xs text-[#70452E]/80 mt-1">
              ภาระหน้าที่หลักที่ได้รับมอบหมายตามมติและระเบียบปฏิบัติคริสตจักร
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {activeProfile.responsibilities.map((resp, index) => (
              <div
                key={index}
                className="p-4 rounded-2xl bg-[#FFF9EE] border border-[#E9D9BF]/60 flex items-start gap-3 text-sm text-[#38251B]"
              >
                <div className="w-6 h-6 rounded-full bg-[#E99A4A]/20 text-[#70452E] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <span className="leading-relaxed font-medium">{resp}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── CONDITIONAL CARDS: For Financial Roles ─────────────────────────── */}
        {activeProfile.isFinancialRole && (
          <div className="space-y-6">
            {/* รายการทางการเงินล่าสุด */}
            <section className="bg-white rounded-3xl border border-[#E9D9BF] p-6 sm:p-8 space-y-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E9D9BF]/60 pb-4">
                <h3 className="text-base sm:text-lg font-bold text-[#38251B] flex items-center gap-2.5">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <span>รายการทางการเงินล่าสุด (Financial Overview)</span>
                </h3>
                <button
                  onClick={() => setLocation("/transactions")}
                  className="text-xs font-bold text-[#E99A4A] hover:underline flex items-center gap-1"
                >
                  <span>ดูทั้งหมด</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <p className="text-xs font-bold text-emerald-800">
                    เงินถวายเดือนนี้
                  </p>
                  <p className="text-xl font-black text-emerald-950">
                    ฿
                    {Number(
                      financeSummaryQuery.data?.monthlyIncome || 0
                    ).toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-[11px] text-emerald-700">ประจำเดือนปัจจุบัน</p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                  <p className="text-xs font-bold text-amber-800">
                    รายจ่ายเดือนนี้
                  </p>
                  <p className="text-xl font-black text-amber-950">
                    ฿
                    {Number(
                      financeSummaryQuery.data?.monthlyExpense || 0
                    ).toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-[11px] text-amber-700">รายจ่ายพันธกิจและดำเนินงาน</p>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-1">
                  <p className="text-xs font-bold text-blue-800">
                    ยอดเงินคงเหลือรวม
                  </p>
                  <p className="text-xl font-black text-blue-950">
                    ฿
                    {Number(
                      financeSummaryQuery.data?.totalBalance || 0
                    ).toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-[11px] text-blue-700">รวมทุกบัญชีและกองทุน</p>
                </div>
              </div>
            </section>

            {/* งานที่รอตรวจสอบ และ งานที่รออนุมัติ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <section className="bg-white rounded-3xl border border-[#E9D9BF] p-6 space-y-4 shadow-sm">
                <h3 className="text-base font-bold text-[#38251B] flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <span>งานที่รอตรวจสอบ</span>
                </h3>
                <div className="p-4 rounded-2xl bg-[#FFF9EE] border border-[#E9D9BF]/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#38251B]">
                      ตรวจสอบรอบนับเงินถวาย
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      พร้อมตรวจ
                    </span>
                  </div>
                  <p className="text-xs text-[#70452E]/80">
                    รอบนับเงินถวายประจำสัปดาห์ รอยืนยันยอดและนำฝากสมุดธนาคาร
                  </p>
                  <button
                    onClick={() => setLocation("/counting")}
                    className="mt-2 w-full py-2 px-3 rounded-xl bg-white border border-[#E9D9BF] text-xs font-bold text-[#70452E] hover:bg-[#FFF4DF] transition-all"
                  >
                    ไปที่ระบบนับเงินถวาย →
                  </button>
                </div>
              </section>

              <section className="bg-white rounded-3xl border border-[#E9D9BF] p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#38251B] flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>งานที่รออนุมัติ</span>
                  </h3>
                  {pendingApprovalsCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs">
                      {pendingApprovalsCount} รายการ
                    </span>
                  )}
                </div>
                <div className="p-4 rounded-2xl bg-[#FFF9EE] border border-[#E9D9BF]/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#38251B]">
                      คำขอเบิกเงินพันธกิจ
                    </span>
                    <span className="text-xs text-[#927D6D]">
                      {pendingApprovalsCount} รายการรอการพิจารณา
                    </span>
                  </div>
                  <p className="text-xs text-[#70452E]/80">
                    คำขอเบิกงบประมาณโครงการที่ยื่นเข้ามาจากฝ่ายต่าง ๆ
                  </p>
                  <button
                    onClick={() => setLocation("/approvals")}
                    className="mt-2 w-full py-2 px-3 rounded-xl bg-[#E99A4A] text-white text-xs font-bold hover:bg-[#DE8640] transition-all"
                  >
                    เปิดหน้าการอนุมัติ →
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* ── CONDITIONAL CARDS: For MEMBER Role ─────────────────────────────── */}
        {!activeProfile.isFinancialRole && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* ประวัติการถวายของฉัน */}
              <section className="bg-white rounded-3xl border border-[#E9D9BF] p-6 space-y-4 shadow-sm">
                <h3 className="text-base font-bold text-[#38251B] flex items-center gap-2">
                  <HeartHandshake className="w-5 h-5 text-rose-500" />
                  <span>ประวัติการถวายของฉัน</span>
                </h3>
                <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-2">
                  <p className="text-xs font-bold text-rose-900">
                    ความปลอดภัยของข้อมูลส่วนบุคคล (Security Rule)
                  </p>
                  <p className="text-xs text-rose-800/80 leading-relaxed">
                    ข้อมูลการถวายของท่านถูกเก็บเป็นความลับสูงสุด เฉพาะตัวท่านและเหรัญญิกเท่านั้นที่เข้าถึงได้
                  </p>
                  <button
                    onClick={() => setLocation("/offerings")}
                    className="mt-2 w-full py-2 px-3 rounded-xl bg-white border border-rose-200 text-xs font-bold text-rose-800 hover:bg-rose-50 transition-all"
                  >
                    ดูประวัติการถวายของฉัน →
                  </button>
                </div>
              </section>

              {/* ใบเสร็จของฉัน */}
              <section className="bg-white rounded-3xl border border-[#E9D9BF] p-6 space-y-4 shadow-sm">
                <h3 className="text-base font-bold text-[#38251B] flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-[#E99A4A]" />
                  <span>ใบเสร็จของฉัน</span>
                </h3>
                <div className="p-4 rounded-2xl bg-[#FFF9EE] border border-[#E9D9BF]/60 space-y-2">
                  <p className="text-xs font-bold text-[#38251B]">
                    ใบเสร็จรับเงินถวายทางการ
                  </p>
                  <p className="text-xs text-[#70452E]/80">
                    ใบเสร็จรับเงินบริจาคประจำปีสำหรับใช้ลดหย่อนภาษี
                  </p>
                  <button
                    onClick={() => setLocation("/reports")}
                    className="mt-2 w-full py-2 px-3 rounded-xl bg-white border border-[#E9D9BF] text-xs font-bold text-[#70452E] hover:bg-[#FFF4DF] transition-all"
                  >
                    ดาวน์โหลดใบเสร็จรับเงิน →
                  </button>
                </div>
              </section>
            </div>

            {/* ตารางรับใช้ และ กิจกรรมของฉัน */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <section className="bg-white rounded-3xl border border-[#E9D9BF] p-6 space-y-4 shadow-sm">
                <h3 className="text-base font-bold text-[#38251B] flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span>ตารางรับใช้</span>
                </h3>
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
                  <p className="text-xs font-bold text-blue-900">
                    ตารางปรนนิบัติในวันอาทิตย์นี้
                  </p>
                  <p className="text-xs text-blue-800/80">
                    ทีมนมัสการ • ฝ่ายต้อนรับ • ฝ่ายโสตทัศนูปกรณ์
                  </p>
                  <button
                    onClick={() => setLocation("/updates")}
                    className="mt-2 w-full py-2 px-3 rounded-xl bg-white border border-blue-200 text-xs font-bold text-blue-800 hover:bg-blue-50 transition-all"
                  >
                    ดูตารางรับใช้ทั้งหมด →
                  </button>
                </div>
              </section>

              <section className="bg-white rounded-3xl border border-[#E9D9BF] p-6 space-y-4 shadow-sm">
                <h3 className="text-base font-bold text-[#38251B] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <span>กิจกรรมของฉัน</span>
                </h3>
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                  <p className="text-xs font-bold text-emerald-900">
                    กิจกรรมและคลาสเรียนพระคัมภีร์
                  </p>
                  <p className="text-xs text-emerald-800/80">
                    ชั้นเรียนผู้เชื่อใหม่ และสัมมนาครอบครัวคริสเตียน
                  </p>
                  <button
                    onClick={() => setLocation("/updates")}
                    className="mt-2 w-full py-2 px-3 rounded-xl bg-white border border-emerald-200 text-xs font-bold text-emerald-800 hover:bg-emerald-50 transition-all"
                  >
                    ดูกิจกรรมคริสตจักร →
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* ── CARD 4: ความปลอดภัยและบัญชีผู้ใช้งาน (Security) ──────────────── */}
        <section className="bg-white rounded-3xl border border-[#E9D9BF] p-6 sm:p-8 space-y-5 shadow-sm">
          <div className="border-b border-[#E9D9BF]/60 pb-4">
            <h3 className="text-base sm:text-lg font-bold text-[#38251B] flex items-center gap-2.5">
              <Lock className="w-5 h-5 text-[#70452E]" />
              <span>ความปลอดภัยและบัญชีผู้ใช้ (Account & Security)</span>
            </h3>
            <p className="text-xs text-[#70452E]/80 mt-1">
              ข้อมูลบัญชีล็อกอิน การยืนยันตัวตน และเซสชันปัจจุบัน
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-2xl bg-[#FFF9EE] border border-[#E9D9BF]/60 space-y-1">
              <span className="text-xs font-bold text-[#70452E]">อีเมลเข้าสู่ระบบ</span>
              <p className="font-semibold text-[#38251B]">
                {user?.email || "vtr30025389@gmail.com"}
              </p>
              <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                <Check className="w-3 h-3 stroke-[3]" />
                ยืนยันตัวตนเรียบร้อยผ่าน Clerk Security
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFF9EE] border border-[#E9D9BF]/60 space-y-1">
              <span className="text-xs font-bold text-[#70452E]">วิธีการเข้าสู่ระบบ</span>
              <p className="font-semibold text-[#38251B] capitalize">
                {user?.loginMethod || "Google OAuth (Clerk Auth)"}
              </p>
              <span className="text-[11px] text-[#927D6D]">
                เข้าใช้ล่าสุด:{" "}
                {user?.lastSignedIn
                  ? new Date(user.lastSignedIn).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "วันนี้"}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <p className="text-xs text-[#927D6D]">
              หากต้องการออกจากระบบในอุปกรณ์นี้ กรุณากดปุ่มด้านขวา
            </p>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-2.5 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-100"
            >
              <LogOut className="h-4 w-4" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </section>

        {/* ── CARD 5: การแจ้งเตือน (Notifications) ─────────────────────────── */}
        <section className="bg-white rounded-3xl border border-[#E9D9BF] p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-[#38251B] flex items-center gap-2.5">
              <Bell className="w-5 h-5 text-[#E99A4A]" />
              <span>การแจ้งเตือน (Notifications)</span>
            </h3>
            {unreadCount > 0 ? (
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold">
                {unreadCount} ข้อความใหม่
              </span>
            ) : (
              <span className="text-xs text-[#927D6D]">อ่านครบทุกข้อความแล้ว</span>
            )}
          </div>
          <div className="p-4 rounded-2xl bg-[#FFF9EE] border border-[#E9D9BF]/60 flex items-center justify-between">
            <span className="text-xs text-[#70452E]">
              รับการแจ้งเตือนเมื่อมีการอัปเดตสถานะเบิกจ่าย หรือรอบนับเงิน
            </span>
            <button
              onClick={() => setLocation("/notifications")}
              className="py-1.5 px-3 rounded-xl bg-white border border-[#E9D9BF] text-xs font-bold text-[#70452E] hover:bg-[#FFF4DF]"
            >
              เปิดศูนย์แจ้งเตือน
            </button>
          </div>
        </section>

      </div>

      {/* ── MODAL 1: ดูโปรไฟล์ / บัตรประจำตัวคริสตจักร (Digital ID Card) ──────── */}
      {showIdCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] border border-[#E9D9BF] max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowIdCardModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-stone-100 text-[#70452E] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1 pt-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#DCECC5] text-[#4F6E28] uppercase tracking-wider">
                Digital Church Member ID
              </span>
              <h3 className="text-xl font-black text-[#38251B] pt-1">
                บัตรประจำตัวสมาชิกคริสตจักร
              </h3>
              <p className="text-xs text-[#70452E]">{churchName}</p>
            </div>

            {/* ID Card Box */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#FFF4DF] via-[#FFF9EE] to-[#FCE9CE] border border-[#E9D9BF] shadow-sm text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-white shadow-md border-3 border-[#E99A4A] flex items-center justify-center text-3xl font-black text-[#70452E]">
                {activeProfile.name.slice(0, 1)}
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-black text-[#38251B]">
                  {activeProfile.name}
                </h4>
                <p className="text-xs font-bold text-[#E99A4A]">
                  {activeProfile.titles.join(" • ")}
                </p>
              </div>

              {/* QR Code Demo Representation */}
              <div className="p-4 bg-white rounded-2xl border border-[#E9D9BF] inline-block shadow-2xs">
                <QrCode className="w-28 h-28 text-[#38251B]" />
                <p className="text-[10px] text-[#927D6D] font-mono mt-1">
                  MEMBER-ID: CFOS-{activeProfile.id.toUpperCase()}-2026
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left pt-2 border-t border-[#E9D9BF]/70 text-xs">
                <div>
                  <span className="text-[10px] text-[#927D6D]">สังกัด:</span>
                  <p className="font-bold text-[#38251B] truncate">
                    {churchName}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-[#927D6D]">สถานะ:</span>
                  <p className="font-bold text-emerald-700">ยืนยันแล้ว (Active)</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIdCardModal(false)}
              className="w-full py-3 rounded-2xl bg-[#38251B] text-white font-bold text-sm hover:bg-[#2A1C14] transition-all"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL 2: แก้ไขโปรไฟล์ (Edit Profile Dialog) ───────────────────── */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] border border-[#E9D9BF] max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowEditProfileModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-stone-100 text-[#70452E] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-[#38251B]">
                แก้ไขโปรไฟล์ผู้ใช้งาน
              </h3>
              <p className="text-xs text-[#70452E]/80">
                ปรับปรุงชื่อที่แสดงในระบบ CFOS และเอกสารทางการเงิน
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#38251B]">
                  ชื่อ-นามสกุลทางการ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-[#E9D9BF] text-sm font-semibold text-[#38251B] focus:border-[#E99A4A] focus:outline-none focus:ring-2 focus:ring-[#E99A4A]/20 transition-all"
                  placeholder="ระบุชื่อ-นามสกุล..."
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FFF9EE] border border-[#E9D9BF]/60 text-xs text-[#70452E]/80 space-y-1">
                <span className="font-bold text-[#38251B]">หมายเหตุ:</span>
                <p>
                  บทบาทและสิทธิ์การใช้งานจะถูกกำหนดโดยผู้ดูแลระบบสูงสุด
                  หากต้องการปรับเปลี่ยนตำแหน่ง กรุณาติดต่อ พณ.ท่านสุริยงค์ บาลเพ็ชร
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="flex-1 py-3 rounded-2xl border border-[#E9D9BF] text-sm font-bold text-[#70452E] hover:bg-[#FFF9EE] transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSavingName}
                  className="flex-1 py-3 rounded-2xl bg-[#E99A4A] hover:bg-[#DE8640] text-white text-sm font-bold shadow-xs transition-all disabled:opacity-50"
                >
                  {isSavingName ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
