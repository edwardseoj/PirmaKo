/**
 * ActionButtons.tsx — A reusable row of icon-only action buttons.
 *
 * What it does:
 *   - Renders a flexible row of circular icon buttons.
 *   - Each button has a tooltip for accessibility.
 *   - Used in both the PDF viewer and editor popups.
 *
 * Usage:
 *   <ActionButtons>
 *     <ActionButton icon={<Check />} tooltip="Confirm" color="green" onClick={onConfirm} />
 *     <ActionButton icon={<X />} tooltip="Cancel" color="red" onClick={onCancel} />
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
  /** Tooltip text shown on hover (also used as aria-label). */
  tooltip: string;
  /** Color theme: "green" for confirm, "red" for cancel, "indigo" for primary. */
  color: "green" | "red" | "indigo";
  /** Called when the button is clicked. */
  onClick: () => void;
  /** If true, the button uses a filled/solid background. Default is false (outline). */
  filled?: boolean;
}

/**
 * A single circular icon button with color theming.
 * No text — just the icon and a tooltip for clarity.
 */
export function ActionButton({
  icon,
  tooltip,
  color,
  onClick,
  filled = false,
}: ActionButtonProps) {
  // Build CSS class names based on color and filled state
  const className = [
    "signer-action-btn",
    `signer-action-btn--${color}`,
    filled ? "signer-action-btn--filled" : "",
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
    >
      {icon}
    </button>
  );
}
