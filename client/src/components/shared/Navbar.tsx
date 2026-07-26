import { Signature, ArrowLeft, LogOut } from "lucide-react";

interface NavbarProps {

  onBack?: () => void;

  onLogout?: () => void;
}

export function Navbar({ onBack, onLogout }: NavbarProps) {
  return (
    <nav className="navbar">
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

      <div className="navbar__icon">
        <Signature size={24} strokeWidth={1.75} />
      </div>

      <span className="navbar__title">PirmaKo</span>

      {onLogout && <div style={{ flex: 1 }} />}

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
