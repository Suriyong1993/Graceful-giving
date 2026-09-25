import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Terms, contactSection } from "./Legal";

describe("contactSection", () => {
  it("names the controller and the address once the church fills them in", () => {
    const section = contactSection({
      churchName: "คริสตจักรพระคุณ",
      privacyContactEmail: "data@grace.example",
    });
    expect(section.heading).toBe("6. ผู้ควบคุมข้อมูลและช่องทางติดต่อ");
    expect(section.body[0]).toContain("คริสตจักรพระคุณ");
    expect(section.body[1]).toContain("data@grace.example");
  });

  it("says which value is missing instead of naming a person", () => {
    expect(contactSection(undefined).body[0]).toContain("ยังไม่ได้ตั้งชื่อ");
    expect(
      contactSection({ churchName: null, privacyContactEmail: null }).body[1]
    ).toContain("ยังไม่ได้ตั้งอีเมล");
  });

  it("still names a controller when only the church name is set", () => {
    const section = contactSection({
      churchName: "คริสตจักรพระคุณ",
      privacyContactEmail: null,
    });
    expect(section.body[0]).toContain("คริสตจักรพระคุณ");
    expect(section.body[1]).toContain("ผู้ดูแลระบบของคริสตจักร");
  });
});

describe("Terms", () => {
  it("renders the headings a member is asked to accept", () => {
    render(<Terms />);
    expect(screen.getByText("ข้อกำหนดการใช้งาน")).toBeInTheDocument();
    for (const heading of [
      "1. ขอบเขตของบริการ",
      "3. ความถูกต้องของข้อมูล",
      "5. การเปลี่ยนแปลงข้อกำหนด",
    ]) {
      expect(screen.getByText(heading)).toBeInTheDocument();
    }
  });

  it("lists no personal name in the policy text", () => {
    render(<Terms />);
    expect(document.body.textContent).not.toMatch(/บาลเพ็ชร|ดวงจิตร|จิณเซ่ง/);
  });
});

describe("legal routes are public", () => {
  const app = readFileSync("client/src/App.tsx", "utf8");

  // The page was deleted once when main was rewritten, which silently left
  // church.publicContact with no consumer. These guards keep it reachable.
  it.each(["/terms", "/privacy"])("App.tsx serves %s without a session", p => {
    expect(app).toContain(`"${p}"`);
    expect(app).toContain(`<Route path="${p}" component=`);
  });

  it("keeps them out of the onboarding nudge", () => {
    const exempt = app.slice(
      app.indexOf("const SETUP_EXEMPT_PATHS"),
      app.indexOf("const SETUP_EXEMPT_PATHS") + 400
    );
    expect(exempt).toContain('"/privacy"');
    expect(exempt).toContain('"/terms"');
  });
});

