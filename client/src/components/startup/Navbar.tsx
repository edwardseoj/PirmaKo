/**
 * Navbar — The top navigation bar for PirmaKo.
 *
 * What it does:
 * - Shows a signature icon (from Lucide) on the left.
 * - Displays the "PirmaKo" brand name next to the icon.
 * - Stays fixed at the top of the screen.
 *
 * Props: None (it's a simple, self-contained component)
 */
import { Signature } from "lucide-react"
import "./Startup.css"

export function Navbar() {
  return (
    <nav className="navbar">
      {/* Icon — uses Lucide's Signature icon */}
      <div className="navbar__icon">
        <Signature size={24} strokeWidth={1.75} />
      </div>

      {/* Brand name */}
      <span className="navbar__title">PirmaKo</span>
    </nav>
  )
}
