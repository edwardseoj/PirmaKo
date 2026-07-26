import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Navbar } from "@/components/shared/Navbar";

describe("Navbar", () => {
  it("renders the PirmaKo brand name", () => {
    render(<Navbar />);
    expect(screen.getByText("PirmaKo")).toBeInTheDocument();
  });

  it("does not render back button when onBack is not provided", () => {
    render(<Navbar />);
    expect(screen.queryByRole("button", { name: /go back/i })).not.toBeInTheDocument();
  });

  it("renders back button when onBack is provided", () => {
    const onBack = vi.fn();
    render(<Navbar onBack={onBack} />);
    expect(screen.getByRole("button", { name: /go back/i })).toBeInTheDocument();
  });

  it("calls onBack when back button is clicked", () => {
    const onBack = vi.fn();
    render(<Navbar onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: /go back/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("does not render logout button when onLogout is not provided", () => {
    render(<Navbar />);
    expect(screen.queryByRole("button", { name: /log out/i })).not.toBeInTheDocument();
  });

  it("renders logout button when onLogout is provided", () => {
    const onLogout = vi.fn();
    render(<Navbar onLogout={onLogout} />);
    expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument();
  });

  it("calls onLogout when logout button is clicked", () => {
    const onLogout = vi.fn();
    render(<Navbar onLogout={onLogout} />);
    fireEvent.click(screen.getByRole("button", { name: /log out/i }));
    expect(onLogout).toHaveBeenCalledOnce();
  });

  it("renders both back and logout buttons when both props are provided", () => {
    const onBack = vi.fn();
    const onLogout = vi.fn();
    render(<Navbar onBack={onBack} onLogout={onLogout} />);
    expect(screen.getByRole("button", { name: /go back/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument();
  });
});
