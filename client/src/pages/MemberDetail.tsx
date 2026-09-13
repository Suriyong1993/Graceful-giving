import React, { useState } from "react";
import { useLocation, useParams } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/common/CommonUI";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  Heart,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export default function MemberDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const memberId = Number(params.id) || 1;
  const [activeTab, setActiveTab] = useState<"profile" | "ministry" | "care">("profile");

  const memberInfo = {
    1: {
      name: "อาจารย์ประสิทธิ์ ศรีสวัสดิ์",
      code: "MEM-001",
      role: "ศิษยาภิบาลอาวุโส (Senior Pastor)",
      ministry: "ฝ่ายประกาศและมิชชัน",
      phone: "081-999-1122",
      email: "prasit@gracechurch.th",
      address: "123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
      baptizedDate: "12 เมษายน 1998",
      joinedDate: "1 มกราคม 2015",
      cellGroup: "กลุ่มแคร์สุขุมวิท",
      emergencyContact: "คุณพรทิพย์ ศรีสวัสดิ์ (ภรรยา) - 081-999-3344",
      status: "active",
      serviceHistory: [
        { role: "ศิษยาภิบาลอาวุโส", period: "2015 - ปัจจุบัน" },
        { role: "คณะกรรมการที่ปรึกษาพันธกิจ", period: "2018 - ปัจจุบัน" },
      ],
      careNotes: [
        { date: "2026-08-15", note: "ประชุมอธิษฐานวางแผนค่ายคริสตจักรประจำปี บรรยากาศเป็นไปด้วยพระคุณและการทรงนำ" },
        { date: "2026-07-20", note: "เยี่ยมเยียนครอบครัวสมาชิกใหม่ในเขตสุขุมวิท" },
      ],
    },
    2: {
      name: "คุณมาลี มีทรัพย์สมบูรณ์",
      code: "MEM-002",
      role: "เหรัญญิกคริสตจักร (Treasurer)",
      ministry: "ฝ่ายบริหารและบุคลากร",
      phone: "089-123-4567",
      email: "malee@gracechurch.th",
      address: "45/2 ซอยอารีย์สัมพันธ์ แขวงสามเสนใน เขตพญาไท กรุงเทพฯ",
      baptizedDate: "23 ตุลาคม 2005",
      joinedDate: "15 พฤษภาคม 2016",
      cellGroup: "กลุ่มแคร์อารีย์",
      emergencyContact: "คุณวีระ มีทรัพย์สมบูรณ์ (สามี) - 089-555-8888",
      status: "active",
      serviceHistory: [
        { role: "เหรัญญิกคริสตจักร", period: "2020 - ปัจจุบัน" },
        { role: "มัคนายกฝ่ายการเงิน", period: "2017 - 2020" },
      ],
      careNotes: [
        { date: "2026-09-01", note: "ส่งรายงานงบการเงินไตรมาสที่ 2 แก่คณะธรรมกิจเรียบร้อย โปร่งใสและตรวจสอบได้" },
      ],
    },
  }[memberId] || {
    name: "คุณสมาชิก คริสตจักร",
    code: `MEM-00${memberId}`,
    role: "สมาชิกคริสตจักร",
    ministry: "ฝ่ายนมัสการ",
    phone: "081-000-0000",
    email: "member@gracechurch.th",
    address: "กรุงเทพมหานคร",
    baptizedDate: "2020-01-01",
    joinedDate: "2022-01-01",
    cellGroup: "กลุ่มแคร์ทั่วไป",
    emergencyContact: "ผู้ติดต่อฉุกเฉิน",
    status: "active",
    serviceHistory: [{ role: "ผู้รับใช้", period: "2022 - ปัจจุบัน" }],
    careNotes: [{ date: "2026-08-01", note: "บันทึกการดูแลและอภิบาล" }],
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setLocation("/members")}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#70452E] hover:text-[#38251B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับสู่ทำเนียบสมาชิก</span>
          </button>
          <span className="text-xs font-mono text-[#70452E]/70 bg-[#FFF4DF] px-3 py-1 rounded-full border border-[#E9D9BF]">
            {memberInfo.code}
          </span>
        </div>

        {/* Member Profile Banner */}
        <div className="bg-[#FFF4DF] border border-[#E9D9BF] rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="w-24 h-24 rounded-full bg-[#DCECC5] border-4 border-white shadow-md flex items-center justify-center text-3xl font-extrabold text-[#70452E] flex-shrink-0">
              {memberInfo.name.slice(0, 1)}
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-bold text-[#38251B]">
                  {memberInfo.name}
                </h1>
                <StatusBadge status={memberInfo.status === "active" ? "completed" : "pending"} />
              </div>
              <p className="text-sm font-medium text-[#E99A4A]">
                {memberInfo.role}
              </p>
              <p className="text-xs text-[#70452E]/80">
                สังกัด: {memberInfo.ministry} • {memberInfo.cellGroup}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${memberInfo.phone}`}
                className="p-3 rounded-2xl bg-white border border-[#E9D9BF] text-[#70452E] hover:bg-[#FFF9EE] shadow-sm transition-colors"
                title="โทรศัพท์"
              >
                <Phone className="w-4 h-4 text-[#A8C978]" />
              </a>
              <a
                href={`mailto:${memberInfo.email}`}
                className="p-3 rounded-2xl bg-white border border-[#E9D9BF] text-[#70452E] hover:bg-[#FFF9EE] shadow-sm transition-colors"
                title="ส่งอีเมล"
              >
                <Mail className="w-4 h-4 text-[#A9D4ED]" />
              </a>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E9D9BF] pb-1">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-colors ${
              activeTab === "profile"
                ? "bg-[#FFF4DF] text-[#38251B] border border-[#E9D9BF]"
                : "text-[#70452E]/70 hover:text-[#38251B]"
            }`}
          >
            ข้อมูลส่วนตัวและครอบครัว
          </button>
          <button
            onClick={() => setActiveTab("ministry")}
            className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-colors ${
              activeTab === "ministry"
                ? "bg-[#FFF4DF] text-[#38251B] border border-[#E9D9BF]"
                : "text-[#70452E]/70 hover:text-[#38251B]"
            }`}
          >
            ประวัติการรับใช้ ({memberInfo.serviceHistory.length})
          </button>
          <button
            onClick={() => setActiveTab("care")}
            className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-colors ${
              activeTab === "care"
                ? "bg-[#FFF4DF] text-[#38251B] border border-[#E9D9BF]"
                : "text-[#70452E]/70 hover:text-[#38251B]"
            }`}
          >
            บันทึกการอภิบาล ({memberInfo.careNotes.length})
          </button>
        </div>

        {/* Tab 1: Profile */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-3xl border border-[#E9D9BF] p-6 md:p-8 space-y-5 shadow-sm">
            <h3 className="text-base font-bold text-[#38251B] flex items-center gap-2">
              <User className="w-4 h-4 text-[#E99A4A]" />
              ข้อมูลการติดต่อและฝ่ายจิตวิญญาณ
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#FFF9EE] border border-[#E9D9BF]/60 space-y-1">
                <span className="text-[#70452E]/60 font-medium">เบอร์โทรศัพท์</span>
                <p className="font-semibold text-sm text-[#38251B]">{memberInfo.phone}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FFF9EE] border border-[#E9D9BF]/60 space-y-1">
                <span className="text-[#70452E]/60 font-medium">อีเมล</span>
                <p className="font-semibold text-sm text-[#38251B]">{memberInfo.email}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FFF9EE] border border-[#E9D9BF]/60 space-y-1 sm:col-span-2">
                <span className="text-[#70452E]/60 font-medium">ที่อยู่ตามทะเบียน</span>
                <p className="font-semibold text-sm text-[#38251B]">{memberInfo.address}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FFF9EE] border border-[#E9D9BF]/60 space-y-1">
                <span className="text-[#70452E]/60 font-medium">วันรับบัพติศมา</span>
                <p className="font-semibold text-sm text-[#38251B]">{memberInfo.baptizedDate}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FFF9EE] border border-[#E9D9BF]/60 space-y-1">
                <span className="text-[#70452E]/60 font-medium">สมาชิกตั้งแต่ปี</span>
                <p className="font-semibold text-sm text-[#38251B]">{memberInfo.joinedDate}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FFF9EE] border border-[#E9D9BF]/60 space-y-1 sm:col-span-2">
                <span className="text-[#70452E]/60 font-medium">บุคคลติดต่อฉุกเฉิน</span>
                <p className="font-semibold text-sm text-[#38251B]">{memberInfo.emergencyContact}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Ministry Service */}
        {activeTab === "ministry" && (
          <div className="bg-white rounded-3xl border border-[#E9D9BF] p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[#38251B] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#A8C978]" />
              ประวัติการรับใช้ในคริสตจักร
            </h3>

            <div className="space-y-3">
              {memberInfo.serviceHistory.map((srv, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#FFF9EE] border border-[#E9D9BF]/60 flex items-center justify-between"
                >
                  <span className="font-semibold text-sm text-[#38251B]">{srv.role}</span>
                  <span className="text-xs text-[#70452E] font-medium bg-white px-3 py-1 rounded-full border border-[#E9D9BF]">
                    {srv.period}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Care Notes */}
        {activeTab === "care" && (
          <div className="bg-white rounded-3xl border border-[#E9D9BF] p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[#38251B] flex items-center gap-2">
              <Heart className="w-4 h-4 text-[#F7B6A6]" />
              บันทึกการอภิบาลและเยี่ยมเยียน
            </h3>

            <div className="space-y-3">
              {memberInfo.careNotes.map((note, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#FFF9EE] border border-[#E9D9BF]/60 space-y-1"
                >
                  <span className="text-[11px] font-mono text-[#70452E]/60">
                    {note.date}
                  </span>
                  <p className="text-xs text-[#38251B] leading-relaxed">
                    {note.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
