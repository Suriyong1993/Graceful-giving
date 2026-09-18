import { describe, expect, it } from "vitest";
import { quickActions } from "../client/src/pages/Home";

describe("Grace-giving dashboard contract", () => {
  it("offers the six reference quick actions", () => {
    expect(quickActions.map(action => action.label)).toEqual([
      "บันทึกถวาย",
      "บันทึกรายจ่าย",
      "รายงาน",
      "สมาชิก",
      "กิจกรรม",
      "เพิ่มเติม",
    ]);
    expect(quickActions.every(action => action.icon && action.tone)).toBe(true);
  });
});
