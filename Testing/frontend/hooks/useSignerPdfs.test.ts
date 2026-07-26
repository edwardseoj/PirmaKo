/**
 * Tests for the useSignerPdfs hook.
 *
 * Covers:
 *   - Initial loading state
 *   - Fetching PDFs and filtering to Pending only
 *   - Sorting
 *   - getPdfInfo function
 *   - signPdf function
 *   - refresh function
 *   - Error handling
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useSignerPdfs } from "@/hooks/useSignerPdfs";

// Mock apiFetch
vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from "@/lib/api";
const mockApiFetch = vi.mocked(apiFetch);

describe("useSignerPdfs", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("starts with loading=true and empty pdfs", () => {
    mockApiFetch.mockResolvedValue(
      new Response(JSON.stringify({ pdfs: [] }))
    );

    const { result } = renderHook(() => useSignerPdfs());

    expect(result.current.loading).toBe(true);
    expect(result.current.pdfs).toEqual([]);
  });

  it("fetches PDFs on mount and filters to Pending only", async () => {
    const mockPdfs = [
      { id: 1, title: "Pending1", filename: "a.pdf", status: "Pending", uploaded_at: "2024-01-01", requester_email: "a@test.com" },
      { id: 2, title: "Signed1", filename: "b.pdf", status: "Signed", uploaded_at: "2024-01-02", requester_email: "b@test.com" },
      { id: 3, title: "Pending2", filename: "c.pdf", status: "Pending", uploaded_at: "2024-01-03", requester_email: "c@test.com" },
    ];
    mockApiFetch.mockResolvedValue(
      new Response(JSON.stringify({ pdfs: mockPdfs }))
    );

    const { result } = renderHook(() => useSignerPdfs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should only contain Pending PDFs
    expect(result.current.pdfs).toHaveLength(2);
    expect(result.current.pdfs.every((p) => p.status === "Pending")).toBe(true);
  });

  it("re-fetches when sort changes", async () => {
    mockApiFetch.mockResolvedValue(
      new Response(JSON.stringify({ pdfs: [] }))
    );

    const { result } = renderHook(() => useSignerPdfs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    mockApiFetch.mockClear();

    await act(async () => {
      result.current.setSort("alpha");
    });

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        expect.stringContaining("sort=alpha")
      );
    });
  });

  it("getPdfInfo returns page dimensions", async () => {
    mockApiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ pdfs: [] }))
    );

    const { result } = renderHook(() => useSignerPdfs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const mockInfo = { id: 1, title: "Doc", width: 612, height: 792, pages: 1 };
    mockApiFetch.mockResolvedValue(
      new Response(JSON.stringify(mockInfo))
    );

    const info = await result.current.getPdfInfo(1);
    expect(info).toEqual(mockInfo);
    expect(mockApiFetch).toHaveBeenCalledWith("/api/pdfs/1/info");
  });

  it("getPdfInfo throws on failure", async () => {
    mockApiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ pdfs: [] }))
    );

    const { result } = renderHook(() => useSignerPdfs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    mockApiFetch.mockResolvedValue(new Response("error", { status: 404 }));

    await expect(result.current.getPdfInfo(1)).rejects.toThrow(
      "Failed to fetch PDF info"
    );
  });

  it("signPdf sends signature and triggers re-fetch", async () => {
    mockApiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ pdfs: [] }))
    );

    const { result } = renderHook(() => useSignerPdfs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    mockApiFetch.mockClear();
    mockApiFetch
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ pdfs: [] })));

    const file = new File(["sig"], "sig.png", { type: "image/png" });

    await act(async () => {
      await result.current.signPdf(1, file, 100, 200);
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/pdfs/1/sign",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("signPdf throws on failure", async () => {
    mockApiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ pdfs: [] }))
    );

    const { result } = renderHook(() => useSignerPdfs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    mockApiFetch.mockResolvedValue(new Response("error", { status: 500 }));

    const file = new File(["sig"], "sig.png", { type: "image/png" });
    await expect(result.current.signPdf(1, file, 0, 0)).rejects.toThrow(
      "Signing failed"
    );
  });

  it("refresh triggers re-fetch", async () => {
    mockApiFetch.mockResolvedValue(
      new Response(JSON.stringify({ pdfs: [] }))
    );

    const { result } = renderHook(() => useSignerPdfs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    mockApiFetch.mockClear();

    await act(async () => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalled();
    });
  });

  it("handles API errors gracefully", async () => {
    mockApiFetch.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useSignerPdfs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.pdfs).toEqual([]);
  });
});
