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

/** Estimated size of the signature element (used for initial clamping). */
const SIGNATURE_WIDTH = 160;
const SIGNATURE_HEIGHT = 40;

/** Starting position — top-left corner, will be centered once the container renders. */
const DEFAULT_POS: Position = { x: 0, y: 0 };

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
   * Records where the cursor is relative to the signature in container-local
   * coordinates so we can maintain that offset during the drag.
   */
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);

      // Convert mouse position to container-relative coordinates first,
      // then subtract the signature's current position to get the offset.
      // This prevents the signature from "jumping" to the cursor on first move.
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - rect.left - sigPos.x,
        y: e.clientY - rect.top - sigPos.y,
      };
    },
    [sigPos, containerRef]
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

      // Convert current mouse position to container-relative coordinates,
      // then subtract the initial offset to get the new signature position.
      const containerX = e.clientX - rect.left;
      const containerY = e.clientY - rect.top;

      const newX = containerX - dragOffset.current.x;
      const newY = containerY - dragOffset.current.y;

      // Clamp so the signature stays fully inside the container
      setSigPos({
        x: Math.max(0, Math.min(newX, rect.width - SIGNATURE_WIDTH)),
        y: Math.max(0, Math.min(newY, rect.height - SIGNATURE_HEIGHT)),
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

  /**
   * Center the signature horizontally on the canvas and place it
   * near the vertical center. Uses the actual container dimensions
   * so the signature starts in a predictable, visible location.
   */
  const centerPosition = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setSigPos({
      x: Math.max(0, (rect.width - SIGNATURE_WIDTH) / 2),
      y: Math.max(0, (rect.height - SIGNATURE_HEIGHT) / 2),
    });
  }, [containerRef]);

  return { sigPos, handleDragStart, isDragging, resetPosition, centerPosition };
}
