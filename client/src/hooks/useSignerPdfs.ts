import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../lib/api";
import type { SortOption } from "../lib/constants";

export interface SignerPdfRecord {
  id: number;
  title: string;
  filename: string;
  status: "Pending" | "Signed";

  uploaded_at: string;

  requester_email: string | null;
}

export type { SortOption } from "../lib/constants";

export function useSignerPdfs() {
  const [pdfs, setPdfs] = useState<SignerPdfRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>("newest");
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/pdfs?sort=${sort}`);
        const data = await res.json();
        if (!cancelled) {

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

      setFetchKey((k) => k + 1);
    },
    []
  );

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
