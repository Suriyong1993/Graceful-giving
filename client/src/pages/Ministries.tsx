import React, { useState } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Illustration } from "@/components/Illustration";
import {
  ArrowRight,
  Building,
  Calendar,
  Cross,
  GraduationCap,
  HeartHandshake,
  Laptop,
  Music,
  Plus,
  Sparkles,
  Users,
  Smile,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

export default function Ministries() {
  const [, setLocation] = useLocation();
  const [showNewModal, setShowNewModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newLeader, setNewLeader] = useState("");

  const ministriesList = [
    {
      id: 1,
      name: "ฝ่ายนมัสการและดนตรี",
      enName: "Worship & Creative Arts",
      icon: Music,
      leader: "คุณธนพัฒน์ (ผู้นำทีมนมัสการ)",
      membersCount: 14,
      schedule: "ซ้อมทุกวันพฤหัสบดี 19:00 น. และรับใช้ทุกวันอาทิตย์",
      description: "นำการนมัสการที่เปี่ยมด้วยพระวิญญาณและความจริง ดูแลนักร้อง นักดนตรี และทีมสรรเสริญ",
      budget: 120000,
      spent: 78500,
      activeProjects: 2,
    },
    {
      id: 2,
      name: "ฝ่ายรวีวารศึกษาและพันธกิจเด็ก",
      enName: "Children & Sunday School",
      icon: GraduationCap,
      leader: "คุณศิริพร (ครูใหญ่รวี)",
      membersCount: 8,
      schedule: "ทุกวันอาทิตย์ 10:00 - 12:00 น. (ชั้น 2 อาคารเรียน)",
      description: "ปลูกฝังพระวจนะของพระเจ้าในจิตใจของเด็กตั้งแต่วัยอนุบาลจนถึงประถม",
      budget: 90000,
      spent: 54200,
      activeProjects: 3,
    },
    {
      id: 3,
      name: "ฝ่ายเยาวชนและคนรุ่นใหม่",
      enName: "Grace Youth Ministry",
      icon: Users,
      leader: "อ.ทวีเกียรติ (ผู้ช่วยศิษยาภิบาล)",
      membersCount: 22,
      schedule: "ทุกวันเสาร์ 17:00 - 19:30 น. (ห้อง Youth Lounge)",
      description: "เสริมสร้างพลังชีวิตเยาวชน มัธยมและมหาวิทยาลัย ให้เติบโตอย่างมั่นคงในพระคริสต์",
      budget: 150000,
      spent: 128000,
      activeProjects: 4,
    },
    {
      id: 4,
      name: "ฝ่ายประกาศและมิชชัน",
      enName: "Outreach & Evangelism",
      icon: Cross,
      leader: "อ.ประสิทธิ์ (ศิษยาภิบาล)",
      membersCount: 10,
      schedule: "ลงพื้นที่ชุมชนทุกวันเสาร์ที่สองของเดือน",
      description: "นำข่าวประเสริฐแห่งความรอดสู่ชุมชนรอบคริสตจักร และสนับสนุนงานมิชชันต่างจังหวัด",
      budget: 350000,
      spent: 245000,
      activeProjects: 2,
    },
    {
      id: 5,
      name: "ฝ่ายสงเคราะห์และดูแลศิษยาภิบาล",
      enName: "Pastoral Care & Benevolence",
      icon: HeartHandshake,
      leader: "คุณวรรณา (มัคนายกฝ่ายสงเคราะห์)",
      membersCount: 6,
      schedule: "เยี่ยมเยียนผู้ป่วยทุกวันอังคารและพฤหัสบดี",
      description: "เคียงข้างผู้ทุกข์ใจ อธิษฐานเผื่อผู้ป่วย และจัดสรรถุงยังชีพสงเคราะห์ผู้ยากไร้",
      budget: 100000,
      spent: 62000,
      activeProjects: 1,
    },
    {
      id: 6,
      name: "ฝ่ายสื่อมัลติมีเดียและเทคโนโลยี",
      enName: "Media & Sound Engineering",
      icon: Laptop,
      leader: "คุณวิทวัส (หัวหน้าทีมมีเดีย)",
      membersCount: 9,
      schedule: "ถ่ายทอดสดทุกรอบนมัสการ และควบคุมระบบภาพเสียง",
      description: "ผลิตสื่อออนไลน์ สตรีมมิ่งสด และดูแลระบบเสียงระบบไฟในห้องนมัสการ",
      budget: 160000,
      spent: 105000,
      activeProjects: 3,
    },
    {
      id: 7,
      name: "ฝ่ายกลุ่มแคร์และสร้างสาวก",
      enName: "Cell Groups & Discipleship",
      icon: ShieldCheck,
      leader: "คุณสมชาย (ผู้นำกลุ่มแคร์)",
      membersCount: 35,
      schedule: "กระจายตามบ้าน 6 กลุ่ม ทุกคืนวันพุธและศุกร์",
      description: "ผูกพันชีวิต เรียนพระคัมภีร์ร่วมกัน อธิษฐานเผื่อกัน และดูแลสมาชิกอย่างใกล้ชิด",
      budget: 60000,
      spent: 34000,
      activeProjects: 6,
    },
    {
      id: 8,
      name: "ฝ่ายปฏิคมและต้อนรับ",
      enName: "Hospitality & Welcome",
      icon: Smile,
      leader: "คุณมาลินี (หัวหน้าฝ่ายปฏิคม)",
      membersCount: 12,
      schedule: "ต้อนรับที่ประตูทางเข้าทุกวันอาทิตย์ 09:00 - 10:30 น.",
      description: "สร้างความประทับใจแรกแก่ผู้มาร่วมใหม่ จัดเตรียมอาหารว่างและบรรยากาศอบอุ่น",
      budget: 50000,
      spent: 29000,
      activeProjects: 1,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-[#FFF4DF] border border-[#E9D9BF] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#DCECC5] text-[#70452E]">
              <Users className="w-3.5 h-3.5 text-[#A8C978]" />
              ฝ่ายงานและทีมรับใช้คริสตจักร
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-[#38251B]">
              พันธกิจและฝ่ายงาน (Ministries)
            </h1>
            <p className="text-sm text-[#70452E]/80 max-w-xl">
              เชื่อมประสานอวัยวะทุกส่วนในพระกายของพระคริสต์
              ด้วยของประทานและหน้าที่รับใช้ที่สอดคล้องตามพระประสงค์
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNewModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#E99A4A] hover:bg-[#d88939] text-white font-medium text-sm shadow-sm transition-all whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มฝ่ายงานใหม่</span>
            </button>
          </div>
        </div>

        {/* Ministries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ministriesList.map((m) => {
            const Icon = m.icon;
            const percent = Math.round((m.spent / m.budget) * 100);

            return (
              <div
                key={m.id}
                onClick={() => setLocation(`/ministries/${m.id}`)}
                className="bg-white rounded-3xl border border-[#E9D9BF] p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-[#FFF4DF] flex items-center justify-center text-[#E99A4A] group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs bg-[#FFF9EE] border border-[#E9D9BF] px-2.5 py-1 rounded-full text-[#70452E] font-medium">
                      ทีมงาน {m.membersCount} คน
                    </span>
                  </div>

                  {/* Titles */}
                  <div>
                    <h3 className="font-bold text-[#38251B] text-base group-hover:text-[#E99A4A] transition-colors">
                      {m.name}
                    </h3>
                    <p className="text-xs text-[#70452E]/60 font-medium">
                      {m.enName}
                    </p>
                  </div>

                  <p className="text-xs text-[#70452E]/80 line-clamp-2 leading-relaxed">
                    {m.description}
                  </p>

                  <div className="p-3 rounded-2xl bg-[#FFF9EE] border border-[#E9D9BF]/50 text-xs text-[#70452E] space-y-1">
                    <p>
                      <span className="font-semibold text-[#38251B]">หัวหน้าฝ่าย:</span> {m.leader}
                    </p>
                    <p className="text-[11px] text-[#70452E]/70 line-clamp-1">
                      <span className="font-semibold text-[#38251B]">รอบรับใช้:</span> {m.schedule}
                    </p>
                  </div>

                  {/* Budget preview */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-xs text-[#70452E]/70">
                      <span>เบิกจ่ายงบ</span>
                      <span className="font-semibold text-[#38251B]">
                        ฿{m.spent.toLocaleString()} / ฿{m.budget.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#FFF4DF] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#A8C978] rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-4 mt-3 border-t border-[#E9D9BF]/40 flex items-center justify-between text-xs font-semibold text-[#70452E] group-hover:text-[#E99A4A]">
                  <span>เปิดดูหน้าฝ่ายงานและสมาชิก</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

        {/* New Ministry Modal */}
        {showNewModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-[#E9D9BF] max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-[#E9D9BF] pb-3">
                <h3 className="text-lg font-bold text-[#38251B]">
                  เพิ่มฝ่ายงานใหม่
                </h3>
                <button
                  onClick={() => setShowNewModal(false)}
                  className="text-[#70452E]/60 hover:text-[#38251B] text-xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-[#38251B]">ชื่อฝ่ายงาน</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ฝ่ายอนุชนและมัธยม"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E9D9BF] mt-1"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#38251B]">หัวหน้าฝ่ายงาน</label>
                  <input
                    type="text"
                    placeholder="ชื่อ-นามสกุล ผู้รับผิดชอบ"
                    value={newLeader}
                    onChange={(e) => setNewLeader(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E9D9BF] mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E9D9BF] text-xs font-medium text-[#70452E]"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => {
                    toast.success("บันทึกฝ่ายงานใหม่เรียบร้อย");
                    setShowNewModal(false);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#E99A4A] text-white text-xs font-semibold hover:bg-[#d88939]"
                >
                  เพิ่มฝ่ายงาน
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
