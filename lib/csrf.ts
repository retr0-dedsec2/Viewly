import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'

export const CSRF_COOKIE_NAME = 'csrf_token'
export const CSRF_HEADER_NAME = 'x-csrf-token'

function generateToken() {
  return crypto.randomUUID().replace(/-/g, '')
}

export function verifyCsrf(req: NextRequest) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return null

  const csrfCookie = req.cookies.get(CSRF_COOKIE_NAME)?.value
  const csrfHeader = req.headers.get(CSRF_HEADER_NAME)

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return new NextResponse(JSON.stringify({ error: 'Invalid CSRF token' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return null
}

export function ensureCsrfCookie(req: NextRequest, res: NextResponse) {
  const existing = req.cookies.get(CSRF_COOKIE_NAME)?.value

  if (!existing) {
    const token = generateToken()
    res.cookies.set({
      name: CSRF_COOKIE_NAME,
      value: token,
      httpOnly: false,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
  }

  return res
}

// Client helper: attach CSRF header when cookie exists (no auto-gen here to avoid bypass).
export function withCsrfHeader(headers: HeadersInit = {}) {
  const token = typeof document !== 'undefined'
    ? document.cookie
        .split('; ')
        .find((c) => c.startsWith(`${CSRF_COOKIE_NAME}=`))
        ?.split('=')[1]
    : undefined

  if (!token) return headers

  if (headers instanceof Headers) {
    headers.set(CSRF_HEADER_NAME, token)
    return headers
  }

  return { ...headers, [CSRF_HEADER_NAME]: token }
}
