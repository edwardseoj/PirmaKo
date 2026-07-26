/**
 * usePdfRenderer.ts — Custom hook that renders a PDF page to a canvas element
 * using pdf.js (pdfjs-dist). This gives us exact control over how the PDF
 * is rendered, which is critical for accurate signature positioning.
 *
 * Why canvas instead of iframe?
 *   The browser's built-in PDF viewer (used in iframes) renders PDFs with
 *   unknown scaling, centering offsets, and toolbars. This makes it impossible
 *   to accurately map pixel positions from the UI to PDF coordinates.
 *   By rendering to a canvas ourselves, we know exactly:
 *   - The scale factor applied
 *   - The offset where the PDF starts in the canvas
 *   - The exact mapping between pixel positions and PDF points
 *
 * Usage:
 *   const { canvasRef, renderInfo } = usePdfRenderer(pdfUrl, containerRef);
 *
 * Returns:
 *   - canvasRef: attach this to the <canvas> element
 *   - renderInfo: contains pdfWidth, pdfHeight, scale, offsetX, offsetY
 *                 for accurate coordinate mapping
 */

import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";

// Use the CDN-hosted worker to avoid Vite build configuration issues.
// The worker runs PDF parsing in a separate thread for better performance.
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/** Information about how the PDF was rendered to the canvas. */
export interface PdfRenderInfo {
  /** Original PDF page width in PDF points (e.g., 612 for US Letter) */
  pdfWidth: number;
  /** Original PDF page height in PDF points (e.g., 792 for US Letter) */
  pdfHeight: number;
  /** Actual rendered width of the PDF on the canvas (CSS pixels) */
  renderWidth: number;
  /** Actual rendered height of the PDF on the canvas (CSS pixels) */
  renderHeight: number;
  /** X offset where the PDF content starts within the canvas (CSS pixels) */
  offsetX: number;
  /** Y offset where the PDF content starts within the canvas (CSS pixels) */
  offsetY: number;
  /** Scale factor applied during rendering (renderedSize = pdfSize * scale) */
  scale: number;
}

/**
 * Renders a PDF page to a canvas element with accurate coordinate mapping.
 *
 * @param pdfUrl - URL to fetch the PDF from (e.g., "/api/pdfs/1/download")
 * @param containerRef - Ref to the container div that wraps the canvas.
 *                       The canvas will be sized to fill this container.
 */
export function usePdfRenderer(
  pdfUrl: string,
  containerRef: React.RefObject<HTMLDivElement | null>
) {
  // Ref to the <canvas> element where the PDF is rendered
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // The rendering info (scale, offsets, PDF dimensions) — null until rendered
  const [renderInfo, setRenderInfo] = useState<PdfRenderInfo | null>(null);

  // Track if a render is in progress to avoid double-renders
  const renderingRef = useRef(false);

  /**
   * Core rendering function — loads the PDF, calculates the correct scale
   * and offset, then renders to the canvas.
   */
  const renderPdf = useCallback(async () => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || renderingRef.current) return;

    renderingRef.current = true;

    try {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Fetch the PDF binary data from the server
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.status}`);
      const pdfData = await response.arrayBuffer();

      // Load the PDF document and get the first page
      const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
      const page = await pdf.getPage(1);

      // Get the original PDF page dimensions (in PDF points, not pixels)
      // A PDF point = 1/72 inch. US Letter is 612x792 points.
      const originalViewport = page.getViewport({ scale: 1 });
      const pdfWidth = originalViewport.width;
      const pdfHeight = originalViewport.height;

      // Get the container's display dimensions (CSS pixels)
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Calculate scale to fit the PDF in the container while preserving aspect ratio.
      // We use "contain" logic: the PDF fills as much as possible without stretching.
      const scale = Math.min(
        containerWidth / pdfWidth,
        containerHeight / pdfHeight
      );

      // The actual size the PDF will be rendered at on the canvas
      const renderWidth = pdfWidth * scale;
      const renderHeight = pdfHeight * scale;

      // Center the PDF within the container (offset from top-left)
      const offsetX = (containerWidth - renderWidth) / 2;
      const offsetY = (containerHeight - renderHeight) / 2;

      // Set canvas size to match container, accounting for device pixel ratio
      // for sharp rendering on Retina/HiDPI displays
      const dpr = window.devicePixelRatio || 1;
      canvas.width = containerWidth * dpr;
      canvas.height = containerHeight * dpr;
      canvas.style.width = `${containerWidth}px`;
      canvas.style.height = `${containerHeight}px`;

      // Scale the drawing context for HiDPI, then clear with white background
      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, containerWidth, containerHeight);

      // Translate the canvas context so the PDF renders centered
      // (instead of at 0,0 which would be top-left)
      ctx.save();
      ctx.translate(offsetX, offsetY);

      // Render the PDF page at the calculated scale
      const scaledViewport = page.getViewport({ scale });
      await page.render({
        canvasContext: ctx,
        canvas: canvas,
        viewport: scaledViewport,
      }).promise;

      ctx.restore();

      // Store the rendering info so the parent can calculate coordinates
      const info: PdfRenderInfo = {
        pdfWidth,
        pdfHeight,
        renderWidth,
        renderHeight,
        offsetX,
        offsetY,
        scale,
      };
      setRenderInfo(info);
    } catch (err) {
      console.error("Failed to render PDF to canvas:", err);
    } finally {
      renderingRef.current = false;
    }
  }, [pdfUrl, containerRef]);

  // Render the PDF once when the component mounts (with a small delay
  // to ensure the container has its layout dimensions calculated)
  useEffect(() => {
    const timer = setTimeout(renderPdf, 50);
    return () => clearTimeout(timer);
  }, [renderPdf]);

  return { canvasRef, renderInfo };
}
