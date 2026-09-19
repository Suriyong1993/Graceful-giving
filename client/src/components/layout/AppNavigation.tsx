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
  { label: "หน้าหลัก", path: "/", icon: Home, iconColor: "text-[#E99A4A]" },
  {
    label: "รายการ",
    path: "/transactions",
    icon: ReceiptText,
    iconColor: "text-[#A8C978]",
  },
  {
    label: "นับเงินถวาย",
    path: "/counting",
    icon: Coins,
    iconColor: "text-[#E99A4A]",
  },
  {
    label: "ถวายทรัพย์",
    path: "/offerings",
    icon: HandCoins,
    iconColor: "text-[#F7B6A6]",
  },
  {
    label: "กล่องสลิป LINE",
    path: "/giving/inbox",
    icon: Inbox,
    iconColor: "text-[#4F8B33]",
  },
  {
    label: "รายจ่าย",
    path: "/expenses",
    icon: CreditCard,
    iconColor: "text-[#E99A4A]",
  },
  {
    label: "กองทุน",
    path: "/funds",
    icon: Landmark,
    iconColor: "text-[#85C1E9]",
  },
  {
    label: "งบประมาณ",
    path: "/budgets",
    icon: PieChart,
    iconColor: "text-[#C39BD3]",
  },
  {
    label: "พันธกิจ",
    path: "/ministries",
    icon: Sprout,
    iconColor: "text-[#A8C978]",
  },
  {
    label: "สมาชิก",
    path: "/members",
    icon: UsersRound,
    iconColor: "text-[#E99A4A]",
  },
  {
    label: "รายงาน",
    path: "/reports",
    icon: FileBarChart,
    iconColor: "text-[#A9D4ED]",
  },
  {
    label: "การอนุมัติ",
    path: "/approvals",
    icon: CheckCircle2,
    iconColor: "text-[#A8C978]",
  },
  {
    label: "ข่าวสารและกิจกรรม",
    path: "/updates",
    icon: CalendarDays,
    iconColor: "text-[#D45945]",
  },
  {
    label: "โปรไฟล์",
    path: "/profile",
    icon: CircleUserRound,
    iconColor: "text-[#E99A4A]",
  },
  {
    label: "ตั้งค่า",
    path: "/settings",
    icon: Settings2,
    iconColor: "text-[#70452E]",
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
            className="flex min-h-12 shrink-0 items-center gap-2.5 rounded-2xl border-2 border-[#E9D9BF] bg-white px-4 text-base font-bold text-[#70452E] hover:bg-[#FFF4DF] shadow-2xs"
          >
            <Menu className="size-6" aria-hidden="true" />
            <span>เมนูทั้งหมด</span>
          </button>
        )}
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[calc(100%-2rem)] max-w-sm gap-0 bg-[#FFF9EE]"
      >
        <SheetHeader className="border-b-2 border-[#E9D9BF] p-6 pr-16">
          <SheetTitle className="text-xl sm:text-2xl font-black text-[#70452E]">
            เมนูทั้งหมด
          </SheetTitle>
          <SheetDescription className="text-sm font-medium text-[#927D6D] mt-0.5">
            จัดการการเงินและพันธกิจคริสตจักร
          </SheetDescription>
        </SheetHeader>
        <nav
          aria-label="เมนูทุกหมวด"
          className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          {authorizedNavItems.map(({ path, label, icon: Icon, iconColor }) => {
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
                      ? "border-[#E9D9BF] bg-[#FFF4DF] font-black text-[#70452E] shadow-2xs"
                      : "border-transparent text-[#70452E] hover:bg-[#FFF4DF] font-bold"
                  }`}
                >
                  <Icon
                    className={`size-6 shrink-0 ${iconColor}`}
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
