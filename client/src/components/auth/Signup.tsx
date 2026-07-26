import { useState } from "react";
import { Eye, EyeOff, ArrowLeft, UserPlus, FileText, PenLine } from "lucide-react";
import { AlertDialog } from "../ui/alert-dialog";
import { useAuth } from "../../contexts/AuthContext";
import "./Auth.css";

interface SignupProps {
  onClose: () => void;
}

export function Signup({ onClose }: SignupProps) {
  const { register } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"requester" | "signer" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [alert, setAlert] = useState<{ title: string; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setAlert({
        title: "Missing Fields",
        message: "Please fill in all fields.",
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

    if (password.length < 6) {
      setAlert({
        title: "Weak Password",
        message: "Password must be at least 6 characters long.",
      });
      return;
    }

    if (password !== confirmPassword) {
      setAlert({
        title: "Passwords Don't Match",
        message: "Please make sure both passwords are the same.",
      });
      return;
    }

    if (!selectedRole) {
      setAlert({
        title: "Select Role",
        message: "Please choose whether you are a Requester or Signer.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await register(email, password, selectedRole);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not create account. Please try again.";
      setAlert({
        title: "Signup Failed",
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth auth--popup">
      <div className="auth__backdrop" onClick={onClose} />

      <div className="auth__popup" onClick={(e) => e.stopPropagation()}>
        <button className="auth__back" onClick={onClose} type="button" aria-label="Go back">
          <ArrowLeft size={20} strokeWidth={1.75} />
        </button>

        <form className="auth__card auth__card--popup" onSubmit={handleSubmit}>
          <h1 className="auth__heading">Create Account</h1>
          <p className="auth__subtitle">Sign up for PirmaKo</p>

          <div className="auth__field">
            <label className="auth__label" htmlFor="signup-email">
              Email
            </label>
            <input
              id="signup-email"
              className="auth__input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="auth__field">
            <label className="auth__label" htmlFor="signup-password">
              Password
            </label>
            <div className="auth__input-wrapper">
              <input
                id="signup-password"
                className="auth__input auth__input--password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
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

          <div className="auth__field">
            <label className="auth__label" htmlFor="signup-confirm">
              Re-enter Password
            </label>
            <div className="auth__input-wrapper">
              <input
                id="signup-confirm"
                className="auth__input auth__input--password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                className="auth__toggle"
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="auth__field">
            <label className="auth__label">I am a...</label>
            <div className="auth__roles">
              <button
                type="button"
                className={`auth__role ${selectedRole === "requester" ? "auth__role--selected" : ""}`}
                onClick={() => setSelectedRole("requester")}
              >
                <FileText size={20} strokeWidth={1.5} />
                <span>Requester</span>
              </button>
              <button
                type="button"
                className={`auth__role ${selectedRole === "signer" ? "auth__role--selected" : ""}`}
                onClick={() => setSelectedRole("signer")}
              >
                <PenLine size={20} strokeWidth={1.5} />
                <span>Signer</span>
              </button>
            </div>
          </div>

          <button
            className="auth__button"
            type="submit"
            disabled={isSubmitting}
          >
            <UserPlus size={18} />
            {isSubmitting ? "Creating Account..." : "Sign Up"}
          </button>
        </form>
      </div>

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
