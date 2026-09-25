import { Sprout } from "lucide-react";

export function HeroSection() {
  return (
    <section
      aria-label="Grace-giving ส่วนต้อนรับ"
      className="animate-fade-up relative rounded-2xl overflow-hidden bg-white border border-[#E7DCC8] card-elevation-sm p-6 sm:p-8 md:p-10 w-full"
    >
      {/* Hero Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 lg:gap-10 items-center relative z-10 w-full">
        {/* Left Column: Generous typography & clear hierarchy */}
        <div className="min-w-0 md:col-span-12 space-y-4 w-full flex flex-col justify-center">
          {/* Brand Title */}
          <h1 className="flex flex-col">
            <span className="flex items-center gap-2 sm:gap-3">
              <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#171311] tracking-tight leading-none font-display">
                Grace
              </span>
              <span className="text-[#1F5C33]">
                <Sprout className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 stroke-[2.5]" />
              </span>
            </span>
            <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#C94F16] tracking-tight leading-none font-display mt-1">
              Ledger
            </span>
          </h1>

          {/* Tagline */}
          <p className="text-base sm:text-lg md:text-xl font-bold text-[#3F3833] leading-relaxed">
            การเงินเชื่อมใจ เพื่อพันธกิจของพระเจ้า
          </p>

          {/* Bible Scripture Badge */}
          <div className="inline-flex self-start flex-wrap items-center gap-2 sm:gap-3 px-3.5 py-2 rounded-xl bg-[#FFFFFF] border border-[#E7DCC8] text-xs sm:text-sm text-[#171311] max-w-full">
            <span className="whitespace-nowrap font-bold text-[#9F3B0F] shrink-0">
              2 โครินธ์ 9:7
            </span>
            <span className="text-stone-700 font-medium">
              “ผู้ให้ด้วยใจยินดี พระเจ้าทรงรัก”
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
