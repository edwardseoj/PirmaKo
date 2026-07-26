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

// Exporting both a component (AuthProvider) and a hook (useAuth) is a standard
// React context pattern. The fast-refresh lint rule is a false positive here.
/** Hook to access the auth context from any component. */
// eslint-disable-next-line react-refresh/only-export-components
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
  // Reads token from localStorage and verifies it with the backend.
  // This ensures the user is routed to their correct homepage without
  // needing the startup role-picking screen.
  useEffect(() => {
    const token = localStorage.getItem("pirmako_token");

    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          localStorage.setItem("pirmako_role", data.user.role);
        } else {
          localStorage.removeItem("pirmako_token");
          localStorage.removeItem("pirmako_role");
        }
      } catch {
        localStorage.removeItem("pirmako_token");
        localStorage.removeItem("pirmako_role");
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  // ── Login ──────────────────────────────────────────────────────
  // Stores token and role in localStorage so the user stays logged in
  // across app restarts. Role is used to route to the correct homepage.
  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    // If the backend returned an error message, throw it so the UI can show it
    if (data.error) throw new Error(data.error);

    // Save token, role, and user — the app is now authenticated
    localStorage.setItem("pirmako_token", data.token);
    localStorage.setItem("pirmako_role", data.user.role);
    setUser(data.user);
    return data.token;
  }, []);

  // ── Register ───────────────────────────────────────────────────
  // Creates a new account with the selected role.
  // Role is stored in JWT (server), localStorage (client), and SQLite (database).
  const register = useCallback(async (email: string, password: string, role: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });
    const data = await res.json();

    if (data.error) throw new Error(data.error);

    // Save token, role, and user after successful registration
    localStorage.setItem("pirmako_token", data.token);
    localStorage.setItem("pirmako_role", data.user.role);
    setUser(data.user);
    return data.token;
  }, []);

  // ── Logout ─────────────────────────────────────────────────────
  // Clears all stored auth data and resets user state.
  // Also calls the server logout endpoint to clear the HTTP cookie.
  // Returns the app to the login screen.
  const logout = useCallback(async () => {
    // Tell the server to clear the JWT cookie
    try {
      await fetch("/api/auth/logout", { method: "GET" });
    } catch {
      // Ignore errors — cookie may already be expired
    }
    // Clear client-side storage and state
    localStorage.removeItem("pirmako_token");
    localStorage.removeItem("pirmako_role");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
