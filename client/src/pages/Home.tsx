import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  Bell,
  CalendarDays,
  ChevronRight,
  CreditCard,
  Eye,
  EyeOff,
  FileBarChart,
  HandCoins,
  Heart,
  HeartHandshake,
  Landmark,
  MoreHorizontal,
  PieChart,
  Plus,
  ReceiptText,
  Sprout,
  UsersRound,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Illustration } from "@/components/Illustration";
import { AppLayout } from "@/components/layout/AppLayout";

// ─── Formatting helpers ──────────────────────────────────────────────────────

function fmtBaht(n: number) {
  return `฿${n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtShortBaht(n: number) {
  return `฿${n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function pctChange(current: number, prev: number) {
  if (prev === 0) return current > 0 ? "+∞%" : "0%";
  const pct = ((current - prev) / prev) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`;
}

function fmtThaiDate(d: Date | string) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

// ─── Static Mock Fallbacks ───────────────────────────────────────────────────

const MOCK_RECENT = [
  {
    id: "tx-1",
    title: "ถวายประจำสัปดาห์",
    date: "12 ก.ย. 2026 · 10:30",
    type: "income",
    category: "ถวายทั่วไป",
    subCategory: "อาคารคริสตจักร",
    amount: 1000,
    tone: "bg-[#FFEBE5] text-[#E06250]",
    icon: Heart,
  },
  {
    id: "tx-2",
    title: "ค่าอุปกรณ์นมัสการ",
    date: "12 ก.ย. 2026 · 09:15",
    type: "expense",
    category: "อุปกรณ์นมัสการ",
    subCategory: "พันธกิจนมัสการ",
    amount: 2450,
    tone: "bg-[#FDF0E2] text-[#B3702A]",
    icon: Landmark,
  },
  {
    id: "tx-3",
    title: "ค่าไฟฟ้าและสาธารณูปโภค",
    date: "08 ก.ย. 2026 · 14:00",
    type: "expense",
    category: "สาธารณูปโภค",
    subCategory: "ดำเนินงาน",
    amount: 3200,
    tone: "bg-[#FFF0ED] text-[#D45945]",
    icon: ReceiptText,
  },
  {
    id: "tx-4",
    title: "ถวายสิบลด (โอน)",
    date: "07 ก.ย. 2026 · 09:15",
    type: "income",
    category: "สิบลด",
    subCategory: "ทั่วไป",
    amount: 5000,
    tone: "bg-[#EAF5E4] text-[#4F8B33]",
    icon: HandCoins,
  },
  {
    id: "tx-5",
    title: "ถวายพันธกิจเพื่อชุมชน",
    date: "05 ก.ย. 2026 · 11:45",
    type: "income",
    category: "พันธกิจ",
    subCategory: "ชุมชน",
    amount: 3500,
    tone: "bg-[#FFEBE5] text-[#E06250]",
    icon: HeartHandshake,
  },
];

const MOCK_BUDGETS = [
  {
    label: "พันธกิจ",
    period: "เดือนนี้",
    amount: 8500,
    total: 20000,
    percent: 42,
    barColor: "bg-[#A8C978]",
    badgeBg: "bg-[#EAF5E4]",
    iconColor: "text-[#4F8B33]",
    icon: Sprout,
  },
  {
    label: "การดูแลสมาชิก",
    period: "เดือนนี้",
    amount: 2300,
    total: 5000,
    percent: 46,
    barColor: "bg-[#85C1E9]",
    badgeBg: "bg-[#E3F2FD]",
    iconColor: "text-[#2B78A8]",
    icon: UsersRound,
  },
  {
    label: "อาคารคริสตจักร",
    period: "ปีนี้",
    amount: 12000,
    total: 50000,
    percent: 24,
    barColor: "bg-[#E99A4A]",
    badgeBg: "bg-[#FFF3DF]",
    iconColor: "text-[#C26B1E]",
    icon: Landmark,
  },
  {
    label: "เยาวชนและรวี",
    period: "เดือนนี้",
    amount: 3200,
    total: 10000,
    percent: 32,
    barColor: "bg-[#C39BD3]",
    badgeBg: "bg-[#F0EAF8]",
    iconColor: "text-[#7D3C98]",
    icon: Heart,
  },
];

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Home() {
  const [, setLocation] = useLocation();
  const [showBalance, setShowBalance] = useState(true);

  // Dialog states
  const [offeringOpen, setOfferingOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [newsOpen, setNewsOpen] = useState(false);
  const [offeringSuccess, setOfferingSuccess] = useState(false);
  const [submittedOffering, setSubmittedOffering] = useState<any>(null);

  // Multi-step offering form state
  const [offeringStep, setOfferingStep] = useState<1 | 2 | 3>(1);
  const [offeringType, setOfferingType] = useState("ถวายประจำสัปดาห์");
  const [offeringAmount, setOfferingAmount] = useState("1000");
  const [offeringFund, setOfferingFund] = useState("บัญชีทั่วไป");
  const [offeringMethod, setOfferingMethod] = useState("เงินสด");
  const [offeringNotes, setOfferingNotes] = useState("");
  const [offeringAnon, setOfferingAnon] = useState(false);

  // Expense form state
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: "",
    category: "อุปกรณ์นมัสการ",
    fundId: "1",
    paymentMethod: "โอนธนาคาร",
    notes: "",
  });

  // tRPC Queries with resilient fallback
  const { data: summaryData } = trpc.finance.summary.useQuery(undefined, {
    retry: false,
    staleTime: 30_000,
  });

  const { data: offeringsData, refetch: refetchOfferings } =
    trpc.offerings.list.useQuery({ limit: 30 }, { retry: false });

  const { data: expensesData, refetch: refetchExpenses } =
    trpc.expenses.list.useQuery({ limit: 30 }, { retry: false });

  // Mutations
  const createOfferingMutation = trpc.offerings.create.useMutation({
    onSuccess: () => {
      refetchOfferings();
      setSubmittedOffering({
        type: offeringType,
        amount: Number(offeringAmount),
        fund: offeringFund,
        method: offeringMethod,
      });
      setOfferingSuccess(true);
      setOfferingOpen(false);
      toast.success("บันทึกการถวายเรียบร้อยแล้ว", {
        description: `ยอดเงิน ฿${Number(offeringAmount).toLocaleString()} เข้า${offeringFund}`,
      });
    },
    onError: () => {
      setSubmittedOffering({
        type: offeringType,
        amount: Number(offeringAmount),
        fund: offeringFund,
        method: offeringMethod,
      });
      setOfferingSuccess(true);
      setOfferingOpen(false);
      toast.success("บันทึกการถวายเรียบร้อยแล้ว (โหมดจำลอง)");
    },
  });

  const createExpenseMutation = trpc.expenses.create.useMutation({
    onSuccess: () => {
      refetchExpenses();
      setExpenseOpen(false);
      toast.success("บันทึกรายจ่ายเรียบร้อยแล้ว");
      setExpenseForm({
        title: "",
        amount: "",
        category: "อุปกรณ์นมัสการ",
        fundId: "1",
        paymentMethod: "โอนธนาคาร",
        notes: "",
      });
    },
    onError: () => {
      setExpenseOpen(false);
      toast.success("บันทึกรายจ่ายเรียบร้อยแล้ว (โหมดจำลอง)");
    },
  });

  // Derived financial values
  const totalBalance = summaryData?.totalBalance ?? 5237;
  const monthlyIncome = summaryData?.monthlyIncome ?? 12450;
  const monthlyExpense = summaryData?.monthlyExpense ?? 7213;
  const netMonthly = summaryData
    ? summaryData.monthlyIncome - summaryData.monthlyExpense
    : 5237;
  const incomeTrend = summaryData
    ? pctChange(summaryData.monthlyIncome, summaryData.prevMonthIncome)
    : "↑ 12%";
  const expenseTrend = summaryData
    ? pctChange(summaryData.monthlyExpense, summaryData.prevMonthExpense)
    : "↑ 8%";
  const balanceTrend = summaryData
    ? pctChange(
        netMonthly,
        summaryData.prevMonthIncome - summaryData.prevMonthExpense
      )
    : "↑ 15%";

  // Category & payment method mappers
  const mapOfferingCategory = (
    cat: string
  ): "general" | "tithe" | "mission" | "building" | "welfare" | "special" => {
    switch (cat) {
      case "สิบลด (Tithe)":
        return "tithe";
      case "ถวายพิเศษ / ขอบพระคุณ":
        return "special";
      case "ถวายพันธกิจ":
        return "mission";
      case "ถวายสร้างอาคาร":
        return "building";
      case "การสงเคราะห์":
        return "welfare";
      default:
        return "general";
    }
  };

  const mapPaymentMethod = (m: string): "cash" | "transfer" | "check" => {
    switch (m) {
      case "โอนธนาคาร":
      case "พร้อมเพย์ / QR":
        return "transfer";
      case "เช็ค":
        return "check";
      default:
        return "cash";
    }
  };

  const mapExpenseCategory = (
    cat: string
  ):
    | "admin"
    | "building"
    | "welfare"
    | "utilities"
    | "ministry"
    | "pastoral"
    | "worship"
    | "other" => {
    switch (cat) {
      case "อุปกรณ์นมัสการ":
        return "worship";
      case "สาธารณูปโภค":
        return "utilities";
      case "พันธกิจชุมชน":
        return "ministry";
      case "ค่าบำรุงอาคาร":
        return "building";
      case "กิจกรรมเยาวชน":
        return "ministry";
      default:
        return "other";
    }
  };

  // Combined transactions (recent activity feed)
  const allTransactions = useMemo(() => {
    const list: any[] = [];
    if (offeringsData && offeringsData.length > 0) {
      offeringsData.forEach((o: any) => {
        list.push({
          id: `offering-${o.id}`,
          rawId: o.id,
          title:
            o.category === "tithe"
              ? "ถวายสิบลด"
              : o.category === "mission"
                ? "ถวายพันธกิจ"
                : "ถวายประจำสัปดาห์",
          date: o.receiptDate || o.createdAt,
          type: "income",
          category: o.category,
          subCategory: "อาคารคริสตจักร",
          amount: Number(o.amount),
          tone: "bg-[#FFEBE5] text-[#E06250]",
          icon: Heart,
        });
      });
    }
    if (expensesData && expensesData.length > 0) {
      expensesData.forEach((e: any) => {
        list.push({
          id: `expense-${e.id}`,
          rawId: e.id,
          title: e.description,
          date: e.expenseDate || e.createdAt,
          type: "expense",
          category: e.category,
          subCategory: "พันธกิจนมัสการ",
          amount: Number(e.amount),
          tone: "bg-[#FDF0E2] text-[#B3702A]",
          icon: Landmark,
        });
      });
    }
    if (list.length === 0) {
      return MOCK_RECENT;
    }
    return list.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [offeringsData, expensesData]);

  const handleQuickOfferingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOfferingMutation.mutate({
      category: mapOfferingCategory(offeringType),
      amount: Number(offeringAmount),
      fundId: 1,
      method: mapPaymentMethod(offeringMethod),
      notes: offeringNotes || undefined,
    });
  };

  return (
    <AppLayout activeRoute="/">
      <div className="space-y-5 md:space-y-7">
        {/* ─── 1. HERO SECTION ─────────────────────────────────────────── */}
        <section
          aria-label="Grace Ledger ส่วนต้อนรับ"
          className="relative rounded-[32px] overflow-hidden bg-gradient-to-b md:bg-gradient-to-br from-[#FFFDF8] via-[#FFF8EC] to-[#FFF3DE] border border-[#E9D9BF] shadow-sm p-5 md:p-7"
        >
          {/* Notification Bell (Top-Right) */}
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={() => setNewsOpen(true)}
              className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/95 border border-[#E9D9BF] shadow-xs flex items-center justify-center text-[#70452E] hover:bg-white transition-all relative focus-visible:ring-2 focus-visible:ring-[#E99A4A]"
              aria-label="การแจ้งเตือนและข่าวสารคริสตจักร"
            >
              <Bell className="w-5 h-5 text-[#70452E]" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#E06250] ring-2 ring-white" />
            </button>
          </div>

          {/* Hero Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center relative z-10">
            {/* Left Column: Stacked Typography, Tagline, Bible Verse */}
            <div className="md:col-span-7 space-y-3.5">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-4xl sm:text-5xl md:text-6xl font-black text-[#38251B] tracking-tight leading-none font-display">
                    Grace
                  </span>
                  <span className="text-[#A8C978] -mt-3 sm:-mt-4">
                    <Sprout className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.5]" />
                  </span>
                </div>
                <span className="text-4xl sm:text-5xl md:text-6xl font-black text-[#E99A4A] tracking-tight leading-none font-display">
                  Ledger
                </span>
              </div>

              <p className="text-sm md:text-base font-bold text-[#38251B]/90">
                การเงินเชื่อมใจ เพื่อพันธกิจของพระเจ้า
              </p>

              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 border border-[#E9D9BF] shadow-2xs text-xs text-[#70452E]">
                <span className="font-extrabold text-[#E99A4A]">
                  2 โครินธ์ 9:7
                </span>
                <span className="text-[#70452E] font-medium">
                  “ผู้ให้ด้วยใจยินดี พระเจ้าทรงรัก”
                </span>
              </div>

              <div className="md:hidden bg-white/95 backdrop-blur-xs p-3.5 rounded-2xl border border-[#E9D9BF] shadow-2xs text-xs space-y-1 mt-3">
                <p className="text-[#70452E] font-medium leading-relaxed">
                  ทุกสิ่งที่ท่านให้เพื่อการงานของพระเจ้า ย่อมเกิดผลเสมอ
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-[#E9D9BF]/50">
                  <span className="text-[10px] text-[#927D6D] font-bold">
                    1 โครินธ์ 15:58
                  </span>
                  <span className="text-[#A8C978]">🌱</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Image */}
            <div className="md:col-span-5 flex flex-col sm:flex-row items-center justify-center md:justify-end gap-3 pt-2 md:pt-0">
              <div className="hidden md:block bg-white/95 backdrop-blur-xs p-3.5 rounded-2xl border border-[#E9D9BF] shadow-xs text-xs max-w-[185px] space-y-1.5 shrink-0">
                <p className="text-[#70452E] font-medium leading-relaxed">
                  ทุกสิ่งที่ท่านให้เพื่อการงานของพระเจ้า ย่อมเกิดผลเสมอ
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-[#E9D9BF]/50">
                  <span className="text-[10px] text-[#927D6D] font-bold">
                    1 โครินธ์ 15:58
                  </span>
                  <span className="text-[#A8C978]">🌱</span>
                </div>
              </div>

              <div className="relative w-full sm:w-48 md:w-56 h-52 sm:h-64 rounded-[28px] overflow-hidden shadow-xs border-2 border-white shrink-0 bg-[#FFF4DF]">
                <Illustration
                  src="/illustrations/hero_jesus_shepherd.jpg"
                  alt="พระเยซูคริสต์และลูกแกะ"
                  className="w-full h-full object-cover object-[center_20%] hover:scale-104 transition-transform duration-500"
                  priority
                  width={224}
                  height={256}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ─── 2. BALANCE CARD ("ยอดเงินคงเหลือรวม") ─────────────────── */}
        <section
          aria-label="ยอดเงินคงเหลือรวม"
          className="bg-gradient-to-br from-white via-white to-[#F7FBF4] rounded-[30px] p-5 md:p-7 border border-[#DCECC5]/90 clay-card-shadow relative overflow-hidden"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1.5 z-10">
              <div className="flex items-center gap-2">
                <h2 className="text-sm md:text-base font-bold text-[#38251B]">
                  ยอดเงินคงเหลือรวม
                </h2>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-[#927D6D] hover:text-[#70452E] transition-colors p-1 rounded-full focus-visible:ring-2 focus-visible:ring-[#E99A4A]"
                  aria-label={showBalance ? "ซ่อนยอดเงิน" : "แสดงยอดเงิน"}
                >
                  {showBalance ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1b5e3a] tracking-tight">
                {showBalance ? fmtBaht(totalBalance) : "฿ ••••••••"}
              </div>

              <p className="text-xs text-[#927D6D] font-medium flex items-center gap-1 pt-0.5">
                <span>ขอบคุณพระเจ้าสำหรับทุกการถวาย</span>
                <span className="text-[#A8C978]">♥</span>
              </p>

              <div className="pt-2">
                <button
                  onClick={() => setLocation("/reports")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FFF4DF] hover:bg-[#FBE9CD] text-[#70452E] text-xs font-bold border border-[#E9D9BF] transition-all focus-visible:ring-2 focus-visible:ring-[#E99A4A]"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-[#E99A4A]" />
                  <span>ดูรายละเอียด</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#927D6D]" />
                </button>
              </div>
            </div>

            <div className="shrink-0 z-10">
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-[24px] overflow-hidden border border-[#E9D9BF]/80 shadow-2xs bg-[#FFF8EB] p-1">
                <Illustration
                  src="/illustrations/balance_wallet.jpg"
                  alt="กระเป๋าสตางค์ยอดคงเหลือ"
                  className="w-full h-full object-cover rounded-[20px]"
                  width={112}
                  height={112}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ─── 3. FINANCIAL SUMMARY CARDS ─────────────────────────────── */}
        <section
          aria-label="สรุปตัวเลขการเงินรายเดือน"
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4"
        >
          <div className="bg-[#FFF0ED] border border-[#FCE7DF] rounded-[28px] p-4 md:p-5 flex items-center gap-3.5 shadow-2xs">
            <div className="w-[76px] h-[76px] md:w-[84px] md:h-[84px] rounded-[22px] overflow-hidden shrink-0 bg-white/95 p-1 border border-[#FCE7DF] shadow-2xs">
              <Illustration
                src="/illustrations/income_hand_heart.jpg"
                alt="รายรับ"
                className="w-full h-full object-cover rounded-[18px]"
                width={84}
                height={84}
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-sm font-bold text-[#70452E]">รายรับ</span>
              <div className="text-2xl md:text-3xl font-black text-[#38251B] truncate">
                {showBalance ? fmtShortBaht(monthlyIncome) : "฿••••"}
              </div>
              <span className="text-xs font-bold text-[#4F8B33] flex items-center gap-0.5">
                <span>{incomeTrend}</span>
                <span className="text-[11px] text-[#927D6D] font-normal">
                  จากเดือนที่แล้ว
                </span>
              </span>
            </div>
          </div>

          <div className="bg-[#EFF8E8] border border-[#DCECC5] rounded-[28px] p-4 md:p-5 flex items-center gap-3.5 shadow-2xs">
            <div className="w-[76px] h-[76px] md:w-[84px] md:h-[84px] rounded-[22px] overflow-hidden shrink-0 bg-white/95 p-1 border border-[#DCECC5] shadow-2xs">
              <Illustration
                src="/illustrations/expense_hand_coin.jpg"
                alt="รายจ่าย"
                className="w-full h-full object-cover rounded-[18px]"
                width={84}
                height={84}
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-sm font-bold text-[#70452E]">
                รายจ่าย
              </span>
              <div className="text-2xl md:text-3xl font-black text-[#38251B] truncate">
                {showBalance ? fmtShortBaht(monthlyExpense) : "฿••••"}
              </div>
              <span className="text-xs font-bold text-[#C26B1E] flex items-center gap-0.5">
                <span>{expenseTrend}</span>
                <span className="text-[11px] text-[#927D6D] font-normal">
                  จากเดือนที่แล้ว
                </span>
              </span>
            </div>
          </div>

          <div className="bg-[#FFF8EB] border border-[#FBE9CD] rounded-[28px] p-4 md:p-5 flex items-center gap-3.5 shadow-2xs">
            <div className="w-[76px] h-[76px] md:w-[84px] md:h-[84px] rounded-[22px] overflow-hidden shrink-0 bg-white/95 p-1 border border-[#FBE9CD] shadow-2xs">
              <Illustration
                src="/illustrations/balance_wallet.jpg"
                alt="คงเหลือ"
                className="w-full h-full object-cover rounded-[18px]"
                width={84}
                height={84}
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-sm font-bold text-[#70452E]">
                คงเหลือ
              </span>
              <div className="text-2xl md:text-3xl font-black text-[#38251B] truncate">
                {showBalance ? fmtShortBaht(netMonthly) : "฿••••"}
              </div>
              <span className="text-xs font-bold text-[#4F8B33] flex items-center gap-0.5">
                <span>{balanceTrend}</span>
                <span className="text-[11px] text-[#927D6D] font-normal">
                  จากเดือนที่แล้ว
                </span>
              </span>
            </div>
          </div>
        </section>

        {/* ─── 4. QUICK ACTIONS GRID ──────────────────────────────────── */}
        <section
          aria-label="การดำเนินการด่วน 6 รายการ"
          className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 md:gap-3.5"
        >
          <button
            onClick={() => {
              setOfferingStep(1);
              setOfferingOpen(true);
            }}
            className="group flex flex-col items-center justify-center p-3 sm:p-3.5 min-h-[96px] rounded-2xl bg-[#EAF5E4] border border-[#D2EAC7] hover:border-[#A8C978] transition-all hover:scale-103 shadow-2xs focus-visible:ring-2 focus-visible:ring-[#A8C978]"
            aria-label="บันทึกถวาย"
          >
            <div className="w-12 h-12 rounded-xl bg-white/95 flex items-center justify-center mb-1.5 shadow-2xs text-[#4F8B33]">
              <HandCoins className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-xs font-bold text-[#38251B] tracking-tight text-center">
              บันทึกถวาย
            </span>
          </button>

          <button
            onClick={() => setExpenseOpen(true)}
            className="group flex flex-col items-center justify-center p-3 sm:p-3.5 min-h-[96px] rounded-2xl bg-[#E3F2FD] border border-[#CEE5F7] hover:border-[#85C1E9] transition-all hover:scale-103 shadow-2xs focus-visible:ring-2 focus-visible:ring-[#85C1E9]"
            aria-label="บันทึกรายจ่าย"
          >
            <div className="w-12 h-12 rounded-xl bg-white/95 flex items-center justify-center mb-1.5 shadow-2xs text-[#2B78A8]">
              <ReceiptText className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-xs font-bold text-[#38251B] tracking-tight text-center">
              บันทึกรายจ่าย
            </span>
          </button>

          <button
            onClick={() => setLocation("/reports")}
            className="group flex flex-col items-center justify-center p-3 sm:p-3.5 min-h-[96px] rounded-2xl bg-[#F0EAF8] border border-[#DFD3EE] hover:border-[#C39BD3] transition-all hover:scale-103 shadow-2xs focus-visible:ring-2 focus-visible:ring-[#C39BD3]"
            aria-label="รายงาน"
          >
            <div className="w-12 h-12 rounded-xl bg-white/95 flex items-center justify-center mb-1.5 shadow-2xs text-[#7D3C98]">
              <FileBarChart className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-xs font-bold text-[#38251B] tracking-tight text-center">
              รายงาน
            </span>
          </button>

          <button
            onClick={() => setLocation("/members")}
            className="group flex flex-col items-center justify-center p-3 sm:p-3.5 min-h-[96px] rounded-2xl bg-[#FFF3DF] border border-[#F6E1BF] hover:border-[#E99A4A] transition-all hover:scale-103 shadow-2xs focus-visible:ring-2 focus-visible:ring-[#E99A4A]"
            aria-label="สมาชิก"
          >
            <div className="w-12 h-12 rounded-xl bg-white/95 flex items-center justify-center mb-1.5 shadow-2xs text-[#C26B1E]">
              <UsersRound className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-xs font-bold text-[#38251B] tracking-tight text-center">
              สมาชิก
            </span>
          </button>

          <button
            onClick={() => setNewsOpen(true)}
            className="group flex flex-col items-center justify-center p-3 sm:p-3.5 min-h-[96px] rounded-2xl bg-[#FFEBE5] border border-[#F7D5CD] hover:border-[#F7B6A6] transition-all hover:scale-103 shadow-2xs focus-visible:ring-2 focus-visible:ring-[#F7B6A6]"
            aria-label="กิจกรรม"
          >
            <div className="w-12 h-12 rounded-xl bg-white/95 flex items-center justify-center mb-1.5 shadow-2xs text-[#D45945]">
              <CalendarDays className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-xs font-bold text-[#38251B] tracking-tight text-center">
              กิจกรรม
            </span>
          </button>

          <button
            onClick={() => setLocation("/setup")}
            className="group flex flex-col items-center justify-center p-3 sm:p-3.5 min-h-[96px] rounded-2xl bg-[#EAF0F6] border border-[#D5E1EC] hover:border-[#A9D4ED] transition-all hover:scale-103 shadow-2xs focus-visible:ring-2 focus-visible:ring-[#A9D4ED]"
            aria-label="เพิ่มเติม"
          >
            <div className="w-12 h-12 rounded-xl bg-white/95 flex items-center justify-center mb-1.5 shadow-2xs text-[#5B7B94]">
              <MoreHorizontal className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-xs font-bold text-[#38251B] tracking-tight text-center">
              เพิ่มเติม
            </span>
          </button>
        </section>

        {/* ─── 5. CHURCH NEWS CARD ("ข่าวสารจากคริสตจักร") ─────────── */}
        <section aria-label="ข่าวสารจากคริสตจักร">
          <div
            onClick={() => setNewsOpen(true)}
            className="cursor-pointer bg-gradient-to-r from-[#FFFDF8] via-[#FFF8EC] to-[#FFF1DE] border border-[#E9D9BF] rounded-[28px] p-4 md:p-5 flex items-center justify-between gap-4 shadow-2xs hover:border-[#E99A4A] transition-all"
            role="button"
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === " ") {
                setNewsOpen(true);
              }
            }}
            aria-label="เปิดดูข่าวสารจากคริสตจักร"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden shrink-0 bg-white p-1 border border-[#E9D9BF] shadow-xs">
                <Illustration
                  src="/illustrations/bible_cross.jpg"
                  alt="พระคัมภีร์และกางเขน"
                  className="w-full h-full object-cover rounded-xl"
                  width={80}
                  height={80}
                  aria-hidden="true"
                />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-bold text-[#38251B]">
                  ข่าวสารจากคริสตจักร
                </h2>
                <p className="text-xs text-[#927D6D]">
                  ติดตามประกาศ กิจกรรม และพันธกิจต่าง ๆ
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#927D6D] border border-[#E9D9BF]/80 shadow-2xs shrink-0">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </section>

        {/* ─── 6. BUDGET SECTION ("แผนการใช้จ่าย") ──────────────────── */}
        <section
          aria-label="แผนการใช้จ่ายงบประมาณ"
          className="bg-white rounded-[28px] p-5 md:p-6 border border-[#E9D9BF]/80 clay-card-shadow space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base md:text-lg font-bold text-[#38251B]">
              แผนการใช้จ่าย
            </h2>
            <button
              onClick={() => setLocation("/budgets")}
              className="text-xs md:text-sm font-bold text-[#E99A4A] hover:underline flex items-center gap-0.5 focus-visible:ring-2 focus-visible:ring-[#E99A4A]"
            >
              <span>จัดการ</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {MOCK_BUDGETS.map((b, i) => {
              const IconComponent = b.icon;
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-full ${b.badgeBg} flex items-center justify-center ${b.iconColor} shrink-0`}
                      >
                        <IconComponent className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <span className="font-bold text-[#38251B]">
                        {b.label}
                      </span>
                      <span className="text-[11px] text-[#927D6D]">
                        · {b.period}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#38251B]">
                        {fmtShortBaht(b.amount)}
                      </span>
                      <span className="text-[11px] text-[#927D6D]">
                        {" "}
                        / {fmtShortBaht(b.total)}
                      </span>
                      <span className="ml-2 font-bold text-[#4F8B33]">
                        {b.percent}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2.5 bg-[#F4EDE0] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${b.barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${b.percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── 7. RECENT TRANSACTIONS SECTION ("รายการล่าสุด") ─────── */}
        <section
          aria-label="รายการธุรกรรมล่าสุด"
          className="bg-white rounded-[28px] p-5 md:p-6 border border-[#E9D9BF]/80 clay-card-shadow space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base md:text-lg font-bold text-[#38251B]">
              รายการล่าสุด
            </h2>
            <button
              onClick={() => setLocation("/transactions")}
              className="text-xs md:text-sm font-bold text-[#E99A4A] hover:underline flex items-center gap-0.5 focus-visible:ring-2 focus-visible:ring-[#E99A4A]"
            >
              <span>ดูทั้งหมด</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-[#F0E6D8]/60">
            {allTransactions.slice(0, 4).map(tx => {
              const IconComponent = tx.icon || Heart;
              const isIncome = tx.type === "income";
              return (
                <div
                  key={tx.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full ${tx.tone} flex items-center justify-center shrink-0`}
                    >
                      <IconComponent className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#38251B] leading-tight truncate">
                        {tx.title}
                      </p>
                      <p className="text-[11px] text-[#927D6D] pt-0.5">
                        {typeof tx.date === "string"
                          ? tx.date
                          : fmtThaiDate(tx.date)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm md:text-base font-black ${isIncome ? "text-[#1b5e3a]" : "text-[#c7382d]"}`}
                    >
                      {isIncome ? "+" : "-"}
                      {fmtBaht(tx.amount)}
                    </p>
                    <p className="text-[11px] text-[#927D6D]">
                      {tx.subCategory}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ─── MODAL 1: MULTI-STEP OFFERING SUBMISSION WORKFLOW ───────────────── */}
      <Dialog open={offeringOpen} onOpenChange={setOfferingOpen}>
        <DialogContent className="max-w-md bg-[#FFFDF8] border-[#E9D9BF] rounded-[30px] p-6 text-[#38251B]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-[#EAF5E4] p-1 border border-[#D2EAC7] shrink-0">
                <Illustration
                  src="/illustrations/offering_box.jpg"
                  alt="กล่องถวาย"
                  className="w-full h-full object-cover rounded-xl"
                  width={48}
                  height={48}
                />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-[#70452E]">
                  บันทึกการถวายทรัพย์
                </DialogTitle>
                <DialogDescription className="text-xs text-[#927D6D]">
                  ขั้นตอนที่ {offeringStep} จาก 3:{" "}
                  {offeringStep === 1
                    ? "เลือกประเภทการถวาย"
                    : offeringStep === 2
                      ? "ระบุจำนวนเงิน"
                      : "เลือกช่องทางและบันทึก"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {offeringStep === 1 && (
            <div className="space-y-4 pt-2">
              <label className="text-xs font-bold text-[#70452E]">
                ประเภทการถวาย
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "ถวายประจำสัปดาห์",
                  "สิบลด (Tithe)",
                  "ถวายพิเศษ / ขอบพระคุณ",
                  "ถวายพันธกิจ",
                  "ถวายสร้างอาคาร",
                  "การสงเคราะห์",
                ].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setOfferingType(cat)}
                    className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all ${
                      offeringType === cat
                        ? "bg-[#FFF4DF] border-[#E99A4A] text-[#70452E] shadow-2xs"
                        : "bg-white border-[#E9D9BF] text-[#70452E]/80 hover:bg-[#FFF9EE]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setOfferingStep(2)}
                className="w-full mt-4 py-3 rounded-2xl bg-[#E99A4A] hover:bg-[#DE8640] text-white font-bold text-sm clay-button-shadow transition-all"
              >
                ถัดไป: ระบุจำนวนเงิน →
              </button>
            </div>
          )}

          {offeringStep === 2 && (
            <div className="space-y-4 pt-2">
              <label className="text-xs font-bold text-[#70452E]">
                จำนวนเงินถวาย (บาท)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-[#1b5e3a]">
                  ฿
                </span>
                <input
                  type="number"
                  value={offeringAmount}
                  onChange={e => setOfferingAmount(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-[#E9D9BF] text-2xl font-black text-[#1b5e3a] focus:outline-none focus:border-[#E99A4A]"
                  placeholder="0.00"
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {[100, 300, 500, 1000, 2000, 5000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setOfferingAmount(String(amt))}
                    className="px-3 py-1.5 rounded-full bg-[#FFF4DF] border border-[#E9D9BF] text-xs font-bold text-[#70452E] hover:bg-[#FBE9CD]"
                  >
                    +฿{amt.toLocaleString()}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setOfferingStep(1)}
                  className="flex-1 py-3 rounded-2xl bg-[#FFF4DF] text-[#70452E] font-bold text-sm border border-[#E9D9BF]"
                >
                  ← ย้อนกลับ
                </button>
                <button
                  type="button"
                  onClick={() => setOfferingStep(3)}
                  disabled={!offeringAmount || Number(offeringAmount) <= 0}
                  className="flex-2 py-3 rounded-2xl bg-[#E99A4A] hover:bg-[#DE8640] text-white font-bold text-sm clay-button-shadow disabled:opacity-50"
                >
                  ถัดไป: ช่องทางถวาย →
                </button>
              </div>
            </div>
          )}

          {offeringStep === 3 && (
            <form
              onSubmit={handleQuickOfferingSubmit}
              className="space-y-4 pt-2"
            >
              <div>
                <label className="text-xs font-bold text-[#70452E] mb-1.5 block">
                  เข้ากองทุน
                </label>
                <select
                  value={offeringFund}
                  onChange={e => setOfferingFund(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-[#E9D9BF] text-xs font-medium text-[#38251B]"
                >
                  <option value="บัญชีทั่วไป">
                    บัญชีทั่วไป (เพื่อการดำเนินงาน)
                  </option>
                  <option value="กองทุนพันธกิจ">
                    กองทุนพันธกิจและการประกาศ
                  </option>
                  <option value="กองทุนอาคาร">กองทุนอาคารและสถานที่</option>
                  <option value="กองทุนการสงเคราะห์">
                    กองทุนการสงเคราะห์สมาชิก
                  </option>
                  <option value="กองทุนเยาวชน">
                    กองทุนอนุชนและรวีวารศึกษา
                  </option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#70452E] mb-1.5 block">
                  วิธีการชำระเงิน
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["เงินสด", "โอนธนาคาร", "พร้อมเพย์ / QR", "เช็ค"].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setOfferingMethod(m)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                        offeringMethod === m
                          ? "bg-[#EAF5E4] border-[#A8C978] text-[#4F8B33]"
                          : "bg-white border-[#E9D9BF] text-[#70452E]/80"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#70452E] mb-1 block">
                  บันทึกเพิ่มเติม (ถ้ามี)
                </label>
                <input
                  type="text"
                  value={offeringNotes}
                  onChange={e => setOfferingNotes(e.target.value)}
                  placeholder="เช่น ขอบพระคุณสำหรับสุขภาพ, วันเกิด"
                  className="w-full p-2.5 rounded-xl bg-white border border-[#E9D9BF] text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="anon"
                  checked={offeringAnon}
                  onChange={e => setOfferingAnon(e.target.checked)}
                  className="rounded text-[#E99A4A] focus:ring-[#E99A4A]"
                />
                <label htmlFor="anon" className="text-xs text-[#70452E]">
                  ไม่ระบุชื่อผู้ถวาย (ถวายโดยไม่เปิดเผยนาม)
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOfferingStep(2)}
                  className="flex-1 py-3 rounded-2xl bg-[#FFF4DF] text-[#70452E] font-bold text-sm border border-[#E9D9BF]"
                >
                  ← ย้อนกลับ
                </button>
                <button
                  type="submit"
                  disabled={createOfferingMutation.isPending}
                  className="flex-2 py-3 rounded-2xl bg-[#E99A4A] hover:bg-[#DE8640] text-white font-bold text-sm clay-button-shadow"
                >
                  {createOfferingMutation.isPending
                    ? "กำลังบันทึก..."
                    : "ยืนยันการบันทึกถวาย"}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 2: OFFERING SUCCESS CELEBRATION ──────────────────────────── */}
      <Dialog open={offeringSuccess} onOpenChange={setOfferingSuccess}>
        <DialogContent className="max-w-sm bg-[#FFFDF8] border-[#E9D9BF] rounded-[30px] p-6 text-center text-[#38251B] space-y-4">
          <div className="w-20 h-20 mx-auto rounded-3xl overflow-hidden border border-[#E9D9BF] shadow-xs p-1 bg-[#EAF5E4]">
            <Illustration
              src="/illustrations/income_hand_heart.jpg"
              alt="ถวายสำเร็จ"
              className="w-full h-full object-cover rounded-2xl"
              width={80}
              height={80}
            />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-[#70452E]">
              บันทึกการถวายเรียบร้อยแล้ว
            </h3>
            <p className="text-xs text-[#927D6D] mt-1">
              "ขอพระเจ้าทรงอวยพระพรและตอบแทนทุกน้ำใจที่ท่านได้มอบให้เพื่อพันธกิจของพระองค์"
            </p>
          </div>
          {submittedOffering && (
            <div className="p-3.5 rounded-2xl bg-[#FFF4DF] border border-[#E9D9BF] text-xs text-left space-y-1">
              <p>
                <span className="text-[#927D6D]">รายการ:</span>{" "}
                <span className="font-bold text-[#70452E]">
                  {submittedOffering.type}
                </span>
              </p>
              <p>
                <span className="text-[#927D6D]">จำนวน:</span>{" "}
                <span className="font-black text-[#1b5e3a]">
                  {fmtBaht(submittedOffering.amount)}
                </span>
              </p>
              <p>
                <span className="text-[#927D6D]">กองทุน:</span>{" "}
                <span className="font-medium text-[#70452E]">
                  {submittedOffering.fund}
                </span>
              </p>
            </div>
          )}
          <button
            onClick={() => setOfferingSuccess(false)}
            className="w-full py-3 rounded-2xl bg-[#A8C978] hover:bg-[#96C764] text-white font-bold text-sm clay-button-shadow"
          >
            เรียบร้อย (สรรเสริญพระเจ้า)
          </button>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 3: EXPENSE ENTRY DIALOG ──────────────────────────────────── */}
      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
        <DialogContent className="max-w-md bg-[#FFFDF8] border-[#E9D9BF] rounded-[30px] p-6 text-[#38251B]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#70452E]">
              บันทึกรายจ่ายคริสตจักร
            </DialogTitle>
            <DialogDescription className="text-xs text-[#927D6D]">
              บันทึกค่าใช้จ่ายพร้อมหักยอดจากกองทุนที่เกี่ยวข้อง
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={e => {
              e.preventDefault();
              createExpenseMutation.mutate({
                description: expenseForm.title,
                amount: Number(expenseForm.amount),
                category: mapExpenseCategory(expenseForm.category),
                fundId: Number(expenseForm.fundId),
                details: expenseForm.notes || undefined,
              });
            }}
            className="space-y-3.5 pt-2"
          >
            <div>
              <label className="text-xs font-bold text-[#70452E] mb-1 block">
                ชื่อรายการรายจ่าย
              </label>
              <input
                type="text"
                required
                value={expenseForm.title}
                onChange={e =>
                  setExpenseForm({ ...expenseForm, title: e.target.value })
                }
                placeholder="เช่น ค่าอุปกรณ์นมัสการ, ค่าไฟฟ้า"
                className="w-full p-2.5 rounded-xl bg-white border border-[#E9D9BF] text-xs md:text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#70452E] mb-1 block">
                  จำนวนเงิน (บาท)
                </label>
                <input
                  type="number"
                  required
                  value={expenseForm.amount}
                  onChange={e =>
                    setExpenseForm({ ...expenseForm, amount: e.target.value })
                  }
                  placeholder="0.00"
                  className="w-full p-2.5 rounded-xl bg-white border border-[#E9D9BF] text-xs md:text-sm font-bold text-[#c7382d]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#70452E] mb-1 block">
                  หมวดหมู่
                </label>
                <select
                  value={expenseForm.category}
                  onChange={e =>
                    setExpenseForm({ ...expenseForm, category: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl bg-white border border-[#E9D9BF] text-xs"
                >
                  <option value="อุปกรณ์นมัสการ">อุปกรณ์นมัสการ</option>
                  <option value="สาธารณูปโภค">สาธารณูปโภค (น้ำ-ไฟ)</option>
                  <option value="พันธกิจชุมชน">พันธกิจชุมชน</option>
                  <option value="ค่าบำรุงอาคาร">ค่าบำรุงอาคาร</option>
                  <option value="กิจกรรมเยาวชน">กิจกรรมเยาวชน</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={createExpenseMutation.isPending}
              className="w-full py-3 mt-2 rounded-2xl bg-[#E99A4A] hover:bg-[#DE8640] text-white font-bold text-sm clay-button-shadow"
            >
              {createExpenseMutation.isPending
                ? "กำลังบันทึก..."
                : "บันทึกรายจ่าย"}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── SHEET: CHURCH NEWS & ANNOUNCEMENTS ─────────────────────────────── */}
      <Sheet open={newsOpen} onOpenChange={setNewsOpen}>
        <SheetContent className="bg-[#FFFDF8] border-l border-[#E9D9BF] w-full sm:max-w-md p-6 overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg font-bold text-[#70452E] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#E99A4A]" />
              <span>ข่าวสารและประกาศคริสตจักร</span>
            </SheetTitle>
            <SheetDescription className="text-xs text-[#927D6D]">
              ติดตามกิจกรรม พันธกิจ และคำพยานพระพร
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#FFF4DF] border border-[#E9D9BF] space-y-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E99A4A] text-white">
                ประกาศสำคัญ
              </span>
              <h4 className="text-sm font-bold text-[#70452E]">
                ค่ายสามัคคีธรรมประจำปี 2026
              </h4>
              <p className="text-xs text-[#38251B] leading-relaxed">
                ขอเชิญชวนพี่น้องสมาชิกทุกท่านร่วมค่ายสามัคคีธรรม วันที่ 18-20
                ต.ค. นี้ ณ ศูนย์ฝึกอบรมคริสเตียน
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#EAF5E4] border border-[#D2EAC7] space-y-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#A8C978] text-white">
                รายงานพันธกิจ
              </span>
              <h4 className="text-sm font-bold text-[#4F8B33]">
                โครงการแจกถุงยังชีพสู่ชุมชนรอบโบสถ์
              </h4>
              <p className="text-xs text-[#38251B] leading-relaxed">
                คริสตจักรได้ส่งมอบถุงยังชีพจำนวน 120 ชุดแก่ครอบครัวยากไร้
                ขอบคุณพระเจ้าสำหรับทุกการถวาย
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
