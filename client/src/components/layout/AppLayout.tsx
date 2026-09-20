import React from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useGuardedNavigate } from "@/hooks/useUnsavedChanges";
import { GuardedLink } from "./GuardedLink";
import { AppMenu, isActiveRoute, getAuthorizedNavItems } from "./AppNavigation";
import { getChurchRoleInfo } from "@shared/roles";
import {
  Bell,
  CircleUserRound,
  FileBarChart,
  Home as HomeIcon,
  Plus,
  ReceiptText,
  Sprout,
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
  const [location] = useLocation();
  const navigate = useGuardedNavigate();
  const { user } = useAuth();
  const currentPath = activeRoute || location;

  const { data: churchProfile } = trpc.church.getProfile.useQuery(undefined, {
    retry: false,
    staleTime: 60_000,
  });

  const churchName =
    churchProfile?.name || user?.name || "คริสตจักรพระคุณสมบูรณ์";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-[#F7B6A6]/30 overflow-x-clip">
      <div className="flex-1 flex flex-row w-full max-w-none mx-auto min-w-0">
        {/* DESKTOP FIXED SIDEBAR (Visible on lg: >= 1024px) */}
        <aside className="hidden lg:flex flex-col w-76 xl:w-80 bg-[#FFF4DF]/95 border-r-2 border-[#E9D9BF] p-6 sticky top-0 h-screen overflow-y-auto shrink-0 z-30">
          {/* 1. Grace-giving Branding */}
          <GuardedLink
            href="/"
            className="flex items-center gap-3.5 mb-6 cursor-pointer select-none"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#D47012]/15 border-2 border-[#D47012]/30 flex items-center justify-center relative overflow-hidden shrink-0 shadow-xs">
              <Sprout className="w-8 h-8 text-[#2C1810]" />
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#3D7826] flex items-center justify-center">
                <span className="text-xs text-white font-black">✝</span>
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-[#2C1810] tracking-tight">
                  Grace
                </span>
                <span className="text-2xl font-black text-[#D47012] tracking-tight">
                  Ledger
                </span>
              </div>
              <p className="text-xs text-[#523D2E] font-extrabold leading-tight mt-0.5">
                การเงินเชื่อมใจ เพื่อคริสตจักร
              </p>
            </div>
          </GuardedLink>

          {/* Quick Offering Action Button */}
          <button
            onClick={() => navigate("/offerings/new")}
            className="w-full mb-6 py-3.5 px-5 rounded-2xl bg-[#D47012] hover:bg-[#BA5E0B] text-white font-black text-base xl:text-lg flex items-center justify-center gap-2.5 clay-button-shadow transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-[#D47012] min-h-[54px]"
            aria-label="บันทึกการถวายใหม่"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
            <span>บันทึกการถวาย</span>
          </button>

          {/* Navigation Links in exact order */}
          <nav
            aria-label="เมนูนำทางหลัก"
            className="flex-1 space-y-1.5 text-base font-bold"
          >
            {getAuthorizedNavItems(user).map(item => {
              const Icon = item.icon;
              const isActive = isActiveRoute(currentPath, item.path);

              return (
                <GuardedLink
                  key={item.path}
                  href={item.path}
                  aria-current={isActive ? "page" : undefined}
                  className={`w-full flex min-h-12 items-center gap-3.5 border-2 px-4 py-3 rounded-2xl transition-all ${
                    isActive
                      ? "bg-white text-[#2C1810] font-black border-[#D47012] shadow-xs"
                      : "border-transparent text-[#4A2E1B] hover:bg-white/80 hover:text-[#2C1810]"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 xl:w-6 xl:h-6 shrink-0 ${item.iconColor}`}
                  />
                  <span className="truncate">{item.label}</span>
                </GuardedLink>
              );
            })}
          </nav>

          {/* User Profile Card at Sidebar Bottom */}
          <div className="pt-4 mt-auto border-t-2 border-[#E9D9BF]/80">
            <GuardedLink
              href="/profile"
              className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white border-2 border-[#E9D9BF] cursor-pointer hover:bg-background transition-all shadow-xs"
            >
              <div className="w-12 h-12 rounded-full bg-[#D47012]/15 flex items-center justify-center text-[#2C1810] font-black text-base shrink-0 border border-[#D47012]/30">
                {user?.name ? user.name.slice(0, 1) : "ศ"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-[#2C1810] truncate">
                  {churchName}
                </p>
                <p className="text-xs text-[#2A6E24] font-black flex items-center gap-1.5 mt-0.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2A6E24]" />
                  {getChurchRoleInfo(user?.churchRole).label}
                </p>
              </div>
            </GuardedLink>
          </div>
        </aside>

        {/* MAIN CONTAINER (Auto-filling 100% available space across all screens) */}
        {/* The column is capped at --content-max and centred in whatever space
            is left beside the sidebar, so a row's date and its amount stay
            within reading distance of each other on a wide monitor. */}
        <main className="flex-1 w-full max-w-[var(--content-max)] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-4 sm:py-6 md:py-8 flex flex-col pb-[calc(var(--mobile-nav-clearance)+env(safe-area-inset-bottom))] lg:pb-16 min-w-0">
          {/* Top Bar for Desktop and Mobile */}
          <header className="flex flex-wrap items-start justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-[#E9D9BF]/60">
            <div className="flex w-full items-center justify-between lg:hidden">
              <AppMenu />
              <GuardedLink
                href="/notifications"
                className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-[#E9D9BF] bg-white text-[#2C1810] hover:bg-[#FFF4DF]"
                aria-label="การแจ้งเตือน"
              >
                <Bell className="size-5" aria-hidden="true" />
              </GuardedLink>
            </div>
            {/* Left: Page Title */}
            {title && (
              <div className="min-w-0 flex-1 basis-full sm:basis-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#2C1810] tracking-tight break-words">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm sm:text-base leading-relaxed text-[#4A2E1B] font-bold mt-1">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
            {/* No brand lockup here when a page passes no title. The sidebar
                already carries it on lg:, and every title-less page (Home,
                Funds, Expenses, Approvals, Settings and the two entry forms)
                opens with its own hero or banner, so the fallback only ever
                repeated a mark the user could already see. */}

            {/* Right: Actions and Notification */}
            <div className="flex max-w-full flex-wrap items-center gap-2.5">
              {action && (
                <div className="max-w-full [&>div]:flex-wrap [&_button]:min-h-11">
                  {action}
                </div>
              )}

              <button
                onClick={() => navigate("/notifications")}
                className="hidden lg:flex size-11 shrink-0 rounded-full bg-white border-2 border-[#E9D9BF] shadow-xs items-center justify-center text-[#2C1810] hover:bg-[#FFF4DF] transition-all relative focus-visible:ring-2 focus-visible:ring-[#D47012]"
                aria-label="การแจ้งเตือน"
              >
                <Bell className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Children Content */}
          <div className="space-y-6 w-full">{children}</div>
        </main>
      </div>

      {/* MOBILE FIXED BOTTOM NAVIGATION BAR */}
      <nav
        aria-label="เมนูนำทางหลักบนมือถือ"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFF4DF]/98 backdrop-blur-md border-t-2 border-[#E9D9BF] px-3 sm:px-6 pt-2 pb-[max(1.15rem,env(safe-area-inset-bottom))] shadow-lg"
      >
        <div className="max-w-md sm:max-w-lg mx-auto flex items-center justify-around sm:justify-between relative">
          {/* 1. หน้าแรก */}
          <button
            onClick={() => navigate("/")}
            className={`flex flex-col items-center justify-center min-w-[56px] sm:min-w-[64px] min-h-[54px] py-1.5 px-2 rounded-2xl transition-all ${
              currentPath === "/"
                ? "bg-white text-[#2C1810] font-black shadow-xs border-2 border-[#D47012]"
                : "text-[#4A2E1B] hover:text-[#2C1810] font-bold"
            }`}
            aria-label="ไปที่หน้าแรก"
            aria-current={currentPath === "/" ? "page" : undefined}
          >
            <HomeIcon className="w-6 h-6 stroke-[2.5] text-[#D47012]" />
            <span className="text-xs sm:text-sm mt-0.5 font-black">
              หน้าแรก
            </span>
          </button>

          {/* 2. รายการ */}
          <button
            onClick={() => navigate("/transactions")}
            className={`flex flex-col items-center justify-center min-w-[56px] sm:min-w-[64px] min-h-[54px] py-1.5 px-2 rounded-2xl transition-all ${
              currentPath.startsWith("/transactions")
                ? "bg-white text-[#2C1810] font-black shadow-xs border-2 border-[#D47012]"
                : "text-[#4A2E1B] hover:text-[#2C1810] font-bold"
            }`}
            aria-label="ไปที่รายการการเงิน"
            aria-current={
              isActiveRoute(currentPath, "/transactions") ? "page" : undefined
            }
          >
            <ReceiptText className="w-6 h-6 stroke-[2.5] text-[#3D7826]" />
            <span className="text-xs sm:text-sm mt-0.5 font-black">รายการ</span>
          </button>

          {/* 3. CENTER PRIMARY FAB: WARM ORANGE '+' BUTTON */}
          <div className="relative -top-6 flex flex-col items-center">
            <button
              onClick={() => navigate("/offerings/new")}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#D47012] hover:bg-[#BA5E0B] text-white flex items-center justify-center clay-button-shadow transition-transform active:scale-95 border-4 border-background focus-visible:ring-2 focus-visible:ring-[#D47012] shadow-lg"
              aria-label="บันทึกการถวายใหม่"
            >
              <Plus className="w-8 h-8 stroke-[3]" />
            </button>
            <span className="text-xs sm:text-sm font-black text-[#2C1810] mt-0.5">
              เพิ่ม
            </span>
          </div>

          {/* 4. รายงาน */}
          <button
            onClick={() => navigate("/reports")}
            className={`flex flex-col items-center justify-center min-w-[56px] sm:min-w-[64px] min-h-[54px] py-1.5 px-2 rounded-2xl transition-all ${
              currentPath.startsWith("/reports")
                ? "bg-white text-[#2C1810] font-black shadow-xs border-2 border-[#D47012]"
                : "text-[#4A2E1B] hover:text-[#2C1810] font-bold"
            }`}
            aria-label="ไปที่หน้ารายงาน"
            aria-current={
              isActiveRoute(currentPath, "/reports") ? "page" : undefined
            }
          >
            <FileBarChart className="w-6 h-6 stroke-[2.5] text-[#2A75A0]" />
            <span className="text-xs sm:text-sm mt-0.5 font-black">รายงาน</span>
          </button>

          {/* 5. ฉัน (Profile) */}
          <button
            onClick={() => navigate("/profile")}
            className={`flex flex-col items-center justify-center min-w-[56px] sm:min-w-[64px] min-h-[54px] py-1.5 px-2 rounded-2xl transition-all ${
              currentPath.startsWith("/profile") ||
              currentPath.startsWith("/settings")
                ? "bg-white text-[#2C1810] font-black shadow-xs border-2 border-[#D47012]"
                : "text-[#4A2E1B] hover:text-[#2C1810] font-bold"
            }`}
            aria-label="ไปที่หน้าโปรไฟล์"
            aria-current={
              currentPath.startsWith("/profile") ? "page" : undefined
            }
          >
            <CircleUserRound className="w-6 h-6 stroke-[2.5] text-[#8E44AD]" />
            <span className="text-xs sm:text-sm mt-0.5 font-black">ฉัน</span>
          </button>
        </div>

        {/* Script Brand Signature */}
        <div className="pt-2 text-center">
          <p className="font-script text-sm md:text-base text-[#4A2E1B] font-bold tracking-wide">
            All for His Glory ♥
          </p>
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
