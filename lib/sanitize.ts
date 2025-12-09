/**
 * Basic sanitization helpers for user-controlled strings.
 * Keeps inputs ASCII-friendly and strips markup-oriented tokens before use.
 */
const TAG_RE = /<[^>]*>?/g
const DANGEROUS_PATTERN = /<|>|javascript:|data:text\/html|onerror=|onload=/i
// Allow letters/numbers across locales without the Unicode regex flag to stay compatible with ES5 targets.
const SAFE_QUERY_PATTERN = /^[A-Za-z0-9À-ÖØ-öø-ÿĀ-žẀ-ỹỲ-ỹ\s\-'&,!.?/()]+$/

export function sanitizeSearchQuery(input: string) {
  const trimmed = input.trim()
  const stripped = trimmed.replace(TAG_RE, '')
  const cleaned = stripped.replace(/[`]/g, '').slice(0, 200)
  const isRejected =
    cleaned.length === 0 ||
    DANGEROUS_PATTERN.test(input) ||
    !SAFE_QUERY_PATTERN.test(cleaned)

  return { sanitized: cleaned, isRejected }
}
