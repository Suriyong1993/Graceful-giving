import { describe, expect, it } from "vitest";
import { groupRoleHolders } from "./roleHolders";

describe("groupRoleHolders", () => {
  it("returns empty lists when nobody holds a role", () => {
    const result = groupRoleHolders([]);
    expect(result.holders.PASTOR).toEqual([]);
    expect(result.holders.TREASURER).toEqual([]);
    expect(result.memberCount).toBe(0);
  });

  it("lists a user under every role in churchRoles", () => {
    const result = groupRoleHolders([
      { name: "ทัศนา", churchRole: "PASTOR", churchRoles: "PASTOR,TREASURER" },
    ]);
    expect(result.holders.PASTOR).toEqual(["ทัศนา"]);
    expect(result.holders.TREASURER).toEqual(["ทัศนา"]);
  });

  it("uses churchRole when churchRoles is empty", () => {
    const result = groupRoleHolders([
      { name: "สมชาย", churchRole: "COUNTER", churchRoles: null },
    ]);
    expect(result.holders.COUNTER).toEqual(["สมชาย"]);
  });

  it("counts members instead of naming them", () => {
    const result = groupRoleHolders([
      { name: "ก", churchRole: "MEMBER", churchRoles: null },
      { name: "ข", churchRole: null, churchRoles: null },
    ]);
    expect(result.memberCount).toBe(2);
    expect(JSON.stringify(result.holders)).not.toContain("ก");
  });

  it("leaves out holders without a name", () => {
    const result = groupRoleHolders([
      { name: "  ", churchRole: "TREASURER", churchRoles: null },
    ]);
    expect(result.holders.TREASURER).toEqual([]);
  });

  it("ignores unknown role ids", () => {
    const result = groupRoleHolders([
      { name: "x", churchRole: "OWNER", churchRoles: null },
    ]);
    expect(Object.keys(result.holders)).not.toContain("OWNER");
  });
});
