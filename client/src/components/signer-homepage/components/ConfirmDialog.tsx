/**
 * ConfirmDialog.tsx — A simple inline confirmation prompt.
 *
 * What it does:
 *   - Asks the user "Are you sure?" before performing an action.
 *   - Shows two small icon buttons: a green checkmark (confirm) and a red X (cancel).
 *   - Appears in place of the original button, so the layout doesn't shift.
 *
 * Used by the PdfEditorPopup when the user clicks the check (sign) button,
 * so they don't accidentally sign a document.
 */

import { Check, X } from "lucide-react";
import { ActionButtons, ActionButton } from "./ActionButtons";

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
    <div className="signer-confirm">
      <span className="signer-confirm__text">{message}</span>
      <ActionButtons>
        <ActionButton
          icon={<Check size={16} strokeWidth={2} />}
          tooltip="Yes, confirm"
          color="green"
          onClick={onConfirm}
          filled
        />
        <ActionButton
          icon={<X size={16} strokeWidth={2} />}
          tooltip="No, go back"
          color="red"
          onClick={onCancel}
        />
      </ActionButtons>
    </div>
  );
}
