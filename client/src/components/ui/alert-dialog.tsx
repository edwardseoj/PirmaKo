/**
 * AlertDialog.tsx — A styled popup dialog for showing error messages.
 *
 * What it does:
 *   - Displays a dark, rounded card centered on the screen.
 *   - Shows a title, message, and an "OK" button to dismiss.
 *   - Semi-transparent backdrop that blocks interaction behind it.
 *   - Styled to match the startup screen's dark theme.
 *
 * Props:
 *   title:   The heading text (e.g., "Login Failed")
 *   message: The detailed error message to show
 *   onClose: Function to call when the user clicks OK or the backdrop
 */

import { AlertTriangle } from "lucide-react";
import "./alert-dialog.css";

interface AlertDialogProps {
  title: string;
  message: string;
  onClose: () => void;
}

export function AlertDialog({ title, message, onClose }: AlertDialogProps) {
  return (
    // Semi-transparent backdrop — clicking it closes the dialog
    <div className="alert-backdrop" onClick={onClose}>
      {/* Prevent clicks inside the card from closing it */}
      <div
        className="alert-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning icon */}
        <div className="alert-card__icon">
          <AlertTriangle size={24} strokeWidth={1.75} />
        </div>

        {/* Title text */}
        <h2 className="alert-card__title">{title}</h2>

        {/* Error message */}
        <p className="alert-card__message">{message}</p>

        {/* Dismiss button */}
        <button className="alert-card__button" onClick={onClose} type="button">
          OK
        </button>
      </div>
    </div>
  );
}
