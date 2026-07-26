/**
 * App.tsx — Root component and screen router for PirmaKo.
 *
 * Manages navigation between screens:
 *   1. Login / Signup — Authentication (shown when not logged in)
 *   2. Homepage       — PDF management (Requester view)
 *   3. SignerHomepage — PDF signing (Signer view)
 *
 * Uses simple state-based routing (no react-router dependency).
 * The AuthProvider wraps everything and manages auth state.
 * After login/signup, the user is routed directly to their
 * role-based homepage (requester → Homepage, signer → SignerHomepage).
 * The Startup role-picking screen has been removed — role is
 * chosen during sign up and stored in JWT + localStorage.
 */

import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Login } from "./components/auth/Login";
import { Signup } from "./components/auth/Signup";
import { Homepage } from "./components/homepage/Homepage";
import { SignerHomepage } from "./components/signer-homepage/SignerHomepage";
import { SonnerToaster } from "./components/ui/sonner";

/** Inner app component that uses the auth context. */
function AppInner() {
  const { user, loading, logout } = useAuth();

  // ── Auth screens ────────────────────────────────────────────────
  const [showSignup, setShowSignup] = useState(false);

  // Reset to login screen when user logs out or becomes null.
  // Without this, logging out after signing up would show the Signup popup
  // instead of returning to the Login screen.
  useEffect(() => {
    if (!user) setShowSignup(false);
  }, [user]);

  // Show a minimal loading state while checking for saved token
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#0f0f1a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#94a3b8",
        fontSize: "14px",
      }}>
        Loading...
      </div>
    );
  }

  // ── Not authenticated — show Login or Signup ────────────────────
  if (!user) {
    return (
      <>
        {showSignup ? (
          <Signup onClose={() => setShowSignup(false)} />
        ) : (
          <Login onSignupClick={() => setShowSignup(true)} />
        )}
      </>
    );
  }

  // ── Authenticated — route to homepage based on user role ────────
  // Role is stored in JWT and localStorage during login/signup.
  // Requesters see the PDF management view, signers see the PDF signing view.
  // Back navigation from either homepage triggers logout → returns to login screen.
  return (
    <>
      {user.role === "requester" && (
        <Homepage onBack={logout} />
      )}

      {user.role === "signer" && (
        <SignerHomepage onBack={logout} />
      )}
    </>
  );
}

/** Root component — wraps everything in AuthProvider. */
function App() {
  return (
    <AuthProvider>
      <AppInner />
      <SonnerToaster />
    </AuthProvider>
  );
}

export default App;
