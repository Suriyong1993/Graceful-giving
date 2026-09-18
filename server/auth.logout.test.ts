import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): {
  ctx: TrpcContext;
  clearedCookies: CookieCall[];
} {
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({
      maxAge: -1,
      secure: true,
      sameSite: "none",
      httpOnly: true,
      path: "/",
    });
  });
});

describe("session cookie attributes", () => {
  /**
   * SameSite=None is only valid together with Secure. Emitting it on a plain
   * http origin makes browsers discard the cookie, which silently broke sign-out.
   */
  it("uses Lax on an insecure origin", () => {
    const options = getSessionCookieOptions({
      protocol: "http",
      headers: {},
    } as unknown as Parameters<typeof getSessionCookieOptions>[0]);
    expect(options.secure).toBe(false);
    expect(options.sameSite).toBe("lax");
  });

  it("uses None with Secure on https", () => {
    const options = getSessionCookieOptions({
      protocol: "https",
      headers: {},
    } as unknown as Parameters<typeof getSessionCookieOptions>[0]);
    expect(options.secure).toBe(true);
    expect(options.sameSite).toBe("none");
  });

  it("honours x-forwarded-proto from a proxy", () => {
    const options = getSessionCookieOptions({
      protocol: "http",
      headers: { "x-forwarded-proto": "https" },
    } as unknown as Parameters<typeof getSessionCookieOptions>[0]);
    expect(options.secure).toBe(true);
    expect(options.sameSite).toBe("none");
  });

  it("never pairs SameSite=None with an insecure cookie", () => {
    for (const protocol of ["http", "https"]) {
      const options = getSessionCookieOptions({
        protocol,
        headers: {},
      } as unknown as Parameters<typeof getSessionCookieOptions>[0]);
      if (options.sameSite === "none") expect(options.secure).toBe(true);
    }
  });
});
