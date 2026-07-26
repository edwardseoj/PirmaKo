import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { usePdfFiles } from "@/hooks/usePdfFiles";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from "@/lib/api";
const mockApiFetch = vi.mocked(apiFetch);

describe("usePdfFiles", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("starts with loading=true and empty pdfs", () => {
    mockApiFetch.mockResolvedValue(
      new Response(JSON.stringify({ pdfs: [] }))
    );

    const { result } = renderHook(() => usePdfFiles());

    expect(result.current.loading).toBe(true);
    expect(result.current.pdfs).toEqual([]);
  });

  it("fetches PDFs on mount with default sort", async () => {
    const mockPdfs = [
      { id: 1, title: "Doc1", filename: "f.pdf", status: "Pending", uploaded_at: "2024-01-01", requester_email: "a@test.com" },
    ];
    mockApiFetch.mockResolvedValue(
      new Response(JSON.stringify({ pdfs: mockPdfs }))
    );

    const { result } = renderHook(() => usePdfFiles());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.pdfs).toEqual(mockPdfs);
    expect(mockApiFetch).toHaveBeenCalledWith(
      expect.stringContaining("sort=newest")
    );
  });

  it("passes requester_email when provided", async () => {
    mockApiFetch.mockResolvedValue(
      new Response(JSON.stringify({ pdfs: [] }))
    );

    renderHook(() => usePdfFiles("user@test.com"));

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        expect.stringContaining("requester_email=user%40test.com")
      );
    });
  });

  it("re-fetches when sort changes", async () => {
    mockApiFetch.mockResolvedValue(
      new Response(JSON.stringify({ pdfs: [] }))
    );

    const { result } = renderHook(() => usePdfFiles());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    mockApiFetch.mockClear();

    await act(async () => {
      result.current.setSort("oldest");
    });

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        expect.stringContaining("sort=oldest")
      );
    });
  });

  it("upload triggers re-fetch", async () => {
    mockApiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ pdfs: [{ id: 1 }] }))
    );

    const { result } = renderHook(() => usePdfFiles());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    mockApiFetch.mockClear();
    mockApiFetch.mockResolvedValue(new Response("ok", { status: 200 }));

    await act(async () => {
      const file = new File(["test"], "test.pdf", { type: "application/pdf" });
      await result.current.upload(file, "user@test.com");
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/pdfs",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("upload throws on failure", async () => {
    mockApiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ pdfs: [] }))
    );

    const { result } = renderHook(() => usePdfFiles());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    mockApiFetch.mockResolvedValue(new Response("error", { status: 500 }));

    const file = new File(["test"], "test.pdf", { type: "application/pdf" });
    await expect(result.current.upload(file)).rejects.toThrow("Upload failed");
  });

  it("remove triggers re-fetch", async () => {
    mockApiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ pdfs: [] }))
    );

    const { result } = renderHook(() => usePdfFiles());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    mockApiFetch.mockClear();
    mockApiFetch.mockResolvedValue(new Response(JSON.stringify({ success: true })));

    await act(async () => {
      await result.current.remove(1);
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/api/pdfs/1", { method: "DELETE" });
  });

  it("remove throws on failure", async () => {
    mockApiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ pdfs: [] }))
    );

    const { result } = renderHook(() => usePdfFiles());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    mockApiFetch.mockResolvedValue(new Response("error", { status: 404 }));

    await expect(result.current.remove(1)).rejects.toThrow("Delete failed");
  });

  it("updateStatus triggers re-fetch", async () => {
    mockApiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ pdfs: [] }))
    );

    const { result } = renderHook(() => usePdfFiles());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    mockApiFetch.mockClear();
    mockApiFetch.mockResolvedValue(new Response(JSON.stringify({ success: true })));

    await act(async () => {
      await result.current.updateStatus(1, "Signed");
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/pdfs/1/status",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "Signed" }),
      })
    );
  });

  it("updateStatus throws on failure", async () => {
    mockApiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ pdfs: [] }))
    );

    const { result } = renderHook(() => usePdfFiles());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    mockApiFetch.mockResolvedValue(new Response("error", { status: 400 }));

    await expect(result.current.updateStatus(1, "Failed")).rejects.toThrow(
      "Status update failed"
    );
  });

  it("refresh triggers re-fetch", async () => {
    mockApiFetch.mockResolvedValue(
      new Response(JSON.stringify({ pdfs: [] }))
    );

    const { result } = renderHook(() => usePdfFiles());

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

  it("handles empty pdfs response gracefully", async () => {
    mockApiFetch.mockResolvedValue(new Response(JSON.stringify({})));

    const { result } = renderHook(() => usePdfFiles());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.pdfs).toEqual([]);
  });
});
