import {
  CheckCircle2,
  CreditCard,
  FileBarChart,
  HandCoins,
  Home as HomeIcon,
  Landmark,
  PieChart,
  Plus,
  ReceiptText,
  Settings2,
  Sprout,
  UsersRound,
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

type HomeTab = "home" | "ledger" | "reports" | "profile";

interface HomeSidebarProps {
  activeTab: HomeTab;
  onTabChange: (tab: HomeTab) => void;
  onOpenOffering: () => void;
}

export function HomeSidebar({
  activeTab,
  onTabChange,
  onOpenOffering,
}: HomeSidebarProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: churchProfile } = trpc.church.getProfile.useQuery(undefined, {
    retry: false,
  });

  const sidebarNavItems = [
    {
      label: "หน้าหลัก",
      tab: "home" as HomeTab,
      icon: HomeIcon,
      iconColor: "text-[#D97706]",
      isTab: true,
    },
    {
      label: "รายการ",
      tab: "ledger" as HomeTab,
      icon: ReceiptText,
      iconColor: "text-[#34D399]",
      isTab: true,
    },
    {
      label: "ถวายทรัพย์",
      path: "/offerings",
      icon: HandCoins,
      iconColor: "text-[#FDA4AF]",
      isTab: false,
    },
    {
      label: "รายจ่าย",
      path: "/expenses",
      icon: CreditCard,
      iconColor: "text-[#D97706]",
      isTab: false,
    },
    {
      label: "กองทุน",
      path: "/funds",
      icon: Landmark,
      iconColor: "text-[#38BDF8]",
      isTab: false,
    },
    {
      label: "งบประมาณ",
      path: "/budgets",
      icon: PieChart,
      iconColor: "text-[#C4B5FD]",
      isTab: false,
    },
    {
      label: "พันธกิจ",
      path: "/ministries",
      icon: Sprout,
      iconColor: "text-[#34D399]",
      isTab: false,
    },
    {
      label: "สมาชิก",
      path: "/members",
      icon: UsersRound,
      iconColor: "text-[#D97706]",
      isTab: false,
    },
    {
      label: "รายงาน",
      tab: "reports" as HomeTab,
      icon: FileBarChart,
      iconColor: "text-[#38BDF8]",
      isTab: true,
    },
    {
      label: "การอนุมัติ",
      path: "/approvals",
      icon: CheckCircle2,
      iconColor: "text-[#34D399]",
      isTab: false,
    },
    {
      label: "ตั้งค่า",
      path: "/settings",
      icon: Settings2,
      iconColor: "text-[#1E4470]",
      isTab: false,
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-72 brand-navy-gradient text-white p-6 sticky top-0 h-screen overflow-y-auto shrink-0 z-30">
      {/* 1. Grace-giving (branding) */}
      <div className="flex items-center gap-3 mb-7">
        <div className="w-12 h-12 rounded-2xl bg-[#F59E0B] flex items-center justify-center relative overflow-hidden shrink-0 shadow-lg">
          <Sprout className="w-7 h-7 text-[#0C1B33]" />
        </div>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-white tracking-tight">
              Grace
            </span>
            <span className="text-xl font-bold text-[#FBBF24] tracking-tight">
              Ledger
            </span>
          </div>
          <p className="text-[11px] text-white/60 font-medium leading-tight">
            การเงินเชื่อมใจ เพื่อคริสตจักร
          </p>
        </div>
      </div>

      {/* Quick Offering Action Button on Sidebar */}
      <button
        onClick={onOpenOffering}
        className="w-full mb-7 py-3 px-4 rounded-xl brand-amber-gradient text-[#0C1B33] font-bold flex items-center justify-center gap-2 amber-glow hover:brightness-95 transition-all"
        aria-label="บันทึกการถวายใหม่"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
        <span>บันทึกการถวาย</span>
      </button>

      {/* Sidebar Nav Links in Exact Specified Order */}
      <nav className="flex-1 space-y-1 text-sm font-medium">
        {sidebarNavItems.map(item => {
          const Icon = item.icon;
          const isActive = item.isTab && activeTab === item.tab;
          return (
            <button
              key={item.label}
              onClick={() =>
                item.isTab ? onTabChange(item.tab!) : setLocation(item.path!)
              }
              className={`w-full flex min-h-11 items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                isActive
                  ? "bg-white/10 text-white font-bold border border-white/15 shadow-sm"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className={`w-5 h-5 ${item.iconColor}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile Card on Sidebar Bottom */}
      <div className="pt-4 mt-auto border-t border-white/10">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="w-10 h-10 rounded-full bg-[#F59E0B] flex items-center justify-center text-[#0C1B33] font-bold text-sm">
            {user?.name ? user.name.slice(0, 1) : "ศ"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">
              {user?.name || churchProfile?.name || "คริสตจักรพระคุณสมบูรณ์"}
            </p>
            <p className="text-[11px] text-[#34D399] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
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
  );
}
