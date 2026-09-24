import { describe, expect, it } from "vitest";
import { getAuthorizedNavItems, navItems } from "./AppNavigation";
import { FEATURES } from "@/lib/features";

describe("navigation shows the budgets entry now that it has a backend", () => {
  it("has a budget entry while FEATURES.budgets is on", () => {
    expect(FEATURES.budgets).toBe(true);
    expect(navItems.map(i => i.path)).toContain("/budgets");
  });

  it("shows the budget entry to roles that can manage budgets", () => {
    for (const churchRole of ["SUPER_ADMIN", "PASTOR", "TREASURER"]) {
      const items = getAuthorizedNavItems({
        role: "user",
        churchRole,
      } as Parameters<typeof getAuthorizedNavItems>[0]);
      expect(items.map(i => i.path)).toContain("/budgets");
    }
  });

  it("hides the budget entry from a plain member", () => {
    const items = getAuthorizedNavItems({
      role: "user",
      churchRole: "MEMBER",
    } as Parameters<typeof getAuthorizedNavItems>[0]);
    expect(items.map(i => i.path)).not.toContain("/budgets");
  });
});
