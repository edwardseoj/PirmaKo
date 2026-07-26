import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Login } from "./components/auth/Login";
import { Signup } from "./components/auth/Signup";
import { Homepage } from "./components/homepage/Homepage";
import { SignerHomepage } from "./components/signer-homepage/SignerHomepage";
import { SonnerToaster } from "./components/ui/sonner";

function AppInner() {
  const { user, loading, logout } = useAuth();

  const [showSignup, setShowSignup] = useState(false);

  useEffect(() => {
    if (!user) setShowSignup(false);
  }, [user]);

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

function App() {
  return (
    <AuthProvider>
      <AppInner />
      <SonnerToaster />
    </AuthProvider>
  );
}

export default App;
