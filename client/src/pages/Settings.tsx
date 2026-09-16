import React, { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Banknote,
  Building,
  CheckCircle2,
  CreditCard,
  Globe,
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

export default function Settings() {
  const [activeTab, setActiveTab] = useState<
    "church" | "roles" | "categories" | "payment"
  >("church");
  const utils = trpc.useUtils();

  const {
    data: churchProfile,
    isLoading,
    refetch,
  } = trpc.church.getProfile.useQuery(undefined, { retry: false });

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

  useEffect(() => {
    if (churchProfile) {
      setName(churchProfile.name || "");
      setAddress(churchProfile.address || "");
      setPhone(churchProfile.phone || "");
      setEmail(churchProfile.email || "");
      setWebsite(churchProfile.website || "");
      setPastorName(churchProfile.pastorName || "");
      setAssistantPastorName(churchProfile.assistantPastorName || "");
      setTreasurerName(churchProfile.treasurerName || "");
      setBankName(churchProfile.bankName || "");
      setBankAccount(churchProfile.bankAccount || "");
      setBankAccountName(churchProfile.bankAccountName || "");
      setMotto(churchProfile.motto || "");
    } else {
      setName("");
      setAddress("");
      setPhone("");
      setEmail("");
      setWebsite("");
      setPastorName("");
      setAssistantPastorName("");
      setTreasurerName("");
      setBankName("");
      setBankAccount("");
      setBankAccountName("");
      setMotto("");
    }
  }, [churchProfile]);

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
      fiscalYearStartMonth: 1,
      motto,
    });
  };

  const churchRoles = [
    {
      role: "SUPER_ADMIN",
      title: "ผู้ดูแลระบบสูงสุด",
      desc: "เข้าถึงทุกฟังก์ชัน จัดการสิทธิ์ และตั้งค่าคริสตจักรทั้งหมด",
    },
    {
      role: "TREASURER",
      title: "เหรัญญิกคริสตจักร",
      desc: "บันทึกบัญชี ตรวจสอบงบ เบิกจ่ายเงิน และออกใบเสร็จรับเงินถวาย",
    },
    {
      role: "PASTOR",
      title: "ศิษยาภิบาล / ผู้นำฝ่ายวิญญาณ",
      desc: "อนุมัติโครงการ ดูรายงานการเงิน อภิบาลสมาชิก และจัดการฝ่ายงาน",
    },
    {
      role: "DEACON",
      title: "มัคนายก / คณะกรรมการ",
      desc: "ตรวจรับงาน เสนองบประมาณ และดูแลพันธกิจตามฝ่ายที่รับผิดชอบ",
    },
    {
      role: "MEMBER",
      title: "สมาชิกคริสตจักร",
      desc: "ดูข่าวสาร ตารางรับใช้ และประวัติการถวายส่วนบุคคลที่ปลอดภัย",
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
        <div className="flex items-center gap-2 border-b border-[#E9D9BF] pb-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("church")}
            className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === "church"
                ? "bg-[#FFF4DF] text-[#38251B] border border-[#E9D9BF]"
                : "text-[#70452E]/70 hover:text-[#38251B]"
            }`}
          >
            <Building className="w-4 h-4 text-[#E99A4A]" />
            <span>ข้อมูลคริสตจักร</span>
          </button>
          <button
            onClick={() => setActiveTab("roles")}
            className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === "roles"
                ? "bg-[#FFF4DF] text-[#38251B] border border-[#E9D9BF]"
                : "text-[#70452E]/70 hover:text-[#38251B]"
            }`}
          >
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>บทบาทและสิทธิ์</span>
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === "categories"
                ? "bg-[#FFF4DF] text-[#38251B] border border-[#E9D9BF]"
                : "text-[#70452E]/70 hover:text-[#38251B]"
            }`}
          >
            <Banknote className="w-4 h-4 text-amber-600" />
            <span>หมวดหมู่บัญชี</span>
          </button>
          <button
            onClick={() => setActiveTab("payment")}
            className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === "payment"
                ? "bg-[#FFF4DF] text-[#38251B] border border-[#E9D9BF]"
                : "text-[#70452E]/70 hover:text-[#38251B]"
            }`}
          >
            <QrCode className="w-4 h-4 text-sky-600" />
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

        {/* Tab 2: Roles */}
        {activeTab === "roles" && (
          <div className="bg-white rounded-3xl border border-[#E9D9BF] p-6 md:p-8 space-y-5 shadow-sm">
            <h3 className="text-base font-bold text-[#38251B] flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              โครงสร้างสิทธิ์การใช้งาน (Role-based Access Control)
            </h3>

            <div className="space-y-3">
              {churchRoles.map(r => (
                <div
                  key={r.role}
                  className="p-4 rounded-2xl bg-[#FFF9EE] border border-[#E9D9BF]/60 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#38251B]">
                      {r.title}
                    </span>
                    <span className="font-mono text-xs text-[#70452E]/70 bg-white px-2 py-0.5 rounded-md border border-[#E9D9BF]">
                      {r.role}
                    </span>
                  </div>
                  <p className="text-xs text-[#70452E]/80">{r.desc}</p>
                </div>
              ))}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#FFF9EE] border border-[#E9D9BF]/60">
                <p className="font-bold text-[#38251B]">หมวดรายรับ (Income)</p>
                <ul className="list-disc pl-5 mt-1.5 space-y-1 text-[#70452E]/80">
                  <li>เงินถวายสิบลด (Tithes)</li>
                  <li>เงินถวายทั่วไปประจำสัปดาห์ (General)</li>
                  <li>เงินถวายพันธกิจและประกาศ (Mission)</li>
                  <li>เงินถวายสมทบสร้างอาคาร (Building)</li>
                  <li>เงินถวายขอบพระคุณ (Thanksgiving)</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FFF9EE] border border-[#E9D9BF]/60">
                <p className="font-bold text-[#38251B]">
                  หมวดรายจ่าย (Expenses)
                </p>
                <ul className="list-disc pl-5 mt-1.5 space-y-1 text-[#70452E]/80">
                  <li>ค่าสาธารณูปโภค (Utility)</li>
                  <li>พันธกิจและกิจกรรมคริสตจักร (Ministry)</li>
                  <li>สงเคราะห์และสังคม (Benevolence)</li>
                  <li>อาคารและสถานที่ (Facilities)</li>
                  <li>เงินเดือนและค่าตอบแทนบุคลากร (Staff)</li>
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
