import { type ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { canAccessRoute } from "@/lib/routeAccess";
import { GuardedLink } from "./GuardedLink";
import {
  CalendarDays,
  CheckCircle2,
  CircleUserRound,
  Coins,
  CreditCard,
  FileBarChart,
  HandCoins,
  Home,
  Inbox,
  Landmark,
  Menu,
  PieChart,
  ReceiptText,
  Settings2,
  Sprout,
  UsersRound,
} from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const navItems = [
  { label: "หน้าหลัก", path: "/", icon: Home },
  {
    label: "รายการ",
    path: "/transactions",
    icon: ReceiptText,
  },
  {
    label: "นับเงินถวาย",
    path: "/counting",
    icon: Coins,
  },
  {
    label: "ถวายทรัพย์",
    path: "/offerings",
    icon: HandCoins,
  },
  {
    label: "กล่องสลิป LINE",
    path: "/giving/inbox",
    icon: Inbox,
  },
  {
    label: "รายจ่าย",
    path: "/expenses",
    icon: CreditCard,
  },
  {
    label: "กองทุน",
    path: "/funds",
    icon: Landmark,
  },
  {
    label: "งบประมาณ",
    path: "/budgets",
    icon: PieChart,
  },
  {
    label: "พันธกิจ",
    path: "/ministries",
    icon: Sprout,
  },
  {
    label: "สมาชิก",
    path: "/members",
    icon: UsersRound,
  },
  {
    label: "รายงาน",
    path: "/reports",
    icon: FileBarChart,
  },
  {
    label: "การอนุมัติ",
    path: "/approvals",
    icon: CheckCircle2,
  },
  {
    label: "ข่าวสารและกิจกรรม",
    path: "/updates",
    icon: CalendarDays,
  },
  {
    label: "โปรไฟล์",
    path: "/profile",
    icon: CircleUserRound,
  },
  {
    label: "ตั้งค่า",
    path: "/settings",
    icon: Settings2,
  },
];

export function getAuthorizedNavItems(
  user?: { role?: string; churchRole?: string | null } | null
) {
  return navItems.filter(item => canAccessRoute(item.path, user));
}

export function isActiveRoute(currentPath: string, path: string) {
  return (
    currentPath === path || (path !== "/" && currentPath.startsWith(`${path}/`))
  );
}

export function AppMenu({ children }: { children?: ReactNode }) {
  const [location] = useLocation();
  const { user } = useAuth();
  const authorizedNavItems = getAuthorizedNavItems(user);

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children || (
          <button
            type="button"
            className="flex min-h-12 shrink-0 items-center gap-2.5 rounded-2xl border-2 border-line bg-card px-4 text-base font-bold text-ink-2 hover:bg-sunken shadow-2xs"
          >
            <Menu className="size-6" aria-hidden="true" />
            <span>เมนูทั้งหมด</span>
          </button>
        )}
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[calc(100%-2rem)] max-w-sm gap-0 bg-page"
      >
        <SheetHeader className="border-b-2 border-line p-6 pr-16">
          <SheetTitle className="text-xl sm:text-2xl font-bold text-ink-2">
            เมนูทั้งหมด
          </SheetTitle>
          <SheetDescription className="text-sm font-medium text-ink-3 mt-0.5">
            จัดการการเงินและพันธกิจคริสตจักร
          </SheetDescription>
        </SheetHeader>
        <nav
          aria-label="เมนูทุกหมวด"
          className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          {authorizedNavItems.map(({ path, label, icon: Icon }) => {
            const active = isActiveRoute(location, path);
            return (
              <SheetClose asChild key={path}>
                <GuardedLink
                  href={path}
                  aria-current={active ? "page" : undefined}
                  onFocus={e =>
                    e.currentTarget.scrollIntoView({ block: "nearest" })
                  }
                  className={`flex min-h-13 items-center gap-3.5 rounded-2xl border-2 px-4 py-3 text-base ${
                    active
                      ? "border-line bg-sunken font-bold text-ink-2 shadow-2xs"
                      : "border-transparent text-ink-2 hover:bg-sunken font-bold"
                  }`}
                >
                  <Icon className={`size-6 shrink-0`} aria-hidden="true" />
                  <span>{label}</span>
                </GuardedLink>
              </SheetClose>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
