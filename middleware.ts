import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME, createCsrfToken } from './lib/csrf'

const PROTECTED_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const csp = [
    "default-src 'self'",
    "img-src 'self' data: https://i.ytimg.com https://*.googleapis.com https://*.ggpht.com",
    "media-src 'self' blob:",
    "script-src 'self' 'unsafe-inline' https://www.paypal.com https://www.paypalobjects.com",
    "connect-src 'self' https://www.googleapis.com https://*.googleapis.com https://api.sandbox.paypal.com https://api-m.paypal.com",
    "frame-src https://www.paypal.com https://www.sandbox.paypal.com",
    "style-src 'self' 'unsafe-inline'",
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
  if (!existingToken) {
    response.cookies.set({
      name: CSRF_COOKIE_NAME,
      value: createCsrfToken(),
      httpOnly: false,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
  }

  const isProtectedApiCall =
    PROTECTED_METHODS.has(request.method) &&
    request.nextUrl.pathname.startsWith('/api')

  if (isProtectedApiCall) {
    const cookieToken = existingToken || response.cookies.get(CSRF_COOKIE_NAME)?.value
    const headerToken = request.headers.get(CSRF_HEADER_NAME)

    if (!cookieToken || !headerToken || headerToken !== cookieToken) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        {
          status: 403,
          headers: { 'content-type': 'application/json' },
        }
      )
    }
  }

  return response
}

export const config = {
  matcher: ['/api/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
}
