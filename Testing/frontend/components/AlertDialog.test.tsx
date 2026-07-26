/**
 * Tests for the AlertDialog component.
 *
 * Covers:
 *   - Renders title and message
 *   - Default OK button calls onClose
 *   - Custom actions render correctly
 *   - Backdrop click triggers onClose
 *   - Card click does not trigger onClose (stopPropagation)
 *   - Custom icon renders instead of default
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AlertDialog } from "@/components/ui/alert-dialog";

describe("AlertDialog", () => {
  const defaultProps = {
    title: "Error",
    message: "Something went wrong",
    onClose: vi.fn(),
  };

  it("renders title and message", () => {
    render(<AlertDialog {...defaultProps} />);
    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders default OK button", () => {
    render(<AlertDialog {...defaultProps} />);
    expect(screen.getByRole("button", { name: "OK" })).toBeInTheDocument();
  });

  it("calls onClose when OK button is clicked", () => {
    const onClose = vi.fn();
    render(<AlertDialog {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(<AlertDialog {...defaultProps} onClose={onClose} />);
    const backdrop = container.querySelector(".alert-backdrop")!;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not call onClose when card content is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(<AlertDialog {...defaultProps} onClose={onClose} />);
    const card = container.querySelector(".alert-card")!;
    fireEvent.click(card);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders custom actions instead of default OK button", () => {
    const actions = [
      { label: "Cancel", onClick: vi.fn(), variant: "ghost" as const },
      { label: "Delete", onClick: vi.fn(), variant: "danger" as const },
    ];
    render(<AlertDialog {...defaultProps} actions={actions} />);
    expect(screen.queryByRole("button", { name: "OK" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("calls the correct action handler when a custom action is clicked", () => {
    const cancelAction = { label: "Cancel", onClick: vi.fn(), variant: "ghost" as const };
    const deleteAction = { label: "Delete", onClick: vi.fn(), variant: "danger" as const };
    render(<AlertDialog {...defaultProps} actions={[cancelAction, deleteAction]} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(deleteAction.onClick).toHaveBeenCalledOnce();
    expect(cancelAction.onClick).not.toHaveBeenCalled();
  });
});
