import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize an HTML string using DOMPurify.
 * Works in both server (Node) and client (browser) environments
 * via isomorphic-dompurify.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty);
}
