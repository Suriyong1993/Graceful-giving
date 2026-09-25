import { BookOpen, ChevronRight, Settings2 } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

interface HomeProfileTabProps {
  onOpenNews: () => void;
}

export function HomeProfileTab({ onOpenNews }: HomeProfileTabProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: churchProfile } = trpc.church.getProfile.useQuery(undefined, {
    retry: false,
  });

  return (
    <div
      role="tabpanel"
      aria-label="โปรไฟล์และการตั้งค่า"
      className="space-y-4"
    >
      <div className="bg-white rounded-2xl p-6 border border-[#DDE5F0] clay-card-shadow text-center space-y-3">
        <div className="w-20 h-20 rounded-full bg-[#EEF2F8] border-2 border-[#D97706] mx-auto flex items-center justify-center text-[#1E4470] font-bold text-2xl">
          {user?.name ? user.name.slice(0, 1) : "ศ"}
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#1E4470]">
            {user?.name || churchProfile?.name || "ผู้รับใช้พระเจ้า"}
          </h2>
          <p className="text-xs text-[#64748B]">
            {churchProfile?.address || "คริสตจักรพระคุณสมบูรณ์ ประเทศไทย"}
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F6EE] text-[#047857] text-xs font-bold">
          <span>
            {user?.churchRole === "SUPER_ADMIN"
              ? "ผู้ดูแลระบบสูงสุด (SUPER_ADMIN)"
              : user?.churchRole === "TREASURER"
                ? "เหรัญญิกคริสตจักร (TREASURER)"
                : "สมาชิกคริสตจักร (MEMBER)"}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-[#DDE5F0] clay-card-shadow space-y-2">
        <h3 className="text-sm font-bold text-[#0C1B33] mb-2">
          การตั้งค่าและการจัดการ
        </h3>
        <button
          onClick={() => setLocation("/setup")}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#F6F8FC] hover:bg-[#EEF2F8] text-xs font-bold text-[#1E4470] transition-all"
        >
          <span className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-[#D97706]" />
            <span>ตั้งค่าคริสตจักร 8 ขั้นตอน</span>
          </span>
          <ChevronRight className="w-4 h-4 text-[#64748B]" />
        </button>
        <button
          onClick={onOpenNews}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#F6F8FC] hover:bg-[#EEF2F8] text-xs font-bold text-[#1E4470] transition-all"
        >
          <span className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#34D399]" />
            <span>ข่าวสารและประกาศคริสตจักร</span>
          </span>
          <ChevronRight className="w-4 h-4 text-[#64748B]" />
        </button>
      </div>
    </div>
  );
}
