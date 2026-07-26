/**
 * formatDate.ts — Shared date formatting utilities.
 *
 * Eliminates the same toLocaleDateString/toLocaleTimeString pattern
 * that was repeated in PdfRow, SignerPdfRow, and PdfViewerPopup.
 */

/** Compact date format: "Jan 15, 2025" */
export function formatShortDate(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Long date format: "January 15, 2025" */
export function formatLongDate(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Time format: "2:30 PM" */
export function formatTime(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
