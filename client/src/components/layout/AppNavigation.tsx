import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileBarChart,
  HandCoins,
  Home,
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
    label: "ถวายทรัพย์",
    path: "/offerings",
    icon: HandCoins,
    iconColor: "text-[#F7B6A6]",
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
    label: "ตั้งค่า",
    path: "/settings",
    icon: Settings2,
    iconColor: "text-[#70452E]",
  },
];

export function isActiveRoute(currentPath: string, path: string) {
  return (
    currentPath === path || (path !== "/" && currentPath.startsWith(`${path}/`))
  );
}

export function AppMenu({ children }: { children?: ReactNode }) {
  const [location] = useLocation();

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children || (
          <button
            type="button"
            className="flex min-h-11 shrink-0 items-center gap-2 rounded-2xl border border-[#E9D9BF] bg-white px-3 text-sm font-bold text-[#70452E] hover:bg-[#FFF4DF]"
          >
            <Menu className="size-5" aria-hidden="true" />
            <span>เมนูทั้งหมด</span>
          </button>
        )}
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[calc(100%-2rem)] max-w-sm gap-0 bg-[#FFF9EE]"
      >
        <SheetHeader className="border-b border-[#E9D9BF] p-5 pr-16">
          <SheetTitle className="text-lg text-[#70452E]">
            เมนูทั้งหมด
          </SheetTitle>
          <SheetDescription>จัดการการเงินและพันธกิจคริสตจักร</SheetDescription>
        </SheetHeader>
        <nav
          aria-label="เมนูทุกหมวด"
          className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          {navItems.map(({ path, label, icon: Icon, iconColor }) => {
            const active = isActiveRoute(location, path);
            return (
              <SheetClose asChild key={path}>
                <Link
                  href={path}
                  aria-current={active ? "page" : undefined}
                  onFocus={e =>
                    e.currentTarget.scrollIntoView({ block: "nearest" })
                  }
                  className={`flex min-h-12 items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${
                    active
                      ? "border-[#E9D9BF] bg-[#FFF4DF] font-bold text-[#70452E]"
                      : "border-transparent text-[#70452E] hover:bg-[#FFF4DF]"
                  }`}
                >
                  <Icon
                    className={`size-5 shrink-0 ${iconColor}`}
                    aria-hidden="true"
                  />
                  {label}
                </Link>
              </SheetClose>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
