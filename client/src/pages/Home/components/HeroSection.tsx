import { Sprout } from "lucide-react";
import { Illustration } from "@/components/Illustration";

export function HeroSection() {
  return (
    <section
      aria-label="Grace-giving ส่วนต้อนรับ"
      className="animate-fade-up relative rounded-[32px] sm:rounded-[40px] md:rounded-[48px] overflow-hidden bg-gradient-to-br from-[#FFFDF9] via-background to-[#FFF1DA] border-2 border-[#E9D9BF] shadow-sm p-5 sm:p-8 md:p-10 lg:p-12 w-full"
    >
      {/* Decorative soft depth aura — spacious and gentle */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 sm:w-72 sm:h-72 md:w-96 md:h-96 rounded-full bg-[#A8C978]/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 -left-16 w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-[#D47012]/15 blur-3xl"
      />

      {/* Hero Content Grid — fluid auto-scaling across all devices */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-8 md:gap-10 lg:gap-12 items-center relative z-10 w-full">
        {/* Left Column: Generous typography & whitespace */}
        <div className="min-w-0 md:col-span-7 lg:col-span-7 xl:col-span-7 space-y-3 sm:space-y-5 md:space-y-6 w-full flex flex-col justify-center">
          {/* Brand Title */}
          <h1 className="flex flex-col">
            <span className="flex items-center gap-2 sm:gap-3.5">
              <span className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-[#2C1810] tracking-tight leading-none font-display">
                Grace
              </span>
              <span className="text-[#3D7826] -mt-2 sm:-mt-4">
                <Sprout className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 stroke-[2.5]" />
              </span>
            </span>
            <span className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-[#D47012] tracking-tight leading-none font-display mt-1 sm:mt-2">
              Ledger
            </span>
          </h1>

          {/* Tagline */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-black text-[#4A2E1B] leading-relaxed">
            การเงินเชื่อมใจ เพื่อพันธกิจของพระเจ้า
          </p>

          {/* Bible Pill Badge */}
          <div className="inline-flex flex-wrap items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full sm:rounded-2xl bg-white border-2 border-[#E9D9BF] text-sm sm:text-base leading-relaxed text-[#2C1810] shadow-xs max-w-full">
            <span className="whitespace-nowrap font-black text-[#B85E0E] shrink-0">
              2 โครินธ์ 9:7
            </span>
            <span className="text-foreground font-bold">
              “ผู้ให้ด้วยใจยินดี พระเจ้าทรงรัก”
            </span>
          </div>
        </div>

        {/* Right Column: Fluid responsive illustration auto-filling the column proportionally */}
        <div className="min-w-0 md:col-span-5 lg:col-span-5 xl:col-span-5 flex items-center justify-center md:justify-end w-full">
          <div className="relative w-full max-w-sm sm:max-w-md md:max-w-none md:w-full aspect-[16/9] sm:aspect-[4/3] md:aspect-[4/3] lg:aspect-[16/11] rounded-[28px] sm:rounded-[36px] md:rounded-[42px] overflow-hidden shadow-md border-4 border-white shrink-0 bg-[#FFF4DF]/70 transition-transform duration-500 hover:scale-[1.015]">
            <Illustration
              src="/illustrations/hero_jesus_shepherd.jpg"
              alt="พระเยซูคริสต์และลูกแกะ"
              className="w-full h-full object-cover object-[center_20%]"
              priority
              width={512}
              height={384}
            />
            <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 pointer-events-none">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-sm border border-[#E9D9BF] shadow-xs">
                <span className="text-xs sm:text-sm font-black text-[#4A2E1B]">
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
