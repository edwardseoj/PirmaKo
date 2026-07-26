/**
 * AuthContext.tsx — Central authentication state for PirmaKo.
 *
 * Manages:
 *   - User data (id, email, role) after login/signup
 *   - JWT token (persisted in localStorage so users stay logged in)
 *   - Loading state while checking auth on app start
 *   - login() and register() functions that call the backend API
 *   - logout() to clear state and token
 *
 * Usage:
 *   const { user, login, register, logout, loading } = useAuth();
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

/** Shape of the user object returned by the backend. */
export interface User {
  id: number;
  email: string;
  role: "requester" | "signer";
}

/** Shape of the auth context — everything components need to access. */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string>;
  register: (email: string, password: string, role: string) => Promise<string>;
  logout: () => void;
}

// Create the context with undefined as default (will be provided by the Provider)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Hook to access the auth context from any component. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return ctx;
}

/** Provider component that wraps the entire app and provides auth state. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ── On mount: check if user has a saved token ──────────────────
  useEffect(() => {
    const token = localStorage.getItem("pirmako_token");
    if (!token) {
      setLoading(false);
      return;
    }

    // Verify the token with the backend and load user data
    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem("pirmako_token");
        }
      })
      .catch(() => {
        localStorage.removeItem("pirmako_token");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // ── Login ──────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    // If the backend returned an error message, throw it so the UI can show it
    if (data.error) throw new Error(data.error);

    // Save token and user — the app is now authenticated
    localStorage.setItem("pirmako_token", data.token);
    setUser(data.user);
    return data.token;
  }, []);

  // ── Register ───────────────────────────────────────────────────
  const register = useCallback(async (email: string, password: string, role: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });
    const data = await res.json();

    if (data.error) throw new Error(data.error);

    localStorage.setItem("pirmako_token", data.token);
    setUser(data.user);
    return data.token;
  }, []);

  // ── Logout ─────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem("pirmako_token");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
