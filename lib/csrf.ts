export const CSRF_COOKIE_NAME = 'csrf_token'
export const CSRF_HEADER_NAME = 'X-CSRF-Token'

function getCrypto(): Crypto | undefined {
  const maybeCrypto = typeof globalThis !== 'undefined' ? (globalThis as any).crypto : undefined
  if (!maybeCrypto) return undefined
  if (typeof maybeCrypto.getRandomValues === 'function' || typeof maybeCrypto.randomUUID === 'function') {
    return maybeCrypto as Crypto
  }
  return undefined
}

// Use Web Crypto when available (middleware / client) to avoid Node-only APIs.
export function createCsrfToken() {
  const webCrypto = getCrypto()
  if (webCrypto?.randomUUID) {
    return webCrypto.randomUUID().replace(/-/g, '')
  }
  if (webCrypto?.getRandomValues) {
    const bytes = new Uint8Array(16)
    webCrypto.getRandomValues(bytes)
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  }
  // Fallback to Math.random (non-crypto) for environments without Web Crypto.
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

function getCookieValue(name: string) {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function getCsrfTokenFromCookie() {
  return getCookieValue(CSRF_COOKIE_NAME)
}

export function withCsrfHeader(headers: HeadersInit = {}) {
  const token = getCsrfTokenFromCookie()
  if (!token) return headers

  if (headers instanceof Headers) {
    headers.set(CSRF_HEADER_NAME, token)
    return headers
  }

  return {
    ...headers,
    [CSRF_HEADER_NAME]: token,
  }
}
