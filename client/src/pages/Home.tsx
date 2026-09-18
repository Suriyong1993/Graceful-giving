import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  FileBarChart,
  HandCoins,
  Heart,
  HeartHandshake,
  Home as HomeIcon,
  Info,
  Landmark,
  Layers,
  Loader2,
  MoreHorizontal,
  PieChart,
  Plus,
  ReceiptText,
  Search,
  Settings2,
  Sprout,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
import { AppMenu } from "@/components/layout/AppNavigation";
import {
  EXPENSE_CATEGORIES,
  OFFERING_CATEGORIES,
  offeringCategoryLabel,
  type ExpenseCategory,
  type OfferingCategory,
} from "@shared/categories";

export const quickActions = [
  { label: "บันทึกถวาย", icon: HandCoins, tone: "income" },
  { label: "บันทึกรายจ่าย", icon: ReceiptText, tone: "expense" },
  { label: "รายงาน", icon: BarChart3, tone: "report" },
  { label: "สมาชิก", icon: UsersRound, tone: "members" },
  { label: "กิจกรรม", icon: CalendarDays, tone: "events" },
  { label: "เพิ่มเติม", icon: MoreHorizontal, tone: "more" },
];

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

function trendArrow(trend: string) {
  return trend.trim().startsWith("-") ? "↓" : "↑";
}

function trendValue(trend: string) {
  return trend.replace(/^[+\-↑↓]\s*/, "");
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

// ─── Balance count-up (first-impression polish) ─────────────────────────────
// Animates the hero balance figure from 0 to its real value on mount/update
// instead of just appearing — skips straight to the final value for
// prefers-reduced-motion so no one is forced to watch a number tick up.
function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(target);
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (prefersReducedMotion) {
      setValue(target);
      return;
    }
    const start = performance.now();
    let frameId: number;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs, prefersReducedMotion]);

  return value;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Home() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Navigation tab state: "home" | "ledger" | "reports" | "profile"
  const [activeTab, setActiveTab] = useState<
    "home" | "ledger" | "reports" | "profile"
  >("home");
  const [showBalance, setShowBalance] = useState(true);

  // Dialog states
  const [offeringOpen, setOfferingOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
  const [newsOpen, setNewsOpen] = useState(false);
  const [offeringSuccess, setOfferingSuccess] = useState(false);
  const [submittedOffering, setSubmittedOffering] = useState<any>(null);

  // Filter states
  const [ledgerTab, setLedgerTab] = useState<
    "all" | "offerings" | "expenses" | "withdrawals"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Multi-step offering form state
  const [offeringStep, setOfferingStep] = useState<1 | 2 | 3>(1);
  const [offeringType, setOfferingType] = useState<OfferingCategory>("general");
  const [offeringAmount, setOfferingAmount] = useState("");
  const [offeringFund, setOfferingFund] = useState("");
  const [offeringMethod, setOfferingMethod] = useState("เงินสด");
  const [offeringNotes, setOfferingNotes] = useState("");
  const [offeringAnon, setOfferingAnon] = useState(false);

  // Expense form state
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: "",
    category: "worship" as ExpenseCategory,
    fundId: "",
    paymentMethod: "โอนธนาคาร",
    notes: "",
  });

  // Withdrawal form state
  const [withdrawalForm, setWithdrawalForm] = useState({
    purpose: "",
    amount: "",
    fundId: "",
    urgency: "normal",
    notes: "",
  });

  // tRPC Queries with resilient fallback
  const {
    data: summaryData,
    isLoading: summaryLoading,
    isError: summaryError,
  } = trpc.finance.summary.useQuery(undefined, {
    retry: false,
    staleTime: 30_000,
  });

  const { data: monthlyStatsData } = trpc.finance.monthlyStats.useQuery(
    undefined,
    {
      retry: false,
      staleTime: 60_000,
    }
  );

  const { data: accountsData } = trpc.finance.accounts.useQuery(undefined, {
    retry: false,
    staleTime: 60_000,
  });

  const { data: offeringsData, refetch: refetchOfferings } =
    trpc.offerings.list.useQuery({ limit: 30 }, { retry: false });

  const { data: expensesData, refetch: refetchExpenses } =
    trpc.expenses.list.useQuery({ limit: 30 }, { retry: false });

  const { data: churchProfile } = trpc.church.getProfile.useQuery(undefined, {
    retry: false,
  });

  // Mutations
  const createOfferingMutation = trpc.offerings.create.useMutation({
    onSuccess: () => {
      refetchOfferings();
      const fundName =
        (accountsData ?? []).find((fa: any) => String(fa.id) === offeringFund)
          ?.name ?? "กองทุนที่เลือก";
      setSubmittedOffering({
        type: offeringType,
        amount: Number(offeringAmount),
        fund: fundName,
        method: offeringMethod,
      });
      setOfferingSuccess(true);
      setOfferingOpen(false);
      toast.success("บันทึกการถวายเรียบร้อยแล้ว", {
        description: `${offeringCategoryLabel(offeringType)} ฿${Number(offeringAmount).toLocaleString()} เข้า${fundName}`,
      });
    },
    onError: error => {
      toast.error("บันทึกการถวายไม่สำเร็จ", { description: error.message });
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
        category: "worship" as ExpenseCategory,
        fundId: "",
        paymentMethod: "โอนธนาคาร",
        notes: "",
      });
    },
    onError: error => {
      toast.error("บันทึกรายจ่ายไม่สำเร็จ", { description: error.message });
    },
  });

  const createWithdrawalMutation = trpc.withdrawals.create.useMutation({
    onSuccess: () => {
      setWithdrawalOpen(false);
      toast.success("ยื่นคำขอเบิกเงินเรียบร้อยแล้ว รอการอนุมัติ");
      setWithdrawalForm({
        purpose: "",
        amount: "",
        fundId: "",
        urgency: "normal",
        notes: "",
      });
    },
    onError: error => {
      toast.error("ยื่นคำขอเบิกเงินไม่สำเร็จ", { description: error.message });
    },
  });

  // Derived values always come from the current API response.
  const totalBalance = summaryData?.totalBalance;
  const monthlyIncome = summaryData?.monthlyIncome;
  const monthlyExpense = summaryData?.monthlyExpense;
  const netMonthly = summaryData
    ? summaryData.monthlyIncome - summaryData.monthlyExpense
    : undefined;
  const incomeTrend = summaryData
    ? pctChange(summaryData.monthlyIncome, summaryData.prevMonthIncome)
    : "";
  const expenseTrend = summaryData
    ? pctChange(summaryData.monthlyExpense, summaryData.prevMonthExpense)
    : "";
  const isBalanceLoading = summaryLoading;
  const isDataUnavailable = !summaryLoading && (summaryError || !summaryData);
  const isPositiveBalance = (totalBalance ?? 0) >= 0;
  const isPositiveNet = (netMonthly ?? 0) >= 0;
  const animatedBalance = useCountUp(totalBalance ?? 0);
  const chartData = monthlyStatsData ?? [];
  const fundAccounts = accountsData ?? [];

  // Payment method mapper (Thai button labels -> API values)
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

  // Combined transactions
  const allTransactions = useMemo(() => {
    const list: any[] = [];
    if (offeringsData && offeringsData.length > 0) {
      offeringsData.forEach((o: any) => {
        list.push({
          id: `offering-${o.id}`,
          rawId: o.id,
          title: offeringCategoryLabel(o.category),
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
    return list.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [offeringsData, expensesData]);

  // Filtered transactions for Ledger
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(tx => {
      const matchSearch =
        tx.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat =
        categoryFilter === "all" || tx.category === categoryFilter;
      const matchType =
        ledgerTab === "all" ||
        (ledgerTab === "offerings" && tx.type === "income") ||
        (ledgerTab === "expenses" && tx.type === "expense");
      return matchSearch && matchCat && matchType;
    });
  }, [allTransactions, searchTerm, categoryFilter, ledgerTab]);

  const handleExportCSV = () => {
    const headers = [
      "วันที่",
      "ประเภท",
      "หมวดหมู่",
      "กองทุน/วัตถุประสงค์",
      "จำนวนเงิน (บาท)",
    ];
    const rows = filteredTransactions.map(tx => [
      typeof tx.date === "string" ? tx.date : fmtThaiDate(tx.date),
      tx.type === "income" ? "รายรับ (ถวาย)" : "รายจ่าย",
      tx.category,
      tx.subCategory,
      tx.amount,
    ]);
    const csvContent =
      "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `grace_ledger_report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("ดาวน์โหลดรายงาน CSV สำเร็จ");
  };

  const handleQuickOfferingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offeringFund) {
      toast.error("กรุณาเลือกกองทุนก่อนบันทึกการถวาย");
      return;
    }
    createOfferingMutation.mutate({
      category: offeringType,
      amount: Number(offeringAmount),
      fundId: Number(offeringFund),
      method: mapPaymentMethod(offeringMethod),
      notes: offeringNotes || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-[#FFF9EE] text-[#38251B] flex flex-col font-sans selection:bg-[#F7B6A6]/30 overflow-x-clip">
      {/* ─── DESKTOP WRAPPER (Persistent Sidebar + Responsive Main Content) ─── */}
      <div className="flex-1 flex flex-row justify-center w-full max-w-[1440px] mx-auto">
        {/* DESKTOP FIXED/PERSISTENT SIDEBAR (Visible on lg: screens >= 1024px) */}
        <aside className="hidden lg:flex flex-col w-72 bg-[#FFF4DF]/85 border-r border-[#E9D9BF] p-6 sticky top-0 h-screen overflow-y-auto shrink-0 z-30">
          {/* 1. Grace-giving (branding) */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#E99A4A]/15 border border-[#E99A4A]/30 flex items-center justify-center relative overflow-hidden shrink-0 shadow-2xs">
              <Sprout className="w-7 h-7 text-[#70452E]" />
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#A8C978] flex items-center justify-center">
                <span className="text-[10px] text-white font-bold">✝</span>
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-[#38251B] tracking-tight">
                  Grace
                </span>
                <span className="text-xl font-black text-[#E99A4A] tracking-tight">
                  Ledger
                </span>
              </div>
              <p className="text-[11px] text-[#927D6D] font-medium leading-tight">
                การเงินเชื่อมใจ เพื่อคริสตจักร
              </p>
            </div>
          </div>

          {/* Quick Offering Action Button on Sidebar */}
          <button
            onClick={() => {
              setOfferingStep(1);
              setOfferingOpen(true);
            }}
            className="w-full mb-6 py-3 px-4 rounded-2xl bg-[#E99A4A] hover:bg-[#DE8640] text-white font-bold flex items-center justify-center gap-2 clay-button-shadow transition-all"
            aria-label="บันทึกการถวายใหม่"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>บันทึกการถวาย</span>
          </button>

          {/* Sidebar Nav Links in Exact Specified Order (12 Items) */}
          <nav className="flex-1 space-y-1 text-sm font-medium">
            {/* 2. หน้าหลัก */}
            <button
              onClick={() => setActiveTab("home")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all ${
                activeTab === "home"
                  ? "bg-[#FFF9EE] text-[#70452E] font-bold border border-[#E9D9BF] shadow-xs"
                  : "text-[#70452E]/80 hover:bg-[#FFF9EE]/60 hover:text-[#70452E]"
              }`}
            >
              <HomeIcon className="w-5 h-5 text-[#E99A4A]" />
              <span>หน้าหลัก</span>
            </button>

            {/* 3. รายการ */}
            <button
              onClick={() => setActiveTab("ledger")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all ${
                activeTab === "ledger"
                  ? "bg-[#FFF9EE] text-[#70452E] font-bold border border-[#E9D9BF] shadow-xs"
                  : "text-[#70452E]/80 hover:bg-[#FFF9EE]/60 hover:text-[#70452E]"
              }`}
            >
              <ReceiptText className="w-5 h-5 text-[#A8C978]" />
              <span>รายการ</span>
            </button>

            {/* 4. ถวายทรัพย์ */}
            <button
              onClick={() => setLocation("/offerings")}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[#70452E]/80 hover:bg-[#FFF9EE]/60 hover:text-[#70452E] transition-all"
            >
              <HandCoins className="w-5 h-5 text-[#F7B6A6]" />
              <span>ถวายทรัพย์</span>
            </button>

            {/* 5. รายจ่าย */}
            <button
              onClick={() => setLocation("/expenses")}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[#70452E]/80 hover:bg-[#FFF9EE]/60 hover:text-[#70452E] transition-all"
            >
              <CreditCard className="w-5 h-5 text-[#E99A4A]" />
              <span>รายจ่าย</span>
            </button>

            {/* 6. กองทุน */}
            <button
              onClick={() => setLocation("/funds")}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[#70452E]/80 hover:bg-[#FFF9EE]/60 hover:text-[#70452E] transition-all"
            >
              <Landmark className="w-5 h-5 text-[#85C1E9]" />
              <span>กองทุน</span>
            </button>

            {/* 7. งบประมาณ */}
            <button
              onClick={() => setLocation("/budgets")}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[#70452E]/80 hover:bg-[#FFF9EE]/60 hover:text-[#70452E] transition-all"
            >
              <PieChart className="w-5 h-5 text-[#C39BD3]" />
              <span>งบประมาณ</span>
            </button>

            {/* 8. พันธกิจ */}
            <button
              onClick={() => setLocation("/ministries")}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[#70452E]/80 hover:bg-[#FFF9EE]/60 hover:text-[#70452E] transition-all"
            >
              <Sprout className="w-5 h-5 text-[#A8C978]" />
              <span>พันธกิจ</span>
            </button>

            {/* 9. สมาชิก */}
            <button
              onClick={() => setLocation("/members")}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[#70452E]/80 hover:bg-[#FFF9EE]/60 hover:text-[#70452E] transition-all"
            >
              <UsersRound className="w-5 h-5 text-[#E99A4A]" />
              <span>สมาชิก</span>
            </button>

            {/* 10. รายงาน */}
            <button
              onClick={() => setActiveTab("reports")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all ${
                activeTab === "reports"
                  ? "bg-[#FFF9EE] text-[#70452E] font-bold border border-[#E9D9BF] shadow-xs"
                  : "text-[#70452E]/80 hover:bg-[#FFF9EE]/60 hover:text-[#70452E]"
              }`}
            >
              <FileBarChart className="w-5 h-5 text-[#A9D4ED]" />
              <span>รายงาน</span>
            </button>

            {/* 11. การอนุมัติ */}
            <button
              onClick={() => setLocation("/approvals")}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[#70452E]/80 hover:bg-[#FFF9EE]/60 hover:text-[#70452E] transition-all"
            >
              <CheckCircle2 className="w-5 h-5 text-[#A8C978]" />
              <span>การอนุมัติ</span>
            </button>

            {/* 12. ตั้งค่า */}
            <button
              onClick={() => setLocation("/settings")}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[#70452E]/80 hover:bg-[#FFF9EE]/60 hover:text-[#70452E] transition-all"
            >
              <Settings2 className="w-5 h-5 text-[#70452E]" />
              <span>ตั้งค่า</span>
            </button>
          </nav>

          {/* User Profile Card on Sidebar Bottom */}
          <div className="pt-4 mt-auto border-t border-[#E9D9BF]/80">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#FFF9EE] border border-[#E9D9BF]">
              <div className="w-10 h-10 rounded-full bg-[#E99A4A]/20 flex items-center justify-center text-[#70452E] font-bold text-sm">
                {user?.name ? user.name.slice(0, 1) : "ศ"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#70452E] truncate">
                  {user?.name ||
                    churchProfile?.name ||
                    "คริสตจักรพระคุณสมบูรณ์"}
                </p>
                <p className="text-[11px] text-[#A8C978] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A8C978]" />
                  {user?.churchRole === "SUPER_ADMIN"
                    ? "ผู้ดูแลระบบสูงสุด"
                    : user?.churchRole === "TREASURER"
                      ? "เหรัญญิกคริสตจักร"
                      : "สมาชิกคริสตจักร"}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN DASHBOARD CONTAINER (Max-w on Desktop, Full Width on Mobile) */}
        <main className="w-full max-w-[560px] md:max-w-4xl xl:max-w-5xl px-4 py-4 md:px-8 md:py-6 flex flex-col pb-[calc(9rem+env(safe-area-inset-bottom))] lg:pb-16 min-w-0">
          <div className="mb-4 flex lg:hidden">
            <AppMenu />
          </div>
          {/* ═══════════════════════════════════════════════════════════════════
              TAB 1: HOME (Dashboard matching reference composition)
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "home" && (
            <div className="space-y-5 md:space-y-7">
              {/* ─── 1. HERO SECTION ─────────────────────────────────────────── */}
              {/* Side-by-side at every breakpoint (text col + image col) so the
                  illustration never drops into an orphaned centered block below
                  the headline on mobile; md+ switches to the wider 12-col split
                  with the extra scripture speech card. */}
              <section
                aria-label="Grace-giving ส่วนต้อนรับ"
                className="animate-fade-up relative rounded-[28px] md:rounded-[32px] overflow-hidden bg-gradient-to-b md:bg-gradient-to-br from-[#FFFDF8] via-[#FFF8EC] to-[#FFF3DE] border border-[#E9D9BF] shadow-sm p-3.5 sm:p-5 md:p-7"
              >
                {/* Decorative depth blob — purely atmospheric, never carries
                    meaning on its own, so it stays out of the a11y tree. */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 md:w-56 md:h-56 rounded-full bg-[#A8C978]/15 blur-3xl"
                />

                {/* Notification Bell (Top-Right) */}
                <div className="absolute top-3 right-3 md:top-4 md:right-4 z-20">
                  <button
                    onClick={() => setNewsOpen(true)}
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full bg-white/95 border border-[#E9D9BF] shadow-xs flex items-center justify-center text-[#70452E] hover:bg-white transition-all relative focus-visible:ring-2 focus-visible:ring-[#E99A4A]"
                    aria-label="การแจ้งเตือนและข่าวสารคริสตจักร"
                  >
                    <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-[#70452E]" />
                    <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#E06250] ring-2 ring-white" />
                  </button>
                </div>

                {/* Hero Content Grid */}
                <div className="grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-12 gap-3 sm:gap-5 items-center relative z-10">
                  {/* Left Column: Stacked Typography, Tagline, Bible Verse */}
                  <div className="min-w-0 md:col-span-7 space-y-1.5 sm:space-y-3.5">
                    {/* Stacked "Grace" + "Ledger" Typography — compact on mobile so balance is visible without scrolling */}
                    <h1 className="flex flex-col">
                      <span className="flex items-center gap-1 sm:gap-1.5">
                        <span className="text-2xl sm:text-5xl md:text-6xl font-black text-[#38251B] tracking-tight leading-none font-display">
                          Grace
                        </span>
                        <span className="text-[#A8C978] -mt-1.5 sm:-mt-4">
                          <Sprout className="w-5 h-5 sm:w-10 sm:h-10 stroke-[2.5]" />
                        </span>
                      </span>
                      <span className="text-2xl sm:text-5xl md:text-6xl font-black text-[#E99A4A] tracking-tight leading-none font-display">
                        Ledger
                      </span>
                    </h1>

                    <p className="hidden sm:block text-sm md:text-base font-bold text-[#38251B]/90">
                      การเงินเชื่อมใจ เพื่อพันธกิจของพระเจ้า
                    </p>

                    {/* Bible Pill Badge — single line, truncates on mobile to save height */}
                    <div className="inline-flex flex-nowrap items-center gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full sm:rounded-2xl bg-white/95 border border-[#E9D9BF] text-[11px] sm:text-xs leading-relaxed text-[#70452E] max-w-full">
                      <span className="whitespace-nowrap font-extrabold text-[#E99A4A] shrink-0">
                        2 โครินธ์ 9:7
                      </span>
                      <span className="text-[#70452E] font-medium truncate">
                        “ผู้ให้ด้วยใจยินดี พระเจ้าทรงรัก”
                      </span>
                    </div>
                  </div>

                  {/* Right Column: 3D Soft Clay Jesus & Fluffy Sheep Hero Image — sits
                      beside the headline at every breakpoint (not stacked below it),
                      so mobile stays compact without the image reading as an
                      orphaned icon. */}
                  <div className="min-w-0 flex items-center justify-center md:col-span-5 md:flex-col md:justify-center md:gap-3 md:pt-10">
                    {/* Desktop Scripture Speech Card */}
                    <div className="hidden md:block w-full max-w-56 bg-white/95 backdrop-blur-xs p-3.5 rounded-2xl border border-[#E9D9BF] text-xs space-y-1.5">
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

                    {/* 3D Clay Jesus & Fluffy Lamb Illustration */}
                    <div className="relative w-24 h-28 sm:w-40 sm:h-52 md:w-full md:max-w-64 md:h-72 rounded-2xl sm:rounded-[28px] overflow-hidden shadow-xs border-2 border-white shrink-0 bg-[#FFF4DF]">
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
              {/* Highest priority visual element: large prominent numbers with
                  status-based color (never color alone — always paired with text) */}
              <section
                aria-label="ยอดเงินคงเหลือรวม"
                style={{ animationDelay: "90ms" }}
                className={`animate-fade-up bg-gradient-to-br from-white via-white to-[#F7FBF4] rounded-[30px] p-5 md:p-7 border relative overflow-hidden ${isPositiveBalance ? "border-[#DCECC5]/90" : "border-[#F2C9BE]"} ${isPositiveBalance ? "clay-balance-glow" : "clay-card-shadow"}`}
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Prominent financial figures */}
                  <div className="min-w-0 flex-1 space-y-1.5 z-10">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm md:text-base font-bold text-[#38251B]">
                        ยอดเงินคงเหลือรวม
                      </h2>
                      <button
                        onClick={() => setShowBalance(!showBalance)}
                        className="text-[#927D6D] hover:text-[#70452E] transition-colors p-1 rounded-full focus-visible:ring-2 focus-visible:ring-[#E99A4A]"
                        aria-label={showBalance ? "ซ่อนยอดเงิน" : "แสดงยอดเงิน"}
                        aria-pressed={!showBalance}
                      >
                        {showBalance ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>

                      {/* Data-source status — kept visually separate from the
                          amount itself so a sample/loading state is never
                          mistaken for a real balance */}
                      {isBalanceLoading && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F0EAF8] text-[#7D3C98] text-[10px] font-bold">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          กำลังโหลดข้อมูล
                        </span>
                      )}
                      {isDataUnavailable && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFF3DF] border border-dashed border-[#E9C179] text-[#946A1E] text-[10px] font-bold">
                          <Info className="w-3 h-3" />
                          {summaryError
                            ? "เชื่อมต่อข้อมูลไม่สำเร็จ"
                            : "ยังไม่มีข้อมูลการเงิน"}
                        </span>
                      )}
                    </div>

                    {isBalanceLoading ? (
                      <div
                        className="h-9 sm:h-11 md:h-12 w-44 sm:w-56 rounded-xl bg-[#EDE6D8] animate-pulse"
                        aria-hidden="true"
                      />
                    ) : (
                      <div
                        className={`break-words text-3xl sm:text-4xl md:text-5xl font-black tracking-tight tabular-nums ${isPositiveBalance ? "text-[#1b5e3a]" : "text-[#B3261E]"}`}
                      >
                        {showBalance && summaryData
                          ? fmtBaht(animatedBalance)
                          : "—"}
                      </div>
                    )}

                    <p className="text-xs text-[#5E4C3E] font-medium flex items-center gap-1 pt-0.5">
                      {isBalanceLoading ? (
                        <span>กำลังตรวจสอบยอดเงินล่าสุด…</span>
                      ) : isPositiveBalance ? (
                        <>
                          <span>ขอบคุณพระเจ้าสำหรับทุกการถวาย</span>
                          <span className="text-[#A8C978]">♥</span>
                        </>
                      ) : (
                        <span className="text-[#B3261E] font-semibold">
                          ยอดคงเหลือติดลบ — ควรตรวจสอบรายจ่าย
                        </span>
                      )}
                    </p>

                    <div className="pt-2">
                      <button
                        onClick={() => setActiveTab("reports")}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FFF4DF] hover:bg-[#FBE9CD] text-[#70452E] text-xs font-bold border border-[#E9D9BF] transition-all focus-visible:ring-2 focus-visible:ring-[#E99A4A]"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-[#E99A4A]" />
                        <span>ดูรายละเอียด</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#927D6D]" />
                      </button>
                    </div>
                  </div>

                  {/* Right: Decorative balance_wallet.jpg tucked cleanly in corner */}
                  <div className="hidden sm:block shrink-0 z-10">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-[24px] overflow-hidden border border-[#E9D9BF]/80 bg-[#FFF8EB] p-1">
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

              {/* ─── 3. FINANCIAL SUMMARY CARDS (Row of 3 cards: รายรับ, รายจ่าย, คงเหลือ) ── */}
              <section
                aria-label="สรุปตัวเลขการเงินรายเดือน"
                style={{ animationDelay: "160ms" }}
                className="animate-fade-up grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4"
              >
                {/* Card 1: รายรับ (Income) — green tone, consistent with the
                    income = green convention used everywhere on this page */}
                <div className="min-w-0 bg-[#EAF5E4] border border-[#D2EAC7] rounded-[28px] p-4 md:p-5 flex sm:flex-col items-center sm:items-start gap-3.5">
                  <div className="w-[76px] h-[76px] md:w-[84px] md:h-[84px] rounded-[22px] overflow-hidden shrink-0 bg-white/95 p-1 border border-[#D2EAC7]">
                    <Illustration
                      src="/illustrations/income_hand_heart.jpg"
                      alt="รายรับ"
                      className="w-full h-full object-cover rounded-[18px]"
                      width={84}
                      height={84}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="min-w-0 max-w-full flex-1">
                    <span className="text-sm font-bold text-[#70452E]">
                      รายรับ
                    </span>
                    {isBalanceLoading ? (
                      <div className="h-7 md:h-8 w-24 my-0.5 rounded-lg bg-white/70 animate-pulse" />
                    ) : (
                      <div className="text-2xl md:text-3xl font-black text-[#38251B] break-words tabular-nums">
                        {showBalance && monthlyIncome !== undefined
                          ? fmtShortBaht(monthlyIncome)
                          : "—"}
                      </div>
                    )}
                    <span className="text-xs font-bold text-[#4F8B33] flex flex-wrap items-center gap-x-1 gap-y-0.5">
                      <span>
                        {trendArrow(incomeTrend)} {trendValue(incomeTrend)}
                      </span>
                      <span className="text-[11px] text-[#6B5A4C] font-medium">
                        จากเดือนที่แล้ว
                      </span>
                    </span>
                  </div>
                </div>

                {/* Card 2: รายจ่าย (Expenses) — dark-orange tone, consistent
                    with the expense = orange/red convention used everywhere */}
                <div className="min-w-0 bg-[#FDEDE3] border border-[#F6D3B8] rounded-[28px] p-4 md:p-5 flex sm:flex-col items-center sm:items-start gap-3.5">
                  <div className="w-[76px] h-[76px] md:w-[84px] md:h-[84px] rounded-[22px] overflow-hidden shrink-0 bg-white/95 p-1 border border-[#F6D3B8]">
                    <Illustration
                      src="/illustrations/expense_hand_coin.jpg"
                      alt="รายจ่าย"
                      className="w-full h-full object-cover rounded-[18px]"
                      width={84}
                      height={84}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="min-w-0 max-w-full flex-1">
                    <span className="text-sm font-bold text-[#70452E]">
                      รายจ่าย
                    </span>
                    {isBalanceLoading ? (
                      <div className="h-7 md:h-8 w-24 my-0.5 rounded-lg bg-white/70 animate-pulse" />
                    ) : (
                      <div className="text-2xl md:text-3xl font-black text-[#38251B] break-words tabular-nums">
                        {showBalance && monthlyExpense !== undefined
                          ? fmtShortBaht(monthlyExpense)
                          : "—"}
                      </div>
                    )}
                    <span className="text-xs font-bold text-[#B3541E] flex flex-wrap items-center gap-x-1 gap-y-0.5">
                      <span>
                        {trendArrow(expenseTrend)} {trendValue(expenseTrend)}
                      </span>
                      <span className="text-[11px] text-[#6B5A4C] font-medium">
                        จากเดือนที่แล้ว
                      </span>
                    </span>
                  </div>
                </div>

                {/* Card 3: คงเหลือ (Net) — color follows surplus/deficit
                    status, always paired with an explicit text label */}
                <div
                  className={`min-w-0 rounded-[28px] p-4 md:p-5 flex sm:flex-col items-center sm:items-start gap-3.5 border ${isPositiveNet ? "bg-[#FFF8EB] border-[#FBE9CD]" : "bg-[#FDEBE8] border-[#F2C9BE]"}`}
                >
                  <div
                    className={`w-[76px] h-[76px] md:w-[84px] md:h-[84px] rounded-[22px] overflow-hidden shrink-0 bg-white/95 p-1 border ${isPositiveNet ? "border-[#FBE9CD]" : "border-[#F2C9BE]"}`}
                  >
                    <Illustration
                      src="/illustrations/balance_wallet.jpg"
                      alt="คงเหลือ"
                      className="w-full h-full object-cover rounded-[18px]"
                      width={84}
                      height={84}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="min-w-0 max-w-full flex-1">
                    <span className="text-sm font-bold text-[#70452E]">
                      คงเหลือ
                    </span>
                    {isBalanceLoading ? (
                      <div className="h-7 md:h-8 w-24 my-0.5 rounded-lg bg-white/70 animate-pulse" />
                    ) : (
                      <div className="text-2xl md:text-3xl font-black text-[#38251B] break-words tabular-nums">
                        {showBalance && netMonthly !== undefined
                          ? fmtShortBaht(netMonthly)
                          : "—"}
                      </div>
                    )}
                    <span
                      className={`text-xs font-bold flex flex-wrap items-center gap-x-1 gap-y-0.5 ${isPositiveNet ? "text-[#4F8B33]" : "text-[#B3261E]"}`}
                    >
                      <span>
                        {isPositiveNet
                          ? "รายรับมากกว่ารายจ่าย"
                          : "รายจ่ายมากกว่ารายรับ"}
                      </span>
                    </span>
                  </div>
                </div>
              </section>

              {/* ─── 4a. PRIMARY ACTIONS (บันทึกการถวาย / บันทึกรายจ่าย) ──────
                  Highest-weight action buttons, placed directly under the balance
                  and income/expense figures so the two most common tasks are one
                  tap away without competing with the secondary menu below. ── */}
              <section
                aria-label="การดำเนินการหลัก"
                style={{ animationDelay: "230ms" }}
                className="animate-fade-up grid grid-cols-2 gap-3 md:gap-4"
              >
                <button
                  onClick={() => {
                    setOfferingStep(1);
                    setOfferingOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-2xl bg-[#4F8B33] hover:bg-[#436F2B] text-white font-bold text-sm sm:text-base clay-button-shadow transition-all focus-visible:ring-2 focus-visible:ring-[#4F8B33] focus-visible:ring-offset-2"
                  aria-label="บันทึกการถวาย"
                >
                  <HandCoins className="w-5 h-5 stroke-[2.2]" />
                  <span>บันทึกการถวาย</span>
                </button>

                <button
                  onClick={() => setExpenseOpen(true)}
                  className="flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-2xl bg-[#C26B1E] hover:bg-[#A85B18] text-white font-bold text-sm sm:text-base clay-button-shadow transition-all focus-visible:ring-2 focus-visible:ring-[#C26B1E] focus-visible:ring-offset-2"
                  aria-label="บันทึกรายจ่าย"
                >
                  <ReceiptText className="w-5 h-5 stroke-[2.2]" />
                  <span>บันทึกรายจ่าย</span>
                </button>
              </section>

              {/* ─── 4b. SECONDARY MENU (รายงาน / สมาชิก / กิจกรรม / เพิ่มเติม) ──
                  Lower visual weight than the primary actions above: smaller
                  icons, muted surfaces, no hover-scale pop. ── */}
              <section
                aria-label="เมนูลัดอื่น ๆ"
                className="grid grid-cols-4 gap-2 md:gap-3"
              >
                {/* รายงาน */}
                <button
                  onClick={() => setActiveTab("reports")}
                  className="flex flex-col items-center justify-center py-3 rounded-2xl bg-[#FAF6EE] border border-[#EDE2CE] hover:border-[#C39BD3] transition-colors focus-visible:ring-2 focus-visible:ring-[#C39BD3]"
                  aria-label="รายงาน"
                >
                  <FileBarChart className="w-5 h-5 stroke-[2] text-[#7D3C98]/80 mb-1" />
                  <span className="text-[11px] font-semibold text-[#70452E]/85 tracking-tight text-center">
                    รายงาน
                  </span>
                </button>

                {/* สมาชิก */}
                <button
                  onClick={() => setLocation("/members")}
                  className="flex flex-col items-center justify-center py-3 rounded-2xl bg-[#FAF6EE] border border-[#EDE2CE] hover:border-[#E99A4A] transition-colors focus-visible:ring-2 focus-visible:ring-[#E99A4A]"
                  aria-label="สมาชิก"
                >
                  <UsersRound className="w-5 h-5 stroke-[2] text-[#C26B1E]/80 mb-1" />
                  <span className="text-[11px] font-semibold text-[#70452E]/85 tracking-tight text-center">
                    สมาชิก
                  </span>
                </button>

                {/* กิจกรรม */}
                <button
                  onClick={() => setNewsOpen(true)}
                  className="flex flex-col items-center justify-center py-3 rounded-2xl bg-[#FAF6EE] border border-[#EDE2CE] hover:border-[#F7B6A6] transition-colors focus-visible:ring-2 focus-visible:ring-[#F7B6A6]"
                  aria-label="กิจกรรม"
                >
                  <CalendarDays className="w-5 h-5 stroke-[2] text-[#D45945]/80 mb-1" />
                  <span className="text-[11px] font-semibold text-[#70452E]/85 tracking-tight text-center">
                    กิจกรรม
                  </span>
                </button>

                {/* เพิ่มเติม */}
                <AppMenu>
                  <button
                    type="button"
                    className="flex flex-col items-center justify-center py-3 w-full rounded-2xl bg-[#FAF6EE] border border-[#EDE2CE] hover:border-[#A9D4ED] transition-colors focus-visible:ring-2 focus-visible:ring-[#A9D4ED]"
                    aria-label="เพิ่มเติม"
                  >
                    <MoreHorizontal className="w-5 h-5 stroke-[2] text-[#5B7B94]/80 mb-1" />
                    <span className="text-[11px] font-semibold text-[#70452E]/85 tracking-tight text-center">
                      เพิ่มเติม
                    </span>
                  </button>
                </AppMenu>
              </section>

              {/* ─── 5. CHURCH NEWS CARD ("ข่าวสารจากคริสตจักร") ─────────── */}
              <section aria-label="ข่าวสารจากคริสตจักร">
                <div
                  onClick={() => setNewsOpen(true)}
                  className="cursor-pointer bg-gradient-to-r from-[#FFFDF8] via-[#FFF8EC] to-[#FFF1DE] border border-[#E9D9BF] rounded-[28px] p-4 md:p-5 flex items-center justify-between gap-4 hover:border-[#E99A4A] transition-all"
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
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden shrink-0 bg-white p-1 border border-[#E9D9BF]">
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
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#927D6D] border border-[#E9D9BF]/80 shrink-0">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </section>

              {/* ─── 6. BUDGET SECTION (real data only) ─────────────────────── */}
              <section
                aria-label="แผนการใช้จ่ายงบประมาณ"
                className="bg-white rounded-[28px] p-5 md:p-6 border border-[#E9D9BF]/80 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-base md:text-lg font-bold text-[#38251B]">
                    แผนการใช้จ่าย
                  </h2>
                  <button
                    onClick={() => setActiveTab("reports")}
                    className="text-xs md:text-sm font-bold text-[#E99A4A] hover:underline flex items-center gap-0.5 focus-visible:ring-2 focus-visible:ring-[#E99A4A]"
                  >
                    <span>ดูรายงาน</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <p className="py-5 text-sm text-[#927D6D]">
                  ยังไม่มีข้อมูลแผนการใช้จ่ายจากระบบ
                  จึงยังไม่แสดงตัวเลขประมาณการ
                </p>
              </section>

              {/* ─── 7. RECENT TRANSACTIONS SECTION ("รายการล่าสุด") ─────── */}
              {/* Lighter shadow than the balance card above — this is
                  reference info, not the primary figure. */}
              <section
                aria-label="รายการธุรกรรมล่าสุด"
                className="bg-white rounded-[28px] p-5 md:p-6 border border-[#E9D9BF]/80 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-base md:text-lg font-bold text-[#38251B]">
                    รายการล่าสุด
                  </h2>
                  <button
                    onClick={() => setActiveTab("ledger")}
                    className="text-xs md:text-sm font-bold text-[#E99A4A] hover:underline flex items-center gap-0.5 focus-visible:ring-2 focus-visible:ring-[#E99A4A]"
                  >
                    <span>ดูทั้งหมด</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="divide-y divide-[#F0E6D8]/60">
                  {allTransactions.length === 0 && (
                    <p className="py-8 text-center text-sm text-[#927D6D]">
                      ยังไม่มีรายการธุรกรรมล่าสุดจากระบบ
                    </p>
                  )}
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
                            <p className="text-[11px] text-[#7A6656] font-medium pt-0.5">
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
                          <p className="text-[11px] text-[#7A6656] font-medium">
                            {tx.subCategory}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 2: LEDGER (Transactions & Accountability)
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "ledger" && (
            <div className="space-y-4">
              <div className="bg-white rounded-[28px] p-5 md:p-6 border border-[#E9D9BF] clay-card-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-[#70452E]">
                      สมุดบัญชีการเงิน
                    </h2>
                    <p className="text-xs text-[#927D6D]">
                      บันทึกรายการรายรับ-รายจ่ายของคริสตจักรอย่างโปร่งใส
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportCSV}
                      className="px-3.5 py-2 rounded-xl bg-[#FFF4DF] hover:bg-[#FBE9CD] text-[#70452E] text-xs font-bold border border-[#E9D9BF] flex items-center gap-1.5 transition-all focus-visible:ring-2 focus-visible:ring-[#E99A4A]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>ส่งออก CSV</span>
                    </button>
                    <button
                      onClick={() => {
                        setOfferingStep(1);
                        setOfferingOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#E99A4A] text-white text-xs font-bold flex items-center gap-1.5 clay-button-shadow hover:bg-[#DE8640] transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>บันทึกใหม่</span>
                    </button>
                  </div>
                </div>

                {/* Sub-tab pills */}
                <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#FFF9EE] border border-[#E9D9BF] mb-4">
                  <button
                    onClick={() => setLedgerTab("all")}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      ledgerTab === "all"
                        ? "bg-white text-[#70452E] shadow-2xs"
                        : "text-[#927D6D]"
                    }`}
                  >
                    ทั้งหมด ({allTransactions.length})
                  </button>
                  <button
                    onClick={() => setLedgerTab("offerings")}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      ledgerTab === "offerings"
                        ? "bg-[#EAF5E4] text-[#4F8B33] shadow-2xs"
                        : "text-[#927D6D]"
                    }`}
                  >
                    รายรับถวาย
                  </button>
                  <button
                    onClick={() => setLedgerTab("expenses")}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      ledgerTab === "expenses"
                        ? "bg-[#FFEBE5] text-[#D45945] shadow-2xs"
                        : "text-[#927D6D]"
                    }`}
                  >
                    รายจ่าย
                  </button>
                </div>

                {/* Search box */}
                <div className="relative mb-4">
                  <Search className="w-4 h-4 text-[#927D6D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="ค้นหารายการ, หมวดหมู่ หรือผู้ถวาย..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#FFFDF8] border border-[#E9D9BF] text-xs md:text-sm focus:outline-none focus:border-[#E99A4A]"
                  />
                </div>

                {/* Transaction list or Empty State (Specification 13) */}
                {filteredTransactions.length === 0 ? (
                  <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-24 h-24 rounded-[24px] overflow-hidden bg-[#FFF4DF] p-1 border border-[#E9D9BF] shadow-xs">
                      <Illustration
                        src="/illustrations/offering_box.jpg"
                        alt="กล่องถวาย"
                        className="w-full h-full object-cover rounded-[20px]"
                        width={96}
                        height={96}
                      />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-[#70452E]">
                        ยังไม่มีรายการถวาย
                      </h3>
                      <p className="text-xs text-[#927D6D] max-w-xs mx-auto">
                        เริ่มบันทึกการถวายรายการแรกของคริสตจักรของคุณ
                        เพื่อความโปร่งใสและเป็นระเบียบ
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setOfferingStep(1);
                        setOfferingOpen(true);
                      }}
                      className="px-5 py-2.5 rounded-full bg-[#E99A4A] text-white text-xs font-bold clay-button-shadow hover:bg-[#DE8640] transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>บันทึกการถวายรายการแรก</span>
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-[#F0E6D8]/60">
                    {filteredTransactions.map(tx => {
                      const isIncome = tx.type === "income";
                      const IconComp = tx.icon || (isIncome ? Heart : Landmark);
                      return (
                        <div
                          key={tx.id}
                          className="py-3 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-full ${tx.tone} flex items-center justify-center shrink-0`}
                            >
                              <IconComp className="w-5 h-5 stroke-[2.2]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-[#38251B] truncate">
                                {tx.title}
                              </p>
                              <p className="text-[11px] text-[#927D6D]">
                                {typeof tx.date === "string"
                                  ? tx.date
                                  : fmtThaiDate(tx.date)}{" "}
                                · {tx.subCategory}
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
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF4DF] text-[#70452E] font-medium">
                              {tx.category}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 3: REPORTS (Financial Charts & Fund Accounts)
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "reports" && (
            <div className="space-y-4">
              {/* Header Card */}
              <div className="bg-white rounded-[28px] p-5 md:p-6 border border-[#E9D9BF] clay-card-shadow flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-[#70452E]">
                    รายงานการเงินคริสตจักร
                  </h2>
                  <p className="text-xs text-[#927D6D]">
                    วิเคราะห์แนวโน้มรายรับ-รายจ่ายเพื่อวางแผนพันธกิจ
                  </p>
                </div>
                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 rounded-xl bg-[#FFF4DF] text-[#70452E] text-xs font-bold border border-[#E9D9BF] flex items-center gap-1.5 hover:bg-[#FBE9CD] transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลด CSV</span>
                </button>
              </div>

              {/* Monthly Trend Chart */}
              <div className="bg-white rounded-[28px] p-5 md:p-6 border border-[#E9D9BF] clay-card-shadow space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#38251B]">
                    แนวโน้มรายรับ - รายจ่าย 5 เดือนล่าสุด
                  </h3>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-[#4F8B33] font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#A8C978]" />{" "}
                      รายรับ
                    </span>
                    <span className="flex items-center gap-1 text-[#C26B1E] font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#E99A4A]" />{" "}
                      รายจ่าย
                    </span>
                  </div>
                </div>

                {chartData.length === 0 ? (
                  <p className="py-16 text-center text-sm text-[#927D6D]">
                    ยังไม่มีข้อมูลแนวโน้มการเงินสำหรับช่วงเวลานี้
                  </p>
                ) : (
                  <div className="h-64 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <XAxis
                          dataKey="name"
                          stroke="#927D6D"
                          fontSize={12}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="#927D6D"
                          fontSize={11}
                          tickLine={false}
                          tickFormatter={v => `฿${v / 1000}k`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#FFFFFF",
                            borderRadius: 16,
                            border: "1px solid #E9D9BF",
                            boxShadow: "0 4px 12px rgba(112,69,46,0.08)",
                          }}
                          formatter={(val: any) => [fmtBaht(val), ""]}
                        />
                        <Bar
                          dataKey="รายรับ"
                          fill="#A8C978"
                          radius={[8, 8, 0, 0]}
                        />
                        <Bar
                          dataKey="รายจ่าย"
                          fill="#E99A4A"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Fund Balances Breakdown */}
              <div className="bg-white rounded-[28px] p-5 md:p-6 border border-[#E9D9BF] clay-card-shadow space-y-3">
                <h3 className="text-sm font-bold text-[#38251B]">
                  ยอดเงินในแต่ละกองทุน (Fund Accounts)
                </h3>
                <div className="divide-y divide-[#F0E6D8]/60">
                  {fundAccounts.length === 0 && (
                    <p className="py-8 text-center text-sm text-[#927D6D]">
                      ยังไม่มีข้อมูลกองทุนจากระบบ
                    </p>
                  )}
                  {fundAccounts.map((fa: any) => (
                    <div
                      key={fa.id}
                      className="py-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: "#A8C978" }}
                        />
                        <span className="text-sm font-bold text-[#38251B]">
                          {fa.name}
                        </span>
                      </div>
                      <span className="text-sm font-extrabold text-[#1b5e3a]">
                        {fmtBaht(Number(fa.balance))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 4: PROFILE (User & Church Profile)
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "profile" && (
            <div className="space-y-4">
              <div className="bg-white rounded-[28px] p-6 border border-[#E9D9BF] clay-card-shadow text-center space-y-3">
                <div className="w-20 h-20 rounded-full bg-[#FFF4DF] border-2 border-[#E99A4A] mx-auto flex items-center justify-center text-[#70452E] font-bold text-2xl">
                  {user?.name ? user.name.slice(0, 1) : "ศ"}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#70452E]">
                    {user?.name || churchProfile?.name || "ผู้รับใช้พระเจ้า"}
                  </h2>
                  <p className="text-xs text-[#927D6D]">
                    {churchProfile?.address ||
                      "คริสตจักรพระคุณสมบูรณ์ ประเทศไทย"}
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF5E4] text-[#4F8B33] text-xs font-bold">
                  <span>
                    {user?.churchRole === "SUPER_ADMIN"
                      ? "ผู้ดูแลระบบสูงสุด (SUPER_ADMIN)"
                      : user?.churchRole === "TREASURER"
                        ? "เหรัญญิกคริสตจักร (TREASURER)"
                        : "สมาชิกคริสตจักร (MEMBER)"}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-[28px] p-5 border border-[#E9D9BF] clay-card-shadow space-y-2">
                <h3 className="text-sm font-bold text-[#38251B] mb-2">
                  การตั้งค่าและการจัดการ
                </h3>
                <button
                  onClick={() => setLocation("/setup")}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#FFF9EE] hover:bg-[#FFF4DF] text-xs font-bold text-[#70452E] transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-[#E99A4A]" />
                    <span>ตั้งค่าคริสตจักร 8 ขั้นตอน</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#927D6D]" />
                </button>
                <button
                  onClick={() => setNewsOpen(true)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#FFF9EE] hover:bg-[#FFF4DF] text-xs font-bold text-[#70452E] transition-all"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#A8C978]" />
                    <span>ข่าวสารและประกาศคริสตจักร</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#927D6D]" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ─── MOBILE FIXED BOTTOM NAVIGATION BAR (Specification 8) ───────────── */}
      {/* Visible on Mobile/Tablet (< 1024px). Contains: หน้าแรก, รายการ, เพิ่ม (+), รายงาน, ฉัน */}
      <nav
        aria-label="เมนูนำทางหลักบนมือถือ"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFF4DF]/95 backdrop-blur-md border-t border-[#E9D9BF] px-4 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-lg"
      >
        <div className="max-w-md mx-auto flex items-center justify-between relative">
          {/* 1. หน้าแรก */}
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2.5 rounded-2xl transition-all ${
              activeTab === "home"
                ? "bg-[#FBE9CD] text-[#70452E] font-bold shadow-2xs"
                : "text-[#927D6D] hover:text-[#70452E]"
            }`}
            aria-label="ไปที่หน้าแรก"
          >
            <HomeIcon className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[11px] mt-0.5 font-bold">หน้าแรก</span>
          </button>

          {/* 2. รายการ */}
          <button
            onClick={() => setActiveTab("ledger")}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2.5 rounded-2xl transition-all ${
              activeTab === "ledger"
                ? "bg-[#FBE9CD] text-[#70452E] font-bold shadow-2xs"
                : "text-[#927D6D] hover:text-[#70452E]"
            }`}
            aria-label="ไปที่รายการการเงิน"
          >
            <ReceiptText className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[11px] mt-0.5 font-bold">รายการ</span>
          </button>

          {/* 3. CENTER PRIMARY FAB: WARM ORANGE '+' ELEVATED BUTTON */}
          <div className="relative -top-5 flex flex-col items-center">
            <button
              onClick={() => {
                setOfferingStep(1);
                setOfferingOpen(true);
              }}
              className="w-14 h-14 rounded-full bg-[#E99A4A] hover:bg-[#DE8640] text-white flex items-center justify-center clay-button-shadow transition-transform active:scale-95 border-3 border-white focus-visible:ring-2 focus-visible:ring-[#E99A4A]"
              aria-label="บันทึกการถวายใหม่ (เพิ่มรายการ)"
            >
              <Plus className="w-7 h-7 stroke-[2.8]" />
            </button>
            <span className="text-[11px] font-extrabold text-[#70452E] mt-0.5">
              เพิ่ม
            </span>
          </div>

          {/* 4. รายงาน */}
          <button
            onClick={() => setActiveTab("reports")}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2.5 rounded-2xl transition-all ${
              activeTab === "reports"
                ? "bg-[#FBE9CD] text-[#70452E] font-bold shadow-2xs"
                : "text-[#927D6D] hover:text-[#70452E]"
            }`}
            aria-label="ไปที่หน้ารายงาน"
          >
            <FileBarChart className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[11px] mt-0.5 font-bold">รายงาน</span>
          </button>

          {/* 5. ฉัน */}
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2.5 rounded-2xl transition-all ${
              activeTab === "profile"
                ? "bg-[#FBE9CD] text-[#70452E] font-bold shadow-2xs"
                : "text-[#927D6D] hover:text-[#70452E]"
            }`}
            aria-label="ไปที่หน้าฉัน (โปรไฟล์)"
          >
            <CircleUserRound className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[11px] mt-0.5 font-bold">ฉัน</span>
          </button>
        </div>

        {/* Script Brand Signature: "All for His Glory ♥" */}
        <div className="pt-1.5 text-center">
          <p className="font-script text-xs md:text-sm text-[#927D6D]/85 tracking-wide">
            All for His Glory ♥
          </p>
        </div>
      </nav>

      {/* ─── MODAL 1: MULTI-STEP OFFERING SUBMISSION WORKFLOW ───────────────── */}
      {/* ─── MODAL 1: MULTI-STEP OFFERING SUBMISSION WORKFLOW ───────────────── */}
      <Dialog open={offeringOpen} onOpenChange={setOfferingOpen}>
        <DialogContent className="w-[95vw] max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl bg-[#FFFDF8] border-2 sm:border-3 border-[#E9D9BF] rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 md:p-10 text-[#38251B] shadow-2xl overflow-y-auto max-h-[92vh]">
          <DialogHeader>
            <div className="flex items-center gap-3.5 sm:gap-5">
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl overflow-hidden bg-[#EAF5E4] p-1.5 border-2 border-[#D2EAC7] shrink-0 shadow-xs">
                <Illustration
                  src="/illustrations/offering_box.jpg"
                  alt="กล่องถวาย"
                  className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
                  width={80}
                  height={80}
                />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-2xl sm:text-3xl md:text-4xl font-black text-[#70452E] tracking-tight">
                  บันทึกการถวายทรัพย์
                </DialogTitle>
                <DialogDescription className="text-sm sm:text-base md:text-lg font-bold text-[#927D6D]">
                  ขั้นตอนที่ {offeringStep} จาก 3:{" "}
                  {offeringStep === 1
                    ? "เลือกประเภทการถวาย"
                    : offeringStep === 2
                      ? "ระบุจำนวนเงินถวาย"
                      : "เลือกกองทุนและช่องทางบันทึก"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Step 1: Category */}
          {offeringStep === 1 && (
            <div className="space-y-6 pt-3 sm:pt-4">
              <label className="text-base sm:text-xl font-black text-[#70452E] block">
                เลือกประเภทการถวาย (แตะเพื่อเลือก):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                {OFFERING_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setOfferingType(cat.id)}
                    className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 sm:border-3 text-base sm:text-xl font-black text-left transition-all min-h-[64px] sm:min-h-[80px] flex items-center justify-between gap-3 ${
                      offeringType === cat.id
                        ? "bg-[#FFF4DF] border-[#E99A4A] text-[#70452E] shadow-md scale-[1.01]"
                        : "bg-white border-[#E9D9BF] text-[#70452E]/90 hover:bg-[#FFF9EE] hover:border-[#E99A4A]/50"
                    }`}
                  >
                    <span>{cat.label}</span>
                    {offeringType === cat.id && (
                      <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#E99A4A] text-white flex items-center justify-center text-sm sm:text-base font-black shrink-0">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setOfferingStep(2)}
                className="w-full mt-4 py-4 sm:py-5 rounded-2xl sm:rounded-3xl bg-[#E99A4A] hover:bg-[#DE8640] text-white font-black text-lg sm:text-xl md:text-2xl clay-button-shadow transition-all min-h-[58px] sm:min-h-[64px]"
              >
                ถัดไป: ระบุจำนวนเงิน →
              </button>
            </div>
          )}

          {/* Step 2: Amount with quick chips */}
          {offeringStep === 2 && (
            <div className="space-y-6 pt-3 sm:pt-4">
              <label className="text-base sm:text-xl font-black text-[#70452E] block">
                ระบุจำนวนเงินถวาย (บาท):
              </label>
              <div className="relative">
                <span className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 text-3xl sm:text-5xl font-black text-[#1b5e3a]">
                  ฿
                </span>
                <input
                  type="number"
                  value={offeringAmount}
                  onChange={e => setOfferingAmount(e.target.value)}
                  className="w-full pl-16 sm:pl-22 pr-6 py-5 sm:py-6 rounded-2xl sm:rounded-3xl bg-white border-2 sm:border-3 border-[#E9D9BF] focus:border-[#E99A4A] text-3xl sm:text-5xl md:text-6xl font-black text-[#1b5e3a] focus:outline-none"
                  placeholder="0.00"
                  autoFocus
                />
              </div>

              {/* Quick Amount Chips */}
              <div className="space-y-2.5">
                <span className="text-sm sm:text-base font-bold text-[#927D6D]">
                  เลือกยอดเงินด่วน:
                </span>
                <div className="flex flex-wrap gap-2.5 sm:gap-3.5">
                  {[100, 300, 500, 1000, 2000, 5000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setOfferingAmount(String(amt))}
                      className="px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-2xl bg-[#FFF4DF] hover:bg-[#FBE9CD] border-2 border-[#E9D9BF] text-base sm:text-xl font-black text-[#70452E] transition-all"
                    >
                      +฿{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 sm:gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setOfferingStep(1)}
                  className="flex-1 py-4 sm:py-5 rounded-2xl sm:rounded-3xl bg-[#FFF4DF] text-[#70452E] font-black text-base sm:text-xl border-2 border-[#E9D9BF] min-h-[58px]"
                >
                  ← ย้อนกลับ
                </button>
                <button
                  type="button"
                  onClick={() => setOfferingStep(3)}
                  disabled={!offeringAmount || Number(offeringAmount) <= 0}
                  className="flex-2 py-4 sm:py-5 rounded-2xl sm:rounded-3xl bg-[#E99A4A] hover:bg-[#DE8640] text-white font-black text-base sm:text-xl clay-button-shadow disabled:opacity-50 min-h-[58px]"
                >
                  ถัดไป: ช่องทางถวาย →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Fund, Payment Method & Final Submit */}
          {offeringStep === 3 && (
            <form
              onSubmit={handleQuickOfferingSubmit}
              className="space-y-5 sm:space-y-6 pt-3"
            >
              <div>
                <label className="text-base sm:text-lg font-black text-[#70452E] mb-2 block">
                  เข้ากองทุน / บัญชีคริสตจักร:
                </label>
                <select
                  required
                  value={offeringFund}
                  onChange={e => setOfferingFund(e.target.value)}
                  className="w-full p-4 sm:p-5 rounded-2xl bg-white border-2 border-[#E9D9BF] text-base sm:text-lg font-bold text-[#38251B] focus:border-[#E99A4A] min-h-[56px]"
                >
                  <option value="" disabled>
                    -- แตะเพื่อเลือกกองทุน --
                  </option>
                  {fundAccounts.map((fa: any) => (
                    <option key={fa.id} value={fa.id}>
                      {fa.name}
                    </option>
                  ))}
                </select>
                {fundAccounts.length === 0 && (
                  <p className="text-sm text-[#D45945] font-bold mt-1.5">
                    ยังไม่มีกองทุนในระบบ กรุณาเพิ่มกองทุนก่อนบันทึกการถวาย
                  </p>
                )}
              </div>

              <div>
                <label className="text-base sm:text-lg font-black text-[#70452E] mb-2 block">
                  วิธีการชำระเงิน:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                  {["เงินสด", "โอนธนาคาร", "พร้อมเพย์ / QR", "เช็ค"].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setOfferingMethod(m)}
                      className={`p-3.5 sm:p-4 rounded-2xl border-2 text-sm sm:text-base font-black text-center transition-all min-h-[54px] sm:min-h-[60px] ${
                        offeringMethod === m
                          ? "bg-[#EAF5E4] border-[#A8C978] text-[#4F8B33] shadow-xs"
                          : "bg-white border-[#E9D9BF] text-[#70452E]/90 hover:bg-[#FFF9EE]"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-base sm:text-lg font-black text-[#70452E] mb-2 block">
                  บันทึกเพิ่มเติม (ถ้ามี):
                </label>
                <input
                  type="text"
                  value={offeringNotes}
                  onChange={e => setOfferingNotes(e.target.value)}
                  placeholder="เช่น ขอบพระคุณสำหรับสุขภาพ, วันเกิด"
                  className="w-full p-3.5 sm:p-4 rounded-2xl bg-white border-2 border-[#E9D9BF] text-base sm:text-lg focus:border-[#E99A4A]"
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="anon"
                  checked={offeringAnon}
                  onChange={e => setOfferingAnon(e.target.checked)}
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg text-[#E99A4A] focus:ring-[#E99A4A] border-2 border-[#E9D9BF]"
                />
                <label htmlFor="anon" className="text-sm sm:text-base font-bold text-[#70452E] cursor-pointer">
                  ไม่ระบุชื่อผู้ถวาย (ถวายโดยไม่เปิดเผยนาม)
                </label>
              </div>

              <div className="flex gap-3 sm:gap-4 pt-3">
                <button
                  type="button"
                  onClick={() => setOfferingStep(2)}
                  className="flex-1 py-4 sm:py-5 rounded-2xl sm:rounded-3xl bg-[#FFF4DF] text-[#70452E] font-black text-base sm:text-xl border-2 border-[#E9D9BF] min-h-[58px]"
                >
                  ← ย้อนกลับ
                </button>
                <button
                  type="submit"
                  disabled={createOfferingMutation.isPending || !offeringFund}
                  className="flex-2 py-4 sm:py-5 rounded-2xl sm:rounded-3xl bg-[#E99A4A] hover:bg-[#DE8640] text-white font-black text-base sm:text-xl clay-button-shadow disabled:opacity-50 min-h-[58px]"
                >
                  {createOfferingMutation.isPending
                    ? "กำลังบันทึก..."
                    : "ยืนยันการบันทึกถวาย ✓"}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 2: OFFERING SUCCESS CELEBRATION ──────────────────────────── */}
      <Dialog open={offeringSuccess} onOpenChange={setOfferingSuccess}>
        <DialogContent className="w-[95vw] max-w-lg sm:max-w-xl bg-[#FFFDF8] border-2 border-[#E9D9BF] rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 text-center text-[#38251B] space-y-6">
          <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto rounded-3xl overflow-hidden border-2 border-[#E9D9BF] shadow-sm p-1.5 bg-[#EAF5E4]">
            <Illustration
              src="/illustrations/income_hand_heart.jpg"
              alt="ถวายสำเร็จ"
              className="w-full h-full object-cover rounded-2xl"
              width={128}
              height={128}
            />
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#70452E] tracking-tight">
              บันทึกการถวายเรียบร้อยแล้ว
            </h3>
            <p className="text-sm sm:text-base md:text-lg text-[#927D6D] mt-2 leading-relaxed font-medium">
              "ขอพระเจ้าทรงอวยพระพรและตอบแทนทุกน้ำใจที่ท่านได้มอบให้เพื่อพันธกิจของพระองค์"
            </p>
          </div>
          {submittedOffering && (
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#FFF4DF] border-2 border-[#E9D9BF] text-base sm:text-lg text-left space-y-2.5">
              <div className="flex justify-between items-center border-b border-[#E9D9BF]/60 pb-2">
                <span className="text-[#927D6D] font-bold">รายการถวาย:</span>
                <span className="font-black text-[#70452E] text-lg sm:text-xl">
                  {offeringCategoryLabel(submittedOffering.type)}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-[#E9D9BF]/60 pb-2">
                <span className="text-[#927D6D] font-bold">จำนวนเงิน:</span>
                <span className="font-black text-[#1b5e3a] text-2xl sm:text-3xl">
                  {fmtBaht(submittedOffering.amount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#927D6D] font-bold">เข้ากองทุน:</span>
                <span className="font-black text-[#70452E] text-base sm:text-lg">
                  {submittedOffering.fund}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={() => setOfferingSuccess(false)}
            className="w-full py-4 sm:py-5 rounded-2xl sm:rounded-3xl bg-[#A8C978] hover:bg-[#96C764] text-white font-black text-base sm:text-xl min-h-[58px] clay-button-shadow transition-transform active:scale-95"
          >
            เรียบร้อย (สรรเสริญพระเจ้า) ✓
          </button>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 3: EXPENSE ENTRY DIALOG ──────────────────────────────────── */}
      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
        <DialogContent className="w-[95vw] max-w-xl sm:max-w-2xl md:max-w-3xl bg-[#FFFDF8] border-2 border-[#E9D9BF] rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 text-[#38251B] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-2xl sm:text-3xl md:text-4xl font-black text-[#70452E]">
              บันทึกรายจ่ายคริสตจักร
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-[#927D6D] mt-1 font-medium">
              บันทึกค่าใช้จ่ายพร้อมหักยอดจากกองทุนที่เกี่ยวข้อง
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={e => {
              e.preventDefault();
              createExpenseMutation.mutate({
                description: expenseForm.title,
                amount: Number(expenseForm.amount),
                category: expenseForm.category,
                fundId: Number(expenseForm.fundId),
                details: expenseForm.notes || undefined,
              });
            }}
            className="space-y-4 sm:space-y-6 pt-2"
          >
            <div>
              <label className="text-base sm:text-lg font-black text-[#70452E] mb-2 block">
                ชื่อรายการรายจ่าย <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={expenseForm.title}
                onChange={e =>
                  setExpenseForm({ ...expenseForm, title: e.target.value })
                }
                placeholder="เช่น ค่าอุปกรณ์นมัสการ, ค่าไฟฟ้า"
                className="w-full p-4 sm:p-5 rounded-2xl bg-white border-2 border-[#E9D9BF] text-base sm:text-lg font-medium focus:border-[#E99A4A] focus:outline-none min-h-[56px]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-base sm:text-lg font-black text-[#70452E] mb-2 block">
                  จำนวนเงิน (บาท) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={expenseForm.amount}
                  onChange={e =>
                    setExpenseForm({ ...expenseForm, amount: e.target.value })
                  }
                  placeholder="0.00"
                  className="w-full p-4 sm:p-5 rounded-2xl bg-white border-2 border-[#E9D9BF] text-xl sm:text-2xl font-black text-[#c7382d] focus:border-[#E99A4A] focus:outline-none min-h-[56px]"
                />
              </div>
              <div>
                <label className="text-base sm:text-lg font-black text-[#70452E] mb-2 block">
                  หมวดหมู่
                </label>
                <select
                  value={expenseForm.category}
                  onChange={e =>
                    setExpenseForm({
                      ...expenseForm,
                      category: e.target.value as ExpenseCategory,
                    })
                  }
                  className="w-full p-4 sm:p-5 rounded-2xl bg-white border-2 border-[#E9D9BF] text-base sm:text-lg font-bold focus:border-[#E99A4A] focus:outline-none min-h-[56px]"
                >
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-base sm:text-lg font-black text-[#70452E] mb-2 block">
                หักจากกองทุน <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={expenseForm.fundId}
                onChange={e =>
                  setExpenseForm({ ...expenseForm, fundId: e.target.value })
                }
                className="w-full p-4 sm:p-5 rounded-2xl bg-white border-2 border-[#E9D9BF] text-base sm:text-lg font-bold focus:border-[#E99A4A] focus:outline-none min-h-[56px]"
              >
                <option value="" disabled>
                  -- เลือกกองทุน --
                </option>
                {fundAccounts.map((fa: any) => (
                  <option key={fa.id} value={fa.id}>
                    {fa.name}
                  </option>
                ))}
              </select>
              {fundAccounts.length === 0 && (
                <p className="text-sm font-bold text-[#D45945] mt-2">
                  ยังไม่มีกองทุนในระบบ กรุณาเพิ่มกองทุนก่อนบันทึกรายจ่าย
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={createExpenseMutation.isPending || !expenseForm.fundId}
              className="w-full py-4 sm:py-5 mt-2 rounded-2xl sm:rounded-3xl bg-[#E99A4A] hover:bg-[#DE8640] text-white font-black text-base sm:text-xl clay-button-shadow disabled:opacity-50 min-h-[58px] transition-transform active:scale-95"
            >
              {createExpenseMutation.isPending
                ? "กำลังบันทึก..."
                : "บันทึกรายจ่าย ✓"}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 4: WITHDRAWAL REQUEST DIALOG ─────────────────────────────── */}
      <Dialog open={withdrawalOpen} onOpenChange={setWithdrawalOpen}>
        <DialogContent className="w-[95vw] max-w-xl sm:max-w-2xl md:max-w-3xl bg-[#FFFDF8] border-2 border-[#E9D9BF] rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 text-[#38251B] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-2xl sm:text-3xl md:text-4xl font-black text-[#70452E]">
              ยื่นคำขอเบิกเงิน (Withdrawal Request)
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-[#927D6D] mt-1 font-medium">
              ส่งคำขอเบิกเงินเพื่อให้ศิษยาภิบาลหรือเหรัญญิกพิจารณาอนุมัติ
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={e => {
              e.preventDefault();
              createWithdrawalMutation.mutate({
                purpose: withdrawalForm.purpose,
                amount: Number(withdrawalForm.amount),
                fundId: Number(withdrawalForm.fundId),
                details: withdrawalForm.notes || undefined,
              });
            }}
            className="space-y-4 sm:space-y-6 pt-2"
          >
            <div>
              <label className="text-base sm:text-lg font-black text-[#70452E] mb-2 block">
                วัตถุประสงค์การเบิก <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={withdrawalForm.purpose}
                onChange={e =>
                  setWithdrawalForm({
                    ...withdrawalForm,
                    purpose: e.target.value,
                  })
                }
                placeholder="เช่น ค่าจัดค่ายอนุชน, ค่าซ่อมแซมห้องน้ำ"
                className="w-full p-4 sm:p-5 rounded-2xl bg-white border-2 border-[#E9D9BF] text-base sm:text-lg font-medium focus:border-[#E99A4A] focus:outline-none min-h-[56px]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-base sm:text-lg font-black text-[#70452E] mb-2 block">
                  จำนวนเงิน (บาท) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={withdrawalForm.amount}
                  onChange={e =>
                    setWithdrawalForm({
                      ...withdrawalForm,
                      amount: e.target.value,
                    })
                  }
                  placeholder="0.00"
                  className="w-full p-4 sm:p-5 rounded-2xl bg-white border-2 border-[#E9D9BF] text-xl sm:text-2xl font-black text-[#70452E] focus:border-[#E99A4A] focus:outline-none min-h-[56px]"
                />
              </div>
              <div>
                <label className="text-base sm:text-lg font-black text-[#70452E] mb-2 block">
                  ความเร่งด่วน
                </label>
                <select
                  value={withdrawalForm.urgency}
                  onChange={e =>
                    setWithdrawalForm({
                      ...withdrawalForm,
                      urgency: e.target.value,
                    })
                  }
                  className="w-full p-4 sm:p-5 rounded-2xl bg-white border-2 border-[#E9D9BF] text-base sm:text-lg font-bold focus:border-[#E99A4A] focus:outline-none min-h-[56px]"
                >
                  <option value="normal">ปกติ (ตามรอบ)</option>
                  <option value="urgent">เร่งด่วน</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-base sm:text-lg font-black text-[#70452E] mb-2 block">
                เบิกจากกองทุน <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={withdrawalForm.fundId}
                onChange={e =>
                  setWithdrawalForm({
                    ...withdrawalForm,
                    fundId: e.target.value,
                  })
                }
                className="w-full p-4 sm:p-5 rounded-2xl bg-white border-2 border-[#E9D9BF] text-base sm:text-lg font-bold focus:border-[#E99A4A] focus:outline-none min-h-[56px]"
              >
                <option value="" disabled>
                  -- เลือกกองทุน --
                </option>
                {fundAccounts.map((fa: any) => (
                  <option key={fa.id} value={fa.id}>
                    {fa.name}
                  </option>
                ))}
              </select>
              {fundAccounts.length === 0 && (
                <p className="text-sm font-bold text-[#D45945] mt-2">
                  ยังไม่มีกองทุนในระบบ กรุณาเพิ่มกองทุนก่อนยื่นคำขอเบิกเงิน
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={
                createWithdrawalMutation.isPending || !withdrawalForm.fundId
              }
              className="w-full py-4 sm:py-5 mt-2 rounded-2xl sm:rounded-3xl bg-[#E99A4A] hover:bg-[#DE8640] text-white font-black text-base sm:text-xl clay-button-shadow disabled:opacity-50 min-h-[58px] transition-transform active:scale-95"
            >
              {createWithdrawalMutation.isPending
                ? "กำลังส่งคำขอ..."
                : "ยื่นคำขอเบิกเงิน ✓"}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── SHEET: CHURCH NEWS & ANNOUNCEMENTS ─────────────────────────────── */}
      <Sheet open={newsOpen} onOpenChange={setNewsOpen}>
        <SheetContent className="bg-[#FFFDF8] border-l border-[#E9D9BF] w-full sm:max-w-lg p-6 sm:p-8 overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl sm:text-2xl font-black text-[#70452E] flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-[#E99A4A]" />
              <span>ข่าวสารและประกาศคริสตจักร</span>
            </SheetTitle>
            <SheetDescription className="text-sm sm:text-base text-[#927D6D] font-medium mt-1">
              ติดตามกิจกรรม พันธกิจ และคำพยานพระพร
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5">
            <div className="p-5 sm:p-6 rounded-3xl bg-[#FFF4DF] border-2 border-[#E9D9BF] space-y-3 shadow-xs">
              <span className="text-xs font-black px-3 py-1 rounded-full bg-[#E99A4A] text-white inline-block">
                ประกาศสำคัญ
              </span>
              <h4 className="text-lg sm:text-xl font-black text-[#70452E]">
                ค่ายสามัคคีธรรมประจำปี 2026
              </h4>
              <p className="text-sm sm:text-base text-[#38251B] leading-relaxed font-medium">
                ขอเชิญชวนพี่น้องสมาชิกทุกท่านร่วมค่ายสามัคคีธรรม วันที่ 18-20
                ต.ค. นี้ ณ ศูนย์ฝึกอบรมคริสเตียน
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-3xl bg-[#EAF5E4] border-2 border-[#D2EAC7] space-y-3 shadow-xs">
              <span className="text-xs font-black px-3 py-1 rounded-full bg-[#A8C978] text-white inline-block">
                รายงานพันธกิจ
              </span>
              <h4 className="text-lg sm:text-xl font-black text-[#4F8B33]">
                โครงการแจกถุงยังชีพสู่ชุมชนรอบโบสถ์
              </h4>
              <p className="text-sm sm:text-base text-[#38251B] leading-relaxed font-medium">
                คริสตจักรได้ส่งมอบถุงยังชีพจำนวน 120 ชุดแก่ครอบครัวยากไร้
                ขอบคุณพระเจ้าสำหรับทุกการถวาย
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
