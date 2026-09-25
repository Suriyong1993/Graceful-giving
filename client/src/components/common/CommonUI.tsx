import React from "react";
import { Illustration } from "@/components/Illustration";
import { ArrowLeft, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── 0. Back Link ────────────────────────────────────────────────────────────

/** Text link back to a parent list. Detail pages use it instead of a second
 *  page-level header, so the hierarchy stays "list > detail" on every route. */
export const BackLink: React.FC<{
  label: string;
  onClick: () => void;
  className?: string;
}> = ({ label, onClick, className = "" }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-2 min-h-11 rounded-xl text-sm font-bold text-[#1E4470] hover:text-[#12325C] hover:bg-[#EEF2F8] px-2 -ml-2 transition-colors focus-visible:ring-2 focus-visible:ring-[#D97706] ${className}`}
  >
    <ArrowLeft className="size-4" aria-hidden="true" />
    <span>{label}</span>
  </button>
);

// ─── 1. Loading Skeleton ─────────────────────────────────────────────────────

export const LoadingSkeleton: React.FC<{
  count?: number;
  height?: string;
  className?: string;
}> = ({ count = 3, height = "h-24", className = "" }) => {
  return (
    <div
      className={`space-y-3.5 w-full ${className}`}
      role="status"
      aria-live="polite"
      aria-label="กำลังโหลดข้อมูล"
    >
      <span className="sr-only">กำลังโหลดข้อมูล</span>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`w-full ${height} rounded-2xl bg-[#EEF2F8]/60 animate-pulse border border-[#DDE5F0]/50 p-4 flex items-center gap-4`}
        >
          <div className="w-14 h-14 rounded-2xl bg-[#DDE5F0]/40 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="w-1/3 h-4 rounded-md bg-[#DDE5F0]/40" />
            <div className="w-1/2 h-3 rounded-md bg-[#DDE5F0]/30" />
          </div>
          <div className="w-20 h-6 rounded-md bg-[#DDE5F0]/40" />
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
      className={`py-12 px-6 rounded-2xl bg-white border border-[#DDE5F0] clay-card-shadow flex flex-col items-center justify-center text-center space-y-4 ${className}`}
    >
      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-[#EEF2F8] p-1 border border-[#DDE5F0] shadow-xs shrink-0">
        <Illustration
          src={illustrationSrc}
          alt={illustrationAlt}
          className="w-full h-full object-cover rounded-xl"
          width={96}
          height={96}
        />
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-base font-bold text-[#1E4470]">{title}</h3>
        <p className="text-sm text-[#475569] leading-relaxed">{description}</p>
      </div>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 px-5 py-2.5 rounded-full bg-[#12325C] hover:bg-[#0F2947] text-white text-xs font-bold clay-button-shadow transition-all focus-visible:ring-2 focus-visible:ring-[#D97706]"
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
    className={`py-12 px-6 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex flex-col items-center justify-center text-center space-y-4 ${className}`}
    role="alert"
  >
    <div className="w-14 h-14 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center text-2xl font-bold">
      !
    </div>
    <div className="space-y-1 max-w-sm">
      <h3 className="text-base font-bold text-[#7F1D1D]">{title}</h3>
      <p className="text-sm text-[#475569] leading-relaxed">{description}</p>
    </div>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="min-h-11 rounded-full bg-[#DC2626] px-5 py-2.5 text-sm font-bold text-white"
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
          bg: "bg-[#E6F6EE] text-[#047857] border-[#B9E6D0]",
          defaultLabel: "อนุมัติแล้ว",
        };
      case "rejected":
      case "inactive":
        return {
          bg: "bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]",
          defaultLabel: "ปฏิเสธ / ยกเลิก",
        };
      case "voided":
        return {
          bg: "bg-slate-100 text-slate-600 border-slate-200",
          defaultLabel: "ยกเลิกรายการ",
        };
      case "counting":
        return {
          bg: "bg-[#FEF3C7] text-[#B45309] border-[#FCD9A0]",
          defaultLabel: "กำลังนับ",
        };
      case "counted":
        return {
          bg: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
          defaultLabel: "รอตรวจสอบ",
        };
      case "verified":
        return {
          bg: "bg-[#E6F6EE] text-[#047857] border-[#B9E6D0]",
          defaultLabel: "ตรวจสอบแล้ว",
        };
      case "posted":
        return {
          bg: "bg-[#065F46] text-white border-[#065F46]",
          defaultLabel: "ลงบัญชีแล้ว",
        };
      case "closed":
        return {
          bg: "bg-slate-200 text-slate-700 border-slate-300",
          defaultLabel: "ปิดรอบแล้ว",
        };
      case "pending":
      default:
        return {
          bg: "bg-[#FEF3C7] text-[#B45309] border-[#FCD9A0]",
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
    if (type === "income") return "text-[#065F46]";
    if (type === "expense") return "text-[#B91C1C]";
    return "text-[#0C1B33]";
  };

  const getSize = () => {
    switch (size) {
      case "sm":
        return "text-sm";
      case "lg":
        return "text-2xl md:text-3xl font-bold";
      case "xl":
        return "text-3xl sm:text-4xl md:text-5xl font-bold";
      case "md":
      default:
        return "text-lg md:text-xl font-bold";
    }
  };

  const prefix = type === "income" ? "+" : type === "expense" ? "-" : "";
  const formatted = Math.abs(amount).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <span
      className={`tracking-tight tabular-nums font-sans font-bold ${getColor()} ${getSize()} ${className}`}
    >
      {prefix}฿{formatted}
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
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-5 md:p-6 border border-[#DDE5F0] clay-card-shadow ${className}`}
    >
      <div className="min-w-0">
        <h1 className="text-xl md:text-2xl font-bold text-[#1E4470] tracking-tight break-words">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
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

// ─── 6. Search and Filter Bar ────────────────────────────────────────────────

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
          className="pointer-events-none w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2"
          aria-hidden="true"
        />
        <input
          type="search"
          aria-label={searchPlaceholder}
          value={searchValue}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="min-h-11 w-full pl-9 pr-4 py-2.5 rounded-2xl bg-[#FFFFFF] border border-[#DDE5F0] text-base md:text-sm text-[#0C1B33] placeholder-[#64748B] focus:border-[#D97706] focus-visible:ring-2 focus-visible:ring-[#D97706]/30"
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
              <button
                key={f.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => onFilterChange(f.id)}
                onFocus={e =>
                  e.currentTarget.scrollIntoView({
                    block: "nearest",
                    inline: "nearest",
                  })
                }
                className={`min-h-11 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? "bg-[#EEF2F8] text-[#1E4470] border border-[#D97706] shadow-2xs"
                    : "bg-white text-[#64748B] border border-[#DDE5F0] hover:bg-[#F6F8FC]"
                }`}
              >
                {f.label}
                {f.count !== undefined && (
                  <span className="ml-1.5 text-[10px] opacity-75">
                    ({f.count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── 7. Confirm Dialog ───────────────────────────────────────────────────────

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
      <DialogContent className="max-w-sm bg-[#FFFFFF] border-[#DDE5F0] rounded-3xl p-6 text-[#0C1B33]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#1E4470]">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#475569] leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 pt-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl bg-[#EEF2F8] text-[#1E4470] font-bold text-xs border border-[#DDE5F0]"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs clay-button-shadow transition-all ${
              variant === "danger"
                ? "bg-[#DC2626] hover:bg-[#C24D3A]"
                : "bg-[#12325C] hover:bg-[#0F2947]"
            }`}
          >
            {isLoading ? "กำลังดำเนินการ..." : confirmText}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
