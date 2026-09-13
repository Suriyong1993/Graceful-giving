import React, { useState } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  CheckCircle2,
  Clock,
  DollarSign,
  Heart,
  MessageSquare,
  Sparkles,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

export default function Notifications() {
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<"all" | "finance" | "approvals" | "news">("all");

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "approvals",
      icon: Clock,
      iconBg: "bg-amber-100 text-amber-800",
      title: "มีคำขอเบิกจ่ายใหม่รอการอนุมัติ",
      desc: "คุณธนพัฒน์ ขอเบิกงบจัดซื้อไมโครโฟนไร้สาย จำนวน ฿14,200",
      time: "10 นาทีที่แล้ว",
      read: false,
      link: "/approvals",
    },
    {
      id: 2,
      type: "finance",
      icon: Wallet,
      iconBg: "bg-emerald-100 text-emerald-800",
      title: "บันทึกเงินถวายสิบลดสำเร็จ",
      desc: "บันทึกเงินถวายสิบลดรอบเช้าวันอาทิตย์ จำนวน ฿28,500 เข้าบัญชีทั่วไป",
      time: "2 ชั่วโมงที่แล้ว",
      read: false,
      link: "/offerings",
    },
    {
      id: 3,
      type: "finance",
      icon: AlertTriangle,
      iconBg: "bg-rose-100 text-rose-800",
      title: "เตือน: งบประมาณฝ่ายอาคารใกล้ถึงขีดจำกัด",
      desc: "ฝ่ายอาคารและสถานที่เบิกจ่ายไปแล้ว 92% ของงบประมาณประจำปี 2026",
      time: "เมื่อวานนี้",
      read: true,
      link: "/budgets/6",
    },
    {
      id: 4,
      type: "news",
      icon: Sparkles,
      iconBg: "bg-sky-100 text-sky-800",
      title: "ประกาศ: เตรียมพร้อมค่ายคริสตจักรประจำปี",
      desc: "เปิดรับสมัครสมาชิกร่วมค่ายครอบครัว ระหว่างวันที่ 23-25 ต.ค. นี้",
      time: "3 วันที่แล้ว",
      read: true,
      link: "/updates",
    },
  ]);

  const filteredList = notifications.filter((n) => {
    if (filter === "all") return true;
    return n.type === filter;
  });

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("ทำเครื่องหมายว่าอ่านแล้วทั้งหมด");
  };

  const markSingleRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Banner */}
        <div className="bg-[#FFF4DF] border border-[#E9D9BF] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#DCECC5] text-[#70452E]">
              <Bell className="w-3.5 h-3.5 text-[#A8C978]" />
              การแจ้งเตือนและการติดต่อสื่อสาร
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-[#38251B]">
              ศูนย์การแจ้งเตือน (Notifications)
            </h1>
            <p className="text-sm text-[#70452E]/80 max-w-xl">
              ติดตามสถานะการเงิน คำขอเบิกจ่าย การอนุมัติ และข่าวสารสำคัญ
              เพื่อให้คุณไม่พลาดทุกพันธกิจในคริสตจักร
            </p>
          </div>

          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-[#E9D9BF] text-[#70452E] hover:bg-[#FFF9EE] text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
          >
            <CheckCheck className="w-4 h-4 text-[#A8C978]" />
            <span>อ่านแล้วทั้งหมด</span>
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all ${
              filter === "all"
                ? "bg-[#E99A4A] text-white shadow-sm"
                : "bg-white border border-[#E9D9BF] text-[#70452E] hover:bg-[#FFF4DF]/50"
            }`}
          >
            ทั้งหมด ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("approvals")}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all ${
              filter === "approvals"
                ? "bg-[#E99A4A] text-white shadow-sm"
                : "bg-white border border-[#E9D9BF] text-[#70452E] hover:bg-[#FFF4DF]/50"
            }`}
          >
            การอนุมัติ
          </button>
          <button
            onClick={() => setFilter("finance")}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all ${
              filter === "finance"
                ? "bg-[#E99A4A] text-white shadow-sm"
                : "bg-white border border-[#E9D9BF] text-[#70452E] hover:bg-[#FFF4DF]/50"
            }`}
          >
            การเงินและบัญชี
          </button>
          <button
            onClick={() => setFilter("news")}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all ${
              filter === "news"
                ? "bg-[#E99A4A] text-white shadow-sm"
                : "bg-white border border-[#E9D9BF] text-[#70452E] hover:bg-[#FFF4DF]/50"
            }`}
          >
            ข่าวสารคริสตจักร
          </button>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-3xl border border-[#E9D9BF] overflow-hidden shadow-sm divide-y divide-[#E9D9BF]/40">
          {filteredList.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => {
                  markSingleRead(item.id);
                  if (item.link) setLocation(item.link);
                }}
                className={`p-4 sm:p-5 flex items-start gap-4 cursor-pointer transition-colors ${
                  !item.read ? "bg-[#FFF9EE]/80 hover:bg-[#FFF4DF]/40" : "hover:bg-stone-50/80"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5 ${item.iconBg}`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-sm ${
                        !item.read ? "font-bold text-[#38251B]" : "font-medium text-[#70452E]"
                      }`}
                    >
                      {item.title}
                    </p>
                    <span className="text-[11px] text-[#70452E]/60 whitespace-nowrap">
                      {item.time}
                    </span>
                  </div>
                  <p className="text-xs text-[#70452E]/80 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                {!item.read && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#E99A4A] flex-shrink-0 mt-2" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
