/**
 * useSignerPdfs.ts — Custom hook for the Signer homepage.
 *
 * This is a frontend-only version — no backend or SQLite yet.
 * Uses sample/hardcoded PDF data so the UI can be developed and tested.
 *
 * When the backend is ready, replace the sample data with real API calls
 * (similar to usePdfFiles.ts in the Requester homepage).
 *
 * Features:
 *   - Manages a list of PDFs waiting for signature
 *   - Provides sort functionality (newest, oldest, alphabetical)
 *   - Allows updating a PDF's status (e.g., marking as "Signed")
 *   - Simulates sign/cancel actions with state changes
 */

import { useState, useCallback, useMemo } from "react";

/** Shape of a single PDF record seen by the signer. */
export interface SignerPdfRecord {
  id: number;
  title: string;
  status: "Pending" | "Signed";
  /** ISO-8601 timestamp — when it was pushed for signing. */
  uploaded_at: string;
}

/** Available sort options. */
export type SortOption = "newest" | "oldest" | "alpha";

/**
 * Sample PDF data — hardcoded for now since there's no backend yet.
 * Replace this with a fetch call once the API is ready.
 */
const SAMPLE_PDFS: SignerPdfRecord[] = [
  {
    id: 1,
    title: "Non-Disclosure Agreement",
    status: "Pending",
    uploaded_at: "2026-07-25T14:30:00Z",
  },
  {
    id: 2,
    title: "Employment Contract - Q3 2026",
    status: "Pending",
    uploaded_at: "2026-07-24T09:15:00Z",
  },
  {
    id: 3,
    title: "Project Proposal - Blocklabs",
    status: "Signed",
    uploaded_at: "2026-07-22T16:45:00Z",
  },
  {
    id: 4,
    title: "Service Level Agreement",
    status: "Pending",
    uploaded_at: "2026-07-20T11:00:00Z",
  },
];

export function useSignerPdfs() {
  const [pdfs, setPdfs] = useState<SignerPdfRecord[]>(SAMPLE_PDFS);
  const [sort, setSort] = useState<SortOption>("newest");

  /** Sort and return the PDF list based on the current sort option. */
  const sortedPdfs = useMemo(() => {
    const sorted = [...pdfs];
    switch (sort) {
      case "newest":
        return sorted.sort(
          (a, b) =>
            new Date(b.uploaded_at).getTime() -
            new Date(a.uploaded_at).getTime()
        );
      case "oldest":
        return sorted.sort(
          (a, b) =>
            new Date(a.uploaded_at).getTime() -
            new Date(b.uploaded_at).getTime()
        );
      case "alpha":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return sorted;
    }
  }, [pdfs, sort]);

  /**
   * Mark a PDF as signed.
   * In a real app this would call the backend API.
   */
  const signPdf = useCallback((id: number) => {
    setPdfs((prev) =>
      prev.map((pdf) =>
        pdf.id === id ? { ...pdf, status: "Signed" as const } : pdf
      )
    );
  }, []);

  return {
    pdfs: sortedPdfs,
    sort,
    setSort,
    signPdf,
  };
}
