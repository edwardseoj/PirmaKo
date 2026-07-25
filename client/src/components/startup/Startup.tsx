/**
 * Startup — The main startup / landing screen for PirmaKo.
 *
 * What it does:
 * - Renders the Navbar at the top.
 * - Shows a heading and two user-type selection cards (Requester & Signer).
 * - When a card is clicked, a toast notification appears confirming the selection.
 * - This is the first screen users see when opening the application.
 *
 * Architecture:
 *   Startup
 *   ├── Navbar          (navigation bar with icon + brand)
 *   ├── Header section  (heading + subtitle)
 *   └── UserTypeCard[]  (clickable cards for user selection)
 */
import { toast } from "sonner"
import { FileText, PenLine } from "lucide-react"
import { Navbar } from "../shared/Navbar"
import { UserTypeCard } from "./UserTypeCard"
import "./Startup.css"

interface StartupProps {
  /** Called when user picks "Requester" — navigates to homepage. */
  onRequesterClick?: () => void
}

/**
 * handleUserTypeSelect — Called when a user type card is clicked.
 * Shows a toast notification telling the user which role they picked.
 *
 * @param userType - Either "Requester" or "Signer"
 */
function handleSignerSelect() {
  toast.success("You selected: Signer", {
    description: "Welcome, Signer! Setting up your experience...",
    duration: 3000,
  })
}

export function Startup({ onRequesterClick }: StartupProps = {}) {
  return (
    <div className="startup">
      {/* Navigation bar — icon + "PirmaKo" brand name */}
      <Navbar />

      {/* Main content area — centered vertically and horizontally */}
      <main className="startup__main">
        {/* Heading section */}
        <div className="startup__header">
          <h1 className="startup__heading">Welcome to PirmaKo</h1>
          <p className="startup__subtitle">
            Choose your role to get started
          </p>
        </div>

        {/* User type selection cards — displayed in a column layout */}
        <div className="startup__cards">
          <UserTypeCard
            title="Requester"
            description="Request documents for signature and track their status"
            icon={FileText}
            onClick={onRequesterClick ?? (() => handleSignerSelect())}
          />

          <UserTypeCard
            title="Signer"
            description="Review and sign documents sent to you for approval"
            icon={PenLine}
            onClick={handleSignerSelect}
          />
        </div>
      </main>
    </div>
  )
}
