/**
 * Tests for the apiFetch() helper function (api.ts).
 *
 * Covers:
 *   - Adding Authorization header when token exists
 *   - Not adding Authorization header when no token
 *   - Passing through custom headers
 *   - Passing through request options
 *   - Merging with existing headers
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiFetch } from "@/lib/api";

describe("apiFetch()", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("sends request without Authorization header when no token is stored", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("ok")
    );

    await apiFetch("/api/test");

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [, options] = fetchSpy.mock.calls[0];
    const headers = options.headers as Headers;
    expect(headers.has("Authorization")).toBe(false);
  });

  it("adds Authorization header when token is in localStorage", async () => {
    localStorage.setItem("pirmako_token", "test-jwt-token");

    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("ok")
    );

    await apiFetch("/api/test");

    const [, options] = fetchSpy.mock.calls[0];
    const headers = options.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer test-jwt-token");
  });

  it("passes through the request URL correctly", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("ok")
    );

    await apiFetch("/api/pdfs?sort=newest");

    const [url] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/pdfs?sort=newest");
  });

  it("passes through custom HTTP method", async () => {
    localStorage.setItem("pirmako_token", "token");

    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("ok")
    );

    await apiFetch("/api/pdfs/1", { method: "DELETE" });

    const [, options] = fetchSpy.mock.calls[0];
    expect(options.method).toBe("DELETE");
  });

  it("preserves existing headers when adding Authorization", async () => {
    localStorage.setItem("pirmako_token", "token");

    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("ok")
    );

    await apiFetch("/api/test", {
      headers: { "Content-Type": "application/json" },
    });

    const [, options] = fetchSpy.mock.calls[0];
    const headers = options.headers as Headers;
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("Authorization")).toBe("Bearer token");
  });

  it("returns the fetch Response directly", async () => {
    const mockResponse = new Response(JSON.stringify({ data: 1 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    vi.spyOn(global, "fetch").mockResolvedValue(mockResponse);

    const result = await apiFetch("/api/test");

    expect(result).toBe(mockResponse);
    expect(result.status).toBe(200);
  });

  it("propagates fetch errors", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    await expect(apiFetch("/api/test")).rejects.toThrow("Network error");
  });
});
