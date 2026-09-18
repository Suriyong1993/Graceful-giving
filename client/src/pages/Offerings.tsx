import React, { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  EmptyState,
  FilterBar,
  LoadingSkeleton,
  MoneyDisplay,
} from "@/components/common/CommonUI";
import { Illustration } from "@/components/Illustration";
import { Download, HandCoins, Heart, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { offeringCategoryLabel } from "@shared/categories";

export default function Offerings() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const {
    data: offeringsData,
    isLoading,
    isError,
    refetch,
  } = trpc.offerings.list.useQuery({ limit: 50 }, { retry: false });

  const offerings = useMemo(() => {
    return (offeringsData ?? []).map(o => ({
      id: o.id,
      category: o.category,
      title: offeringCategoryLabel(o.category),
      amount: Number(o.amount),
      date: o.receiptDate,
      method: o.method || "เงินสด",
      fund: "บัญชีทั่วไป",
    }));
  }, [offeringsData]);

  const filtered = useMemo(() => {
    return offerings.filter(o => {
      const matchSearch = o.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchCat =
        categoryFilter === "all" || o.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [offerings, searchTerm, categoryFilter]);

  const totalAmount = useMemo(
    () => filtered.reduce((sum, o) => sum + o.amount, 0),
    [filtered]
  );

  return (
    <AppLayout
      activeRoute="/offerings"
      title="ถวายทรัพย์"
      subtitle="บันทึกและตรวจสอบรายการเงินถวายทุกประเภทของคริสตจักร"
      action={
        <button
          onClick={() => setLocation("/offerings/new")}
          className="px-4 py-2 rounded-2xl bg-[#E99A4A] hover:bg-[#DE8640] text-white text-xs font-bold clay-button-shadow transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>บันทึกถวายใหม่</span>
        </button>
      }
    >
      {/* 1. Header Banner with 3D Offering Box Illustration */}
      <div className="bg-gradient-to-r from-[#FFFDF8] via-[#FFF8EC] to-[#FFF1DE] rounded-[32px] p-5 sm:p-7 border border-[#E9D9BF] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-[#E9D9BF] text-xs font-bold text-[#70452E]">
            <Sparkles className="w-3.5 h-3.5 text-[#E99A4A]" />
            <span>ยอดถวายรวมเดือนนี้</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#1b5e3a]">
            <MoneyDisplay amount={totalAmount} type="income" size="xl" />
          </h2>
          <p className="text-xs text-[#927D6D]">
            "ผู้ให้ด้วยใจยินดี พระเจ้าทรงรัก" — 2 โครินธ์ 9:7
          </p>
        </div>

        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[24px] overflow-hidden bg-white p-1.5 border border-[#E9D9BF] shadow-xs shrink-0">
          <Illustration
            src="/illustrations/offering_box.jpg"
            alt="กล่องถวาย"
            className="w-full h-full object-cover rounded-[20px]"
            width={112}
            height={112}
          />
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white rounded-[28px] p-4 md:p-5 border border-[#E9D9BF] clay-card-shadow">
        <FilterBar
          searchPlaceholder="ค้นหาประเภทถวายหรือกองทุน..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          filters={[
            { id: "all", label: "ทั้งหมด", count: offerings.length },
            {
              id: "tithe",
              label: "สิบลด",
              count: offerings.filter(o => o.category === "tithe").length,
            },
            {
              id: "general",
              label: "ถวายทั่วไป",
              count: offerings.filter(o => o.category === "general").length,
            },
            {
              id: "mission",
              label: "พันธกิจ",
              count: offerings.filter(o => o.category === "mission").length,
            },
            {
              id: "building",
              label: "สร้างอาคาร",
              count: offerings.filter(o => o.category === "building").length,
            },
          ]}
          activeFilter={categoryFilter}
          onFilterChange={setCategoryFilter}
        />
      </div>

      {/* 3. Offerings List */}
      {isLoading ? (
        <LoadingSkeleton count={3} />
      ) : isError ? (
        <EmptyState
          title="โหลดรายการถวายไม่สำเร็จ"
          description="เกิดข้อผิดพลาดในการเชื่อมต่อข้อมูลจริง กรุณาลองใหม่อีกครั้ง"
          actionText="ลองใหม่"
          onAction={() => refetch()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="ยังไม่มีรายการถวาย"
          description="เริ่มบันทึกการถวายรายการแรกของคริสตจักรของคุณ เพื่อความโปร่งใสและเป็นระเบียบ"
          actionText="บันทึกการถวายรายการแรก"
          onAction={() => setLocation("/offerings/new")}
        />
      ) : (
        <div className="bg-white rounded-[28px] border border-[#E9D9BF] clay-card-shadow divide-y divide-[#F0E6D8]/60 overflow-hidden">
          {filtered.map(o => (
            <div
              key={o.id}
              onClick={() => setLocation(`/transactions/offering-${o.id}`)}
              className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-[#FFF9EE]/70 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-[#EAF5E4] text-[#4F8B33] flex items-center justify-center shrink-0 shadow-2xs">
                  <HandCoins className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-[#38251B] truncate">
                    {o.title}
                  </h3>
                  <p className="text-[11px] text-[#927D6D] pt-0.5">
                    {new Intl.DateTimeFormat("th-TH", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(o.date))}{" "}
                    · {o.method} · {o.fund}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <MoneyDisplay amount={o.amount} type="income" size="md" />
                <span className="block text-[10px] text-[#A8C978] font-bold">
                  บันทึกเรียบร้อย
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
