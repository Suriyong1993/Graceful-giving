import React from "react";
import { Illustration } from "@/components/Illustration";
import { ArrowLeft, Search } from "lucide-react";
import { formatAmount } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── 1. Loading Skeleton ─────────────────────────────────────────────────────

export const LoadingSkeleton: React.FC<{
  count?: number;
  height?: string;
  className?: string;
}> = ({ count = 3, height = "h-24", className = "" }) => {
  return (
    <div className={`space-y-3.5 w-full ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`w-full ${height} rounded-[24px] bg-[#FFF4DF]/60 animate-pulse border border-[#E9D9BF]/50 p-4 flex items-center gap-4`}
        >
          <div className="w-14 h-14 rounded-2xl bg-[#E9D9BF]/40 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="w-1/3 h-4 rounded-md bg-[#E9D9BF]/40" />
            <div className="w-1/2 h-3 rounded-md bg-[#E9D9BF]/30" />
          </div>
          <div className="w-20 h-6 rounded-md bg-[#E9D9BF]/40" />
        </div>
      ))}
    </div>
  );
};

// ─── 2. Empty State ──────────────────────────────────────────────────────────

export const EmptyState: React.FC<{
  title: string;
  description: string;
  illustrationSrc?: string;
  illustrationAlt?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}> = ({
  title,
  description,
  illustrationSrc = "/illustrations/offering_box.jpg",
  illustrationAlt = "กล่องถวาย",
  actionText,
  onAction,
  className = "",
}) => {
  return (
    <div
      className={`py-12 px-6 rounded-[28px] bg-white border border-[#E9D9BF] clay-card-shadow flex flex-col items-center justify-center text-center space-y-4 ${className}`}
    >
      <div className="w-24 h-24 rounded-[24px] overflow-hidden bg-[#FFF4DF] p-1 border border-[#E9D9BF] shadow-xs shrink-0">
        <Illustration
          src={illustrationSrc}
          alt={illustrationAlt}
          className="w-full h-full object-cover rounded-[20px]"
          width={96}
          height={96}
        />
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-base font-bold text-[#70452E]">{title}</h3>
        <p className="text-sm text-[#674F42] leading-relaxed">{description}</p>
      </div>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="min-h-11 mt-2 px-5 py-2.5 rounded-full bg-[#E99A4A] hover:bg-[#DE8640] text-white text-xs font-bold clay-button-shadow transition-all focus-visible:ring-2 focus-visible:ring-[#E99A4A]"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export const ErrorState: React.FC<{
  title?: string;
  description: string;
  onRetry?: () => void;
  className?: string;
}> = ({
  title = "โหลดข้อมูลไม่สำเร็จ",
  description,
  onRetry,
  className = "",
}) => (
  <div
    className={`py-12 px-6 rounded-[28px] bg-[#FFF8F6] border border-[#F7D5CD] flex flex-col items-center justify-center text-center space-y-4 ${className}`}
    role="alert"
  >
    <div className="w-14 h-14 rounded-full bg-[#FFEBE5] text-[#D45945] flex items-center justify-center text-2xl font-bold">
      !
    </div>
    <div className="space-y-1 max-w-sm">
      <h3 className="text-base font-bold text-[#7C2A1E]">{title}</h3>
      <p className="text-sm text-[#674F42] leading-relaxed">{description}</p>
    </div>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="min-h-11 rounded-full bg-[#D45945] px-5 py-2.5 text-sm font-bold text-white"
      >
        ลองใหม่
      </button>
    )}
  </div>
);

// ─── 3. Status Badge ─────────────────────────────────────────────────────────

export type StatusType =
  | "pending"
  | "approved"
  | "rejected"
  | "completed"
  | "active"
  | "inactive"
  | "voided"
  // Weekly offering counting session
  | "counting"
  | "counted"
  | "verified"
  | "posted"
  | "closed";

export const StatusBadge: React.FC<{
  status: StatusType | string;
  label?: string;
  className?: string;
}> = ({ status, label, className = "" }) => {
  const getStyle = () => {
    switch (status) {
      case "approved":
      case "completed":
      case "active":
        return {
          bg: "bg-[#EAF5E4] text-[#4F8B33] border-[#D2EAC7]",
          defaultLabel: "อนุมัติแล้ว",
        };
      case "rejected":
      case "inactive":
        return {
          bg: "bg-[#FFEBE5] text-[#D45945] border-[#F7D5CD]",
          defaultLabel: "ปฏิเสธ / ยกเลิก",
        };
      case "voided":
        return {
          bg: "bg-stone-100 text-stone-600 border-stone-200",
          defaultLabel: "ยกเลิกรายการ",
        };
      case "counting":
        return {
          bg: "bg-[#FFF3DF] text-[#C26B1E] border-[#F6E1BF]",
          defaultLabel: "กำลังนับ",
        };
      case "counted":
        return {
          bg: "bg-[#E7F1FB] text-[#2F6690] border-[#CBE0F2]",
          defaultLabel: "รอตรวจสอบ",
        };
      case "verified":
        return {
          bg: "bg-[#EAF5E4] text-[#4F8B33] border-[#D2EAC7]",
          defaultLabel: "ตรวจสอบแล้ว",
        };
      case "posted":
        return {
          bg: "bg-[#1b5e3a] text-white border-[#1b5e3a]",
          defaultLabel: "ลงบัญชีแล้ว",
        };
      case "closed":
        return {
          bg: "bg-stone-200 text-stone-700 border-stone-300",
          defaultLabel: "ปิดรอบแล้ว",
        };
      case "pending":
      default:
        return {
          bg: "bg-[#FFF3DF] text-[#C26B1E] border-[#F6E1BF]",
          defaultLabel: "รอดำเนินการ",
        };
    }
  };

  const style = getStyle();

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold border ${style.bg} ${className}`}
    >
      <span
        className="w-1.5 h-1.5 shrink-0 rounded-full bg-current"
        aria-hidden="true"
      />
      <span>{label || style.defaultLabel}</span>
    </span>
  );
};

// ─── 4. Money Display ────────────────────────────────────────────────────────

export const MoneyDisplay: React.FC<{
  amount: number;
  type?: "income" | "expense" | "neutral";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}> = ({ amount, type = "neutral", size = "md", className = "" }) => {
  const isPositive = type === "income" || (type === "neutral" && amount > 0);
  const isNegative = type === "expense" || (type === "neutral" && amount < 0);

  const getColor = () => {
    if (type === "income") return "text-[#1b5e3a]";
    if (type === "expense") return "text-[#c7382d]";
    return "text-[#38251B]";
  };

  // Each size carries its own weight. The base class used to set font-bold
  // as well, so two font-weight utilities landed on the same element and the
  // winner depended on Tailwind's output order rather than on this switch.
  const getSize = () => {
    switch (size) {
      case "sm":
        return "text-sm font-bold";
      case "lg":
        return "text-2xl md:text-3xl font-black";
      case "xl":
        return "text-3xl sm:text-4xl md:text-5xl font-black";
      case "md":
      default:
        return "text-lg md:text-xl font-extrabold";
    }
  };

  const prefix = type === "income" ? "+" : type === "expense" ? "-" : "";
  const formatted = formatAmount(Math.abs(amount));

  // The "฿" is its own element with a small gap. Run together with the
  // digits, the glyph's ink overlaps the first numeral, and separating it
  // also keeps the digits themselves aligned down a table column.
  return (
    <span
      className={`tracking-tight tabular-nums font-sans ${getColor()} ${getSize()} ${className}`}
    >
      {prefix}
      <span className="mr-1">฿</span>
      {formatted}
    </span>
  );
};

// ─── 5. Page Header ──────────────────────────────────────────────────────────

export const PageHeader: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, className = "" }) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-[28px] p-5 md:p-6 border border-[#E9D9BF] clay-card-shadow ${className}`}
    >
      <div className="min-w-0">
        <h1 className="text-xl md:text-2xl font-extrabold text-[#70452E] tracking-tight break-words">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-[#927D6D] mt-1 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="flex max-w-full flex-wrap items-center gap-2 [&_button]:min-h-11">
          {action}
        </div>
      )}
    </div>
  );
};

// ─── 6. Chip ─────────────────────────────────────────────────────────────────

/**
 * The small pill used for filters and for quick-amount presets.
 *
 * Several screens had their own copy of this button, and most of those copies
 * were 26–36px tall — under the 44px the rest of the app uses as its minimum
 * touch target, and awkward to hit on a phone. Defining it once keeps the
 * height, the radius and the selected state the same everywhere.
 */
export const Chip: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    active?: boolean;
    /** Right-hand count, e.g. the number of rows a filter would keep. */
    count?: number;
  }
> = ({ active = false, count, className = "", children, ...props }) => (
  <button
    type="button"
    aria-pressed={active}
    className={`min-h-11 shrink-0 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
      active
        ? "bg-[#FFF4DF] text-[#70452E] border border-[#E99A4A] shadow-2xs"
        : "bg-white text-[#927D6D] border border-[#E9D9BF] hover:bg-[#FFF9EE]"
    } ${className}`}
    {...props}
  >
    {children}
    {count !== undefined && (
      <span className="ml-1.5 text-[10px] opacity-75">({count})</span>
    )}
  </button>
);

// ─── 7. Search and Filter Bar ────────────────────────────────────────────────

export const FilterBar: React.FC<{
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (v: string) => void;
  filters?: { id: string; label: string; count?: number }[];
  activeFilter?: string;
  onFilterChange?: (id: string) => void;
  className?: string;
}> = ({
  searchPlaceholder = "ค้นหา...",
  searchValue,
  onSearchChange,
  filters,
  activeFilter,
  onFilterChange,
  className = "",
}) => {
  return (
    <div className={`min-w-0 space-y-3 ${className}`}>
      {/* Search Input */}
      <div className="relative w-full">
        <Search
          className="pointer-events-none w-4 h-4 text-[#927D6D] absolute left-3.5 top-1/2 -translate-y-1/2"
          aria-hidden="true"
        />
        <input
          type="search"
          aria-label={searchPlaceholder}
          value={searchValue}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="min-h-11 w-full pl-9 pr-4 py-2.5 rounded-2xl bg-[#FFFDF8] border border-[#E9D9BF] text-base md:text-sm text-[#38251B] placeholder-[#927D6D] focus:border-[#E99A4A] focus-visible:ring-2 focus-visible:ring-[#E99A4A]/30"
        />
      </div>

      {/* Filter Tabs / Chips */}
      {filters && filters.length > 0 && onFilterChange && (
        <div
          role="group"
          aria-label="กรองรายการ"
          className="flex items-center gap-2 overflow-x-auto p-1 -m-1 no-scrollbar"
        >
          {filters.map(f => {
            const isActive = activeFilter === f.id;
            return (
              <Chip
                key={f.id}
                active={isActive}
                count={f.count}
                onClick={() => onFilterChange(f.id)}
                onFocus={e =>
                  e.currentTarget.scrollIntoView({
                    block: "nearest",
                    inline: "nearest",
                  })
                }
              >
                {f.label}
              </Chip>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── 8. Back Link ────────────────────────────────────────────────────────────

/**
 * "Back to the list" control, shown at the top of every detail and entry page.
 *
 * Ten pages each wrote their own, in six different styles — three shapes, two
 * type sizes, and four of them below the 44px minimum touch target. Because
 * this is the control a user reaches for after deciding not to save, it has
 * to look and behave the same wherever it appears.
 */
export const BackLink: React.FC<{
  label: string;
  onClick: () => void;
  /** "plain" drops the pill for pages that sit it beside a status tag. */
  variant?: "pill" | "plain";
  className?: string;
}> = ({ label, onClick, variant = "pill", className = "" }) => (
  <button
    type="button"
    onClick={onClick}
    className={`min-h-11 inline-flex items-center gap-1.5 text-xs font-bold transition-all ${
      variant === "pill"
        ? "rounded-2xl border border-[#E9D9BF] bg-[#FFF4DF] px-3.5 py-2 text-[#70452E] hover:bg-[#FBE9CD]"
        : "text-sm font-medium text-[#70452E] hover:text-[#38251B]"
    } ${className}`}
  >
    <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
    <span>{label}</span>
  </button>
);

// ─── 9. Confirm Dialog ───────────────────────────────────────────────────────

export const ConfirmDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
  onConfirm: () => void;
  isLoading?: boolean;
}> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  variant = "primary",
  onConfirm,
  isLoading = false,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-[#FFFDF8] border-[#E9D9BF] rounded-[30px] p-6 text-[#38251B]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#70452E]">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#674F42] leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 pt-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl bg-[#FFF4DF] text-[#70452E] font-bold text-xs border border-[#E9D9BF]"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs clay-button-shadow transition-all ${
              variant === "danger"
                ? "bg-[#D45945] hover:bg-[#C24D3A]"
                : "bg-[#E99A4A] hover:bg-[#DE8640]"
            }`}
          >
            {isLoading ? "กำลังดำเนินการ..." : confirmText}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
