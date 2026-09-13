import React, { useState } from "react";
import { useLocation, useParams } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { MoneyDisplay } from "@/components/common/CommonUI";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  Music,
  Phone,
  Plus,
  UserCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export default function MinistryDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const ministryId = Number(params.id) || 1;
  const [activeTab, setActiveTab] = useState<"members" | "events" | "budget">("members");

  const ministryInfo = {
    1: {
      name: "ฝ่ายนมัสการและดนตรี (Worship Ministry)",
      leader: "คุณธนพัฒน์ (ผู้นำนมัสการ)",
      description: "รับใช้ในการนำที่ประชุมเข้าสู่การทรงสถิตของพระเจ้าผ่านบทเพลงสรรเสริญและการนมัสการอย่างสุดจิตสุดใจ",
      schedule: "ซ้อมวันพฤหัสบดี 19:00 น. และเตรียมความพร้อมวันอาทิตย์ 08:30 น.",
      location: "ห้องนมัสการหลัก ชั้น 1",
      budget: 120000,
      spent: 78500,
      members: [
        { id: 1, name: "ธนพัฒน์ สุขสวัสดิ์", role: "ผู้นำทีมนมัสการ / กีตาร์โปร่ง", phone: "081-234-5678", email: "thanapat@church.org" },
        { id: 2, name: "วรรณภา เลิศฤทธิ์", role: "นักร้องนำ (Vocal Lead)", phone: "089-876-5432", email: "wannapa@church.org" },
        { id: 3, name: "กิตติศักดิ์ พรหมมา", role: "มือกลอง (Drummer)", phone: "086-555-1234", email: "kittisak@church.org" },
        { id: 4, name: "สุรเชษฐ์ เจริญผล", role: "คีย์บอร์ด / เปียโน", phone: "084-222-9876", email: "surachet@church.org" },
        { id: 5, name: "กมลวรรณ ชื่นชม", role: "นักร้องคอรัส (Backing Vocal)", phone: "082-333-4455", email: "kamol@church.org" },
      ],
      events: [
        { title: "นมัสการวันอาทิตย์รอบเช้า", date: "วันอาทิตย์ที่ 20 ก.ย. 2026", time: "09:30 - 12:00 น." },
        { title: "ค่ำคืนสรรเสริญและอธิษฐาน (Praise Night)", date: "วันศุกร์ที่ 25 ก.ย. 2026", time: "19:00 - 21:00 น." },
      ],
    },
  }[ministryId] || {
    name: "ฝ่ายงานคริสตจักร",
    leader: "หัวหน้าฝ่ายงาน",
    description: "ฝ่ายงานรับใช้ในพระกายของพระคริสต์",
    schedule: "ตามตารางที่นัดหมาย",
    location: "ห้องประชุมคริสตจักร",
    budget: 90000,
    spent: 45000,
    members: [
      { id: 1, name: "ผู้รับใช้ในทีม", role: "สมาชิกฝ่าย", phone: "081-000-0000", email: "member@church.org" },
    ],
    events: [
      { title: "ประชุมฝ่ายประจำเดือน", date: "วันอาทิตย์สุดท้ายของเดือน", time: "13:00 น." },
    ],
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setLocation("/ministries")}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#70452E] hover:text-[#38251B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้ารวมฝ่ายงาน</span>
          </button>
          <span className="text-xs text-[#70452E]/70 bg-[#FFF4DF] px-3 py-1 rounded-full border border-[#E9D9BF] font-semibold">
            สมาชิก {ministryInfo.members.length} คน
          </span>
        </div>

        {/* Header Card */}
        <div className="bg-[#FFF4DF] border border-[#E9D9BF] rounded-3xl p-6 md:p-8 space-y-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#70452E]/70 uppercase tracking-wider">
                รายละเอียดฝ่ายพันธกิจ
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-[#38251B]">
                {ministryInfo.name}
              </h1>
              <p className="text-xs text-[#70452E]/80 max-w-xl leading-relaxed">
                {ministryInfo.description}
              </p>
            </div>

            <button
              onClick={() => toast.success("เปิดแบบฟอร์มเพิ่มสมาชิกทีมรับใช้")}
              className="px-5 py-2.5 rounded-2xl bg-[#E99A4A] hover:bg-[#d88939] text-white text-sm font-medium shadow-sm transition-colors flex items-center gap-2 self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มสมาชิกในทีม</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#E9D9BF]/60 text-xs text-[#70452E]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#E99A4A]" />
              <span>{ministryInfo.schedule}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#E99A4A]" />
              <span>{ministryInfo.location}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E9D9BF] pb-1">
          <button
            onClick={() => setActiveTab("members")}
            className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-colors ${
              activeTab === "members"
                ? "bg-[#FFF4DF] text-[#38251B] border border-[#E9D9BF]"
                : "text-[#70452E]/70 hover:text-[#38251B]"
            }`}
          >
            สมาชิกในทีม ({ministryInfo.members.length})
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-colors ${
              activeTab === "events"
                ? "bg-[#FFF4DF] text-[#38251B] border border-[#E9D9BF]"
                : "text-[#70452E]/70 hover:text-[#38251B]"
            }`}
          >
            กิจกรรมและตารางรับใช้ ({ministryInfo.events.length})
          </button>
        </div>

        {/* Tab 1: Members */}
        {activeTab === "members" && (
          <div className="bg-white rounded-3xl border border-[#E9D9BF] overflow-hidden shadow-sm">
            <div className="p-5 border-b border-[#E9D9BF]">
              <h3 className="text-base font-bold text-[#38251B] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#E99A4A]" />
                รายชื่อผู้รับใช้ในฝ่าย
              </h3>
            </div>

            <div className="divide-y divide-[#E9D9BF]/40">
              {ministryInfo.members.map((member) => (
                <div
                  key={member.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FFF4DF]/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#DCECC5] flex items-center justify-center text-[#70452E] font-bold text-sm">
                      {member.name.slice(0, 1)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[#38251B]">{member.name}</p>
                      <p className="text-xs text-[#70452E]/70">{member.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-[#70452E]/80">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#E99A4A]" />
                      <span>{member.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#E99A4A]" />
                      <span>{member.email}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Events */}
        {activeTab === "events" && (
          <div className="bg-white rounded-3xl border border-[#E9D9BF] p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[#38251B] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#E99A4A]" />
              ตารางกิจกรรมและการปฏิบัติงาน
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ministryInfo.events.map((evt, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#FFF9EE] border border-[#E9D9BF] space-y-2"
                >
                  <p className="font-bold text-sm text-[#38251B]">{evt.title}</p>
                  <p className="text-xs text-[#70452E]">{evt.date}</p>
                  <p className="text-xs text-[#70452E]/70 font-mono">{evt.time}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
