/**
 * The client's useAuth hook synthesises a placeholder user while auth.me is
 * unresolved, so that a freshly signed-up member is not stuck on a blocked
 * screen. Every role gate in the client reads that user: the navigation
 * filter, the route guards and the dashboard shortcuts. If the placeholder
 * claims a privileged role, a plain member is handed screens the client is
 * supposed to keep from them — and permanently so when auth.me fails, because
 * the query does not retry.
 *
 * The server still enforces the real permissions on every mutation, but the
 * financial and directory reads behind those screens are protectedProcedure
 * (signed in is enough), so the client gate is what actually keeps a member
 * out of them. This reads the source because the failure mode is a developer
 * typing a role into the fallback.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(
  join(import.meta.dirname, "..", "client/src/_core/hooks/useAuth.ts"),
  "utf8"
);

/** The block that builds the placeholder user, without the real query data. */
const fallbackBlock = source.slice(
  source.indexOf("const fallbackUser"),
  source.indexOf("const user =")
);

describe("useAuth falls back to least privilege", () => {
  it("builds a placeholder user at all", () => {
    expect(fallbackBlock).not.toHaveLength(0);
    expect(fallbackBlock).toContain("churchRole:");
    expect(fallbackBlock).toContain("role:");
  });

  it("never grants the admin flag to the placeholder", () => {
    expect(fallbackBlock).not.toContain('role: "admin"');
  });

  for (const privileged of [
    "SUPER_ADMIN",
    "PASTOR",
    "TREASURER",
    "DEACON",
    "COUNTER",
  ]) {
    it(`never grants ${privileged} to the placeholder`, () => {
      expect(fallbackBlock).not.toContain(privileged);
    });
  }

  it("uses the least privileged church role", () => {
    expect(fallbackBlock).toContain('churchRole: "MEMBER"');
  });

  it("keeps the guards waiting until the real role is known", () => {
    // Without this the guards run against the placeholder and flip once
    // auth.me answers, briefly showing the wrong navigation.
    expect(source).toContain("meQuery.isLoading");
  });
});
