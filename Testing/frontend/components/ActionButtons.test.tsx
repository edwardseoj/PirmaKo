import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ActionButtons, ActionButton } from "@/components/signer-homepage/components/ActionButtons";

describe("ActionButtons", () => {
  it("renders children in a wrapper div", () => {
    const { container } = render(
      <ActionButtons>
        <ActionButton icon={<span>✓</span>} tooltip="OK" color="green" onClick={vi.fn()} />
      </ActionButtons>
    );
    expect(container.querySelector(".signer-action-buttons")).toBeInTheDocument();
  });

  it("renders multiple buttons", () => {
    render(
      <ActionButtons>
        <ActionButton icon={<span>✓</span>} tooltip="OK" color="green" onClick={vi.fn()} />
        <ActionButton icon={<span>✗</span>} tooltip="Cancel" color="red" onClick={vi.fn()} />
      </ActionButtons>
    );
    expect(screen.getByRole("button", { name: "OK" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });
});

describe("ActionButton", () => {
  it("renders with tooltip as aria-label", () => {
    render(
      <ActionButton icon={<span>✓</span>} tooltip="Confirm signing" color="green" onClick={vi.fn()} />
    );
    expect(screen.getByRole("button", { name: "Confirm signing" })).toBeInTheDocument();
  });

  it("renders label text when provided", () => {
    render(
      <ActionButton icon={<span>✓</span>} label="Sign" tooltip="Sign" color="green" onClick={vi.fn()} />
    );
    expect(screen.getByText("Sign")).toBeInTheDocument();
  });

  it("does not render label text when not provided", () => {
    const { container } = render(
      <ActionButton icon={<span>✓</span>} tooltip="Sign" color="green" onClick={vi.fn()} />
    );
    expect(container.querySelector(".signer-action-btn__label")).not.toBeInTheDocument();
  });

  it("applies color class", () => {
    const { container } = render(
      <ActionButton icon={<span>✓</span>} tooltip="OK" color="red" onClick={vi.fn()} />
    );
    expect(container.querySelector(".signer-action-btn--red")).toBeInTheDocument();
  });

  it("applies filled class when filled=true", () => {
    const { container } = render(
      <ActionButton icon={<span>✓</span>} tooltip="OK" color="green" onClick={vi.fn()} filled />
    );
    expect(container.querySelector(".signer-action-btn--filled")).toBeInTheDocument();
  });

  it("does not apply filled class when filled=false", () => {
    const { container } = render(
      <ActionButton icon={<span>✓</span>} tooltip="OK" color="green" onClick={vi.fn()} />
    );
    expect(container.querySelector(".signer-action-btn--filled")).not.toBeInTheDocument();
  });

  it("applies disabled class and attribute when disabled", () => {
    const { container } = render(
      <ActionButton icon={<span>✓</span>} tooltip="OK" color="green" onClick={vi.fn()} disabled />
    );
    expect(container.querySelector(".signer-action-btn--disabled")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(
      <ActionButton icon={<span>✓</span>} tooltip="OK" color="green" onClick={onClick} />
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("applies with-label class when label is provided", () => {
    const { container } = render(
      <ActionButton icon={<span>✓</span>} label="Sign" tooltip="Sign" color="green" onClick={vi.fn()} />
    );
    expect(container.querySelector(".signer-action-btn--with-label")).toBeInTheDocument();
  });
});
