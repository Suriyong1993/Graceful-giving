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
      <div className="bg-white rounded-[28px] p-6 border border-[#E9D9BF] clay-card-shadow text-center space-y-3">
        <div className="w-20 h-20 rounded-full bg-[#FFF4DF] border-2 border-[#E99A4A] mx-auto flex items-center justify-center text-[#70452E] font-bold text-2xl">
          {user?.name ? user.name.slice(0, 1) : "ศ"}
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#70452E]">
            {user?.name || churchProfile?.name || "ผู้รับใช้พระเจ้า"}
          </h2>
          <p className="text-xs text-[#927D6D]">
            {churchProfile?.address || "คริสตจักรพระคุณสมบูรณ์ ประเทศไทย"}
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF5E4] text-[#4F8B33] text-xs font-bold">
          <span>
            {user?.churchRole === "SUPER_ADMIN"
              ? "ผู้ดูแลระบบสูงสุด (SUPER_ADMIN)"
              : user?.churchRole === "TREASURER"
                ? "เหรัญญิกคริสตจักร (TREASURER)"
                : "สมาชิกคริสตจักร (MEMBER)"}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-[28px] p-5 border border-[#E9D9BF] clay-card-shadow space-y-2">
        <h3 className="text-sm font-bold text-[#38251B] mb-2">
          การตั้งค่าและการจัดการ
        </h3>
        <button
          onClick={() => setLocation("/setup")}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#FFF9EE] hover:bg-[#FFF4DF] text-xs font-bold text-[#70452E] transition-all"
        >
          <span className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-[#E99A4A]" />
            <span>ตั้งค่าคริสตจักร 8 ขั้นตอน</span>
          </span>
          <ChevronRight className="w-4 h-4 text-[#927D6D]" />
        </button>
        <button
          onClick={onOpenNews}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#FFF9EE] hover:bg-[#FFF4DF] text-xs font-bold text-[#70452E] transition-all"
        >
          <span className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#A8C978]" />
            <span>ข่าวสารและประกาศคริสตจักร</span>
          </span>
          <ChevronRight className="w-4 h-4 text-[#927D6D]" />
        </button>
      </div>
    </div>
  );
}
