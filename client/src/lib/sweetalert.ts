// SweetAlert2 & Bootstrap styled Alert Utility for Graceful Giving
export interface SwalOptions {
  title?: string;
  text?: string;
  html?: string;
  icon?: "success" | "error" | "warning" | "info" | "question";
  showCancelButton?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: string;
  cancelButtonColor?: string;
  timer?: number;
}

export interface SwalResult {
  isConfirmed: boolean;
  isDismissed: boolean;
}

export const Swal = {
  fire(options: SwalOptions): Promise<SwalResult> {
    return new Promise(resolve => {
      if (typeof document === "undefined") {
        return resolve({ isConfirmed: true, isDismissed: false });
      }

      // Existing modal cleanup
      const existing = document.getElementById("grace-sweetalert-container");
      if (existing) existing.remove();

      const container = document.createElement("div");
      container.id = "grace-sweetalert-container";
      container.className =
        "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity duration-200";

      const iconSvgs: Record<string, string> = {
        success: `
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 border-2 border-emerald-300 text-emerald-600 animate-bounce">
            <svg class="h-9 w-9 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        `,
        error: `
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 border-2 border-rose-300 text-rose-600">
            <svg class="h-9 w-9 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        `,
        warning: `
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 border-2 border-amber-300 text-amber-600">
            <svg class="h-9 w-9 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        `,
        info: `
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 border-2 border-sky-300 text-sky-600">
            <svg class="h-9 w-9 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        `,
        question: `
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 border-2 border-purple-300 text-purple-600">
            <svg class="h-9 w-9 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        `,
      };

      const iconHtml = options.icon ? iconSvgs[options.icon] || "" : "";
      const confirmText = options.confirmButtonText || "ตกลง";
      const cancelText = options.cancelButtonText || "ยกเลิก";

      container.innerHTML = `
        <div class="relative w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-6 sm:p-8 text-center shadow-2xl border-2 border-[#E9D9BF] transition-all scale-100">
          ${iconHtml}
          ${
            options.title
              ? `<h3 class="mt-4 text-xl sm:text-2xl font-black text-[#2C1810] tracking-tight">${options.title}</h3>`
              : ""
          }
          ${
            options.text
              ? `<p class="mt-2 text-sm sm:text-base text-[#70452E]/85 font-medium leading-relaxed">${options.text}</p>`
              : ""
          }
          ${options.html ? `<div class="mt-2 text-sm text-[#70452E]/90">${options.html}</div>` : ""}

          <div class="mt-6 flex flex-col-reverse sm:flex-row items-center justify-center gap-3">
            ${
              options.showCancelButton
                ? `<button id="swal-cancel-btn" type="button" class="w-full sm:w-auto min-h-11 px-5 py-2.5 rounded-2xl border-2 border-[#E9D9BF] bg-[#FFF4DF] hover:bg-[#FBE9CD] text-[#70452E] font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#E99A4A]/50">
                    ${cancelText}
                  </button>`
                : ""
            }
            <button id="swal-confirm-btn" type="button" class="w-full sm:w-auto min-h-11 px-7 py-2.5 rounded-2xl bg-[#D47012] hover:bg-[#BA5E0B] text-white font-bold text-sm shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-[#D47012]/50 active:scale-95">
              ${confirmText}
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(container);

      const close = (confirmed: boolean) => {
        container.classList.add("opacity-0");
        setTimeout(() => {
          container.remove();
          resolve({ isConfirmed: confirmed, isDismissed: !confirmed });
        }, 150);
      };

      const confirmBtn = container.querySelector("#swal-confirm-btn");
      confirmBtn?.addEventListener("click", () => close(true));

      const cancelBtn = container.querySelector("#swal-cancel-btn");
      cancelBtn?.addEventListener("click", () => close(false));

      // Handle Escape key
      const keyHandler = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          window.removeEventListener("keydown", keyHandler);
          close(false);
        }
      };
      window.addEventListener("keydown", keyHandler);

      // Auto timer if provided
      if (options.timer && options.timer > 0) {
        setTimeout(() => close(true), options.timer);
      }
    });
  },

  success(title: string, text?: string) {
    return this.fire({ icon: "success", title, text });
  },

  error(title: string, text?: string) {
    return this.fire({ icon: "error", title, text });
  },

  warning(title: string, text?: string) {
    return this.fire({ icon: "warning", title, text });
  },

  confirm(
    title: string,
    text?: string,
    confirmBtnOrOptions?: string | Partial<SwalOptions>,
    cancelBtn?: string
  ) {
    if (typeof confirmBtnOrOptions === "object" && confirmBtnOrOptions !== null) {
      return this.fire({
        icon: "question",
        title,
        text,
        showCancelButton: true,
        confirmButtonText: "ยืนยัน",
        cancelButtonText: "ยกเลิก",
        ...confirmBtnOrOptions,
      });
    }
    return this.fire({
      icon: "question",
      title,
      text,
      showCancelButton: true,
      confirmButtonText: confirmBtnOrOptions || "ยืนยัน",
      cancelButtonText: cancelBtn || "ยกเลิก",
    });
  },
};
