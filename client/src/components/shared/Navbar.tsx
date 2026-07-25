/**
 * Navbar.tsx — Shared navigation bar used across all screens.
 *
 * Displays the PirmaKo logo icon and brand name.
 * Accepts an optional `onBack` callback: if provided, a back arrow
 * appears on the left side of the navbar so users can navigate back.
 */

import { Signature, ArrowLeft } from "lucide-react";

interface NavbarProps {
  /** When provided, a back button is shown that calls this function. */
  onBack?: () => void;
}

export function Navbar({ onBack }: NavbarProps) {
  return (
    <nav className="navbar">
      {/* Back button — only shown when onBack is provided */}
      {onBack && (
        <button
          className="navbar__back"
          onClick={onBack}
          type="button"
          aria-label="Go back"
        >
          <ArrowLeft size={20} strokeWidth={1.75} />
        </button>
      )}

      {/* Logo icon */}
      <div className="navbar__icon">
        <Signature size={24} strokeWidth={1.75} />
      </div>

      {/* Brand name */}
      <span className="navbar__title">PirmaKo</span>
    </nav>
  );
}
