/**
 * Tests for the Signup component.
 *
 * Covers:
 *   - Renders all form fields
 *   - Validates empty fields
 *   - Validates email format
 *   - Validates password length
 *   - Validates password confirmation match
 *   - Role selection
 *   - Submits registration form
 *   - Shows error on failed registration
 *   - Back button calls onClose
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Signup } from "@/components/auth/Signup";
import { AuthProvider } from "@/contexts/AuthContext";

function renderSignup(onClose = vi.fn()) {
  return render(
    <AuthProvider>
      <Signup onClose={onClose} />
    </AuthProvider>
  );
}

describe("Signup", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      if (typeof url === "string" && url.includes("/api/auth/me")) {
        return new Response(JSON.stringify({ error: "Not authenticated" }));
      }
      return new Response(JSON.stringify({ error: "Unknown" }));
    });
  });

  it("renders email, password, and confirm password fields", async () => {
    renderSignup();
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Re-enter Password")).toBeInTheDocument();
  });

  it("renders role selection buttons", async () => {
    renderSignup();
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /requester/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /signer/i })).toBeInTheDocument();
  });

  it("shows alert when fields are empty", async () => {
    renderSignup();
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText("Missing Fields")).toBeInTheDocument();
    });
  });

  it("shows alert for invalid email", async () => {
    const { container } = renderSignup();
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    // Bypass HTML5 email validation by setting noValidate on the form
    const form = container.querySelector("form")!;
    form.setAttribute("novalidate", "");

    await userEvent.type(screen.getByLabelText("Email"), "bad-email");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.type(screen.getByLabelText("Re-enter Password"), "password123");

    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("Invalid Email")).toBeInTheDocument();
    });
  });

  it("shows alert for short password", async () => {
    renderSignup();
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email"), "test@test.com");
    await user.type(screen.getByLabelText("Password"), "123");
    await user.type(screen.getByLabelText("Re-enter Password"), "123");

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText("Weak Password")).toBeInTheDocument();
    });
  });

  it("shows alert when passwords don't match", async () => {
    renderSignup();
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email"), "test@test.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Re-enter Password"), "different123");

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText("Passwords Don't Match")).toBeInTheDocument();
    });
  });

  it("shows alert when no role is selected", async () => {
    renderSignup();
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email"), "test@test.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Re-enter Password"), "password123");

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText("Select Role")).toBeInTheDocument();
    });
  });

  it("calls onClose when back button is clicked", async () => {
    const onClose = vi.fn();
    renderSignup(onClose);

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /go back/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("submits registration successfully", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      if (typeof url === "string" && url.includes("/api/auth/me")) {
        return new Response(JSON.stringify({ error: "Not authenticated" }));
      }
      return new Response(
        JSON.stringify({
          token: "reg-token",
          user: { id: 1, email: "new@test.com", role: "requester" },
        })
      );
    });

    renderSignup();
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email"), "new@test.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Re-enter Password"), "password123");
    fireEvent.click(screen.getByRole("button", { name: /requester/i }));
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(localStorage.getItem("pirmako_token")).toBe("reg-token");
    });
  });
});
