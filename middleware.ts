import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME, createCsrfToken } from './lib/csrf'

const PROTECTED_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const existingToken = request.cookies.get(CSRF_COOKIE_NAME)?.value
  if (!existingToken) {
    response.cookies.set({
      name: CSRF_COOKIE_NAME,
      value: createCsrfToken(),
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
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
