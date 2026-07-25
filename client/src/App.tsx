/**
 * App — Root component of the PirmaKo application.
 *
 * What it does:
 * - Renders the Startup screen (the first thing users see).
 * - Provides the SonnerToaster for toast notifications.
 *
 * Architecture:
 *   App
 *   ├── Startup      (the landing screen with navbar + cards)
 *   └── SonnerToaster (renders toast notifications globally)
 */
import { Startup } from "./components/startup/Startup"
import { SonnerToaster } from "./components/ui/sonner"

function App() {
  return (
    <>
      {/* Main application screen */}
      <Startup />

      {/* Global toast notification provider — renders notifications in a portal */}
      <SonnerToaster />
    </>
  )
}

export default App
