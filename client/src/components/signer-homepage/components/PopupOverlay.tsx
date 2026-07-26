/**
 * PopupOverlay.tsx — A reusable backdrop overlay for modal popups.
 *
 * What it does:
 *   - Covers the entire screen with a dark, semi-transparent background.
 *   - Applies a blur effect behind the overlay for a "frosted glass" look.
 *   - Clicking the overlay (not the content inside) triggers the onClose callback.
 *   - Uses a smooth fade-in animation when appearing.
 *
 * Usage:
 *   <PopupOverlay onClose={() => setOpen(false)}>
 *     <div>Your popup content here</div>
 *   </PopupOverlay>
 */

import type { ReactNode } from "react";

interface PopupOverlayProps {
  /** Content to display inside the popup (centered on screen). */
  children: ReactNode;
  /** Called when the user clicks the dark backdrop (outside the content). */
  onClose: () => void;
}

export function PopupOverlay({ children, onClose }: PopupOverlayProps) {
  return (
    <div className="signer-popup-overlay" onClick={onClose}>
      {/* stopPropagation prevents clicks inside the popup from closing it */}
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}
