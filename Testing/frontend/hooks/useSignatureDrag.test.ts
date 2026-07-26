/**
 * Tests for the useSignatureDrag hook.
 *
 * Covers:
 *   - Initial position is (0, 0)
 *   - handleDragStart sets up offset tracking
 *   - Mouse move updates position during drag
 *   - Mouse up ends dragging
 *   - Position clamping within container bounds
 *   - resetPosition resets to (0, 0)
 *   - centerPosition centers the signature
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSignatureDrag, type Position } from "@/components/signer-homepage/hooks/useSignatureDrag";
import { createRef } from "react";

// Create a mock container element with getBoundingClientRect
function createMockContainer(width = 500, height = 400) {
  return {
    current: {
      getBoundingClientRect: () => ({
        top: 0,
        left: 0,
        width,
        height,
        right: width,
        bottom: height,
        x: 0,
        y: 0,
        toJSON: () => {},
      }),
    } as React.RefObject<HTMLDivElement>,
  };
}

describe("useSignatureDrag", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("starts at position (0, 0)", () => {
    const container = createMockContainer();
    const { result } = renderHook(() => useSignatureDrag(container));

    expect(result.current.sigPos).toEqual({ x: 0, y: 0 });
  });

  it("is not dragging initially", () => {
    const container = createMockContainer();
    const { result } = renderHook(() => useSignatureDrag(container));

    expect(result.current.isDragging).toBe(false);
  });

  it("handleDragStart sets isDragging to true", () => {
    const container = createMockContainer();
    const { result } = renderHook(() => useSignatureDrag(container));

    act(() => {
      result.current.handleDragStart({
        preventDefault: vi.fn(),
        clientX: 100,
        clientY: 100,
      } as unknown as React.MouseEvent);
    });

    expect(result.current.isDragging).toBe(true);
  });

  it("resets position to (0, 0) with resetPosition", () => {
    const container = createMockContainer();
    const { result } = renderHook(() => useSignatureDrag(container));

    act(() => {
      result.current.centerPosition();
    });

    // Position should now be centered
    expect(result.current.sigPos.x).toBeGreaterThan(0);

    act(() => {
      result.current.resetPosition();
    });

    expect(result.current.sigPos).toEqual({ x: 0, y: 0 });
  });

  it("centerPosition centers the signature", () => {
    const container = createMockContainer(500, 400);
    const { result } = renderHook(() => useSignatureDrag(container));

    act(() => {
      result.current.centerPosition();
    });

    // SIGNATURE_WIDTH = 160, SIGNATURE_HEIGHT = 40
    // x = (500 - 160) / 2 = 170
    // y = (400 - 40) / 2 = 180
    expect(result.current.sigPos).toEqual({ x: 170, y: 180 });
  });

  it("clamps position to container bounds during drag", () => {
    const container = createMockContainer(300, 200);
    const { result } = renderHook(() => useSignatureDrag(container));

    // Start drag at a position
    act(() => {
      result.current.handleDragStart({
        preventDefault: vi.fn(),
        clientX: 50,
        clientY: 50,
      } as unknown as React.MouseEvent);
    });

    // Simulate mouse move beyond container bounds
    act(() => {
      const mouseMoveEvent = new MouseEvent("mousemove", {
        clientX: 1000,
        clientY: 1000,
        bubbles: true,
      });
      document.dispatchEvent(mouseMoveEvent);
    });

    // Should be clamped to container dimensions minus signature size
    // SIGNATURE_WIDTH = 160, SIGNATURE_HEIGHT = 40
    // maxX = 300 - 160 = 140
    // maxY = 200 - 40 = 160
    expect(result.current.sigPos.x).toBeLessThanOrEqual(140);
    expect(result.current.sigPos.y).toBeLessThanOrEqual(160);
    expect(result.current.sigPos.x).toBeGreaterThanOrEqual(0);
    expect(result.current.sigPos.y).toBeGreaterThanOrEqual(0);
  });

  it("mouse up ends dragging", () => {
    const container = createMockContainer();
    const { result } = renderHook(() => useSignatureDrag(container));

    act(() => {
      result.current.handleDragStart({
        preventDefault: vi.fn(),
        clientX: 100,
        clientY: 100,
      } as unknown as React.MouseEvent);
    });

    expect(result.current.isDragging).toBe(true);

    act(() => {
      document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    });

    expect(result.current.isDragging).toBe(false);
  });
});
