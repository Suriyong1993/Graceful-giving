import { describe, expect, it } from "vitest";
import { quickActions, statCards } from "../client/src/pages/Home";

describe("Grace-giving dashboard contract", () => {
  it("keeps the reference dashboard summary set stable for the first visual slice", () => {
    expect(statCards).toHaveLength(3);
    expect(statCards.map((card) => card.label)).toEqual(["รายรับ", "รายจ่าย", "คงเหลือ"]);
    expect(statCards.map((card) => card.value)).toEqual(["฿12,450", "฿7,213", "฿5,237"]);
  });

  it("offers the six reference quick actions", () => {
    expect(quickActions.map((action) => action.label)).toEqual([
      "บันทึกถวาย",
      "บันทึกรายจ่าย",
      "รายงาน",
      "สมาชิก",
      "กิจกรรม",
      "เพิ่มเติม",
    ]);
    expect(quickActions.every((action) => action.icon && action.tone)).toBe(true);
  });
});
