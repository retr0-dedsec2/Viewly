import { NextRequest, NextResponse } from 'next/server'

export const AUTH_COOKIE_NAME = 'auth_token'
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export function getAuthToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '')
  }

  return req.cookies.get(AUTH_COOKIE_NAME)?.value || null
}

export function setAuthCookie(res: NextResponse, token: string) {
  res.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE,
  })
}

export function clearAuthCookie(res: NextResponse) {
  res.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    expires: new Date(0),
    path: '/',
  })
}
