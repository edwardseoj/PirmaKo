import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface User {
  id: number;
  email: string;
  role: "requester" | "signer";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string>;
  register: (email: string, password: string, role: string) => Promise<string>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (data.error) throw new Error(data.error);

    localStorage.setItem("pirmako_token", data.token);
    localStorage.setItem("pirmako_role", data.user.role);
    setUser(data.user);
    return data.token;
  }, []);

  const register = useCallback(async (email: string, password: string, role: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });
    const data = await res.json();

    if (data.error) throw new Error(data.error);

    localStorage.setItem("pirmako_token", data.token);
    localStorage.setItem("pirmako_role", data.user.role);
    setUser(data.user);
    return data.token;
  }, []);

  const logout = useCallback(async () => {

    try {
      await fetch("/api/auth/logout", { method: "GET" });
    } catch {

    }

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
