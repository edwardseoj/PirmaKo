/**
 * Navbar.tsx — Shared navigation bar used across all screens.
 *
 * Displays the PirmaKo logo icon and brand name.
 * Accepts an optional `onBack` callback: if provided, a back arrow
 * appears on the left side of the navbar so users can navigate back.
 * Accepts an optional `onLogout` callback: if provided, a logout button
 * appears on the right side of the navbar.
 */

import { Signature, ArrowLeft, LogOut } from "lucide-react";

interface NavbarProps {
  /** When provided, a back button is shown that calls this function. */
  onBack?: () => void;
  /** When provided, a logout button is shown on the right side. */
  onLogout?: () => void;
}

export function Navbar({ onBack, onLogout }: NavbarProps) {
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

      {/* Spacer — pushes logout button to the right */}
      {onLogout && <div style={{ flex: 1 }} />}

      {/* Logout button — only shown when onLogout is provided */}
      {onLogout && (
        <button
          className="navbar__logout"
          onClick={onLogout}
          type="button"
          aria-label="Log out"
        >
          <LogOut size={18} strokeWidth={1.75} />
        </button>
      )}
    </nav>
  );
}
