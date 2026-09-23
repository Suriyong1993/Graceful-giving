import { describe, expect, it } from "vitest";
import { getAuthorizedNavItems, navItems } from "./AppNavigation";
import { FEATURES } from "@/lib/features";

describe("navigation hides features without a backend", () => {
  it("has no budget entry while FEATURES.budgets is off", () => {
    expect(FEATURES.budgets).toBe(false);
    expect(navItems.map(i => i.path)).not.toContain("/budgets");
  });

  it("shows no budget entry even to roles that could open it", () => {
    for (const churchRole of ["SUPER_ADMIN", "PASTOR", "TREASURER"]) {
      const items = getAuthorizedNavItems({
        role: "user",
        churchRole,
      } as Parameters<typeof getAuthorizedNavItems>[0]);
      expect(items.map(i => i.path)).not.toContain("/budgets");
    }
  });
});
