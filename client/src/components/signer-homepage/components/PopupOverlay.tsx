import type { ReactNode } from "react";

interface PopupOverlayProps {

  children: ReactNode;

  onClose: () => void;
}

export function PopupOverlay({ children, onClose }: PopupOverlayProps) {
  return (
    <div className="signer-popup-overlay" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}
