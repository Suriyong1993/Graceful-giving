import { ChevronRight } from "lucide-react";

interface ChurchNewsCardProps {
  onOpenNews: () => void;
}

export function ChurchNewsCard({ onOpenNews }: ChurchNewsCardProps) {
  return (
    <section aria-label="ข่าวสารจากคริสตจักร" className="w-full">
      <div
        onClick={onOpenNews}
        className="cursor-pointer bg-gradient-to-r from-[#FFFFFF] via-[#FAF8F5] to-[#FFF8EA] border-2 border-[#E7DCC8] rounded-2xl sm:rounded-2xl p-5 sm:p-7 flex items-center justify-between gap-4 hover:border-[#C94F16] transition-all shadow-xs"
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") {
            onOpenNews();
          }
        }}
        aria-label="เปิดดูข่าวสารจากคริสตจักร"
      >
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#171311]">
              ข่าวสารจากคริสตจักร
            </h2>
            <p className="text-sm sm:text-base text-[#3F3833] font-bold mt-0.5">
              ติดตามประกาศ กิจกรรม และพันธกิจต่าง ๆ
            </p>
          </div>
        </div>
        <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[#171311] border-2 border-[#E7DCC8] shrink-0 shadow-2xs">
          <ChevronRight className="w-6 h-6" />
        </div>
      </div>
    </section>
  );
}
