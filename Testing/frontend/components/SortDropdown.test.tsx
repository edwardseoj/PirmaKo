import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SortDropdown } from "@/components/signer-homepage/components/SortDropdown";
import type { SortOption } from "@/hooks/useSignerPdfs";

describe("SortDropdown", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the current sort label", () => {
    render(<SortDropdown sort="newest" onSortChange={vi.fn()} />);
    expect(screen.getByText("Recently Uploaded")).toBeInTheDocument();
  });

  it("renders 'Oldest' label for oldest sort", () => {
    render(<SortDropdown sort="oldest" onSortChange={vi.fn()} />);
    expect(screen.getByText("Oldest")).toBeInTheDocument();
  });

  it("renders 'Alphabetical by Title' for alpha sort", () => {
    render(<SortDropdown sort="alpha" onSortChange={vi.fn()} />);
    expect(screen.getByText("Alphabetical by Title")).toBeInTheDocument();
  });

  it("does not show dropdown menu initially", () => {
    render(<SortDropdown sort="newest" onSortChange={vi.fn()} />);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("shows dropdown menu when trigger is clicked", () => {
    render(<SortDropdown sort="newest" onSortChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /recently uploaded/i }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("shows all three sort options when open", () => {
    render(<SortDropdown sort="newest" onSortChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /recently uploaded/i }));
    expect(screen.getByRole("option", { name: "Recently Uploaded" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Oldest" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Alphabetical by Title" })).toBeInTheDocument();
  });

  it("calls onSortChange when a different option is selected", () => {
    const onSortChange = vi.fn();
    render(<SortDropdown sort="newest" onSortChange={onSortChange} />);
    fireEvent.click(screen.getByRole("button", { name: /recently uploaded/i }));
    fireEvent.click(screen.getByRole("option", { name: "Oldest" }));
    expect(onSortChange).toHaveBeenCalledWith("oldest");
  });

  it("closes the dropdown after selecting an option", () => {
    const onSortChange = vi.fn();
    render(<SortDropdown sort="newest" onSortChange={onSortChange} />);
    fireEvent.click(screen.getByRole("button", { name: /recently uploaded/i }));
    fireEvent.click(screen.getByRole("option", { name: "Alphabetical by Title" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("marks the active option with aria-selected", () => {
    render(<SortDropdown sort="newest" onSortChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /recently uploaded/i }));
    expect(screen.getByRole("option", { name: "Recently Uploaded" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByRole("option", { name: "Oldest" })).toHaveAttribute(
      "aria-selected",
      "false"
    );
  });
});
