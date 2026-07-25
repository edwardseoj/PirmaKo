/**
 * useSignatureDrag.ts — Custom hook that handles the drag-and-drop
 * behavior for placing a signature on the PDF editor page.
 *
 * How it works:
 *   1. The user presses (mousedown) on the signature element.
 *   2. As the mouse moves, the signature follows within the PDF page bounds.
 *   3. When the mouse is released, the signature stays in its new position.
 *
 * The signature position is stored as pixel offsets relative to the
 * PDF page container, so it stays correct even if the container scrolls.
 *
 * Returns:
 *   - sigPos: { x, y } — current position of the signature in pixels
 *   - handleDragStart: call this from the signature's onMouseDown event
 *   - isDragging: true while the user is actively dragging
 */

import { useState, useEffect, useRef, useCallback } from "react";

/** Position in pixels relative to the container. */
export interface Position {
  x: number;
  y: number;
}

/** The size of the signature element (used to clamp within bounds). */
const SIGNATURE_WIDTH = 160;
const SIGNATURE_HEIGHT = 40;

/** Starting position — centered horizontally, near the bottom. */
const DEFAULT_POS: Position = { x: 50, y: 250 };

/**
 * Custom hook for handling signature drag-and-drop within a container.
 *
 * @param containerRef - A React ref to the draggable area (the PDF page element).
 *                       The hook measures this element to keep the signature in bounds.
 */
export function useSignatureDrag(
  containerRef: React.RefObject<HTMLDivElement | null>
) {
  // Current position of the signature (relative to the container's top-left)
  const [sigPos, setSigPos] = useState<Position>(DEFAULT_POS);

  // True while the user is holding the mouse button and moving
  const [isDragging, setIsDragging] = useState(false);

  // Stores the offset between the mouse cursor and the signature's top-left corner.
  // This prevents the signature from "jumping" to the cursor when drag starts.
  const dragOffset = useRef<Position>({ x: 0, y: 0 });

  /**
   * Called when the user presses the mouse button on the signature element.
   * Records where the cursor is relative to the signature so we can maintain
   * that offset during the drag.
   */
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);

      // Calculate the offset: how far the cursor is from the signature's top-left.
      // This way, the signature doesn't snap to the cursor position on first move.
      dragOffset.current = {
        x: e.clientX - sigPos.x,
        y: e.clientY - sigPos.y,
      };
    },
    [sigPos]
  );

  /**
   * While dragging, listen for mouse move and mouse up on the whole document.
   * This allows the user to drag outside the container and still get smooth movement.
   */
  useEffect(() => {
    if (!isDragging) return;

    function handleMouseMove(e: MouseEvent) {
      const container = containerRef.current;
      if (!container) return;

      // Get the container's position on screen right now (accounts for any scrolling)
      const rect = container.getBoundingClientRect();

      // Calculate new position relative to the container's top-left corner
      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;

      // Clamp so the signature stays fully inside the container
      setSigPos({
        x: Math.max(0, Math.min(newX - rect.left, rect.width - SIGNATURE_WIDTH)),
        y: Math.max(0, Math.min(newY - rect.top, rect.height - SIGNATURE_HEIGHT)),
      });
    }

    function handleMouseUp() {
      setIsDragging(false);
    }

    // Attach listeners to the whole document so dragging works even outside the box
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, containerRef]);

  /** Reset the signature to its default position. */
  const resetPosition = useCallback(() => {
    setSigPos(DEFAULT_POS);
  }, []);

  return { sigPos, handleDragStart, isDragging, resetPosition };
}
