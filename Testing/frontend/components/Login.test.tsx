import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Login } from "@/components/auth/Login";
import { AuthProvider } from "@/contexts/AuthContext";

function renderLogin(onSignupClick = vi.fn()) {
  return render(
    <AuthProvider>
      <Login onSignupClick={onSignupClick} />
    </AuthProvider>
  );
}

describe("Login", () => {
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

  it("renders email and password fields", async () => {
    renderLogin();
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("renders the login heading", async () => {
    renderLogin();
    await waitFor(() => {
      expect(screen.getByText("Welcome back")).toBeInTheDocument();
    });
  });

  it("shows password when toggle is clicked", async () => {
    renderLogin();
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText("Password");
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggle = screen.getByRole("button", { name: /show password/i });
    fireEvent.click(toggle);
    expect(passwordInput).toHaveAttribute("type", "text");
  });

  it("shows alert when fields are empty", async () => {
    renderLogin();
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText("Missing Fields")).toBeInTheDocument();
    });
  });

  it("shows alert when email is invalid", async () => {
    const { container } = renderLogin();
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    const form = container.querySelector("form")!;
    form.setAttribute("novalidate", "");

    await userEvent.type(screen.getByLabelText("Email"), "invalid-email");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("Invalid Email")).toBeInTheDocument();
    });
  });

  it("calls onSignupClick when Sign up link is clicked", async () => {
    const onSignupClick = vi.fn();
    renderLogin(onSignupClick);

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));
    expect(onSignupClick).toHaveBeenCalledOnce();
  });

  it("submits login and shows error on failure", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      if (typeof url === "string" && url.includes("/api/auth/me")) {
        return new Response(JSON.stringify({ error: "Not authenticated" }));
      }
      return new Response(
        JSON.stringify({ error: "Invalid email or password" })
      );
    });

    renderLogin();
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email"), "test@test.com");
    await user.type(screen.getByLabelText("Password"), "wrongpass");
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText("Login Failed")).toBeInTheDocument();
    });
  });
});
