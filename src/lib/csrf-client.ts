/**
 * Client-side CSRF token helper.
 *
 * Reads the `csrf-token` cookie set by the middleware and returns it
 * for inclusion in state-changing request headers.
 */

const CSRF_COOKIE_NAME = "csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Read the CSRF token from cookies.
 */
export function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${CSRF_COOKIE_NAME}=`));
  return match ? match.split("=")[1] : null;
}

/**
 * Build headers object that includes the CSRF token for state-changing requests.
 */
export function csrfHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extra,
  };
  const token = getCsrfToken();
  if (token) {
    headers[CSRF_HEADER_NAME] = token;
  }
  return headers;
}

/**
 * Drop-in replacement for fetch() that automatically includes the CSRF token
 * on state-changing methods (POST, PUT, PATCH, DELETE).
 */
export async function csrfFetch(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const method = (init?.method || "GET").toUpperCase();
  const needsCsrf = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  if (needsCsrf) {
    const token = getCsrfToken();
    const headers = new Headers(init?.headers);
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (token) {
      headers.set(CSRF_HEADER_NAME, token);
    }
    return fetch(url, { ...init, headers, credentials: "include" });
  }

  return fetch(url, { ...init, credentials: "include" });
}
