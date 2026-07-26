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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [alert, setAlert] = useState<{ title: string; message: string } | null>(
    null,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setAlert({
        title: "Missing Fields",
        message: "Please enter both your email and password.",
      });
      return;
    }

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

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid email or password. Please try again.";
      setAlert({
        title: "Login Failed",
        message,
      });

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
        <form className="auth__card" onSubmit={handleSubmit}>
          <h1 className="auth__heading">Welcome back</h1>
          <p className="auth__subtitle">Sign in to your PirmaKo account</p>

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

          <button
            className="auth__button"
            type="submit"
            disabled={isSubmitting}
          >
            <LogIn size={18} />
            {isSubmitting ? "Logging in..." : "Log In"}
          </button>

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
