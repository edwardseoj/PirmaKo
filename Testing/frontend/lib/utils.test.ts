import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn()", () => {
  it("returns a single class when given one class string", () => {
    expect(cn("px-4")).toBe("px-4");
  });

  it("concatenates multiple class strings", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("deduplicates conflicting Tailwind classes", () => {

    expect(cn("px-4", "px-2")).toBe("px-2");
  });

  it("merges non-conflicting Tailwind classes", () => {
    expect(cn("px-4", "py-2", "bg-red-500")).toBe("px-4 py-2 bg-red-500");
  });

  it("handles conditional classes with && operator", () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn("base", isActive && "active", isDisabled && "disabled")).toBe(
      "base active"
    );
  });

  it("handles falsy values gracefully", () => {
    expect(cn("px-4", null, undefined, false, 0, "")).toBe("px-4");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });

  it("handles object syntax from clsx", () => {
    expect(cn({ "px-4": true, "py-2": false })).toBe("px-4");
  });

  it("deduplicates complex Tailwind class conflicts", () => {

    expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
  });

  it("handles string concatenation edge cases", () => {
    expect(cn("  px-4  ", "  py-2  ")).toBe("px-4 py-2");
  });
});
