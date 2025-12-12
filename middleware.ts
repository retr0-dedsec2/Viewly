import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ensureCsrfCookie, verifyCsrf } from './lib/csrf'

const CSRF_FREE_API = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-2fa',
]

const PROTECTED_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function applySecurityHeaders(res: NextResponse) {
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

  res.headers.set('Content-Security-Policy', csp)
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  res.headers.set('X-XSS-Protection', '0')
  return res
}

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  const method = req.method
  const isApi = pathname.startsWith('/api/')
  const bearer =
    req.headers.get('authorization') ||
    req.headers.get('Authorization') ||
    ''
  const hasBearerToken = /^Bearer\s+/i.test(bearer)

  // 1) API + Bearer => pas de CSRF (mobile / SDK)
  if (isApi && hasBearerToken) {
    return applySecurityHeaders(NextResponse.next())
  }

  // 2) login/register/2FA API => pas de CSRF
  if (isApi && CSRF_FREE_API.includes(pathname)) {
    return applySecurityHeaders(NextResponse.next())
  }

  // 3) GET/HEAD/OPTIONS => pas de CSRF
  if (!PROTECTED_METHODS.has(method)) {
    return applySecurityHeaders(NextResponse.next())
  }

  // 4) Vérification CSRF pour le Web (cookies)
  const check = verifyCsrf(req)
  if (check instanceof NextResponse) {
    return applySecurityHeaders(check)
  }

  // 5) Assurer un cookie csrf_token pour le site
  const res = NextResponse.next()
  ensureCsrfCookie(req, res)
  return applySecurityHeaders(res)
}

export const config = {
  matcher: ['/api/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
}
