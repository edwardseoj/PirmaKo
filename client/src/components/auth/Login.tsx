/**
 * Login.tsx — The login screen for PirmaKo.
 *
 * What it does:
 *   - Shows email and password fields in a centered card layout
 *   - Password field has a show/hide toggle (eye/eye-off icons)
 *   - Validates that both fields are filled and email contains "@"
 *   - Calls the backend /api/auth/login endpoint
 *   - Shows an AlertDialog if credentials are wrong or user doesn't exist
 *   - On success, navigates to the startup screen (handled by App.tsx via AuthContext)
 *   - Has a "Sign up" link that opens the Signup popup
 *
 * Props:
 *   onSignupClick: Called when the user wants to open the signup popup
 */

import { useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Navbar } from "../shared/Navbar";
import { AlertDialog } from "../ui/alert-dialog";
import { useAuth } from "../../contexts/AuthContext";
import "./Auth.css";

interface LoginProps {
  onSignupClick: () => void;
}

export function Login({ onSignupClick }: LoginProps) {
  const { login } = useAuth();

  // ── Form state ──────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Alert dialog state ──────────────────────────────────────────
  const [alert, setAlert] = useState<{ title: string; message: string } | null>(null);

  // ── Handle login form submission ────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation: both fields must be filled
    if (!email.trim() || !password.trim()) {
      setAlert({
        title: "Missing Fields",
        message: "Please enter both your email and password.",
      });
      return;
    }

    // Email must contain "@"
    if (!email.includes("@")) {
      setAlert({
        title: "Invalid Email",
        message: "Please enter a valid email address containing '@'.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      // On success, AuthContext updates user state → App.tsx switches to startup
    } catch (err: any) {
      setAlert({
        title: "Login Failed",
        message: err.message || "Invalid email or password. Please try again.",
      });
      // Clear fields on error per UX requirements
      setEmail("");
      setPassword("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth">
      <Navbar />

      <main className="auth__main">
        {/* Login card */}
        <form className="auth__card" onSubmit={handleSubmit}>
          <h1 className="auth__heading">Welcome back</h1>
          <p className="auth__subtitle">Sign in to your PirmaKo account</p>

          {/* Email field */}
          <div className="auth__field">
            <label className="auth__label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              className="auth__input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          {/* Password field with show/hide toggle */}
          <div className="auth__field">
            <label className="auth__label" htmlFor="login-password">
              Password
            </label>
            <div className="auth__input-wrapper">
              <input
                id="login-password"
                className="auth__input auth__input--password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                className="auth__toggle"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Login button */}
          <button
            className="auth__button"
            type="submit"
            disabled={isSubmitting}
          >
            <LogIn size={18} />
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>

          {/* Sign up link — small text below the button */}
          <p className="auth__switch">
            Don't have an account?{" "}
            <button
              className="auth__link"
              type="button"
              onClick={onSignupClick}
            >
              Sign up
            </button>
          </p>
        </form>
      </main>

      {/* Error dialog popup */}
      {alert && (
        <AlertDialog
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}
    </div>
  );
}
