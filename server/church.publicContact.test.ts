import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function anonymous(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("church.publicContact", () => {
  it("is readable without a session", async () => {
    const caller = appRouter.createCaller(anonymous());
    await expect(caller.church.publicContact()).resolves.toBeDefined();
  });

  it("returns only the church name and the privacy contact", async () => {
    const caller = appRouter.createCaller(anonymous());
    const result = await caller.church.publicContact();
    expect(Object.keys(result).sort()).toEqual([
      "churchName",
      "privacyContactEmail",
    ]);
  });

  it("keeps the full profile behind a session", async () => {
    const caller = appRouter.createCaller(anonymous());
    await expect(caller.church.getProfile()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
