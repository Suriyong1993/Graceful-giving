import { useLocation } from "wouter";
import { useEffect, useRef, type ReactNode } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useGuardedNavigate } from "@/hooks/useUnsavedChanges";
import { GuardedLink } from "./GuardedLink";
import { AppMenu, isActiveRoute, navItems } from "./AppNavigation";
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
  children: ReactNode;
  activeRoute?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
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
  const mainRef = useRef<HTMLElement>(null);
  const previousPathRef = useRef(currentPath);

  useEffect(() => {
    if (previousPathRef.current !== currentPath) {
      previousPathRef.current = currentPath;
      mainRef.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [currentPath]);

  const { data: churchProfile } = trpc.church.getProfile.useQuery(undefined, {
    retry: false,
    staleTime: 60_000,
  });

  const churchName =
    churchProfile?.name || user?.name || "คริสตจักรพระคุณสมบูรณ์";

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#0C1B33] flex flex-col font-sans selection:bg-[#F59E0B]/25 overflow-x-clip">
      <a
        href="#main-content"
        className="sr-only z-[100] rounded-xl bg-[#0C1B33] px-4 py-3 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        ข้ามไปยังเนื้อหาหลัก
      </a>
      <div className="flex-1 flex flex-row justify-center w-full max-w-[1440px] mx-auto">
        {/* DESKTOP SIDEBAR (lg: >= 1024px) — deep navy brand surface */}
        <aside className="hidden lg:flex flex-col w-72 brand-navy-gradient text-white p-6 sticky top-0 h-screen overflow-y-auto shrink-0 z-30">
          {/* 1. Grace-giving Branding */}
          <GuardedLink
            href="/"
            className="flex items-center gap-3 mb-7 cursor-pointer select-none"
          >
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
          </GuardedLink>

          {/* Quick Offering Action Button */}
          <button
            onClick={() => navigate("/offerings/new")}
            className="w-full mb-7 py-3 px-4 rounded-xl brand-amber-gradient text-[#0C1B33] font-bold flex items-center justify-center gap-2 amber-glow hover:brightness-95 focus-visible:ring-2 focus-visible:ring-[#FBBF24]"
            aria-label="บันทึกการถวายใหม่"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>บันทึกการถวาย</span>
          </button>

          {/* Navigation Links in exact order */}
          <nav
            aria-label="เมนูนำทางหลัก"
            className="flex-1 space-y-1 text-sm font-medium"
          >
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = isActiveRoute(currentPath, item.path);

              return (
                <GuardedLink
                  key={item.path}
                  href={item.path}
                  aria-current={isActive ? "page" : undefined}
                  className={`w-full flex min-h-11 items-center gap-3 border px-4 py-2.5 rounded-xl transition-all ${
                    isActive
                      ? "bg-white/10 text-white font-bold border-white/15 shadow-sm"
                      : "border-transparent text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${isActive ? "text-[#FBBF24]" : "text-white/60"}`}
                  />
                  <span>{item.label}</span>
                </GuardedLink>
              );
            })}
          </nav>

          {/* User Profile Card at Sidebar Bottom */}
          <div className="pt-4 mt-auto border-t border-white/10">
            <GuardedLink
              href="/settings"
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-[#F59E0B] flex items-center justify-center text-[#0C1B33] font-bold text-sm shrink-0">
                {user?.name ? user.name.slice(0, 1) : "ศ"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {churchName}
                </p>
                <p className="text-[11px] text-[#6EE7B7] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6EE7B7]" />
                  {user?.churchRole === "SUPER_ADMIN"
                    ? "ผู้ดูแลระบบสูงสุด"
                    : user?.churchRole === "TREASURER"
                      ? "เหรัญญิกคริสตจักร"
                      : "สมาชิกคริสตจักร"}
                </p>
              </div>
            </GuardedLink>
          </div>
        </aside>

        {/* MAIN CONTAINER */}
        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          className="w-full max-w-[560px] md:max-w-4xl xl:max-w-5xl px-4 py-4 md:px-8 md:py-6 flex flex-col pb-[calc(9rem+env(safe-area-inset-bottom))] lg:pb-16 min-w-0 focus:outline-none"
        >
          {/* Top Bar for Desktop and Mobile */}
          <header className="flex flex-wrap items-start justify-between gap-4 mb-6 pb-4 border-b border-[#DDE5F0]">
            <div className="flex w-full items-center justify-between lg:hidden">
              <AppMenu />
              <GuardedLink
                href="/notifications"
                className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#DDE5F0] bg-white text-[#1E4470] hover:bg-[#EEF2F8] card-elevation-sm"
                aria-label="การแจ้งเตือน"
              >
                <Bell className="size-5" aria-hidden="true" />
              </GuardedLink>
            </div>
            {/* Left: Page Title or Mobile Branding */}
            <div className="min-w-0 flex-1 basis-full sm:basis-0">
              {title ? (
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-[#0C1B33] tracking-tight break-words">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-sm leading-relaxed text-[#64748B] mt-1">
                      {subtitle}
                    </p>
                  )}
                </div>
              ) : (
                <GuardedLink
                  href="/"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#12325C] flex items-center justify-center">
                    <Sprout className="w-5 h-5 text-[#FBBF24]" />
                  </div>
                  <div>
                    <span className="text-base font-bold text-[#0C1B33]">
                      Grace{" "}
                    </span>
                    <span className="text-base font-bold text-[#B45309]">
                      Ledger
                    </span>
                  </div>
                </GuardedLink>
              )}
            </div>

            {/* Right: Actions and Notification */}
            <div className="flex max-w-full flex-wrap items-center gap-2.5">
              {action && (
                <div className="max-w-full [&>div]:flex-wrap [&_button]:min-h-11">
                  {action}
                </div>
              )}

              <button
                onClick={() => navigate("/notifications")}
                className="hidden lg:flex size-11 shrink-0 rounded-xl bg-white border border-[#DDE5F0] shadow-xs card-elevation-sm items-center justify-center text-[#1E4470] hover:bg-[#EEF2F8] transition-all relative focus-visible:ring-2 focus-visible:ring-[#D97706]"
                aria-label="การแจ้งเตือน"
              >
                <Bell className="w-5 h-5" />
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
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 brand-navy-gradient text-white px-4 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgba(12,27,51,0.5)]"
      >
        <div className="max-w-md mx-auto flex items-center justify-between relative">
          {/* 1. หน้าแรก */}
          <button
            onClick={() => navigate("/")}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2.5 rounded-xl transition-all ${
              currentPath === "/"
                ? "text-[#FBBF24] font-bold bg-white/10"
                : "text-white/55 hover:text-white"
            }`}
            aria-label="ไปที่หน้าแรก"
            aria-current={currentPath === "/" ? "page" : undefined}
          >
            <HomeIcon className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[11px] mt-0.5 font-bold">หน้าแรก</span>
          </button>

          {/* 2. รายการ */}
          <button
            onClick={() => navigate("/transactions")}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2.5 rounded-xl transition-all ${
              currentPath.startsWith("/transactions")
                ? "text-[#FBBF24] font-bold bg-white/10"
                : "text-white/55 hover:text-white"
            }`}
            aria-label="ไปที่รายการการเงิน"
            aria-current={
              isActiveRoute(currentPath, "/transactions") ? "page" : undefined
            }
          >
            <ReceiptText className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[11px] mt-0.5 font-bold">รายการ</span>
          </button>

          {/* 3. CENTER PRIMARY FAB: WARM ORANGE '+' BUTTON */}
          <div className="relative -top-5 flex flex-col items-center">
            <button
              onClick={() => navigate("/offerings/new")}
              className="w-14 h-14 rounded-full brand-amber-gradient text-[#0C1B33] flex items-center justify-center amber-glow transition-transform active:scale-95 border-2 border-[#0C1B33]/10 focus-visible:ring-2 focus-visible:ring-[#FBBF24]"
              aria-label="บันทึกการถวายใหม่"
            >
              <Plus className="w-7 h-7 stroke-[2.8]" />
            </button>
            <span className="text-[11px] font-bold text-[#FBBF24] mt-0.5">
              เพิ่ม
            </span>
          </div>

          {/* 4. รายงาน */}
          <button
            onClick={() => navigate("/reports")}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2.5 rounded-xl transition-all ${
              currentPath.startsWith("/reports")
                ? "text-[#FBBF24] font-bold bg-white/10"
                : "text-white/55 hover:text-white"
            }`}
            aria-label="ไปที่หน้ารายงาน"
            aria-current={
              isActiveRoute(currentPath, "/reports") ? "page" : undefined
            }
          >
            <FileBarChart className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[11px] mt-0.5 font-bold">รายงาน</span>
          </button>

          {/* 5. ฉัน */}
          <button
            onClick={() => navigate("/settings")}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2.5 rounded-xl transition-all ${
              currentPath.startsWith("/settings")
                ? "text-[#FBBF24] font-bold bg-white/10"
                : "text-white/55 hover:text-white"
            }`}
            aria-label="ไปที่หน้าฉัน (ตั้งค่า)"
            aria-current={
              isActiveRoute(currentPath, "/settings") ? "page" : undefined
            }
          >
            <CircleUserRound className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[11px] mt-0.5 font-bold">ฉัน</span>
          </button>
        </div>

        {/* Script Brand Signature */}
        <div className="pt-1.5 text-center">
          <p className="font-script text-xs md:text-sm text-white/45 tracking-wide">
            All for His Glory ♥
          </p>
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
