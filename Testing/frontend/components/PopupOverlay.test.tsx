import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PopupOverlay } from "@/components/signer-homepage/components/PopupOverlay";

describe("PopupOverlay", () => {
  it("renders children inside the overlay", () => {
    render(
      <PopupOverlay onClose={vi.fn()}>
        <div>Popup content</div>
      </PopupOverlay>
    );
    expect(screen.getByText("Popup content")).toBeInTheDocument();
  });

  it("calls onClose when the overlay backdrop is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(
      <PopupOverlay onClose={onClose}>
        <div>Content</div>
      </PopupOverlay>
    );
    const overlay = container.querySelector(".signer-popup-overlay")!;
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not call onClose when content inside is clicked", () => {
    const onClose = vi.fn();
    render(
      <PopupOverlay onClose={onClose}>
        <button>Click me</button>
      </PopupOverlay>
    );
    fireEvent.click(screen.getByRole("button", { name: "Click me" }));
    expect(onClose).not.toHaveBeenCalled();
  });
});
