/**
 * Validate a redirect target is a safe, same-origin relative path.
 * Rejects absolute URLs, protocol-relative URLs, and javascript: URIs.
 */
export function sanitizeRedirect(
  url: string | null | undefined,
  fallback = "/room"
): string {
  if (!url) return fallback;
  // Must start with exactly one slash (relative path)
  // Reject: //, https://, javascript:, data:, etc.
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  return fallback;
}
