import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type User = NonNullable<TrpcContext["user"]>;

function createContext(user: User | null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

const member: User = {
  id: 2,
  openId: "member",
  email: "member@example.com",
  name: "Member",
  loginMethod: "manus",
  role: "user",
  churchRole: "MEMBER",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const admin: User = {
  ...member,
  id: 1,
  openId: "admin",
  role: "admin",
  churchRole: "SUPER_ADMIN",
};

describe("security regressions", () => {
  it("blocks regular members from mutating member records", async () => {
    const caller = appRouter.createCaller(createContext(member));
    await expect(
      caller.members.create({ name: "Example Member" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      caller.members.update({ id: 1, name: "Changed" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.members.deactivate({ id: 1 })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("rejects an event whose end precedes its start", async () => {
    const caller = appRouter.createCaller(createContext(admin));
    await expect(
      caller.updates.createEvent({
        title: "กิจกรรมทดสอบ",
        summary: "กิจกรรมสำหรับทดสอบเวลา",
        description: "รายละเอียดกิจกรรมทดสอบ",
        startsAt: new Date("2026-09-18T10:00:00Z"),
        endsAt: new Date("2026-09-18T09:00:00Z"),
        status: "draft",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects reversed financial report ranges", async () => {
    const caller = appRouter.createCaller(createContext(admin));
    await expect(
      caller.reports.financial({
        fromDate: new Date("2026-09-20T00:00:00Z"),
        toDate: new Date("2026-09-19T00:00:00Z"),
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
