import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Banknote,
  Building,
  CheckCircle2,
  CreditCard,
  Globe,
  Loader2,
  Lock,
  Mail,
  Phone,
  QrCode,
  Save,
  Settings as SettingsIcon,
  Shield,
  UserCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { useAuth } from "@/_core/hooks/useAuth";
import { LogOut } from "lucide-react";
import { EXPENSE_CATEGORIES, OFFERING_CATEGORIES } from "@shared/categories";

export default function Settings() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "church" | "roles" | "categories" | "payment"
  >("church");
  const utils = trpc.useUtils();

  const {
    data: churchProfile,
    isLoading,
    refetch,
  } = trpc.church.getProfile.useQuery(undefined, { retry: false });

  const usersQuery = trpc.auth.listUsers.useQuery(undefined, {
    enabled: activeTab === "roles",
    retry: false,
  });

  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  const setRoleMutation = trpc.auth.setChurchRole.useMutation({
    onSuccess: () => {
      toast.success("อัปเดตบทบาทผู้ใช้งานเรียบร้อยแล้ว");
      void usersQuery.refetch();
      void utils.auth.me.invalidate();
    },
    onError: err => {
      toast.error(err.message || "ไม่สามารถอัปเดตบทบาทได้");
    },
    onSettled: () => {
      setUpdatingUserId(null);
    },
  });

  const handleRoleChange = async (userId: number, newRole: string) => {
    setUpdatingUserId(userId);
    try {
      await setRoleMutation.mutateAsync({
        userId,
        churchRole: newRole as any,
      });
    } catch {
      // Handled in onError
    }
  };

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [pastorName, setPastorName] = useState("");
  const [assistantPastorName, setAssistantPastorName] = useState("");
  const [treasurerName, setTreasurerName] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [motto, setMotto] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [baseline, setBaseline] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    pastorName: "",
    treasurerName: "",
    motto: "",
  });

  useEffect(() => {
    const loaded = {
      name: churchProfile?.name || "",
      address: churchProfile?.address || "",
      phone: churchProfile?.phone || "",
      email: churchProfile?.email || "",
      pastorName: churchProfile?.pastorName || "",
      treasurerName: churchProfile?.treasurerName || "",
      motto: churchProfile?.motto || "",
    };
    setName(loaded.name);
    setAddress(loaded.address);
    setPhone(loaded.phone);
    setEmail(loaded.email);
    setWebsite(churchProfile?.website || "");
    setPastorName(loaded.pastorName);
    setAssistantPastorName(churchProfile?.assistantPastorName || "");
    setTreasurerName(loaded.treasurerName);
    setBankName(churchProfile?.bankName || "");
    setBankAccount(churchProfile?.bankAccount || "");
    setBankAccountName(churchProfile?.bankAccountName || "");
    setMotto(loaded.motto);
    setBaseline(loaded);
  }, [churchProfile]);

  const isDirty =
    name !== baseline.name ||
    address !== baseline.address ||
    phone !== baseline.phone ||
    email !== baseline.email ||
    pastorName !== baseline.pastorName ||
    treasurerName !== baseline.treasurerName ||
    motto !== baseline.motto;
  useUnsavedChanges(isDirty);

  const updateProfileMutation = trpc.church.updateProfile.useMutation({
    onSuccess: () => {
      setIsSaving(false);
      void utils.church.getProfile.invalidate();
      toast.success("บันทึกการตั้งค่าข้อมูลคริสตจักรเรียบร้อยแล้ว");
      refetch();
    },
    onError: error => {
      setIsSaving(false);
      toast.error(
        error.message || "บันทึกการตั้งค่าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
      );
    },
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    updateProfileMutation.mutate({
      name,
      address,
      phone,
      email,
      website,
      pastorName,
      assistantPastorName,
      treasurerName,
      bankName,
      bankAccount,
      bankAccountName,
      fiscalYearStartMonth: churchProfile?.fiscalYearStartMonth ?? 1,
      motto,
    });
  };

  const churchRoles = [
    {
      role: "SUPER_ADMIN",
      title: "ผู้ดูแลระบบสูงสุด",
      appointee: "พณ.ท่านหม่อมหลวงราชวงศ์สุริยงค์ บาลเพ็ชร",
      desc: "ดูแลระบบและโครงสร้างทั้งหมด จัดการผู้ใช้งานและสิทธิ์ ตั้งค่าคริสตจักร และตรวจสอบ Audit Log (สิทธิ์สูงสุดของระบบ)",
      duties: [
        "ดูแลระบบและโครงสร้างทั้งหมด",
        "จัดการผู้ใช้งานและสิทธิ์",
        "ตั้งค่าคริสตจักร",
        "ตรวจสอบ Audit Log",
        "เข้าถึงข้อมูลทุกส่วนตามสิทธิ์สูงสุดของระบบ",
      ],
    },
    {
      role: "TREASURER",
      title: "เหรัญญิกคริสตจักร",
      appointee: "สุดารัตน์ จิณเซ่ง, อาจารย์ทัศนา ดวงจิตร",
      desc: "บันทึกรายรับ-รายจ่าย ตรวจสอบเงินถวายและบัญชี จัดการเบิกจ่าย ติดตามงบประมาณ ออกใบเสร็จ และจัดทำรายงานการเงิน",
      duties: [
        "บันทึกรายรับและรายจ่าย",
        "ตรวจสอบเงินถวาย",
        "ตรวจสอบบัญชีและยอดเงิน",
        "จัดการรายการเบิกจ่าย",
        "ตรวจสอบและติดตามงบประมาณ",
        "ออกใบเสร็จรับเงินถวาย",
        "จัดทำรายงานทางการเงิน",
      ],
    },
    {
      role: "PASTOR",
      title: "ศิษยาภิบาล / ผู้นำฝ่ายวิญญาณ",
      appointee: "ศบ.อาจารย์สรรเสริญ ดวงจิตร",
      desc: "กำกับทิศทางและงานของคริสตจักร พิจารณาและอนุมัติโครงการ ตรวจสอบภาพรวมการเงิน และดูแลด้านอภิบาลสมาชิก",
      duties: [
        "กำกับทิศทางและงานของคริสตจักร",
        "พิจารณาและอนุมัติโครงการตามอำนาจที่กำหนด",
        "ตรวจสอบภาพรวมด้านการเงิน",
        "ติดตามการดำเนินงานของฝ่ายต่าง ๆ",
        "ดูแลด้านอภิบาลและสมาชิก",
        "ติดตามผลการดำเนินพันธกิจ",
      ],
    },
    {
      role: "DEACON",
      title: "มัคนายก / คณะกรรมการ",
      appointee: "อาจารย์ทัศนา ดวงจิตร",
      desc: "ดูแลและติดตามงานตามฝ่ายที่รับผิดชอบ ตรวจรับงานและติดตามโครงการ เสนอคำของบประมาณและรายการเบิกจ่าย",
      duties: [
        "ดูแลและติดตามงานตามฝ่ายที่รับผิดชอบ",
        "ตรวจรับงานและติดตามโครงการ",
        "เสนอคำของบประมาณ",
        "เสนอรายการเบิกจ่าย",
        "ตรวจสอบการใช้ทรัพยากรของฝ่าย",
        "ดูรายงานเฉพาะส่วนที่ได้รับมอบหมาย",
      ],
    },
    {
      role: "MEMBER",
      title: "สมาชิกคริสตจักร",
      appointee: "สมาชิกคริสตจักรทั่วไป",
      desc: "ดูข่าวสาร ประกาศ ตารางกิจกรรม ตารางรับใช้ และดูประวัติการถวายส่วนบุคคลอย่างปลอดภัย",
      duties: [
        "ดูข่าวสารและประกาศ",
        "ดูตารางกิจกรรมและตารางรับใช้",
        "ดูข้อมูลกิจกรรมที่ตนเองเกี่ยวข้อง",
        "ดูประวัติการถวายส่วนบุคคล",
        "ดูใบเสร็จหรือหลักฐานการถวายของตนเอง",
        "จัดการข้อมูลส่วนตัวตามที่ระบบอนุญาต",
      ],
    },
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Banner */}
        <div className="bg-[#FFF4DF] border border-[#E9D9BF] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#DCECC5] text-[#70452E]">
              <SettingsIcon className="w-3.5 h-3.5 text-[#A8C978]" />
              การจัดการและการกำหนดค่าระบบ
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-[#38251B]">
              ตั้งค่าคริสตจักร (Settings)
            </h1>
            <p className="text-sm text-[#70452E]/80 max-w-xl">
              กำหนดข้อมูลพื้นฐาน สิทธิ์การใช้งานระบบ หมวดหมู่บัญชี
              และช่องทางการรับเงินถวายอย่างปลอดภัย
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 sm:gap-2 border-b border-[#E9D9BF] pb-1 overflow-x-auto no-scrollbar -mx-1 px-1 touch-pan-x">
          <button
            onClick={() => setActiveTab("church")}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
              activeTab === "church"
                ? "bg-[#FFF4DF] text-[#38251B] border border-[#E9D9BF] shadow-2xs"
                : "text-[#70452E]/70 hover:text-[#38251B]"
            }`}
          >
            <Building className="w-4 h-4 text-[#E99A4A] shrink-0" />
            <span>ข้อมูลคริสตจักร</span>
          </button>
          <button
            onClick={() => setActiveTab("roles")}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
              activeTab === "roles"
                ? "bg-[#FFF4DF] text-[#38251B] border border-[#E9D9BF] shadow-2xs"
                : "text-[#70452E]/70 hover:text-[#38251B]"
            }`}
          >
            <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>บทบาทและสิทธิ์</span>
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
              activeTab === "categories"
                ? "bg-[#FFF4DF] text-[#38251B] border border-[#E9D9BF] shadow-2xs"
                : "text-[#70452E]/70 hover:text-[#38251B]"
            }`}
          >
            <Banknote className="w-4 h-4 text-amber-600 shrink-0" />
            <span>หมวดหมู่บัญชี</span>
          </button>
          <button
            onClick={() => setActiveTab("payment")}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
              activeTab === "payment"
                ? "bg-[#FFF4DF] text-[#38251B] border border-[#E9D9BF] shadow-2xs"
                : "text-[#70452E]/70 hover:text-[#38251B]"
            }`}
          >
            <QrCode className="w-4 h-4 text-sky-600 shrink-0" />
            <span>บัญชีธนาคาร & พร้อมเพย์</span>
          </button>
        </div>

        {/* Tab 1: Church Profile Form */}
        {activeTab === "church" && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="bg-white rounded-3xl border border-[#E9D9BF] p-6 md:p-8 space-y-5 shadow-sm">
              <h3 className="text-base font-bold text-[#38251B] flex items-center gap-2">
                <Building className="w-5 h-5 text-[#E99A4A]" />
                ข้อมูลทั่วไปของคริสตจักร
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-semibold text-[#38251B]">
                    ชื่อคริสตจักร <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-[#E9D9BF] text-sm font-semibold text-[#38251B]"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-semibold text-[#38251B]">
                    คำขวัญ / นิมิตคริสตจักร
                  </label>
                  <input
                    type="text"
                    value={motto}
                    onChange={e => setMotto(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-[#E9D9BF] text-sm text-[#38251B]"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-semibold text-[#38251B]">
                    ที่อยู่คริสตจักร
                  </label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-[#E9D9BF] text-sm text-[#38251B]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-[#38251B]">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-[#E9D9BF] text-sm text-[#38251B]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-[#38251B]">
                    อีเมลทางการ
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-[#E9D9BF] text-sm text-[#38251B]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-[#38251B]">
                    ศิษยาภิบาลอาวุโส
                  </label>
                  <input
                    type="text"
                    value={pastorName}
                    onChange={e => setPastorName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-[#E9D9BF] text-sm text-[#38251B]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-[#38251B]">
                    เหรัญญิกคริสตจักร
                  </label>
                  <input
                    type="text"
                    value={treasurerName}
                    onChange={e => setTreasurerName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-[#E9D9BF] text-sm text-[#38251B]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-3 rounded-2xl bg-[#E99A4A] hover:bg-[#d88939] text-white font-semibold text-sm shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}</span>
              </button>
            </div>
          </form>
        )}

        {/* Account and sign out */}
        {activeTab === "church" && (
          <section className="rounded-3xl border border-[#E9D9BF] bg-white p-6 shadow-sm md:p-8">
            <h3 className="text-base font-bold text-[#38251B]">บัญชีผู้ใช้</h3>
            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-[#674F42]">
                <p className="font-bold text-[#38251B]">
                  {user?.name || "ผู้ใช้งาน"}
                </p>
                <p>{user?.email || "ไม่ระบุอีเมล"}</p>
                <p className="mt-1">
                  บทบาทในระบบ:{" "}
                  <span className="font-bold text-emerald-700">
                    {user?.churchRole === "SUPER_ADMIN"
                      ? "👑 ผู้ดูแลระบบสูงสุด (SUPER_ADMIN)"
                      : user?.churchRole === "PASTOR"
                      ? "✝️ ศิษยาภิบาล (PASTOR)"
                      : user?.churchRole === "TREASURER"
                      ? "💰 เหรัญญิกคริสตจักร (TREASURER)"
                      : user?.churchRole === "DEACON"
                      ? "🤝 มัคนายก / คณะกรรมการ (DEACON)"
                      : user?.churchRole === "COUNTER"
                      ? "📝 ทีมนับเงินถวาย (COUNTER)"
                      : user?.churchRole === "MEMBER"
                      ? "👤 สมาชิกคริสตจักร (MEMBER)"
                      : user?.role === "admin"
                      ? "👑 ผู้ดูแลระบบ (Admin)"
                      : "👤 สมาชิกทั่วไป"}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/profile"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#E9D9BF] bg-[#FFF4DF] px-5 py-2.5 text-sm font-bold text-[#70452E] transition-colors hover:bg-[#FBE9CD]"
                >
                  <UserCheck className="h-4 w-4 text-[#E99A4A]" />
                  ดูโปรไฟล์เต็ม
                </Link>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-100"
                >
                  <LogOut className="h-4 w-4" />
                  ออกจากระบบ
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Tab 2: Roles & User Management */}
        {activeTab === "roles" && (
          <div className="space-y-6">
            {/* User Management Table */}
            <div className="bg-white rounded-3xl border border-[#E9D9BF] p-6 md:p-8 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E9D9BF]/60 pb-5">
                <div>
                  <h3 className="text-lg font-bold text-[#38251B] flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#E99A4A]" />
                    จัดการบทบาทและสิทธิ์ผู้ใช้งานในระบบ
                  </h3>
                  <p className="text-xs text-[#70452E]/80 mt-1">
                    กำหนดบทบาทให้ผู้ที่เข้าสู่ระบบ เพื่อให้ได้รับสิทธิ์การใช้งานตรงตามตำแหน่งหน้าที่จริง
                  </p>
                </div>
                {user?.churchRole === "SUPER_ADMIN" || user?.role === "admin" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 self-start sm:self-auto">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    คุณมีสิทธิ์กำหนดบทบาท
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 self-start sm:self-auto">
                    เฉพาะผู้ดูแลระบบสูงสุดที่สามารถเปลี่ยนสิทธิ์ได้
                  </span>
                )}
              </div>

              {usersQuery.isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-sm text-[#70452E]/70 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-[#E99A4A]" />
                  <span>กำลังโหลดรายชื่อผู้ใช้งาน...</span>
                </div>
              ) : !usersQuery.data || usersQuery.data.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#70452E]/70 bg-[#FFF9EE] rounded-2xl border border-[#E9D9BF]/60">
                  ยังไม่พบข้อมูลผู้ใช้งานในระบบ
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#E9D9BF]/70 text-xs font-bold text-[#70452E]/80 uppercase">
                        <th className="pb-3 px-3">ผู้ใช้งาน</th>
                        <th className="pb-3 px-3">อีเมล</th>
                        <th className="pb-3 px-3">เข้าใช้ล่าสุด</th>
                        <th className="pb-3 px-3 text-right">บทบาทในระบบ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E9D9BF]/40">
                      {usersQuery.data.map(u => {
                        const isMe = u.openId === user?.openId;
                        const isUpdating = updatingUserId === u.id;
                        const canEdit =
                          user?.churchRole === "SUPER_ADMIN" ||
                          user?.role === "admin";

                        return (
                          <tr
                            key={u.id}
                            className="hover:bg-[#FFF9EE]/50 transition-colors"
                          >
                            <td className="py-3.5 px-3">
                              <div className="font-bold text-[#38251B] flex items-center gap-2">
                                <span>{u.name || "ไม่ระบุชื่อ"}</span>
                                {isMe && (
                                  <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full border border-amber-300">
                                    คุณ
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-[#674F42]">
                              {u.email || "-"}
                            </td>
                            <td className="py-3.5 px-3 text-xs text-[#927D6D]">
                              {u.lastSignedIn
                                ? new Date(u.lastSignedIn).toLocaleDateString("th-TH", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "-"}
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              {canEdit ? (
                                <div className="inline-flex items-center gap-2">
                                  {isUpdating && (
                                    <Loader2 className="w-4 h-4 animate-spin text-[#E99A4A]" />
                                  )}
                                  <select
                                    value={u.churchRole || "MEMBER"}
                                    disabled={isUpdating}
                                    onChange={e =>
                                      handleRoleChange(u.id, e.target.value)
                                    }
                                    className="px-3 py-1.5 rounded-xl border border-[#E9D9BF] bg-white text-xs font-semibold text-[#38251B] shadow-sm hover:border-[#E99A4A] focus:outline-none focus:ring-2 focus:ring-[#E99A4A]/20 transition-all cursor-pointer disabled:opacity-50"
                                  >
                                    <option value="SUPER_ADMIN">👑 ผู้ดูแลระบบสูงสุด (SUPER_ADMIN)</option>
                                    <option value="PASTOR">✝️ ศิษยาภิบาล (PASTOR)</option>
                                    <option value="TREASURER">💰 เหรัญญิกคริสตจักร (TREASURER)</option>
                                    <option value="DEACON">🤝 มัคนายก / คณะกรรมการ (DEACON)</option>
                                    <option value="COUNTER">📝 ทีมนับเงินถวาย (COUNTER)</option>
                                    <option value="MEMBER">👤 สมาชิกคริสตจักร (MEMBER)</option>
                                  </select>
                                </div>
                              ) : (
                                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF4DF] text-[#70452E] border border-[#E9D9BF]">
                                  {u.churchRole || "MEMBER"}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Structure and Appointed Roles Reference */}
            <div className="bg-white rounded-3xl border border-[#E9D9BF] p-6 md:p-8 space-y-6 shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-[#38251B] flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  โครงสร้างสิทธิ์การใช้งานและผู้รับผิดชอบอย่างเป็นทางการ
                </h3>
                <p className="text-xs text-[#70452E]/80 mt-1">
                  กำหนดบทบาท หน้าที่ความรับผิดชอบ และรายนามผู้ได้รับมอบหมายตามมติคริสตจักร
                </p>
              </div>

              <div className="space-y-4">
                {churchRoles.map(r => (
                  <div
                    key={r.role}
                    className="p-5 rounded-2xl bg-[#FFF9EE] border border-[#E9D9BF]/70 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E9D9BF]/50 pb-3">
                      <div>
                        <span className="font-bold text-base text-[#38251B]">
                          {r.title}
                        </span>
                        <span className="ml-2.5 font-mono text-xs text-[#70452E]/70 bg-white px-2.5 py-0.5 rounded-md border border-[#E9D9BF]">
                          {r.role}
                        </span>
                      </div>
                      <div className="text-xs font-semibold px-3 py-1 rounded-full border bg-white text-[#38251B] border-[#E9D9BF] self-start sm:self-auto">
                        ผู้รับผิดชอบ: <span className="text-[#E99A4A] font-bold">{r.appointee}</span>
                      </div>
                    </div>

                    <p className="text-xs text-[#70452E]/90 leading-relaxed font-medium">
                      {r.desc}
                    </p>

                    <div className="pt-1">
                      <p className="text-xs font-bold text-[#38251B] mb-1.5">ขอบเขตหน้าที่ในระบบ:</p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[#674F42]">
                        {r.duties.map((duty, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-600 font-bold">•</span>
                            <span>{duty}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Categories */}
        {activeTab === "categories" && (
          <div className="bg-white rounded-3xl border border-[#E9D9BF] p-6 md:p-8 space-y-5 shadow-sm">
            <h3 className="text-base font-bold text-[#38251B] flex items-center gap-2">
              <Banknote className="w-5 h-5 text-amber-600" />
              หมวดหมู่การเงินมาตรฐานคริสตจักร
            </h3>

            <p className="text-sm text-[#674F42]">
              หมวดหมู่เหล่านี้คือค่าที่ระบบใช้จริงทั้งในฐานข้อมูล แบบฟอร์ม
              และรายงาน
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#E9D9BF]/60 bg-[#FFF9EE] p-4">
                <p className="font-bold text-[#38251B]">
                  หมวดรายรับ (เงินถวาย)
                </p>
                <ul className="mt-2 space-y-1">
                  {OFFERING_CATEGORIES.map(c => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-3 text-sm text-[#674F42]"
                    >
                      <span>{c.label}</span>
                      <span className="font-mono text-xs text-[#927D6D]">
                        {c.id}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-[#E9D9BF]/60 bg-[#FFF9EE] p-4">
                <p className="font-bold text-[#38251B]">หมวดรายจ่าย</p>
                <ul className="mt-2 space-y-1">
                  {EXPENSE_CATEGORIES.map(c => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-3 text-sm text-[#674F42]"
                    >
                      <span>{c.label}</span>
                      <span className="font-mono text-xs text-[#927D6D]">
                        {c.id}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Payment */}
        {activeTab === "payment" && (
          <div className="bg-white rounded-3xl border border-[#E9D9BF] p-6 md:p-8 space-y-5 shadow-sm">
            <h3 className="text-base font-bold text-[#38251B] flex items-center gap-2">
              <QrCode className="w-5 h-5 text-sky-600" />
              บัญชีรับเงินถวายและ QR พร้อมเพย์
            </h3>

            <div className="p-4 rounded-2xl bg-[#FFF4DF]/50 border border-[#E9D9BF] flex flex-col sm:flex-row items-center gap-6">
              <div className="w-32 h-32 bg-white p-2 rounded-2xl border border-[#E9D9BF] shadow-inner flex items-center justify-center">
                <QrCode className="w-24 h-24 text-[#38251B]" />
              </div>

              <div className="space-y-2 text-center sm:text-left text-xs">
                <p className="font-bold text-base text-[#38251B]">
                  {bankAccountName}
                </p>
                <p className="text-[#70452E]">
                  ธนาคาร:{" "}
                  <span className="font-semibold text-[#38251B]">
                    {bankName}
                  </span>
                </p>
                <p className="text-[#70452E]">
                  เลขที่บัญชี:{" "}
                  <span className="font-mono font-bold text-sm text-[#38251B]">
                    {bankAccount}
                  </span>
                </p>
                <p className="text-xs text-[#70452E]/70">
                  QR Code นี้จะแสดงในแบบฟอร์มถวายทรัพย์
                  เพื่อให้สมาชิกสแกนโอนได้สะดวก
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
