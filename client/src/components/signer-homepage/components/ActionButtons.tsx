import type { ReactNode } from "react";

export function ActionButtons({ children }: { children: ReactNode }) {
  return <div className="signer-action-buttons">{children}</div>;
}

interface ActionButtonProps {

  icon: ReactNode;

  label?: string;

  tooltip: string;

  color: "green" | "red" | "indigo";

  onClick: () => void;

  filled?: boolean;

  disabled?: boolean;
}

export function ActionButton({
  icon,
  label,
  tooltip,
  color,
  onClick,
  filled = false,
  disabled = false,
}: ActionButtonProps) {

  const className = [
    "signer-action-btn",
    `signer-action-btn--${color}`,
    filled ? "signer-action-btn--filled" : "",
    label ? "signer-action-btn--with-label" : "",
    disabled ? "signer-action-btn--disabled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={className}
      onClick={onClick}
      type="button"
      title={tooltip}
      aria-label={tooltip}
      disabled={disabled}
    >
      {icon}
      {label && <span className="signer-action-btn__label">{label}</span>}
    </button>
  );
}
