import React from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  CreditCard,
  FileBarChart,
  HandCoins,
  Home as HomeIcon,
  Landmark,
  MoreHorizontal,
  PieChart,
  Plus,
  ReceiptText,
  Settings2,
  Sprout,
  UsersRound,
} from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
  activeRoute?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  activeRoute,
  title,
  subtitle,
  action,
}) => {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const currentPath = activeRoute || location;

  const { data: churchProfile } = trpc.church.getProfile.useQuery(undefined, {
    retry: false,
    staleTime: 60_000,
  });

  const churchName =
    churchProfile?.name || user?.name || "คริสตจักรพระคุณสมบูรณ์";

  const navItems = [
    { label: "หน้าหลัก", path: "/", icon: HomeIcon, iconColor: "text-[#E99A4A]" },
    { label: "รายการ", path: "/transactions", icon: ReceiptText, iconColor: "text-[#A8C978]" },
    { label: "ถวายทรัพย์", path: "/offerings", icon: HandCoins, iconColor: "text-[#F7B6A6]" },
    { label: "รายจ่าย", path: "/expenses", icon: CreditCard, iconColor: "text-[#E99A4A]" },
    { label: "กองทุน", path: "/funds", icon: Landmark, iconColor: "text-[#85C1E9]" },
    { label: "งบประมาณ", path: "/budgets", icon: PieChart, iconColor: "text-[#C39BD3]" },
    { label: "พันธกิจ", path: "/ministries", icon: Sprout, iconColor: "text-[#A8C978]" },
    { label: "สมาชิก", path: "/members", icon: UsersRound, iconColor: "text-[#E99A4A]" },
    { label: "รายงาน", path: "/reports", icon: FileBarChart, iconColor: "text-[#A9D4ED]" },
    { label: "การอนุมัติ", path: "/approvals", icon: CheckCircle2, iconColor: "text-[#A8C978]" },
    { label: "ตั้งค่า", path: "/settings", icon: Settings2, iconColor: "text-[#70452E]" },
  ];

  return (
    <div className="min-h-screen bg-[#FFF9EE] text-[#38251B] flex flex-col font-sans selection:bg-[#F7B6A6]/30 overflow-x-hidden">
      <div className="flex-1 flex flex-row justify-center w-full max-w-[1440px] mx-auto">
        {/* DESKTOP FIXED SIDEBAR (Visible on lg: >= 1024px) */}
        <aside className="hidden lg:flex flex-col w-72 bg-[#FFF4DF]/85 border-r border-[#E9D9BF] p-6 sticky top-0 h-screen overflow-y-auto shrink-0 z-30">
          {/* 1. Grace-giving Branding */}
          <div
            onClick={() => setLocation("/")}
            className="flex items-center gap-3 mb-6 cursor-pointer select-none"
          >
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

          {/* Quick Offering Action Button */}
          <button
            onClick={() => setLocation("/offerings/new")}
            className="w-full mb-6 py-3 px-4 rounded-2xl bg-[#E99A4A] hover:bg-[#DE8640] text-white font-bold flex items-center justify-center gap-2 clay-button-shadow transition-all focus-visible:ring-2 focus-visible:ring-[#E99A4A]"
            aria-label="บันทึกการถวายใหม่"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>บันทึกการถวาย</span>
          </button>

          {/* Navigation Links in exact order */}
          <nav className="flex-1 space-y-1 text-sm font-medium">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === "/"
                  ? currentPath === "/"
                  : currentPath.startsWith(item.path);

              return (
                <button
                  key={item.path}
                  onClick={() => setLocation(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all ${
                    isActive
                      ? "bg-[#FFF9EE] text-[#70452E] font-bold border border-[#E9D9BF] shadow-xs"
                      : "text-[#70452E]/80 hover:bg-[#FFF9EE]/60 hover:text-[#70452E]"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${item.iconColor}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile Card at Sidebar Bottom */}
          <div className="pt-4 mt-auto border-t border-[#E9D9BF]/80">
            <div
              onClick={() => setLocation("/settings")}
              className="flex items-center gap-3 p-3 rounded-2xl bg-[#FFF9EE] border border-[#E9D9BF] cursor-pointer hover:bg-white transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-[#E99A4A]/20 flex items-center justify-center text-[#70452E] font-bold text-sm shrink-0">
                {user?.name ? user.name.slice(0, 1) : "ศ"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#70452E] truncate">
                  {churchName}
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

        {/* MAIN CONTAINER */}
        <main className="w-full max-w-[560px] lg:max-w-4xl xl:max-w-5xl px-4 py-4 md:px-8 md:py-6 flex flex-col pb-36 lg:pb-16 min-w-0">
          {/* Top Bar for Desktop and Mobile */}
          <header className="flex items-center justify-between gap-4 mb-6 pb-2 border-b border-[#E9D9BF]/60">
            {/* Left: Page Title or Mobile Branding */}
            <div>
              {title ? (
                <div>
                  <h1 className="text-xl md:text-2xl font-extrabold text-[#38251B] tracking-tight">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-xs text-[#927D6D] mt-0.5">{subtitle}</p>
                  )}
                </div>
              ) : (
                <div
                  onClick={() => setLocation("/")}
                  className="flex items-center gap-2 cursor-pointer lg:hidden"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#E99A4A]/15 border border-[#E99A4A]/30 flex items-center justify-center">
                    <Sprout className="w-5 h-5 text-[#70452E]" />
                  </div>
                  <div>
                    <span className="text-base font-black text-[#38251B]">
                      Grace{" "}
                    </span>
                    <span className="text-base font-black text-[#E99A4A]">
                      Ledger
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Actions and Notification */}
            <div className="flex items-center gap-2.5">
              {action && <div>{action}</div>}

              <button
                onClick={() => setLocation("/notifications")}
                className="w-10 h-10 rounded-full bg-white border border-[#E9D9BF] shadow-xs flex items-center justify-center text-[#70452E] hover:bg-[#FFF4DF] transition-all relative focus-visible:ring-2 focus-visible:ring-[#E99A4A]"
                aria-label="การแจ้งเตือน"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#E06250] ring-2 ring-white" />
              </button>
            </div>
          </header>

          {/* Children Content */}
          <div className="space-y-6">{children}</div>
        </main>
      </div>

      {/* MOBILE FIXED BOTTOM NAVIGATION BAR */}
      <nav
        aria-label="เมนูนำทางหลักบนมือถือ"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFF4DF]/95 backdrop-blur-md border-t border-[#E9D9BF] px-4 pt-2 pb-5 shadow-lg"
      >
        <div className="max-w-md mx-auto flex items-center justify-between relative">
          {/* 1. หน้าแรก */}
          <button
            onClick={() => setLocation("/")}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2.5 rounded-2xl transition-all ${
              currentPath === "/"
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
            onClick={() => setLocation("/transactions")}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2.5 rounded-2xl transition-all ${
              currentPath.startsWith("/transactions")
                ? "bg-[#FBE9CD] text-[#70452E] font-bold shadow-2xs"
                : "text-[#927D6D] hover:text-[#70452E]"
            }`}
            aria-label="ไปที่รายการการเงิน"
          >
            <ReceiptText className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[11px] mt-0.5 font-bold">รายการ</span>
          </button>

          {/* 3. CENTER PRIMARY FAB: WARM ORANGE '+' BUTTON */}
          <div className="relative -top-5 flex flex-col items-center">
            <button
              onClick={() => setLocation("/offerings/new")}
              className="w-14 h-14 rounded-full bg-[#E99A4A] hover:bg-[#DE8640] text-white flex items-center justify-center clay-button-shadow transition-transform active:scale-95 border-3 border-white focus-visible:ring-2 focus-visible:ring-[#E99A4A]"
              aria-label="บันทึกการถวายใหม่"
            >
              <Plus className="w-7 h-7 stroke-[2.8]" />
            </button>
            <span className="text-[11px] font-extrabold text-[#70452E] mt-0.5">
              เพิ่ม
            </span>
          </div>

          {/* 4. รายงาน */}
          <button
            onClick={() => setLocation("/reports")}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2.5 rounded-2xl transition-all ${
              currentPath.startsWith("/reports")
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
            onClick={() => setLocation("/settings")}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2.5 rounded-2xl transition-all ${
              currentPath.startsWith("/settings")
                ? "bg-[#FBE9CD] text-[#70452E] font-bold shadow-2xs"
                : "text-[#927D6D] hover:text-[#70452E]"
            }`}
            aria-label="ไปที่หน้าฉัน (ตั้งค่า)"
          >
            <CircleUserRound className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[11px] mt-0.5 font-bold">ฉัน</span>
          </button>
        </div>

        {/* Script Brand Signature */}
        <div className="pt-1.5 text-center">
          <p className="font-script text-xs md:text-sm text-[#927D6D]/85 tracking-wide">
            All for His Glory ♥
          </p>
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
