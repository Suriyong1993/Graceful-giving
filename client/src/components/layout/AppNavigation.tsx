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
            className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-[#E4DED7] bg-white px-3.5 text-sm font-semibold text-[#1F1A17] hover:bg-[#F4F1ED]"
          >
            <Menu className="size-5" aria-hidden="true" />
            <span>เมนูทั้งหมด</span>
          </button>
        )}
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[calc(100%-2rem)] max-w-sm gap-0 bg-white"
      >
        <SheetHeader className="border-b border-[#E4DED7] p-5 pr-16">
          <SheetTitle className="text-lg font-bold text-[#1F1A17]">
            เมนูทั้งหมด
          </SheetTitle>
          <SheetDescription className="text-sm text-[#736A63] mt-0.5">
            จัดการการเงินและพันธกิจคริสตจักร
          </SheetDescription>
        </SheetHeader>
        <nav
          aria-label="เมนูทุกหมวด"
          className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
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
                  className={`flex min-h-12 items-center gap-3 rounded-xl px-3.5 text-[15px] ${
                    active
                      ? "bg-[#FDEBD8] font-semibold text-[#A34A0C]"
                      : "font-medium text-[#3F3833] hover:bg-[#F4F1ED]"
                  }`}
                >
                  <Icon
                    className={`size-5 shrink-0 ${active ? "text-[#B9530F]" : "text-[#736A63]"}`}
                    aria-hidden="true"
                  />
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
