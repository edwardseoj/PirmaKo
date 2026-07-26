/**
 * api.ts — Helper for making authenticated API requests.
 *
 * Wraps the native fetch() to automatically include the JWT token
 * from localStorage in the Authorization header. This keeps the
 * token handling in one place instead of repeating it in every hook.
 *
 * Usage:
 *   const data = await apiFetch("/api/pdfs?sort=newest");
 *   const res = await apiFetch("/api/pdfs", { method: "POST", body: formData });
 */

/** Get the stored JWT token (returns null if not logged in). */
function getToken(): string | null {
  return localStorage.getItem("pirmako_token");
}

/**
 * Make a fetch request with the Authorization header automatically added.
 * Works exactly like the native fetch() — same parameters, same return type.
 * If no token exists, the request is sent without auth (for public endpoints).
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();

  // Merge the Authorization header with any existing headers
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
