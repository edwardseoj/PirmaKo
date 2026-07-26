/**
 * ActionButtons.tsx — A reusable row of icon action buttons.
 *
 * What it does:
 *   - Renders a flexible row of icon buttons with optional text labels.
 *   - Each button has a tooltip for accessibility.
 *   - Used in both the PDF viewer and editor popups.
 *   - Buttons can be icon-only (circular) or icon+text (pill-shaped).
 *
 * Usage:
 *   <ActionButtons>
 *     <ActionButton icon={<Check />} label="Sign" tooltip="Sign this document" color="green" onClick={onSign} filled />
 *     <ActionButton icon={<CircleX />} label="Cancel" tooltip="Cancel signing" color="red" onClick={onCancel} />
 *   </ActionButtons>
 */

import type { ReactNode } from "react";

/** Wraps a group of ActionButton components in a flex row. */
export function ActionButtons({ children }: { children: ReactNode }) {
  return <div className="signer-action-buttons">{children}</div>;
}

interface ActionButtonProps {
  /** The Lucide icon to render inside the button. */
  icon: ReactNode;
  /** Optional text label shown next to the icon. When omitted, renders icon-only. */
  label?: string;
  /** Tooltip text shown on hover (also used as aria-label). */
  tooltip: string;
  /** Color theme: "green" for confirm, "red" for cancel, "indigo" for primary. */
  color: "green" | "red" | "indigo";
  /** Called when the button is clicked. */
  onClick: () => void;
  /** If true, the button uses a filled/solid background. Default is false (outline). */
  filled?: boolean;
  /** If true, the button is visually dimmed and non-interactive. */
  disabled?: boolean;
}

/**
 * A single action button with color theming.
 * When `label` is provided, renders as a pill-shaped button with icon + text.
 * When `label` is omitted, renders as a circular icon-only button.
 */
export function ActionButton({
  icon,
  label,
  tooltip,
  color,
  onClick,
  filled = false,
  disabled = false,
}: ActionButtonProps) {
  // Build CSS class names based on color, filled state, label, and disabled state
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
