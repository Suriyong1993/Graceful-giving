import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Illustration } from "./Illustration";

describe("Illustration", () => {
  it("renders image with basic attributes and default lazy loading", () => {
    render(
      <Illustration
        src="/test-image.jpg"
        alt="Test illustration"
        width={300}
        height={200}
      />
    );

    const img = screen.getByRole("img", { name: "Test illustration" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/test-image.jpg");
    expect(img).toHaveAttribute("width", "300");
    expect(img).toHaveAttribute("height", "200");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("decoding", "async");
    expect(img).toHaveClass(
      "object-cover",
      "select-none",
      "pointer-events-none"
    );
  });

  it("sets loading to eager when priority is true", () => {
    render(
      <Illustration
        src="/priority-image.jpg"
        alt="Priority illustration"
        priority
      />
    );

    const img = screen.getByRole("img", { name: "Priority illustration" });
    expect(img).toHaveAttribute("loading", "eager");
  });

  it("appends custom className alongside default classes", () => {
    render(
      <Illustration
        src="/custom.jpg"
        alt="Custom styling"
        className="w-full h-full rounded-2xl"
      />
    );

    const img = screen.getByRole("img", { name: "Custom styling" });
    expect(img).toHaveClass(
      "object-cover",
      "select-none",
      "pointer-events-none",
      "w-full",
      "h-full",
      "rounded-2xl"
    );
  });
});
