/**
 * App.tsx — Root component and screen router for PirmaKo.
 *
 * Manages navigation between the three main screens:
 *   1. Startup           — role selection (Requester / Signer)
 *   2. Homepage          — PDF management (Requester view)
 *   3. SignerHomepage    — PDF signing (Signer view)
 *
 * Uses simple state-based routing (no react-router dependency).
 * The "activeScreen" state determines which screen is visible.
 * When a user clicks "Requester" on Startup, we switch to Homepage.
 * When a user clicks "Signer" on Startup, we switch to SignerHomepage.
 * The back button on Navbar returns to Startup.
 */

import { useState } from "react";
import { Startup } from "./components/startup/Startup";
import { Homepage } from "./components/homepage/Homepage";
import { SignerHomepage } from "./components/signer-homepage/SignerHomepage";
import { SonnerToaster } from "./components/ui/sonner";

/** Available screens in the app. */
type Screen = "startup" | "homepage" | "signer-homepage";

function App() {
  // Track which screen is currently active.
  const [activeScreen, setActiveScreen] = useState<Screen>("startup");

  return (
    <>
      {/* Conditionally render the active screen */}
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

      {/* Toast notification provider — stays mounted across all screens */}
      <SonnerToaster />
    </>
  );
}

export default App;
