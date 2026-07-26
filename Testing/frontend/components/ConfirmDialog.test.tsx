/**
 * Tests for the ConfirmDialog component.
 *
 * Covers:
 *   - Renders message
 *   - Confirm and Cancel buttons present
 *   - onConfirm fires on confirm click
 *   - onCancel fires on cancel click
 *   - Backdrop click fires onCancel
 *   - Card click does not fire onCancel
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmDialog } from "@/components/signer-homepage/components/ConfirmDialog";

describe("ConfirmDialog", () => {
  const defaultProps = {
    message: "Sign this document?",
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it("renders the confirmation message", () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText("Sign this document?")).toBeInTheDocument();
  });

  it("renders Confirm Action heading", () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText("Confirm Action")).toBeInTheDocument();
  });

  it("renders Sign and Cancel buttons", () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByRole("button", { name: /sign/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("calls onConfirm when Sign button is clicked", () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: /sign/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onCancel when Cancel button is clicked", () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("calls onCancel when backdrop is clicked", () => {
    const onCancel = vi.fn();
    const { container } = render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
    const backdrop = container.querySelector(".alert-backdrop")!;
    fireEvent.click(backdrop);
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("does not call onCancel when card is clicked", () => {
    const onCancel = vi.fn();
    const { container } = render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
    const card = container.querySelector(".alert-card")!;
    fireEvent.click(card);
    expect(onCancel).not.toHaveBeenCalled();
  });
});
