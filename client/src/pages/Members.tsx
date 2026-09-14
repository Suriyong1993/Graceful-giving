import React, { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  EmptyState,
  FilterBar,
  StatusBadge,
} from "@/components/common/CommonUI";
import {
  Download,
  Mail,
  Phone,
  Plus,
  Search,
  ShieldAlert,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export default function Members() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newMinistry, setNewMinistry] = useState("ฝ่ายนมัสการ");

  const membersList = useMemo(() => {
    return [
      {
        id: 1,
        code: "MEM-001",
        name: "อาจารย์ประสิทธิ์ ศรีสวัสดิ์",
        role: "ศิษยาภิบาลอาวุโส",
        ministry: "ฝ่ายประกาศและมิชชัน",
        phone: "081-999-1122",
        email: "prasit@gracechurch.th",
        baptizedDate: "1998-04-12",
        cellGroup: "กลุ่มแคร์สุขุมวิท",
        status: "active",
      },
      {
        id: 2,
        code: "MEM-002",
        name: "คุณมาลี มีทรัพย์สมบูรณ์",
        role: "เหรัญญิกคริสตจักร",
        ministry: "ฝ่ายบริหารและบุคลากร",
        phone: "089-123-4567",
        email: "malee@gracechurch.th",
        baptizedDate: "2005-10-23",
        cellGroup: "กลุ่มแคร์อารีย์",
        status: "active",
      },
      {
        id: 3,
        code: "MEM-003",
        name: "คุณสมชาย รักสงบ",
        role: "มัคนายกฝ่ายอาคาร",
        ministry: "ฝ่ายอาคารและสถานที่",
        phone: "084-555-6789",
        email: "somchai@gmail.com",
        baptizedDate: "2010-06-15",
        cellGroup: "กลุ่มแคร์บางนา",
        status: "active",
      },
      {
        id: 4,
        code: "MEM-004",
        name: "คุณธนพัฒน์ สุขสวัสดิ์",
        role: "ผู้นำทีมนมัสการ",
        ministry: "ฝ่ายนมัสการและดนตรี",
        phone: "081-234-5678",
        email: "thanapat@hotmail.com",
        baptizedDate: "2015-12-25",
        cellGroup: "กลุ่มแคร์เยาวชน",
        status: "active",
      },
      {
        id: 5,
        code: "MEM-005",
        name: "คุณศิริพร บุญเจริญ",
        role: "ครูใหญ่รวีวารศึกษา",
        ministry: "ฝ่ายรวีวารศึกษาและเด็ก",
        phone: "086-777-8899",
        email: "siriporn@outlook.com",
        baptizedDate: "2012-08-19",
        cellGroup: "กลุ่มแคร์อารีย์",
        status: "active",
      },
      {
        id: 6,
        code: "MEM-006",
        name: "คุณวิทวัส แสงธรรม",
        role: "หัวหน้าทีมมีเดีย",
        ministry: "ฝ่ายสื่อและไอที",
        phone: "087-333-2211",
        email: "wittawat@gmail.com",
        baptizedDate: "2018-03-30",
        cellGroup: "กลุ่มแคร์สุขุมวิท",
        status: "active",
      },
      {
        id: 7,
        code: "MEM-007",
        name: "คุณวรรณา เกียรติคุณ",
        role: "มัคนายกฝ่ายสงเคราะห์",
        ministry: "ฝ่ายสงเคราะห์และชุมชน",
        phone: "083-444-1100",
        email: "wanna@yahoo.com",
        baptizedDate: "2008-11-09",
        cellGroup: "กลุ่มแคร์บางนา",
        status: "active",
      },
      {
        id: 8,
        code: "MEM-008",
        name: "นางสาวศรัณย์พร วงศ์สวรรค์",
        role: "ผู้สนใจเรียนพระคัมภีร์",
        ministry: "กลุ่มผู้เชื่อใหม่",
        phone: "090-111-4455",
        email: "saranporn@gmail.com",
        baptizedDate: "-",
        cellGroup: "กลุ่มแคร์เยาวชน",
        status: "pending",
      },
    ];
  }, []);

  const filteredMembers = useMemo(() => {
    return membersList.filter(m => {
      const matchSearch =
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.phone.includes(searchTerm) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "all" || m.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [membersList, searchTerm, statusFilter]);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error("กรุณาระบุชื่อ-นามสกุล สมาชิก");
      return;
    }
    toast.success("บันทึกข้อมูลสมาชิกใหม่เรียบร้อยแล้ว");
    setShowAddMemberModal(false);
    setNewName("");
    setNewPhone("");
    setNewEmail("");
  };

  const exportCSV = () => {
    const headers =
      "รหัสสมาชิก,ชื่อ-นามสกุล,บทบาท,ฝ่ายงาน,เบอร์โทร,อีเมล,กลุ่มแคร์,สถานะ\n";
    const rows = filteredMembers
      .map(
        m =>
          `"${m.code}","${m.name}","${m.role}","${m.ministry}","${m.phone}","${m.email}","${m.cellGroup}","${m.status}"`
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + headers + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `church-members-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("ส่งออกทะเบียนสมาชิกสำเร็จ");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-[#FFF4DF] border border-[#E9D9BF] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#DCECC5] text-[#70452E]">
              <Users className="w-3.5 h-3.5 text-[#A8C978]" />
              ทะเบียนสมาชิกร่วมพันธกิจ
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-[#38251B]">
              ทำเนียบสมาชิกคริสตจักร (Church Directory)
            </h1>
            <p className="text-sm text-[#70452E]/80 max-w-xl">
              บันทึกและดูแลสมาชิกทุกคนในครอบครัวแห่งความเชื่อ
              พร้อมการปกป้องข้อมูลส่วนบุคคลตามหลักความโปร่งใสและปลอดภัย
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-[#E9D9BF] text-[#70452E] hover:bg-[#FFF9EE] text-sm font-medium shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>ส่งออก CSV</span>
            </button>
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#E99A4A] hover:bg-[#d88939] text-white font-medium text-sm shadow-sm transition-all whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              <span>เพิ่มสมาชิกใหม่</span>
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#E9D9BF] shadow-sm">
            <p className="text-xs text-[#70452E]/70 font-semibold">
              สมาชิกทั้งหมด
            </p>
            <p className="text-2xl font-bold text-[#38251B] mt-1">128 คน</p>
            <p className="text-[11px] text-[#70452E]/60 mt-0.5">
              ในระบบทะเบียน
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-[#E9D9BF] shadow-sm">
            <p className="text-xs text-[#70452E]/70 font-semibold">
              รับบัพติศมาแล้ว
            </p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">112 คน</p>
            <p className="text-[11px] text-emerald-800/60 mt-0.5">
              สมาชิกสมบูรณ์
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-[#E9D9BF] shadow-sm">
            <p className="text-xs text-[#70452E]/70 font-semibold">
              ผู้รับใช้ในฝ่ายงาน
            </p>
            <p className="text-2xl font-bold text-[#E99A4A] mt-1">64 คน</p>
            <p className="text-[11px] text-[#70452E]/60 mt-0.5">
              ครอบคลุม 8 ฝ่าย
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-[#E9D9BF] shadow-sm">
            <p className="text-xs text-[#70452E]/70 font-semibold">
              ผู้เชื่อใหม่ / ผู้สนใจ
            </p>
            <p className="text-2xl font-bold text-sky-700 mt-1">16 คน</p>
            <p className="text-[11px] text-sky-800/60 mt-0.5">
              กำลังเรียนพระคัมภีร์
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <FilterBar
          searchPlaceholder="ค้นหาด้วยชื่อ, เบอร์โทร, อีเมล, รหัสสมาชิก..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
          filters={[
            { label: "ทั้งหมด", id: "all" },
            { label: "สมาชิกประจำ", id: "active" },
            { label: "ผู้สนใจ/รอรับบัพติศมา", id: "pending" },
          ]}
        />

        {/* Table List */}
        {filteredMembers.length === 0 ? (
          <EmptyState
            title="ไม่พบข้อมูลสมาชิก"
            description="ไม่พบรายชื่อสมาชิกที่ตรงกับเงื่อนไขการค้นหา"
            actionText="เพิ่มสมาชิกใหม่"
            onAction={() => setShowAddMemberModal(true)}
          />
        ) : (
          <div className="bg-white rounded-3xl border border-[#E9D9BF] overflow-hidden shadow-sm">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-[#38251B]">
                <thead className="bg-[#FFF9EE] border-b border-[#E9D9BF] text-xs font-semibold text-[#70452E]">
                  <tr>
                    <th className="py-4 px-6">รหัส</th>
                    <th className="py-4 px-6">ชื่อ-นามสกุล</th>
                    <th className="py-4 px-6">ตำแหน่ง / บทบาท</th>
                    <th className="py-4 px-6">ฝ่ายงานที่สังกัด</th>
                    <th className="py-4 px-6">กลุ่มแคร์</th>
                    <th className="py-4 px-6">เบอร์โทรศัพท์</th>
                    <th className="py-4 px-6 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9D9BF]/40">
                  {filteredMembers.map(m => (
                    <tr
                      key={m.id}
                      onClick={() => setLocation(`/members/${m.id}`)}
                      className="hover:bg-[#FFF4DF]/30 cursor-pointer transition-colors"
                    >
                      <td className="py-4 px-6 font-mono text-xs text-[#70452E]/70 whitespace-nowrap">
                        {m.code}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#DCECC5] flex items-center justify-center text-[#70452E] font-bold text-xs">
                            {m.name.slice(0, 1)}
                          </div>
                          <span className="font-semibold text-[#38251B]">
                            {m.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs text-[#70452E]/80 whitespace-nowrap">
                        {m.role}
                      </td>
                      <td className="py-4 px-6 text-xs font-medium text-[#38251B] whitespace-nowrap">
                        {m.ministry}
                      </td>
                      <td className="py-4 px-6 text-xs text-[#70452E]/70 whitespace-nowrap">
                        {m.cellGroup}
                      </td>
                      <td className="py-4 px-6 text-xs text-[#70452E]/80 whitespace-nowrap">
                        {m.phone}
                      </td>
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <StatusBadge
                          status={
                            m.status === "active" ? "completed" : "pending"
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-[#E9D9BF]/40">
              {filteredMembers.map(m => (
                <div
                  key={m.id}
                  onClick={() => setLocation(`/members/${m.id}`)}
                  className="p-4 flex items-center justify-between gap-3 active:bg-[#FFF4DF]/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#DCECC5] flex items-center justify-center text-[#70452E] font-bold text-sm flex-shrink-0">
                      {m.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-[#38251B] truncate">
                        {m.name}
                      </p>
                      <p className="text-xs text-[#70452E]/70">
                        {m.role} • {m.ministry}
                      </p>
                      <p className="text-[11px] text-[#70452E]/60">{m.phone}</p>
                    </div>
                  </div>
                  <StatusBadge
                    status={m.status === "active" ? "completed" : "pending"}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Member Modal */}
        {showAddMemberModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-[#E9D9BF] max-w-md w-full max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-[#E9D9BF] pb-3">
                <h3 className="text-lg font-bold text-[#38251B]">
                  เพิ่มสมาชิกใหม่
                </h3>
                <button
                  onClick={() => setShowAddMemberModal(false)}
                  type="button"
                  aria-label="ปิด"
                  className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-xl text-xl font-bold text-[#70452E]/60 hover:bg-[#FFF4DF] hover:text-[#38251B]"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleAddMember} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-[#38251B]">
                    ชื่อ-นามสกุล <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น คุณมานพ พงษ์ไพบูลย์"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E9D9BF] mt-1"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#38251B]">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="tel"
                    placeholder="08x-xxx-xxxx"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E9D9BF] mt-1"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#38251B]">อีเมล</label>
                  <input
                    type="email"
                    placeholder="member@email.com"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E9D9BF] mt-1"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#38251B]">
                    ฝ่ายงานที่สนใจรับใช้
                  </label>
                  <select
                    value={newMinistry}
                    onChange={e => setNewMinistry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E9D9BF] bg-white font-medium mt-1"
                  >
                    <option>ฝ่ายนมัสการและดนตรี</option>
                    <option>ฝ่ายรวีวารศึกษาและเด็ก</option>
                    <option>ฝ่ายเยาวชน</option>
                    <option>ฝ่ายสื่อและไอที</option>
                    <option>ฝ่ายต้อนรับและปฏิคม</option>
                    <option>ฝ่ายสงเคราะห์</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddMemberModal(false)}
                    className="px-4 py-2 rounded-xl border border-[#E9D9BF] text-xs font-medium text-[#70452E]"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#E99A4A] text-white text-xs font-semibold hover:bg-[#d88939]"
                  >
                    บันทึกข้อมูล
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
