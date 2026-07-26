/**
 * AlertDialog.tsx — A styled popup dialog for showing error messages
 * and confirmation prompts.
 *
 * What it does:
 *   - Displays a dark, rounded card centered on the screen.
 *   - Shows a title, message, and action buttons.
 *   - Semi-transparent backdrop that blocks interaction behind it.
 *   - Styled to match the startup screen's dark theme.
 *
 * Props:
 *   title:    The heading text (e.g., "Login Failed" or "Delete PDF")
 *   message:  The detailed message to show
 *   onClose:  Function to call when the dialog is dismissed (backdrop click)
 *   icon:     Optional Lucide icon element to replace the default warning icon
 *   actions:  Optional array of custom action buttons (replaces the default OK button)
 *             Each action has: label, icon, onClick, variant ("primary" | "danger" | "ghost")
 */

import { type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import "./alert-dialog.css";

/** Configuration for a single action button in the dialog. */
export interface AlertDialogAction {
  /** Button text label. */
  label: string;
  /** Lucide icon element to show before the label. */
  icon?: ReactNode;
  /** Called when the button is clicked. */
  onClick: () => void;
  /** Visual style: "primary" (indigo), "danger" (red), or "ghost" (transparent). */
  variant?: "primary" | "danger" | "ghost";
}

interface AlertDialogProps {
  title: string;
  message: string;
  onClose: () => void;
  /** Optional custom icon element (replaces the default AlertTriangle). */
  icon?: ReactNode;
  /**
   * Optional custom action buttons.
   * When provided, replaces the default single "OK" button.
   * Backdrop click still calls onClose (for dismissal without action).
   */
  actions?: AlertDialogAction[];
}

export function AlertDialog({ title, message, onClose, icon, actions }: AlertDialogProps) {
  return (
    // Semi-transparent backdrop — clicking it dismisses the dialog
    <div className="alert-backdrop" onClick={onClose}>
      {/* Prevent clicks inside the card from closing it */}
      <div
        className="alert-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon — custom or default warning triangle */}
        <div className="alert-card__icon">
          {icon ?? <AlertTriangle size={24} strokeWidth={1.75} />}
        </div>

        {/* Title text */}
        <h2 className="alert-card__title">{title}</h2>

        {/* Message text */}
        <p className="alert-card__message">{message}</p>

        {/* Action buttons — custom or default OK */}
        {actions && actions.length > 0 ? (
          <div className="alert-card__actions">
            {actions.map((action, i) => (
              <button
                key={i}
                className={`alert-card__button alert-card__button--${action.variant ?? "primary"}`}
                onClick={action.onClick}
                type="button"
              >
                {action.icon && <span className="alert-card__button-icon">{action.icon}</span>}
                {action.label}
              </button>
            ))}
          </div>
        ) : (
          <button className="alert-card__button alert-card__button--primary" onClick={onClose} type="button">
            OK
          </button>
        )}
      </div>
    </div>
  );
}
