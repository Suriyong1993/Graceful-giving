import { Wordmark } from "@/components/common/Wordmark";

export function HeroSection() {
  return (
    <section
      aria-label="Grace-giving ส่วนต้อนรับ"
      className="animate-fade-up relative rounded-3xl overflow-hidden bg-card border border-line card-elevation-sm p-6 sm:p-8 md:p-10 w-full"
    >
      {/* Hero Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 lg:gap-10 items-center relative z-10 w-full">
        {/* Left Column: Generous typography & clear hierarchy */}
        <div className="min-w-0 md:col-span-12 space-y-4 w-full flex flex-col justify-center">
          {/* Brand Title */}
          <h1>
            <Wordmark size="lg" />
          </h1>

          {/* Tagline */}
          <p className="text-base sm:text-lg md:text-xl font-bold text-ink leading-relaxed">
            การเงินเชื่อมใจ เพื่อพันธกิจของพระเจ้า
          </p>

          {/* Bible Scripture Badge */}
          <div className="inline-flex self-start flex-wrap items-center gap-2 sm:gap-3 px-3.5 py-2 rounded-xl bg-surface border border-line text-xs sm:text-sm text-ink max-w-full">
            <span className="whitespace-nowrap font-bold text-brand-strong shrink-0">
              2 โครินธ์ 9:7
            </span>
            <span className="text-ink-2 font-medium">
              “ผู้ให้ด้วยใจยินดี พระเจ้าทรงรัก”
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
