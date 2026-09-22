import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Banknote,
  Building,
  Loader2,
  Lock,
  QrCode,
  Save,
  Shield,
  UserCheck,
  FileText,
  Search,
  Filter,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Swal } from "@/lib/sweetalert";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { useAuth } from "@/_core/hooks/useAuth";
import { LogOut } from "lucide-react";
import { EXPENSE_CATEGORIES, OFFERING_CATEGORIES } from "@shared/categories";
import { isSuperAdmin, getChurchRoleInfo, CHURCH_ROLES } from "@shared/roles";
import { NativeSelect } from "@/components/ui/native-select";

export default function Settings() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "church" | "roles" | "categories" | "payment" | "audit"
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

  const auditQuery = trpc.audit.list.useQuery(
    { limit: 100 },
    {
      enabled: activeTab === "audit",
      retry: false,
    }
  );

  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const [roleSearch, setRoleSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  const [auditSearch, setAuditSearch] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState<string>("ALL");

  const setRoleMutation = trpc.auth.setChurchRole.useMutation({
    onSuccess: () => {
      void usersQuery.refetch();
      void utils.auth.me.invalidate();
      void auditQuery.refetch();
    },
    onError: err => {
      toast.error(err.message || "ไม่สามารถอัปเดตบทบาทได้");
    },
    onSettled: () => {
      setUpdatingUserId(null);
    },
  });

  const handleRoleChange = async (userId: number, newRole: string) => {
    const targetUser = usersQuery.data?.find(u => u.id === userId);
    const targetRoleInfo = getChurchRoleInfo(newRole as any);

    const isConfirmed = await Swal.confirm(
      "ยืนยันการเปลี่ยนบทบาท?",
      `คุณต้องการปรับบทบาทของ "${targetUser?.name || targetUser?.email || "ผู้ใช้งาน"}" เป็น "${targetRoleInfo.badgeLabel}" หรือไม่? ผู้ใช้จะได้รับสิทธิ์และเมนูตามบทบาทนี้ทันที`,
      {
        confirmButtonText: "ยืนยันเปลี่ยนบทบาท",
        cancelButtonText: "ยกเลิก",
      }
    );

    if (!isConfirmed) return;

    setUpdatingUserId(userId);
    try {
      await setRoleMutation.mutateAsync({
        userId,
        churchRole: newRole as any,
      });
      await Swal.success(
        "เปลี่ยนบทบาทสำเร็จ!",
        `ได้เปลี่ยนบทบาทของ ${targetUser?.name || "ผู้ใช้งาน"} เป็น ${targetRoleInfo.badgeLabel} เรียบร้อยแล้ว`
      );
    } catch (err: any) {
      await Swal.error(
        "ไม่สามารถเปลี่ยนบทบาทได้",
        err.message || "เกิดข้อผิดพลาดในการปรับเปลี่ยนบทบาท"
      );
    } finally {
      setUpdatingUserId(null);
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
    onSuccess: async () => {
      setIsSaving(false);
      void utils.church.getProfile.invalidate();
      refetch();
      await Swal.success(
        "บันทึกข้อมูลสำเร็จ!",
        "บันทึกการตั้งค่าข้อมูลคริสตจักรเรียบร้อยแล้ว"
      );
    },
    onError: async error => {
      setIsSaving(false);
      await Swal.error(
        "บันทึกไม่สำเร็จ",
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

  if (!isSuperAdmin(user)) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto my-12 bg-card rounded-3xl p-8 border-2 border-line text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-danger-soft border-2 border-danger-soft mx-auto flex items-center justify-center text-danger">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-ink">
            สิทธิ์การเข้าถึงถูกจำกัด (Restricted Access)
          </h2>
          <p className="text-sm text-ink-2/80">
            หน้านี้สงวนไว้สำหรับ{" "}
            <strong className="text-warning font-bold">
              ผู้ดูแลระบบสูงสุด (SUPER_ADMIN)
            </strong>{" "}
            เท่านั้น
            เพื่อความปลอดภัยของข้อมูลคริสตจักรและการกำหนดสิทธิ์ผู้ใช้งาน
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-brand text-white font-bold text-sm hover:bg-brand transition-all shadow-xs"
            >
              กลับสู่หน้าหลัก
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Banner */}
        <div className="bg-sunken border border-line rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-success-soft text-ink-2">
              การจัดการและการกำหนดค่าระบบ
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-ink">
              ตั้งค่าคริสตจักร (Settings)
            </h1>
            <p className="text-sm text-ink-2/80 max-w-xl">
              กำหนดข้อมูลพื้นฐาน สิทธิ์การใช้งานระบบ หมวดหมู่บัญชี
              และช่องทางการรับเงินถวายอย่างปลอดภัย
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 sm:gap-2 border-b border-line pb-1 overflow-x-auto no-scrollbar -mx-1 px-1 touch-pan-x">
          <button
            onClick={() => setActiveTab("church")}
            className={`min-h-11 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
              activeTab === "church"
                ? "bg-sunken text-ink border border-line shadow-2xs"
                : "text-ink-2/70 hover:text-ink"
            }`}
          >
            <Building className="w-4 h-4 text-brand shrink-0" />
            <span>ข้อมูลคริสตจักร</span>
          </button>
          <button
            onClick={() => setActiveTab("roles")}
            className={`min-h-11 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
              activeTab === "roles"
                ? "bg-sunken text-ink border border-line shadow-2xs"
                : "text-ink-2/70 hover:text-ink"
            }`}
          >
            <Shield className="w-4 h-4 text-success shrink-0" />
            <span>บทบาทและสิทธิ์</span>
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`min-h-11 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
              activeTab === "categories"
                ? "bg-sunken text-ink border border-line shadow-2xs"
                : "text-ink-2/70 hover:text-ink"
            }`}
          >
            <Banknote className="w-4 h-4 text-warning shrink-0" />
            <span>หมวดหมู่บัญชี</span>
          </button>
          <button
            onClick={() => setActiveTab("payment")}
            className={`min-h-11 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
              activeTab === "payment"
                ? "bg-sunken text-ink border border-line shadow-2xs"
                : "text-ink-2/70 hover:text-ink"
            }`}
          >
            <QrCode className="w-4 h-4 text-info shrink-0" />
            <span>บัญชีธนาคาร & พร้อมเพย์</span>
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`min-h-11 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
              activeTab === "audit"
                ? "bg-sunken text-ink border border-line shadow-2xs"
                : "text-ink-2/70 hover:text-ink"
            }`}
          >
            <FileText className="w-4 h-4 text-ink-2 shrink-0" />
            <span>ตรวจสอบประวัติ (Audit Log)</span>
          </button>
        </div>

        {/* Tab 1: Church Profile Form */}
        {activeTab === "church" && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="bg-card rounded-3xl border border-line p-6 md:p-8 space-y-5 shadow-sm">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                ข้อมูลทั่วไปของคริสตจักร
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-semibold text-ink">
                    ชื่อคริสตจักร <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-line text-sm font-semibold text-ink"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-semibold text-ink">
                    คำขวัญ / นิมิตคริสตจักร
                  </label>
                  <input
                    type="text"
                    value={motto}
                    onChange={e => setMotto(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-line text-sm text-ink"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-semibold text-ink">
                    ที่อยู่คริสตจักร
                  </label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-line text-sm text-ink"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-ink">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-line text-sm text-ink"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-ink">อีเมลทางการ</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-line text-sm text-ink"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-ink">
                    ศิษยาภิบาลอาวุโส
                  </label>
                  <input
                    type="text"
                    value={pastorName}
                    onChange={e => setPastorName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-line text-sm text-ink"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-ink">
                    เหรัญญิกคริสตจักร
                  </label>
                  <input
                    type="text"
                    value={treasurerName}
                    onChange={e => setTreasurerName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-line text-sm text-ink"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-3 rounded-2xl bg-brand hover:bg-brand text-white font-semibold text-sm shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}</span>
              </button>
            </div>
          </form>
        )}

        {/* Account and sign out */}
        {activeTab === "church" && (
          <section className="rounded-3xl border border-line bg-card p-6 shadow-sm md:p-8">
            <h3 className="text-base font-bold text-ink">บัญชีผู้ใช้</h3>
            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-ink-2">
                <p className="font-bold text-ink">
                  {user?.name || "ผู้ใช้งาน"}
                </p>
                <p>{user?.email || "ไม่ระบุอีเมล"}</p>
                <p className="mt-1">
                  บทบาทในระบบ:{" "}
                  <span className="font-bold text-success">
                    {getChurchRoleInfo(user?.churchRole).badgeLabel}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/profile"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-line bg-sunken px-5 py-2.5 text-sm font-bold text-ink-2 transition-colors hover:bg-line"
                >
                  <UserCheck className="h-4 w-4 text-brand" />
                  ดูโปรไฟล์เต็ม
                </Link>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-danger-soft bg-danger-soft px-5 py-2.5 text-sm font-bold text-danger transition-colors hover:bg-danger-soft"
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
            <div className="bg-card rounded-3xl border border-line p-6 md:p-8 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line/60 pb-5">
                <div>
                  <h3 className="text-lg font-bold text-ink flex items-center gap-2">
                    จัดการบทบาทและสิทธิ์ผู้ใช้งานในระบบ
                  </h3>
                  <p className="text-xs text-ink-2/80 mt-1">
                    กำหนดบทบาทให้ผู้ที่เข้าสู่ระบบ
                    เพื่อให้ได้รับสิทธิ์การใช้งานตรงตามตำแหน่งหน้าที่จริง
                  </p>
                </div>
                {user?.churchRole === "SUPER_ADMIN" ||
                user?.role === "admin" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-success-soft text-success border border-success-line self-start sm:self-auto">
                    คุณมีสิทธิ์กำหนดบทบาท
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-warning-soft text-warning border border-warning-line self-start sm:self-auto">
                    เฉพาะผู้ดูแลระบบสูงสุดที่สามารถเปลี่ยนสิทธิ์ได้
                  </span>
                )}
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-2/50" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อผู้ใช้งาน หรือ อีเมล..."
                    value={roleSearch}
                    onChange={e => setRoleSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-line bg-page/40 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-ink-2/60 shrink-0" />
                  <NativeSelect
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    className="font-semibold focus:ring-2 focus:ring-brand/20"
                  >
                    <option value="ALL">บทบาททั้งหมด</option>
                    <option value="SUPER_ADMIN">ผู้ดูแลระบบสูงสุด</option>
                    <option value="PASTOR">ศิษยาภิบาล</option>
                    <option value="TREASURER">เหรัญญิก</option>
                    <option value="DEACON">มัคนายก</option>
                    <option value="COUNTER">ทีมนับเงิน</option>
                    <option value="MEMBER">สมาชิกทั่วไป</option>
                  </NativeSelect>
                </div>
              </div>

              {usersQuery.isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-sm text-ink-2/70 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-brand" />
                  <span>กำลังโหลดรายชื่อผู้ใช้งาน...</span>
                </div>
              ) : !usersQuery.data || usersQuery.data.length === 0 ? (
                <div className="py-8 text-center text-sm text-ink-2/70 bg-page rounded-2xl border border-line/60">
                  ยังไม่พบข้อมูลผู้ใช้งานในระบบ
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-line/70 text-xs font-bold text-ink-2/80 uppercase">
                        <th className="pb-3 px-3">ผู้ใช้งาน</th>
                        <th className="pb-3 px-3">อีเมล</th>
                        <th className="pb-3 px-3">เข้าใช้ล่าสุด</th>
                        <th className="pb-3 px-3 text-right">บทบาทในระบบ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/40">
                      {(() => {
                        const filteredUsers = (usersQuery.data || []).filter(
                          u => {
                            const matchesSearch =
                              !roleSearch ||
                              (u.name &&
                                u.name
                                  .toLowerCase()
                                  .includes(roleSearch.toLowerCase())) ||
                              (u.email &&
                                u.email
                                  .toLowerCase()
                                  .includes(roleSearch.toLowerCase()));
                            const matchesFilter =
                              roleFilter === "ALL" ||
                              (u.churchRole || "MEMBER") === roleFilter;
                            return matchesSearch && matchesFilter;
                          }
                        );

                        if (filteredUsers.length === 0) {
                          return (
                            <tr>
                              <td
                                colSpan={4}
                                className="py-8 text-center text-xs text-ink-2/70 bg-page/30"
                              >
                                ไม่พบผู้ใช้งานที่ตรงกับเงื่อนไขการค้นหา
                              </td>
                            </tr>
                          );
                        }

                        return filteredUsers.map(u => {
                          const isMe = u.openId === user?.openId;
                          const isUpdating = updatingUserId === u.id;
                          const canEdit =
                            user?.churchRole === "SUPER_ADMIN" ||
                            user?.role === "admin";

                          return (
                            <tr
                              key={u.id}
                              className="hover:bg-page/50 transition-colors"
                            >
                              <td className="py-3.5 px-3">
                                <div className="font-bold text-ink flex items-center gap-2">
                                  <span>{u.name || "ไม่ระบุชื่อ"}</span>
                                  {isMe && (
                                    <span className="text-[10px] bg-warning-soft text-warning font-semibold px-2 py-0.5 rounded-full border border-warning-line">
                                      คุณ
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3.5 px-3 text-ink-2">
                                {u.email || "-"}
                              </td>
                              <td className="py-3.5 px-3 text-xs text-ink-3">
                                {u.lastSignedIn
                                  ? new Date(u.lastSignedIn).toLocaleDateString(
                                      "th-TH",
                                      {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }
                                    )
                                  : "-"}
                              </td>
                              <td className="py-3.5 px-3 text-right">
                                {canEdit ? (
                                  <div className="inline-flex items-center gap-2">
                                    {isUpdating && (
                                      <Loader2 className="w-4 h-4 animate-spin text-brand" />
                                    )}
                                    <NativeSelect
                                      value={u.churchRole || "MEMBER"}
                                      disabled={isUpdating}
                                      onChange={e =>
                                        handleRoleChange(u.id, e.target.value)
                                      }
                                      className="font-semibold shadow-sm hover:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                                    >
                                      <option value="SUPER_ADMIN">
                                        ผู้ดูแลระบบสูงสุด (SUPER_ADMIN)
                                      </option>
                                      <option value="PASTOR">
                                        ศิษยาภิบาล (PASTOR)
                                      </option>
                                      <option value="TREASURER">
                                        เหรัญญิกคริสตจักร (TREASURER)
                                      </option>
                                      <option value="DEACON">
                                        มัคนายก / คณะกรรมการ (DEACON)
                                      </option>
                                      <option value="COUNTER">
                                        ทีมนับเงินถวาย (COUNTER)
                                      </option>
                                      <option value="MEMBER">
                                        สมาชิกคริสตจักร (MEMBER)
                                      </option>
                                    </NativeSelect>
                                  </div>
                                ) : (
                                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-sunken text-ink-2 border border-line">
                                    {u.churchRole || "MEMBER"}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Structure and Appointed Roles Reference */}
            <div className="bg-card rounded-3xl border border-line p-6 md:p-8 space-y-6 shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-ink flex items-center gap-2">
                  โครงสร้างสิทธิ์การใช้งานและผู้รับผิดชอบอย่างเป็นทางการ
                </h3>
                <p className="text-xs text-ink-2/80 mt-1">
                  กำหนดบทบาท หน้าที่ความรับผิดชอบ
                  และรายนามผู้ได้รับมอบหมายตามมติคริสตจักร
                </p>
              </div>

              <div className="space-y-4">
                {churchRoles.map(r => (
                  <div
                    key={r.role}
                    className="p-5 rounded-2xl bg-page border border-line/70 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line/50 pb-3">
                      <div>
                        <span className="font-bold text-base text-ink">
                          {r.title}
                        </span>
                        <span className="ml-2.5 font-mono text-xs text-ink-2/70 bg-card px-2.5 py-0.5 rounded-md border border-line">
                          {r.role}
                        </span>
                      </div>
                      <div className="text-xs font-semibold px-3 py-1 rounded-full border bg-card text-ink border-line self-start sm:self-auto">
                        ผู้รับผิดชอบ:{" "}
                        <span className="text-brand font-bold">
                          {r.appointee}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-ink-2/90 leading-relaxed font-medium">
                      {r.desc}
                    </p>

                    <div className="pt-1">
                      <p className="text-xs font-bold text-ink mb-1.5">
                        ขอบเขตหน้าที่ในระบบ:
                      </p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-ink-2">
                        {r.duties.map((duty, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-success font-bold">•</span>
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
          <div className="bg-card rounded-3xl border border-line p-6 md:p-8 space-y-5 shadow-sm">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              หมวดหมู่การเงินมาตรฐานคริสตจักร
            </h3>

            <p className="text-sm text-ink-2">
              หมวดหมู่เหล่านี้คือค่าที่ระบบใช้จริงทั้งในฐานข้อมูล แบบฟอร์ม
              และรายงาน
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-line/60 bg-page p-4">
                <p className="font-bold text-ink">หมวดรายรับ (เงินถวาย)</p>
                <ul className="mt-2 space-y-1">
                  {OFFERING_CATEGORIES.map(c => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-3 text-sm text-ink-2"
                    >
                      <span>{c.label}</span>
                      <span className="font-mono text-xs text-ink-3">
                        {c.id}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-line/60 bg-page p-4">
                <p className="font-bold text-ink">หมวดรายจ่าย</p>
                <ul className="mt-2 space-y-1">
                  {EXPENSE_CATEGORIES.map(c => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-3 text-sm text-ink-2"
                    >
                      <span>{c.label}</span>
                      <span className="font-mono text-xs text-ink-3">
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
          <div className="bg-card rounded-3xl border border-line p-6 md:p-8 space-y-5 shadow-sm">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              บัญชีรับเงินถวายและ QR พร้อมเพย์
            </h3>

            <div className="p-4 rounded-2xl bg-sunken/50 border border-line flex flex-col sm:flex-row items-center gap-6">
              <div className="w-32 h-32 bg-card p-2 rounded-2xl border border-line shadow-inner flex items-center justify-center">
                <QrCode className="w-24 h-24 text-ink" />
              </div>

              <div className="space-y-2 text-center sm:text-left text-xs">
                <p className="font-bold text-base text-ink">
                  {bankAccountName}
                </p>
                <p className="text-ink-2">
                  ธนาคาร:{" "}
                  <span className="font-semibold text-ink">{bankName}</span>
                </p>
                <p className="text-ink-2">
                  เลขที่บัญชี:{" "}
                  <span className="font-mono font-bold text-sm text-ink">
                    {bankAccount}
                  </span>
                </p>
                <p className="text-xs text-ink-2/70">
                  QR Code นี้จะแสดงในแบบฟอร์มถวายทรัพย์
                  เพื่อให้สมาชิกสแกนโอนได้สะดวก
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Audit Log */}
        {activeTab === "audit" && (
          <div className="bg-card rounded-3xl border border-line p-6 md:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line/60 pb-5">
              <div>
                <h3 className="text-lg font-bold text-ink flex items-center gap-2">
                  บันทึกประวัติการดำเนินงาน (Audit Log)
                </h3>
                <p className="text-xs text-ink-2/80 mt-1">
                  ตรวจสอบความปลอดภัย การปรับเปลี่ยนบทบาทผู้ใช้
                  และการแก้ไขข้อมูลสำคัญทั้งหมดในระบบ
                </p>
              </div>
              <button
                type="button"
                onClick={() => void auditQuery.refetch()}
                disabled={auditQuery.isFetching}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-line bg-page hover:bg-sunken text-xs font-semibold text-ink-2 transition-all disabled:opacity-50 self-start sm:self-auto"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    auditQuery.isFetching ? "animate-spin text-brand" : ""
                  }`}
                />
                <span>รีเฟรชข้อมูล</span>
              </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-2/50" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อผู้ดำเนินการ, อีเมล หรือกิจกรรม..."
                  value={auditSearch}
                  onChange={e => setAuditSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-line bg-page/40 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-ink-2/60 shrink-0" />
                <NativeSelect
                  value={auditActionFilter}
                  onChange={e => setAuditActionFilter(e.target.value)}
                  className="font-semibold focus:ring-2 focus:ring-brand/20"
                >
                  <option value="ALL">กิจกรรมทั้งหมด</option>
                  <option value="AUTH_SET_CHURCH_ROLE">
                    เปลี่ยนบทบาทผู้ใช้ (AUTH_SET_CHURCH_ROLE)
                  </option>
                  <option value="AUTH_UPDATE_PROFILE">
                    แก้ไขโปรไฟล์ (AUTH_UPDATE_PROFILE)
                  </option>
                  <option value="CHURCH_UPDATE_PROFILE">
                    แก้ไขข้อมูลคริสตจักร (CHURCH_UPDATE_PROFILE)
                  </option>
                </NativeSelect>
              </div>
            </div>

            {auditQuery.isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-sm text-ink-2/70 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-brand" />
                <span>กำลังโหลด Audit Log...</span>
              </div>
            ) : (
              (() => {
                const logs = (auditQuery.data || []).filter(log => {
                  const matchesSearch =
                    !auditSearch ||
                    (log.userName &&
                      log.userName
                        .toLowerCase()
                        .includes(auditSearch.toLowerCase())) ||
                    (log.userEmail &&
                      log.userEmail
                        .toLowerCase()
                        .includes(auditSearch.toLowerCase())) ||
                    log.action
                      .toLowerCase()
                      .includes(auditSearch.toLowerCase());
                  const matchesFilter =
                    auditActionFilter === "ALL" ||
                    log.action === auditActionFilter;
                  return matchesSearch && matchesFilter;
                });

                if (logs.length === 0) {
                  return (
                    <div className="py-10 text-center text-sm text-ink-2/70 bg-page rounded-2xl border border-line/60">
                      ยังไม่พบบันทึกประวัติ หรือไม่ตรงกับเงื่อนไขการค้นหา
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-line/70 font-bold text-ink-2/80 uppercase">
                          <th className="pb-3 px-3">วัน-เวลา</th>
                          <th className="pb-3 px-3">ผู้ดำเนินการ (Actor)</th>
                          <th className="pb-3 px-3">กิจกรรม (Action)</th>
                          <th className="pb-3 px-3">เป้าหมาย (Target)</th>
                          <th className="pb-3 px-3">รายละเอียด (Details)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/40">
                        {logs.map(log => {
                          const dateStr = new Date(
                            log.createdAt
                          ).toLocaleDateString("th-TH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          });

                          let actionBadge = (
                            <span className="px-2.5 py-1 rounded-full bg-sunken text-ink-2 font-mono text-[11px] border border-line-strong">
                              {log.action}
                            </span>
                          );
                          if (log.action === "AUTH_SET_CHURCH_ROLE") {
                            actionBadge = (
                              <span className="px-2.5 py-1 rounded-full bg-success-soft text-success font-bold text-[11px] border border-success-line">
                                เปลี่ยนบทบาทผู้ใช้
                              </span>
                            );
                          } else if (log.action === "AUTH_UPDATE_PROFILE") {
                            actionBadge = (
                              <span className="px-2.5 py-1 rounded-full bg-info-soft text-info font-bold text-[11px] border border-info-line">
                                แก้ไขโปรไฟล์
                              </span>
                            );
                          }

                          return (
                            <tr
                              key={log.id}
                              className="hover:bg-page/50 transition-colors"
                            >
                              <td className="py-3.5 px-3 text-ink-3 font-mono whitespace-nowrap">
                                {dateStr}
                              </td>
                              <td className="py-3.5 px-3 font-semibold text-ink">
                                <div>{log.userName || "ไม่ระบุชื่อ"}</div>
                                {log.userEmail && (
                                  <div className="text-[11px] text-ink-2/70 font-normal">
                                    {log.userEmail}
                                  </div>
                                )}
                              </td>
                              <td className="py-3.5 px-3 whitespace-nowrap">
                                {actionBadge}
                              </td>
                              <td className="py-3.5 px-3 text-ink-2">
                                <span className="font-mono text-[11px] bg-sunken px-2 py-0.5 rounded-md border border-line">
                                  {log.entity}
                                  {log.entityId ? ` #${log.entityId}` : ""}
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-ink-2 max-w-sm">
                                {log.metadata ? (
                                  <div
                                    className="font-mono text-[11px] bg-page p-1.5 rounded-lg border border-line truncate max-w-[280px]"
                                    title={JSON.stringify(
                                      log.metadata,
                                      null,
                                      2
                                    )}
                                  >
                                    {JSON.stringify(log.metadata)}
                                  </div>
                                ) : (
                                  "-"
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
