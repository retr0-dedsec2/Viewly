import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME, createCsrfToken } from './lib/csrf'

const PROTECTED_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const csp = [
    "default-src 'self'",
    "img-src 'self' data: https://i.ytimg.com https://*.googleapis.com https://*.ggpht.com https://*.gstatic.com https://pagead2.googlesyndication.com https://tpc.googlesyndication.com",
    "media-src 'self' blob: https://www.youtube.com",
    "script-src 'self' 'unsafe-inline' https://www.paypal.com https://www.paypalobjects.com https://www.youtube.com https://www.youtube-nocookie.com https://pagead2.googlesyndication.com https://vercel.live",
    "connect-src 'self' https://www.googleapis.com https://*.googleapis.com https://api.sandbox.paypal.com https://api-m.paypal.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://vercel.live https://*.acrcloud.com",
    "frame-src https://www.paypal.com https://www.sandbox.paypal.com https://www.youtube.com https://www.youtube-nocookie.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  response.headers.set('X-XSS-Protection', '0')

  const existingToken = request.cookies.get(CSRF_COOKIE_NAME)?.value
  const csrfToken = existingToken || createCsrfToken()

  // Always ensure the CSRF cookie is set so the client can read it for protected calls.
  response.cookies.set({
    name: CSRF_COOKIE_NAME,
    value: csrfToken,
    httpOnly: false,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })

  const hasBearerAuth = Boolean(request.headers.get('authorization') || request.headers.get('Authorization'))
  const isProtectedApiCall =
    PROTECTED_METHODS.has(request.method) &&
    request.nextUrl.pathname.startsWith('/api')

  // Skip CSRF checks for API calls that provide an Authorization header (mobile/SDK use case).
  // Keep CSRF for browser flows that rely on cookies.
  if (isProtectedApiCall && !hasBearerAuth) {
    const cookieToken = csrfToken
    const headerToken = request.headers.get(CSRF_HEADER_NAME)

    if (!cookieToken || !headerToken || headerToken !== cookieToken) {
      const denied = NextResponse.json(
        { error: 'Invalid CSRF token' },
        {
          status: 403,
          headers: { 'content-type': 'application/json' },
        }
      )
      // Propagate the CSRF cookie so the next request can succeed
      denied.cookies.set({
        name: CSRF_COOKIE_NAME,
        value: csrfToken,
        httpOnly: false,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      })
      return denied
    }
  }

  return response
}

export const config = {
  matcher: ['/api/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
}
