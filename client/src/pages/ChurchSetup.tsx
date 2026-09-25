import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { clearSetupSkip, markSetupSkipped } from "@/lib/setupSkip";
import {
  Check,
  ChevronRight,
  Church,
  CreditCard,
  HandCoins,
  Heart,
  Landmark,
  Settings2,
  ShieldCheck,
  Users,
  WalletCards,
  X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SetupData = {
  // Step 1: Basic Info
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  // Step 2: Leadership
  pastorName: string;
  assistantPastorName: string;
  treasurerName: string;
  motto: string;
  // Step 3: Bank Account
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  // Step 4: Offering Categories (comma-separated, stored for display)
  offeringCategories: string[];
  // Step 5: Funds
  funds: Array<{ name: string; type: string; description: string }>;
  // Step 6: Fiscal Year
  fiscalYearStartMonth: number;
  budgetYear: number;
  // Step 7: User Roles (just informational, actual assignment via admin)
  // Step 8: Confirmation
};

type StepConfig = {
  id: number;
  title: string;
  subtitle: string;
  icon: typeof Church;
  color: string;
  bgColor: string;
};

const STEPS: StepConfig[] = [
  {
    id: 1,
    title: "ข้อมูลพื้นฐาน",
    subtitle: "ชื่อและที่ตั้งคริสตจักร",
    icon: Church,
    color: "text-[#92400E]",
    bgColor: "bg-[#FEF6E7]",
  },
  {
    id: 2,
    title: "ผู้นำคริสตจักร",
    subtitle: "ศิษยาภิบาลและผู้รับผิดชอบ",
    icon: Users,
    color: "text-[#3B82F6]",
    bgColor: "bg-[#EFF6FF]",
  },
  {
    id: 3,
    title: "บัญชีธนาคาร",
    subtitle: "ข้อมูลการรับโอนเงิน",
    icon: CreditCard,
    color: "text-[#059669]",
    bgColor: "bg-[#ECFDF5]",
  },
  {
    id: 4,
    title: "หมวดหมู่การถวาย",
    subtitle: "ประเภทการถวายที่ใช้",
    icon: HandCoins,
    color: "text-[#B91C1C]",
    bgColor: "bg-[#FEE2E2]",
  },
  {
    id: 5,
    title: "กองทุนและบัญชี",
    subtitle: "บัญชีแยกประเภทและกองทุน",
    icon: WalletCards,
    color: "text-[#7C3AED]",
    bgColor: "bg-[#EDE9FE]",
  },
  {
    id: 6,
    title: "ปีงบประมาณ",
    subtitle: "รอบปีการเงินและงบประมาณ",
    icon: Landmark,
    color: "text-[#92400E]",
    bgColor: "bg-[#FEF3C7]",
  },
  {
    id: 7,
    title: "สิทธิ์การเข้าถึง",
    subtitle: "บทบาทและการอนุญาต",
    icon: ShieldCheck,
    color: "text-[#065F46]",
    bgColor: "bg-[#D6F0E4]",
  },
  {
    id: 8,
    title: "ยืนยันการตั้งค่า",
    subtitle: "ตรวจสอบและเริ่มใช้งาน",
    icon: Check,
    color: "text-[#465A75]",
    bgColor: "bg-[#DCE4F0]",
  },
];

const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const DEFAULT_OFFERING_CATEGORIES = [
  "ถวายสิบลด",
  "ถวายทั่วไป",
  "ถวายพันธกิจ",
  "ถวายกองทุนอาคาร",
  "ถวายสวัสดิการ",
  "ถวายพิเศษ",
];

const DEFAULT_FUNDS = [
  {
    name: "กองทุนทั่วไป",
    type: "general",
    description: "กองทุนหลักสำหรับค่าใช้จ่ายทั่วไป",
  },
  { name: "กองทุนสิบลด", type: "tithe", description: "เงินถวายสิบลดจากสมาชิก" },
  {
    name: "กองทุนพันธกิจ",
    type: "mission",
    description: "สนับสนุนงานประกาศและพันธกิจ",
  },
  {
    name: "กองทุนอาคาร",
    type: "building",
    description: "ซ่อมแซมและพัฒนาอาคาร",
  },
  {
    name: "กองทุนสวัสดิการ",
    type: "welfare",
    description: "ช่วยเหลือสมาชิกและผู้ยากไร้",
  },
];

// ─── Utility ─────────────────────────────────────────────────────────────────

const SAVE_ERROR_PATTERNS: Array<[pattern: string, message: string]> = [
  ["10001", "กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลก่อนบันทึกการตั้งค่า"],
  [
    "10002",
    "บัญชีนี้ไม่มีสิทธิ์บันทึกการตั้งค่า (ต้องเป็นผู้ดูแลหรือผู้นำคริสตจักร)",
  ],
  [
    "เฉพาะผู้นำคริสตจักรเท่านั้น",
    "บัญชีนี้ไม่มีสิทธิ์บันทึกการตั้งค่า (ต้องเป็นผู้ดูแลหรือผู้นำคริสตจักร)",
  ],
  [
    "Database is not available",
    "เชื่อมต่อฐานข้อมูลไม่ได้ ข้อมูลยังไม่ถูกบันทึก กรุณาตั้งค่า DATABASE_URL แล้วลองใหม่",
  ],
];

function getSaveErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  return (
    SAVE_ERROR_PATTERNS.find(([pattern]) => message.includes(pattern))?.[1] ??
    (message || "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง")
  );
}

function FieldLabel({
  children,
  required,
  htmlFor,
}: {
  children: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-xs font-bold text-[#465A75]"
    >
      {children} {required && <span className="text-[#DC2626]">*</span>}
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  disabled?: boolean;
}) {
  const fieldId = `setup-${label.replace(/\s+/g, "-")}`;
  return (
    <div>
      <FieldLabel htmlFor={fieldId} required={required}>
        {label}
      </FieldLabel>
      <input
        id={fieldId}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-xl border border-[#DCE4F0] bg-white px-3.5 py-2.5 text-sm text-[#465A75] placeholder:text-[#94A3B8] focus:border-[#B45309] focus:outline-none focus:ring-2 focus:ring-[#B45309]/20 disabled:opacity-60"
      />
    </div>
  );
}

// ─── Step Components ──────────────────────────────────────────────────────────

function Step1({
  data,
  set,
}: {
  data: SetupData;
  set: (p: Partial<SetupData>) => void;
}) {
  return (
    <div className="space-y-4">
      <TextField
        label="ชื่อคริสตจักร"
        required
        value={data.name}
        onChange={v => set({ name: v })}
        placeholder="เช่น คริสตจักรบ้านแห่งพระคุณ (Grace House Church)"
      />
      <div>
        <FieldLabel htmlFor="church-address">ที่อยู่</FieldLabel>
        <textarea
          id="church-address"
          value={data.address}
          onChange={e => set({ address: e.target.value })}
          placeholder="บ้านเลขที่, ถนน, แขวง/ตำบล, เขต/อำเภอ, จังหวัด, รหัสไปรษณีย์"
          rows={3}
          className="w-full rounded-xl border border-[#DCE4F0] bg-white px-3.5 py-2.5 text-sm text-[#465A75] placeholder:text-[#94A3B8] focus:border-[#B45309] focus:outline-none resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="โทรศัพท์"
          value={data.phone}
          onChange={v => set({ phone: v })}
          placeholder="02-XXX-XXXX"
          type="tel"
        />
        <TextField
          label="อีเมล"
          value={data.email}
          onChange={v => set({ email: v })}
          placeholder="church@example.com"
          type="email"
        />
      </div>
      <TextField
        label="เว็บไซต์"
        value={data.website}
        onChange={v => set({ website: v })}
        placeholder="https://www.church.com"
      />
    </div>
  );
}

function Step2({
  data,
  set,
}: {
  data: SetupData;
  set: (p: Partial<SetupData>) => void;
}) {
  return (
    <div className="space-y-4">
      <TextField
        label="ชื่อศิษยาภิบาล"
        required
        value={data.pastorName}
        onChange={v => set({ pastorName: v })}
        placeholder="ศจ. ชื่อ นามสกุล"
      />
      <TextField
        label="ชื่อผู้ช่วยศิษยาภิบาล"
        value={data.assistantPastorName}
        onChange={v => set({ assistantPastorName: v })}
        placeholder="ศจ. ชื่อ นามสกุล (ถ้ามี)"
      />
      <TextField
        label="ชื่อผู้ดูแลการเงิน (เหรัญญิก)"
        required
        value={data.treasurerName}
        onChange={v => set({ treasurerName: v })}
        placeholder="มัคนายก ชื่อ นามสกุล"
      />
      <div>
        <FieldLabel htmlFor="church-motto">
          ข้อพระคัมภีร์หรือคติพจน์ของคริสตจักร
        </FieldLabel>
        <textarea
          id="church-motto"
          value={data.motto}
          onChange={e => set({ motto: e.target.value })}
          placeholder="เช่น 2 โครินธ์ 9:7 · ผู้ให้ด้วยใจยินดี พระเจ้าทรงรัก"
          rows={2}
          className="w-full rounded-xl border border-[#DCE4F0] bg-white px-3.5 py-2.5 text-sm text-[#465A75] placeholder:text-[#94A3B8] focus:border-[#B45309] focus:outline-none resize-none"
        />
      </div>
      <div className="rounded-2xl border border-[#EFF6FF] bg-[#EFF6FF] p-4">
        <p className="text-xs font-bold text-[#1D4ED8]">
          💡 เกี่ยวกับบทบาทผู้ใช้
        </p>
        <p className="mt-1 text-xs text-[#3B82F6]">
          ผู้ดูแลระบบสามารถกำหนดสิทธิ์ <strong>SUPER_ADMIN</strong>,{" "}
          <strong>PASTOR</strong>, <strong>TREASURER</strong>{" "}
          ให้ผู้ใช้แต่ละคนได้ในภายหลังจากหน้าโปรไฟล์
        </p>
      </div>
    </div>
  );
}

function Step3({
  data,
  set,
}: {
  data: SetupData;
  set: (p: Partial<SetupData>) => void;
}) {
  const BANKS = [
    "ธนาคารกสิกรไทย",
    "ธนาคารกรุงไทย",
    "ธนาคารไทยพาณิชย์",
    "ธนาคารกรุงเทพ",
    "ธนาคารกรุงศรีอยุธยา",
    "ธนาคารออมสิน",
    "ธนาคารอื่นๆ",
  ];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel htmlFor="church-bank">ธนาคาร</FieldLabel>
        <select
          id="church-bank"
          value={data.bankName}
          onChange={e => set({ bankName: e.target.value })}
          className="w-full rounded-xl border border-[#DCE4F0] bg-white px-3.5 py-2.5 text-sm text-[#465A75] focus:border-[#B45309] focus:outline-none"
        >
          <option value="">— เลือกธนาคาร —</option>
          {BANKS.map(b => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>
      <TextField
        label="เลขที่บัญชี"
        required
        value={data.bankAccount}
        onChange={v => set({ bankAccount: v })}
        placeholder="000-0-00000-0"
      />
      <TextField
        label="ชื่อบัญชี"
        required
        value={data.bankAccountName}
        onChange={v => set({ bankAccountName: v })}
        placeholder="คริสตจักร..."
      />
      <div className="rounded-2xl border border-[#ECFDF5] bg-[#ECFDF5] p-4">
        <p className="text-xs font-bold text-[#047857]">🔒 ความปลอดภัย</p>
        <p className="mt-1 text-xs text-[#059669]">
          ข้อมูลบัญชีธนาคารจะถูกเก็บเป็นความลับ — เข้าถึงได้เฉพาะ TREASURER และ
          SUPER_ADMIN เท่านั้น
        </p>
      </div>
    </div>
  );
}

function Step4({
  data,
  set,
}: {
  data: SetupData;
  set: (p: Partial<SetupData>) => void;
}) {
  const toggleCat = (cat: string) => {
    const next = data.offeringCategories.includes(cat)
      ? data.offeringCategories.filter(c => c !== cat)
      : [...data.offeringCategories, cat];
    set({ offeringCategories: next });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#5A6B85]">
        เลือกหมวดหมู่การถวายที่คริสตจักรของคุณใช้งาน:
      </p>
      <div className="grid grid-cols-2 gap-2">
        {DEFAULT_OFFERING_CATEGORIES.map(cat => {
          const selected = data.offeringCategories.includes(cat);
          return (
            <button
              key={cat}
              onClick={() => toggleCat(cat)}
              className={`flex min-h-[48px] items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition ${
                selected
                  ? "border-[#B45309] bg-[#FEF6E7] text-[#92400E]"
                  : "border-[#DCE4F0] bg-white text-[#5A6B85] hover:bg-[#FFFFFF]"
              }`}
            >
              <span
                className={`grid size-5 shrink-0 place-items-center rounded-md ${selected ? "bg-[#12325C] text-white" : "bg-[#DCE4F0]"}`}
              >
                {selected ? (
                  <Check className="size-3" />
                ) : (
                  <HandCoins className="size-3 text-[#B45309]" />
                )}
              </span>
              {cat}
            </button>
          );
        })}
      </div>
      {data.offeringCategories.length === 0 && (
        <p className="text-xs text-[#DC2626]">
          ⚠ กรุณาเลือกอย่างน้อย 1 หมวดหมู่
        </p>
      )}
    </div>
  );
}

function Step5({
  data,
  set,
}: {
  data: SetupData;
  set: (p: Partial<SetupData>) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-[#5A6B85]">
        กองทุนเริ่มต้นที่แนะนำสำหรับคริสตจักร:
      </p>
      {data.funds.map((fund, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-2xl border border-[#DCE4F0] bg-white p-3.5"
        >
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#FEF3C7] text-[#B45309]">
            <WalletCards className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[#465A75]">{fund.name}</p>
            <p className="text-xs text-[#5A6B85]">{fund.description}</p>
          </div>
          <Check className="size-4 shrink-0 text-[#059669]" />
        </div>
      ))}
      <div className="rounded-2xl border border-[#FEF3C7] bg-[#fffde9] p-4">
        <p className="text-xs font-bold text-[#92400E]">
          💡 สามารถเพิ่มกองทุนเพิ่มเติมได้ภายหลัง
        </p>
        <p className="mt-1 text-xs text-[#92400E]">
          จากหน้าการเงิน → จัดการกองทุน
        </p>
      </div>
    </div>
  );
}

function Step6({
  data,
  set,
}: {
  data: SetupData;
  set: (p: Partial<SetupData>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel required>เดือนเริ่มต้นปีงบประมาณ</FieldLabel>
        <select
          value={data.fiscalYearStartMonth}
          onChange={e => set({ fiscalYearStartMonth: Number(e.target.value) })}
          className="w-full rounded-xl border border-[#DCE4F0] bg-white px-3.5 py-2.5 text-sm text-[#465A75] focus:border-[#B45309] focus:outline-none"
        >
          {THAI_MONTHS.map((m, i) => (
            <option key={i + 1} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-[#64748B]">
          ปีงบประมาณจะเริ่มจาก{THAI_MONTHS[data.fiscalYearStartMonth - 1]}
          ของทุกปี
        </p>
      </div>
      <div>
        <FieldLabel required>ปีงบประมาณปัจจุบัน (พ.ศ.)</FieldLabel>
        <input
          type="number"
          value={data.budgetYear}
          onChange={e => set({ budgetYear: Number(e.target.value) })}
          min={2550}
          max={2600}
          className="w-full rounded-xl border border-[#DCE4F0] bg-white px-3.5 py-2.5 text-sm text-[#465A75] focus:border-[#B45309] focus:outline-none"
        />
      </div>
      <div className="rounded-2xl border border-[#FEF3C7] bg-[#fffde9] p-4 space-y-2">
        <p className="text-xs font-bold text-[#92400E]">
          📅 ตัวอย่างรอบปีงบประมาณ
        </p>
        <p className="text-xs text-[#92400E]">
          ปีที่ {data.budgetYear}: {THAI_MONTHS[data.fiscalYearStartMonth - 1]}{" "}
          {data.budgetYear} →{" "}
          {THAI_MONTHS[(data.fiscalYearStartMonth - 2 + 12) % 12]}{" "}
          {data.budgetYear + 1}
        </p>
      </div>
    </div>
  );
}

function Step7() {
  const roles = [
    {
      role: "SUPER_ADMIN",
      label: "ผู้ดูแลระบบสูงสุด",
      desc: "เข้าถึงได้ทุกอย่าง รวมถึงข้อมูลผู้ถวายและการตั้งค่า",
      color: "bg-[#FEE2E2] text-[#B91C1C]",
    },
    {
      role: "PASTOR",
      label: "ศิษยาภิบาล / ผู้นำ",
      desc: "ดูรายงานการเงิน อนุมัติคำขอ แต่ไม่เห็นชื่อผู้ถวาย",
      color: "bg-[#EFF6FF] text-[#3B82F6]",
    },
    {
      role: "TREASURER",
      label: "เหรัญญิก / ผู้ดูแลการเงิน",
      desc: "บันทึกและดูรายการทั้งหมด รวมถึงชื่อผู้ถวาย",
      color: "bg-[#ECFDF5] text-[#059669]",
    },
    {
      role: "MEMBER",
      label: "สมาชิกทั่วไป",
      desc: "ดูยอดรวมและสร้างคำขอเบิก แต่ไม่เห็นรายละเอียดผู้ถวาย",
      color: "bg-[#DCE4F0] text-[#92400E]",
    },
  ];
  return (
    <div className="space-y-3">
      <p className="text-sm text-[#5A6B85]">
        ระบบมี 4 บทบาทหลัก ผู้ดูแลระบบสามารถกำหนดให้ผู้ใช้แต่ละคนได้:
      </p>
      {roles.map(({ role, label, desc, color }) => (
        <div
          key={role}
          className="flex items-start gap-3 rounded-2xl border border-[#DCE4F0] bg-white p-3.5"
        >
          <span
            className={`inline-flex shrink-0 items-center rounded-lg px-2.5 py-1 text-xs font-bold ${color}`}
          >
            {role}
          </span>
          <div>
            <p className="text-sm font-bold text-[#465A75]">{label}</p>
            <p className="text-xs text-[#5A6B85]">{desc}</p>
          </div>
        </div>
      ))}
      <div className="rounded-2xl border border-[#D6F0E4] bg-[#ECFDF5] p-4">
        <p className="text-xs font-bold text-[#047857]">🔐 การกำหนดสิทธิ์</p>
        <p className="mt-1 text-xs text-[#065F46]">
          ไปที่ เมนู → โปรไฟล์ผู้ใช้ → กำหนดบทบาท
          หลังจากตั้งค่าคริสตจักรเสร็จแล้ว
        </p>
      </div>
    </div>
  );
}

function Step8({ data }: { data: SetupData }) {
  const summaryItems = [
    { label: "ชื่อคริสตจักร", value: data.name || "—" },
    { label: "ศิษยาภิบาล", value: data.pastorName || "—" },
    { label: "เหรัญญิก", value: data.treasurerName || "—" },
    {
      label: "ธนาคาร",
      value: data.bankName ? `${data.bankName} ${data.bankAccount}` : "—",
    },
    {
      label: "ปีงบประมาณ",
      value: `เริ่ม${THAI_MONTHS[data.fiscalYearStartMonth - 1]}`,
    },
    { label: "หมวดหมู่ถวาย", value: `${data.offeringCategories.length} หมวด` },
    { label: "กองทุน", value: `${data.funds.length} กองทุน` },
  ];
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#DCE4F0] bg-white overflow-hidden">
        {summaryItems.map(({ label, value }, i) => (
          <div
            key={label}
            className={`flex items-center justify-between px-4 py-3 text-sm ${i < summaryItems.length - 1 ? "border-b border-[#DCE4F0]" : ""}`}
          >
            <span className="text-[#5A6B85]">{label}</span>
            <span className="font-bold text-[#465A75] text-right max-w-[55%] truncate">
              {value}
            </span>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-[#B9E6D0] bg-[#ECFDF5] p-4 text-center">
        <Heart className="mx-auto mb-2 size-8 text-[#047857]" fill="#047857" />
        <p className="text-sm font-bold text-[#065F46]">พร้อมเริ่มต้นใช้งาน!</p>
        <p className="mt-1 text-xs text-[#047857]">
          ระบบจะบันทึกข้อมูลและนำคุณไปยังหน้าแดชบอร์ด
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ChurchSetup() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<SetupData>({
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    pastorName: "",
    assistantPastorName: "",
    treasurerName: "",
    motto: "2 โครินธ์ 9:7 · ผู้ให้ด้วยใจยินดี พระเจ้าทรงรัก",
    bankName: "",
    bankAccount: "",
    bankAccountName: "",
    offeringCategories: DEFAULT_OFFERING_CATEGORIES.slice(0, 4),
    funds: DEFAULT_FUNDS,
    fiscalYearStartMonth: 1,
    budgetYear: 2569,
  });

  const updateProfileMutation = trpc.church.updateProfile.useMutation();
  const completeSetupMutation = trpc.church.completeSetup.useMutation();
  const utils = trpc.useUtils();

  function skipSetup() {
    markSetupSkipped();
    setLocation("/");
  }

  const set = (partial: Partial<SetupData>) =>
    setData(d => ({ ...d, ...partial }));
  const totalSteps = STEPS.length;
  const progressPct = ((step - 1) / (totalSteps - 1)) * 100;
  const currentStepConfig = STEPS[step - 1];
  const StepIcon = currentStepConfig.icon;

  // ── Validation ──────────────────────────────────────────────────────────────
  function validateStep(): boolean {
    if (step === 1 && !data.name.trim()) {
      toast.error("กรุณาระบุชื่อคริสตจักร");
      return false;
    }
    if (step === 2 && !data.pastorName.trim()) {
      toast.error("กรุณาระบุชื่อศิษยาภิบาล");
      return false;
    }
    if (step === 4 && data.offeringCategories.length === 0) {
      toast.error("กรุณาเลือกหมวดหมู่การถวายอย่างน้อย 1 หมวด");
      return false;
    }
    return true;
  }

  function next() {
    if (!validateStep()) return;
    setStep(s => Math.min(s + 1, totalSteps));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setStep(s => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleFinish() {
    if (!validateStep()) return;
    setSaving(true);
    try {
      await updateProfileMutation.mutateAsync({
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email || undefined,
        website: data.website || undefined,
        pastorName: data.pastorName,
        assistantPastorName: data.assistantPastorName,
        treasurerName: data.treasurerName,
        bankName: data.bankName,
        bankAccount: data.bankAccount,
        bankAccountName: data.bankAccountName,
        fiscalYearStartMonth: data.fiscalYearStartMonth,
        motto: data.motto,
      });
      await completeSetupMutation.mutateAsync();
      clearSetupSkip();
      await utils.church.getProfile.invalidate();
      toast.success("ตั้งค่าคริสตจักรเรียบร้อย! 🎉");
      setTimeout(() => setLocation("/"), 1200);
    } catch (error: unknown) {
      // Surface the real failure and stay on this step so the filled-in data is not lost.
      toast.error(getSaveErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F8FC]">
      <div className="mx-auto min-h-screen max-w-[560px] overflow-x-hidden bg-[#F6F8FC] pb-32 shadow-[0_0_40px_rgba(12,27,51,0.07)] lg:my-6 lg:min-h-0 lg:rounded-3xl lg:border lg:border-[#DCE4F0]">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#FEF3C7] via-[#FEF6E7] to-[#F6F8FC] px-5 pb-6 pt-5 sm:px-8">
          <button
            onClick={skipSetup}
            aria-label="กลับหน้าหลัก"
            className="absolute right-5 top-5 grid size-9 place-items-center rounded-full bg-white/70 text-[#64748B] hover:bg-white transition"
          >
            <X className="size-4" />
          </button>
          <p className="text-xs font-bold text-[#92400E]">
            GRACE-GIVING · ตั้งค่าคริสตจักร
          </p>
          <h1 className="font-display mt-2 text-2xl font-bold leading-tight tracking-tight text-[#3E4C61]">
            ยินดีต้อนรับ 👋
            <br />
            มาเริ่มต้นด้วยกัน
          </h1>

          {/* Progress bar */}
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#5A6B85]">
              <span>
                ขั้นตอนที่ {step} จาก {totalSteps}
              </span>
              <span>{Math.round(progressPct)}%</span>
            </div>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progressPct)}
              aria-label="ความคืบหน้าการตั้งค่า"
              className="h-2 overflow-hidden rounded-full bg-[#DCE4F0]"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#B45309] to-[#F59E0B] transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Step dots */}
          <div className="mt-4 flex justify-center gap-1.5">
            {STEPS.map(s => (
              <button
                key={s.id}
                onClick={() => step > s.id && setStep(s.id)}
                aria-label={`ขั้นตอน ${s.id}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s.id === step
                    ? "w-6 bg-[#B45309]"
                    : s.id < step
                      ? "w-3 bg-[#B45309]/50"
                      : "w-3 bg-[#DCE4F0]"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Card */}
        <div className="px-4 pt-4 sm:px-6">
          <div className="rounded-2xl border border-[#DCE4F0] bg-white px-5 py-6 shadow-[0_8px_24px_rgba(12,27,51,0.06)] sm:px-7">
            {/* Step Header */}
            <div className="mb-5 flex items-center gap-3">
              <span
                className={`grid size-12 place-items-center rounded-2xl ${currentStepConfig.bgColor}`}
              >
                <StepIcon className={`size-6 ${currentStepConfig.color}`} />
              </span>
              <div>
                <p className="text-xs font-bold text-[#92400E]">
                  ขั้นตอนที่ {step}
                </p>
                <h2 className="font-display text-lg font-bold leading-tight text-[#3E4C61]">
                  {currentStepConfig.title}
                </h2>
                <p className="text-xs text-[#5A6B85]">
                  {currentStepConfig.subtitle}
                </p>
              </div>
            </div>

            {/* Step Content */}
            {step === 1 && <Step1 data={data} set={set} />}
            {step === 2 && <Step2 data={data} set={set} />}
            {step === 3 && <Step3 data={data} set={set} />}
            {step === 4 && <Step4 data={data} set={set} />}
            {step === 5 && <Step5 data={data} set={set} />}
            {step === 6 && <Step6 data={data} set={set} />}
            {step === 7 && <Step7 />}
            {step === 8 && <Step8 data={data} />}
          </div>
        </div>

        {/* All Steps Overview (collapsed) */}
        <div className="px-4 pt-3 sm:px-6">
          <details className="group rounded-2xl border border-[#DCE4F0] bg-white overflow-hidden">
            <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-xs font-bold text-[#5A6B85] select-none">
              <span className="flex items-center gap-2">
                <Settings2 className="size-4 text-[#B45309]" />
                ขั้นตอนทั้งหมด
              </span>
              <ChevronRight className="size-4 transition-transform duration-200 group-open:rotate-90" />
            </summary>
            <div className="divide-y divide-[#DCE4F0]">
              {STEPS.map(s => {
                const Icon = s.icon;
                const done = step > s.id;
                const active = step === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => done && setStep(s.id)}
                    disabled={!done && !active}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-xs transition ${
                      active ? "bg-[#FFFFFF]" : done ? "hover:bg-[#FFFFFF]" : ""
                    }`}
                  >
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                        done
                          ? "bg-[#047857] text-white"
                          : active
                            ? "bg-[#12325C] text-white"
                            : "bg-[#DCE4F0] text-[#64748B]"
                      }`}
                    >
                      {done ? <Check className="size-3.5" /> : s.id}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`font-bold ${active ? "text-[#92400E]" : done ? "text-[#465A75]" : "text-[#64748B]"}`}
                      >
                        {s.title}
                      </p>
                      <p className="text-[10px] text-[#94A3B8]">{s.subtitle}</p>
                    </div>
                    {done && (
                      <Check className="ml-auto size-3.5 shrink-0 text-[#059669]" />
                    )}
                  </button>
                );
              })}
            </div>
          </details>
        </div>
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[560px]">
        <div className="border-t border-[#DCE4F0] bg-[#FFFFFF]/95 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:px-6">
          <div className="flex gap-3">
            {step > 1 && (
              <button
                onClick={back}
                className="min-h-[48px] flex-1 rounded-2xl border border-[#DCE4F0] bg-white text-sm font-bold text-[#5A6B85] hover:bg-[#F6F8FC] active:scale-[0.98] transition"
              >
                ← ย้อนกลับ
              </button>
            )}
            {step < totalSteps ? (
              <button
                onClick={next}
                className="min-h-[48px] flex-[2] rounded-2xl bg-gradient-to-r from-[#B45309] to-[#F59E0B] text-sm font-bold text-white shadow-[0_4px_14px_rgba(12,27,51,0.3)] hover:opacity-95 active:scale-[0.98] transition"
              >
                ถัดไป →
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={saving}
                className="min-h-[48px] flex-[2] rounded-2xl bg-gradient-to-r from-[#047857] to-[#059669] text-sm font-bold text-white shadow-[0_4px_14px_rgba(4,120,87,0.3)] hover:opacity-95 active:scale-[0.98] transition disabled:opacity-60"
              >
                {saving ? "กำลังบันทึก..." : "✓ ยืนยันและเริ่มใช้งาน"}
              </button>
            )}
          </div>
          <button
            onClick={skipSetup}
            className="mt-2 w-full py-2 text-center text-xs font-bold text-[#5A6B85] transition hover:text-[#3E4C61]"
          >
            ไว้ทีหลัง →
          </button>
        </div>
      </div>
    </div>
  );
}
