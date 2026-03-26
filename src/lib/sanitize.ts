/**
 * Sanitize an HTML string for safe use in dangerouslySetInnerHTML.
 *
 * Uses a lightweight approach that works in both server (Node) and
 * client (browser) environments without heavy dependencies like jsdom.
 *
 * For JSON-LD scripts and inline script tags, this strips any closing
 * script tags to prevent injection. For HTML content, it strips
 * dangerous tags and attributes.
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return "";

  // Strip any </script> tags that could break out of a script context
  let clean = dirty.replace(/<\/script/gi, "<\\/script");

  // Strip event handler attributes (onclick, onerror, onload, etc.)
  clean = clean.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "");
  clean = clean.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, "");

  // Strip javascript: protocol in href/src attributes
  clean = clean.replace(/(href|src|action)\s*=\s*["']?\s*javascript\s*:/gi, '$1="');

  // Strip <script>, <iframe>, <object>, <embed>, <form> tags entirely
  clean = clean.replace(/<\s*(script|iframe|object|embed|form)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "");
  clean = clean.replace(/<\s*(script|iframe|object|embed|form)[^>]*\/?>/gi, "");

  return clean;
}
