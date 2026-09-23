import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { HeroSection } from "./HeroSection";

describe("HeroSection", () => {
  it("renders the hero section with proper accessibility label", () => {
    render(<HeroSection />);

    const section = screen.getByRole("region", {
      name: "Grace-giving ส่วนต้อนรับ",
    });
    expect(section).toBeInTheDocument();
  });

  it("renders the brand title and tagline", () => {
    render(<HeroSection />);

    expect(screen.getByText("Grace-giving")).toBeInTheDocument();
    expect(
      screen.getByText("การเงินเชื่อมใจ เพื่อพันธกิจของพระเจ้า")
    ).toBeInTheDocument();
  });

  it("renders the scripture quote badge", () => {
    render(<HeroSection />);

    expect(screen.getByText("2 โครินธ์ 9:7")).toBeInTheDocument();
    expect(
      screen.getByText("“ผู้ให้ด้วยใจยินดี พระเจ้าทรงรัก”")
    ).toBeInTheDocument();
  });

  it("shows no decorative illustration", () => {
    const { container } = render(<HeroSection />);
    expect(container.querySelector("img")).toBeNull();
  });
});
