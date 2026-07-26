import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Startup } from "@/components/startup/Startup";
import { UserTypeCard } from "@/components/startup/UserTypeCard";
import { FileText } from "lucide-react";

describe("Startup", () => {
  it("renders the welcome heading", () => {
    render(<Startup />);
    expect(screen.getByText("Welcome to PirmaKo")).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    render(<Startup />);
    expect(screen.getByText("Choose your role to get started")).toBeInTheDocument();
  });

  it("renders both role cards", () => {
    render(<Startup />);
    expect(screen.getByText("Requester")).toBeInTheDocument();
    expect(screen.getByText("Signer")).toBeInTheDocument();
  });

  it("calls onRequesterClick when Requester card is clicked", () => {
    const onRequesterClick = vi.fn();
    render(<Startup onRequesterClick={onRequesterClick} />);
    fireEvent.click(screen.getByText("Requester").closest("button")!);
    expect(onRequesterClick).toHaveBeenCalledOnce();
  });

  it("calls onSignerClick when Signer card is clicked", () => {
    const onSignerClick = vi.fn();
    render(<Startup onSignerClick={onSignerClick} />);
    fireEvent.click(screen.getByText("Signer").closest("button")!);
    expect(onSignerClick).toHaveBeenCalledOnce();
  });
});

describe("UserTypeCard", () => {
  it("renders the title", () => {
    render(<UserTypeCard title="Requester" description="Upload docs" icon={FileText} onClick={vi.fn()} />);
    expect(screen.getByText("Requester")).toBeInTheDocument();
  });

  it("renders the description", () => {
    render(<UserTypeCard title="Requester" description="Upload docs" icon={FileText} onClick={vi.fn()} />);
    expect(screen.getByText("Upload docs")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<UserTypeCard title="Requester" description="Upload docs" icon={FileText} onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders as a button element", () => {
    render(<UserTypeCard title="Test" description="Desc" icon={FileText} onClick={vi.fn()} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
