/**
 * usePdfFiles.ts — Custom React hook for managing PDF files via the API.
 *
 * Handles:
 * - Fetching the PDF list from the backend
 * - Uploading new PDFs
 * - Deleting PDFs (with confirmation handled in the component)
 * - Downloading PDFs
 * - Updating PDF status (e.g., marking as Signed)
 * - Sorting (newest, oldest, alphabetical)
 * - Loading state for skeleton UI
 *
 * Usage:
 *   const { pdfs, loading, upload, remove, download, updateStatus, sort, setSort } = usePdfFiles()
 */

import { useState, useEffect, useCallback } from "react";

/** Shape of a single PDF record as returned by the API. */
export interface PdfRecord {
  id: number;
  title: string;
  filename: string;
  status: "Pending" | "Signed" | "Failed";
  uploaded_at: string; // ISO-8601 timestamp
}

/** Available sort options. */
export type SortOption = "newest" | "oldest" | "alpha";

export function usePdfFiles() {
  const [pdfs, setPdfs] = useState<PdfRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>("newest");
  const [fetchKey, setFetchKey] = useState(0);

  // ── Fetch PDFs ────────────────────────────────────────────────
  // The actual fetch logic. Called by the effect below.
  // Uses fetchKey to trigger re-fetches without putting setState
  // directly inside useEffect.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/pdfs?sort=${sort}`);
        const data = await res.json();
        if (!cancelled) setPdfs(data.pdfs ?? []);
      } catch (err) {
        console.error("Failed to fetch PDFs:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [sort, fetchKey]); // Re-runs when sort or fetchKey changes

  // ── Upload a PDF ──────────────────────────────────────────────
  // Accepts a File object, sends it to the API, then triggers a re-fetch.
  const upload = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/pdfs", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      // Trigger a re-fetch so the new PDF appears immediately.
      setFetchKey((k) => k + 1);
    },
    []
  );

  // ── Delete a PDF ──────────────────────────────────────────────
  // Sends a DELETE request, then triggers a re-fetch.
  const remove = useCallback(async (id: number) => {
    const res = await fetch(`/api/pdfs/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Delete failed");
    setFetchKey((k) => k + 1);
  }, []);

  // ── Download a PDF ────────────────────────────────────────────
  // Triggers a file download in the browser using a temporary <a> tag.
  const download = useCallback(
    async (id: number, title: string) => {
      const res = await fetch(`/api/pdfs/${id}/download`);
      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    []
  );

  // ── Update status ─────────────────────────────────────────────
  // PATCH request to change a PDF's status (e.g., mark as Signed).
  // When status is "Signed", the backend removes the PDF from the database.
  const updateStatus = useCallback(
    async (id: number, status: "Pending" | "Signed" | "Failed") => {
      const res = await fetch(`/api/pdfs/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Status update failed");
      setFetchKey((k) => k + 1);
    },
    []
  );

  return {
    pdfs,
    loading,
    sort,
    setSort,
    upload,
    remove,
    download,
    updateStatus,
    refresh: () => setFetchKey((k) => k + 1),
  };
}
