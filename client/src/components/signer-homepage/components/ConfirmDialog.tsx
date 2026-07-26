import { AlertTriangle, Check, X } from "lucide-react";

interface ConfirmDialogProps {

  message: string;

  onConfirm: () => void;

  onCancel: () => void;
}

export function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (

    <div className="alert-backdrop" onClick={onCancel}>
      <div
        className="alert-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="alert-card__icon">
          <AlertTriangle size={24} strokeWidth={1.75} />
        </div>

        <h2 className="alert-card__title">Confirm Action</h2>
        <p className="alert-card__message">{message}</p>

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
