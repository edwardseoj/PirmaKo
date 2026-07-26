import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { type ReactNode } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("throws when useAuth is used outside AuthProvider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used inside an AuthProvider");
    consoleSpy.mockRestore();
  });

  it("ends with loading=false and user=null when no token", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
  });

  it("verifies token and sets user on mount when token exists", async () => {
    const mockUser = { id: 1, email: "test@test.com", role: "requester" };
    localStorage.setItem("pirmako_token", "valid-token");

    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ user: mockUser }))
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
  });

  it("clears token when verification fails on mount", async () => {
    localStorage.setItem("pirmako_token", "expired-token");

    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem("pirmako_token")).toBeNull();
  });

  it("clears token when fetch throws on mount", async () => {
    localStorage.setItem("pirmako_token", "some-token");
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem("pirmako_token")).toBeNull();
  });

  it("login stores token and sets user on success", async () => {
    const mockResponse = {
      token: "new-jwt-token",
      user: { id: 1, email: "test@test.com", role: "requester" },
    };

    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      if (typeof url === "string" && url.includes("/api/auth/me")) {
        return new Response(JSON.stringify({ error: "Not authenticated" }));
      }
      return new Response(JSON.stringify(mockResponse));
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let token: string;
    await act(async () => {
      token = await result.current.login("test@test.com", "password123");
    });

    expect(token!).toBe("new-jwt-token");
    expect(result.current.user).toEqual(mockResponse.user);
    expect(localStorage.getItem("pirmako_token")).toBe("new-jwt-token");
    expect(localStorage.getItem("pirmako_role")).toBe("requester");
  });

  it("login throws error when backend returns error", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      if (typeof url === "string" && url.includes("/api/auth/me")) {
        return new Response(JSON.stringify({ error: "Not authenticated" }));
      }
      return new Response(JSON.stringify({ error: "Invalid email or password" }));
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await expect(
        result.current.login("wrong@test.com", "wrongpass")
      ).rejects.toThrow("Invalid email or password");
    });

    expect(result.current.user).toBeNull();
  });

  it("register stores token and sets user on success", async () => {
    const mockResponse = {
      token: "reg-jwt-token",
      user: { id: 2, email: "new@test.com", role: "signer" },
    };

    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      if (typeof url === "string" && url.includes("/api/auth/me")) {
        return new Response(JSON.stringify({ error: "Not authenticated" }));
      }
      return new Response(JSON.stringify(mockResponse));
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let token: string;
    await act(async () => {
      token = await result.current.register("new@test.com", "password123", "signer");
    });

    expect(token!).toBe("reg-jwt-token");
    expect(result.current.user).toEqual(mockResponse.user);
    expect(localStorage.getItem("pirmako_token")).toBe("reg-jwt-token");
    expect(localStorage.getItem("pirmako_role")).toBe("signer");
  });

  it("register throws error on backend failure", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      if (typeof url === "string" && url.includes("/api/auth/me")) {
        return new Response(JSON.stringify({ error: "Not authenticated" }));
      }
      return new Response(
        JSON.stringify({ error: "An account with this email already exists" })
      );
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await expect(
        result.current.register("existing@test.com", "password123", "requester")
      ).rejects.toThrow("An account with this email already exists");
    });
  });

  it("logout clears user and localStorage", async () => {
    localStorage.setItem("pirmako_token", "some-token");
    localStorage.setItem("pirmako_role", "requester");

    const mockUser = { id: 1, email: "test@test.com", role: "requester" };
    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      if (typeof url === "string" && url.includes("/api/auth/me")) {
        return new Response(JSON.stringify({ user: mockUser }));
      }
      return new Response(JSON.stringify({ success: true }));
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem("pirmako_token")).toBeNull();
    expect(localStorage.getItem("pirmako_role")).toBeNull();
  });

  it("logout handles server errors gracefully", async () => {
    localStorage.setItem("pirmako_token", "token");
    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      if (typeof url === "string" && url.includes("/api/auth/me")) {
        return new Response(JSON.stringify({ error: "Not authenticated" }));
      }
      throw new Error("Server down");
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem("pirmako_token")).toBeNull();
  });
});
