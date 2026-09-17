import { useEffect, useRef } from "react";

export const UNSAVED_CHANGES_MESSAGE =
  "คุณมีข้อมูลที่ยังไม่ได้บันทึก ต้องการออกจากหน้านี้หรือไม่?";

/**
 * Warns the user before losing unsaved form data.
 *
 * Covers two exit paths while `isDirty` is true:
 * - Closing the tab or refreshing (`beforeunload`).
 * - Pressing the browser Back/Forward button (`popstate`), via a sentinel
 *   history entry that is restored if the user cancels.
 *
 * In-app navigation triggered by a button or link (e.g. a "cancel" action,
 * a sidebar link) is not covered here — guard those calls with
 * `confirmDiscardChanges` before navigating.
 */
export function useUnsavedChanges(
  isDirty: boolean,
  message: string = UNSAVED_CHANGES_MESSAGE
) {
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirtyRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (!isDirty) return;

    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      if (!isDirtyRef.current) return;
      if (window.confirm(message)) {
        window.history.back();
      } else {
        window.history.pushState(null, "", window.location.href);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isDirty, message]);
}

/** Guard for in-app navigation triggered by a button or link. */
export function confirmDiscardChanges(
  isDirty: boolean,
  message: string = UNSAVED_CHANGES_MESSAGE
): boolean {
  return !isDirty || window.confirm(message);
}
