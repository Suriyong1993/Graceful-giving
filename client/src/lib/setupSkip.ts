// "Skipped church setup" flag shared by the SetupGate (App.tsx) and the
// ChurchSetup wizard. Stored in sessionStorage: per-tab, and forgotten when
// the tab closes — so skipping never permanently hides the setup reminder.
export const SETUP_SKIP_KEY = "grace-giving-skip-setup";

export function hasSkippedSetup(): boolean {
  try {
    return sessionStorage.getItem(SETUP_SKIP_KEY) === "1";
  } catch {
    return false;
  }
}

export function markSetupSkipped(): void {
  try {
    sessionStorage.setItem(SETUP_SKIP_KEY, "1");
  } catch {
    // Storage unavailable (private mode, etc.) — the gate simply won't remember the skip.
  }
}

export function clearSetupSkip(): void {
  try {
    sessionStorage.removeItem(SETUP_SKIP_KEY);
  } catch {
    // Nothing to clear.
  }
}
