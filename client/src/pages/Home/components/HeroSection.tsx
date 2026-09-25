import { Sprout } from "lucide-react";
import { Illustration } from "@/components/Illustration";

export function HeroSection() {
  return (
    <section
      aria-label="Grace-giving ส่วนต้อนรับ"
      className="animate-fade-up relative rounded-2xl overflow-hidden brand-navy-gradient text-white w-full shadow-[0_24px_60px_-28px_rgba(12,27,51,0.65)]"
    >
      {/* Ambient brand glow — decorative only */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full bg-[#F59E0B]/20 blur-3xl"
      />

      {/* Hero Content Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 lg:gap-10 items-center p-6 sm:p-8 md:p-10 w-full">
        {/* Left Column: Generous typography & clear hierarchy */}
        <div className="min-w-0 md:col-span-7 space-y-4 w-full flex flex-col justify-center">
          {/* Brand Title */}
          <h1 className="flex flex-col">
            <span className="flex items-center gap-2 sm:gap-3">
              <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-none font-display">
                Grace
              </span>
              <span className="text-[#FBBF24]">
                <Sprout className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 stroke-[2.5]" />
              </span>
            </span>
            <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#FBBF24] tracking-tight leading-none font-display mt-1">
              Ledger
            </span>
          </h1>

          {/* Tagline */}
          <p className="text-base sm:text-lg md:text-xl font-bold text-white/85 leading-relaxed">
            การเงินเชื่อมใจ เพื่อพันธกิจของพระเจ้า
          </p>

          {/* Bible Scripture Badge */}
          <div className="inline-flex flex-wrap items-center gap-2 sm:gap-3 px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-xs sm:text-sm text-white max-w-full">
            <span className="whitespace-nowrap font-bold text-[#FBBF24] shrink-0">
              2 โครินธ์ 9:7
            </span>
            <span className="text-white/75 font-medium">
              “ผู้ให้ด้วยใจยินดี พระเจ้าทรงรัก”
            </span>
          </div>
        </div>

        {/* Right Column: Clean illustration card */}
        <div className="min-w-0 md:col-span-5 flex items-center justify-center md:justify-end w-full">
          <div className="relative w-full max-w-sm sm:max-w-md md:max-w-none aspect-[16/10] rounded-2xl overflow-hidden border border-white/20 bg-white/5 shadow-inner">
            <Illustration
              src="/illustrations/hero_jesus_shepherd.jpg"
              alt="พระเยซูคริสต์และลูกแกะ"
              className="w-full h-full object-cover object-[center_20%]"
              priority
              width={512}
              height={384}
            />
            <div className="absolute bottom-3 left-3 pointer-events-none">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0C1B33]/85 backdrop-blur-xs border border-white/15">
                <span className="text-xs font-bold text-white">
                  พระเยซูผู้เลี้ยงที่ดี ♥
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
