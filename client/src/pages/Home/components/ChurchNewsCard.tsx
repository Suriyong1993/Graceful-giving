import { ChevronRight } from "lucide-react";

interface ChurchNewsCardProps {
  onOpenNews: () => void;
}

export function ChurchNewsCard({ onOpenNews }: ChurchNewsCardProps) {
  return (
    <section aria-label="ข่าวสารจากคริสตจักร" className="w-full">
      <div
        onClick={onOpenNews}
        className="cursor-pointer bg-secondary border-2 border-line rounded-xl sm:rounded-xl p-5 sm:p-7 flex items-center justify-between gap-4 hover:border-brand transition-all shadow-xs"
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
            <h2 className="text-xl sm:text-2xl font-bold text-ink">
              ข่าวสารจากคริสตจักร
            </h2>
            <p className="text-sm sm:text-base text-ink font-bold mt-0.5">
              ติดตามประกาศ กิจกรรม และพันธกิจต่าง ๆ
            </p>
          </div>
        </div>
        <div className="w-11 h-11 rounded-full bg-card flex items-center justify-center text-ink border-2 border-line shrink-0 shadow-2xs">
          <ChevronRight className="w-6 h-6" />
        </div>
      </div>
    </section>
  );
}
