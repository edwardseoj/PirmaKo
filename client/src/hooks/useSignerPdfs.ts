/**
 * useSignerPdfs.ts — Custom hook for the Signer homepage.
 *
 * Connects to the ElysiaJS backend to fetch and sign PDFs stored in SQLite.
 * Only shows PDFs with "Pending" status (signed PDFs are filtered out).
 *
 * Features:
 *   - Fetches the real PDF list from the API (sorted by backend)
 *   - Provides sort functionality (newest, oldest, alphabetical)
 *   - Signs a PDF by sending the signature image + position to the backend
 *   - Re-fetches the list after signing so the signed PDF disappears
 *   - Loading state for skeleton UI
 */

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../lib/api";
import type { SortOption } from "../lib/constants";

/** Shape of a single PDF record seen by the signer. */
export interface SignerPdfRecord {
  id: number;
  title: string;
  filename: string;
  status: "Pending" | "Signed";
  /** ISO-861 timestamp — when it was pushed for signing. */
  uploaded_at: string;
  /** Email of the requester who uploaded this PDF. */
  requester_email: string | null;
}

// Re-export SortOption for backward compatibility with existing imports
export type { SortOption } from "../lib/constants";

export function useSignerPdfs() {
  const [pdfs, setPdfs] = useState<SignerPdfRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>("newest");
  const [fetchKey, setFetchKey] = useState(0);

  // ── Fetch PDFs from the API ────────────────────────────────────
  // Only shows PDFs that are in "Pending" status (not yet signed).
  // The backend sorts by the chosen option; we filter client-side.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/pdfs?sort=${sort}`);
        const data = await res.json();
        if (!cancelled) {
          // Filter to only show Pending PDFs to the signer
          const pendingPdfs = (data.pdfs ?? []).filter(
            (pdf: SignerPdfRecord) => pdf.status === "Pending"
          );
          setPdfs(pendingPdfs);
        }
      } catch (err) {
        console.error("Failed to fetch PDFs:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sort, fetchKey]);

  /**
   * Fetch PDF page dimensions (width/height in points) from the backend.
   * The frontend needs these to calculate correct signature positions
   * because the iframe's display size doesn't match the actual PDF page size.
   */
  const getPdfInfo = useCallback(async (id: number) => {
    const res = await apiFetch(`/api/pdfs/${id}/info`);
    if (!res.ok) throw new Error("Failed to fetch PDF info");
    return res.json() as Promise<{
      id: number;
      title: string;
      width: number;
      height: number;
      pages: number;
    }>;
  }, []);

  /**
   * Sign a PDF by sending the signature image and position to the backend.
   * posX and posY are in PDF points (not percentages) — the frontend
   * calculates these using the actual PDF page dimensions from getPdfInfo.
   * The backend combines the PDF with the signature, saves it, and marks it as Signed.
   * After signing, we re-fetch the list so the signed PDF disappears.
   */
  const signPdf = useCallback(
    async (id: number, signatureFile: File, posX: number, posY: number) => {
      const formData = new FormData();
      formData.append("signature", signatureFile);
      formData.append("posX", String(posX));
      formData.append("posY", String(posY));

      const res = await apiFetch(`/api/pdfs/${id}/sign`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Signing failed");

      // Re-fetch so the signed PDF is removed from the list
      setFetchKey((k) => k + 1);
    },
    []
  );

  /** Trigger a manual re-fetch (e.g., after external changes). */
  const refresh = useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

  return {
    pdfs,
    loading,
    sort,
    setSort,
    signPdf,
    getPdfInfo,
    refresh,
  };
}
