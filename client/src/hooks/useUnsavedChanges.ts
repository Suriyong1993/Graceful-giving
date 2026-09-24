import { useCallback, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Swal } from "@/lib/sweetalert";

export const UNSAVED_CHANGES_MESSAGE =
  "คุณมีข้อมูลที่ยังไม่ได้บันทึก ต้องการออกจากหน้านี้หรือไม่?";

/**
 * Forms currently holding unsaved edits. Shared navigation (the sidebar,
 * the mobile bar, the menu sheet) reads this to guard a route change
 * without needing to know which form is mounted.
 */
const dirtyForms = new Set<object>();

export function hasUnsavedChanges(): boolean {
  return dirtyForms.size > 0;
}

export function clearUnsavedChanges(): void {
  dirtyForms.clear();
}

/** Guard for navigation away from whatever form is currently mounted. */
export async function confirmDiscardPendingChanges(
  message: string = UNSAVED_CHANGES_MESSAGE
): Promise<boolean> {
  if (!hasUnsavedChanges()) return true;
  return await Swal.confirm("มีข้อมูลที่ยังไม่ได้บันทึก", message, {
    confirmButtonText: "ออกจากหน้านี้",
    cancelButtonText: "กรอกข้อมูลต่อ",
    icon: "warning",
  });
}

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
  const token = useRef({}).current;

  useEffect(() => {
    if (!isDirty) return;
    dirtyForms.add(token);
    return () => {
      dirtyForms.delete(token);
    };
  }, [isDirty, token]);

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

    const handlePopState = async () => {
      if (!isDirtyRef.current) return;
      const isConfirmed = await Swal.confirm(
        "มีข้อมูลที่ยังไม่ได้บันทึก",
        message,
        {
          confirmButtonText: "ออกจากหน้านี้",
          cancelButtonText: "กรอกข้อมูลต่อ",
          icon: "warning",
        }
      );
      if (isConfirmed) {
        clearUnsavedChanges();
        isDirtyRef.current = false;
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
export async function confirmDiscardChanges(
  isDirty: boolean,
  message: string = UNSAVED_CHANGES_MESSAGE
): Promise<boolean> {
  if (!isDirty) return true;
  return await Swal.confirm("มีข้อมูลที่ยังไม่ได้บันทึก", message, {
    confirmButtonText: "ออกจากหน้านี้",
    cancelButtonText: "กรอกข้อมูลต่อ",
    icon: "warning",
  });
}

/**
 * `setLocation` that first confirms discarding any unsaved form edits.
 * Use it for navigation buttons in shared chrome, where the caller does
 * not know which form is mounted.
 */
export function useGuardedNavigate() {
  const [, setLocation] = useLocation();
  return useCallback(
    async (path: string) => {
      const allowed = await confirmDiscardPendingChanges();
      if (allowed) {
        clearUnsavedChanges();
        setLocation(path);
      }
    },
    [setLocation]
  );
}
