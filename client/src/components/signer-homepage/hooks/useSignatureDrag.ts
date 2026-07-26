import { useState, useEffect, useRef, useCallback } from "react";

export interface Position {
  x: number;
  y: number;
}

const SIGNATURE_WIDTH = 160;
const SIGNATURE_HEIGHT = 40;

const DEFAULT_POS: Position = { x: 0, y: 0 };

export function useSignatureDrag(
  containerRef: React.RefObject<HTMLDivElement | null>
) {

  const [sigPos, setSigPos] = useState<Position>(DEFAULT_POS);

  const [isDragging, setIsDragging] = useState(false);

  const dragOffset = useRef<Position>({ x: 0, y: 0 });

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);

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

  useEffect(() => {
    if (!isDragging) return;

    function handleMouseMove(e: MouseEvent) {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();

      const containerX = e.clientX - rect.left;
      const containerY = e.clientY - rect.top;

      const newX = containerX - dragOffset.current.x;
      const newY = containerY - dragOffset.current.y;

      setSigPos({
        x: Math.max(0, Math.min(newX, rect.width - SIGNATURE_WIDTH)),
        y: Math.max(0, Math.min(newY, rect.height - SIGNATURE_HEIGHT)),
      });
    }

    function handleMouseUp() {
      setIsDragging(false);
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, containerRef]);

  const resetPosition = useCallback(() => {
    setSigPos(DEFAULT_POS);
  }, []);

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
