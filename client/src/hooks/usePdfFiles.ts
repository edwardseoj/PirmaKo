import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../lib/api";
import type { SortOption } from "../lib/constants";

export interface PdfRecord {
  id: number;
  title: string;
  filename: string;
  status: "Pending" | "Signed" | "Failed";
  uploaded_at: string;

  requester_email: string | null;

}

export type { SortOption } from "../lib/constants";

export function usePdfFiles(requesterEmail?: string) {
  const [pdfs, setPdfs] = useState<PdfRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>("newest");
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {

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
  }, [sort, fetchKey, requesterEmail]);

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

      setFetchKey((k) => k + 1);
    },
    []
  );

  const remove = useCallback(async (id: number) => {
    const res = await apiFetch(`/api/pdfs/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Delete failed");
    setFetchKey((k) => k + 1);
  }, []);

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
