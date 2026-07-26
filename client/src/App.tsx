/**
 * App.tsx — Root component and screen router for PirmaKo.
 *
 * Manages navigation between screens:
 *   1. Login / Signup — Authentication (shown when not logged in)
 *   2. Startup        — Role selection (Requester / Signer)
 *   3. Homepage       — PDF management (Requester view)
 *   4. SignerHomepage — PDF signing (Signer view)
 *
 * Uses simple state-based routing (no react-router dependency).
 * The AuthProvider wraps everything and manages auth state.
 * When a user logs in or signs up, they see the startup screen.
 * After selecting a role, they go to the appropriate homepage.
 */

import { useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Login } from "./components/auth/Login";
import { Signup } from "./components/auth/Signup";
import { Startup } from "./components/startup/Startup";
import { Homepage } from "./components/homepage/Homepage";
import { SignerHomepage } from "./components/signer-homepage/SignerHomepage";
import { SonnerToaster } from "./components/ui/sonner";

/** Available screens in the app (after authentication). */
type Screen = "startup" | "homepage" | "signer-homepage";

/** Inner app component that uses the auth context. */
function AppInner() {
  const { user, loading } = useAuth();

  // ── Auth screens ────────────────────────────────────────────────
  const [showSignup, setShowSignup] = useState(false);

  // ── App screens (only used after login) ─────────────────────────
  const [activeScreen, setActiveScreen] = useState<Screen>("startup");

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

  // ── Authenticated — show the app screens ────────────────────────
  return (
    <>
      {activeScreen === "startup" && (
        <Startup
          onRequesterClick={() => setActiveScreen("homepage")}
          onSignerClick={() => setActiveScreen("signer-homepage")}
        />
      )}

      {activeScreen === "homepage" && (
        <Homepage
          onBack={() => setActiveScreen("startup")}
        />
      )}

      {activeScreen === "signer-homepage" && (
        <SignerHomepage
          onBack={() => setActiveScreen("startup")}
        />
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
