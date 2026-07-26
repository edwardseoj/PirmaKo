import { type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import "./alert-dialog.css";

export interface AlertDialogAction {

  label: string;

  icon?: ReactNode;

  onClick: () => void;

  variant?: "primary" | "danger" | "ghost";
}

interface AlertDialogProps {
  title: string;
  message: string;
  onClose: () => void;

  icon?: ReactNode;

  actions?: AlertDialogAction[];
}

export function AlertDialog({ title, message, onClose, icon, actions }: AlertDialogProps) {
  return (

    <div className="alert-backdrop" onClick={onClose}>
      <div
        className="alert-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="alert-card__icon">
          {icon ?? <AlertTriangle size={24} strokeWidth={1.75} />}
        </div>

        <h2 className="alert-card__title">{title}</h2>

        <p className="alert-card__message">{message}</p>

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
