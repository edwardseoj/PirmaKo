import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface PdfRenderInfo {

  pdfWidth: number;

  pdfHeight: number;

  renderWidth: number;

  renderHeight: number;

  offsetX: number;

  offsetY: number;

  scale: number;
}

export function usePdfRenderer(
  pdfUrl: string,
  containerRef: React.RefObject<HTMLDivElement | null>
) {

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [renderInfo, setRenderInfo] = useState<PdfRenderInfo | null>(null);

  const renderingRef = useRef(false);

  const renderPdf = useCallback(async () => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || renderingRef.current) return;

    renderingRef.current = true;

    try {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.status}`);
      const pdfData = await response.arrayBuffer();

      const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
      const page = await pdf.getPage(1);

      const originalViewport = page.getViewport({ scale: 1 });
      const pdfWidth = originalViewport.width;
      const pdfHeight = originalViewport.height;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      const scale = Math.min(
        containerWidth / pdfWidth,
        containerHeight / pdfHeight
      );

      const renderWidth = pdfWidth * scale;
      const renderHeight = pdfHeight * scale;

      const offsetX = (containerWidth - renderWidth) / 2;
      const offsetY = (containerHeight - renderHeight) / 2;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = containerWidth * dpr;
      canvas.height = containerHeight * dpr;
      canvas.style.width = `${containerWidth}px`;
      canvas.style.height = `${containerHeight}px`;

      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, containerWidth, containerHeight);

      ctx.save();
      ctx.translate(offsetX, offsetY);

      const scaledViewport = page.getViewport({ scale });
      await page.render({
        canvasContext: ctx,
        canvas: canvas,
        viewport: scaledViewport,
      }).promise;

      ctx.restore();

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

  useEffect(() => {
    const timer = setTimeout(renderPdf, 50);
    return () => clearTimeout(timer);
  }, [renderPdf]);

  return { canvasRef, renderInfo };
}
