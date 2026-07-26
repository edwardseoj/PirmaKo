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
import { apiFetch } from "../lib/api";
import type { SortOption } from "../lib/constants";

/** Shape of a single PDF record as returned by the API. */
export interface PdfRecord {
  id: number;
  title: string;
  filename: string;
  status: "Pending" | "Signed" | "Failed";
  uploaded_at: string; // ISO-8601 timestamp
  requester_email: string | null; // Email of the requester who uploaded this PDF
}

// Re-export SortOption for backward compatibility with existing imports
export type { SortOption } from "../lib/constants";

/**
 * Custom hook for managing PDF files via the API.
 *
 * Accepts an optional requesterEmail parameter. When provided,
 * only PDFs uploaded by that email are returned. This ensures
 * each requester only sees their own uploads.
 *
 * @param requesterEmail - Optional email to filter PDFs by. When omitted, returns all PDFs.
 */
export function usePdfFiles(requesterEmail?: string) {
  const [pdfs, setPdfs] = useState<PdfRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>("newest");
  const [fetchKey, setFetchKey] = useState(0);

  // ── Fetch PDFs ────────────────────────────────────────────────
  // The actual fetch logic. Called by the effect below.
  // Uses fetchKey to trigger re-fetches without putting setState
  // directly inside useEffect.
  // When requesterEmail is provided, the backend filters results
  // so requesters only see their own uploaded PDFs.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        // Build query params — include requester_email if provided
        const params = new URLSearchParams({ sort });
        if (requesterEmail) {
          params.set("requester_email", requesterEmail);
        }
        const res = await apiFetch(`/api/pdfs?${params.toString()}`);
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
  }, [sort, fetchKey, requesterEmail]); // Re-runs when sort, fetchKey, or requesterEmail changes

  // ── Upload a PDF ──────────────────────────────────────────────
  // Accepts a File object and the requester's email, sends it to the API,
  // then triggers a re-fetch. The email links the PDF to the uploader.
  const upload = useCallback(
    async (file: File, requesterEmail?: string) => {
      const formData = new FormData();
      formData.append("file", file);
      if (requesterEmail) {
        formData.append("requester_email", requesterEmail);
      }

      const res = await apiFetch("/api/pdfs", {
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
    const res = await apiFetch(`/api/pdfs/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Delete failed");
    setFetchKey((k) => k + 1);
  }, []);

  // ── Download a PDF ────────────────────────────────────────────
  // Triggers a file download in the browser using a temporary <a> tag.
  const download = useCallback(
    async (id: number, title: string) => {
      const res = await apiFetch(`/api/pdfs/${id}/download`);
      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${title}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    },
    []
  );

  // ── Update status ─────────────────────────────────────────────
  // PATCH request to change a PDF's status (e.g., mark as Signed).
  // When status is "Signed", the backend removes the PDF from the database.
  const updateStatus = useCallback(
    async (id: number, status: "Pending" | "Signed" | "Failed") => {
      const res = await apiFetch(`/api/pdfs/${id}/status`, {
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
