/**
 * ConfirmDialog.tsx — A modal confirmation dialog that inherits startup styling.
 *
 * What it does:
 *   - Displays a dark, rounded card centered on the screen (same as AlertDialog).
 *   - Shows a warning icon, a message, and Confirm / Cancel buttons.
 *   - Semi-transparent backdrop that blocks interaction behind it.
 *   - Styled to match the startup screen's dark theme.
 *
 * Used by the PdfEditorPopup when the user clicks the check (sign) button,
 * so they don't accidentally sign a document.
 */

import { AlertTriangle, Check, X } from "lucide-react";

interface ConfirmDialogProps {
  /** The message to show (e.g., "Sign this document?"). */
  message: string;
  /** Called when the user confirms the action. */
  onConfirm: () => void;
  /** Called when the user cancels the confirmation. */
  onCancel: () => void;
}

export function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    // Semi-transparent backdrop — clicking it cancels the confirmation
    <div className="alert-backdrop" onClick={onCancel}>
      {/* Prevent clicks inside the card from closing it */}
      <div
        className="alert-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning icon — same as AlertDialog */}
        <div className="alert-card__icon">
          <AlertTriangle size={24} strokeWidth={1.75} />
        </div>

        {/* Confirmation message */}
        <h2 className="alert-card__title">Confirm Action</h2>
        <p className="alert-card__message">{message}</p>

        {/* Confirm and Cancel buttons — full width, same width */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="alert-card__button"
            onClick={onCancel}
            type="button"
            style={{
              background: "var(--color-bg-tertiary)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-secondary)",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <X size={16} strokeWidth={2} />
              Cancel
            </span>
          </button>
          <button
            className="alert-card__button"
            onClick={onConfirm}
            type="button"
          >
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <Check size={16} strokeWidth={2} />
              Sign
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
