import React from "react";
import { Link } from "wouter";
import { confirmDiscardPendingChanges } from "@/hooks/useUnsavedChanges";

type LinkProps = React.ComponentProps<typeof Link>;

/**
 * A wouter `Link` that asks for confirmation before leaving a form with
 * unsaved edits. Cancelling prevents the default, so wouter skips the
 * navigation and any composed handler — such as the menu sheet's close —
 * never runs, leaving the user on the form.
 *
 * Takes no ref: wouter's `Link` props do not accept one, and the only
 * `asChild` consumer (the menu sheet's `SheetClose`) needs the click
 * handler rather than the node.
 */
export function GuardedLink({ onClick, ...props }: LinkProps) {
  return (
    <Link
      {...props}
      onClick={event => {
        if (!confirmDiscardPendingChanges()) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
    />
  );
}
