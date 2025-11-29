import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getCredentialStatus } from '@/lib/paypal'
import { getAuthToken } from '@/lib/auth-tokens'

export async function GET(req: NextRequest) {
  // Require authentication; allow admins to inspect credential presence without exposing secrets.
  const token = getAuthToken(req)
  const payload = token ? verifyToken(token) : null

  if (!payload || payload.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const status = getCredentialStatus()

  return NextResponse.json({
    clientIdKeys: status.clientId,
    clientSecretKeys: status.clientSecret,
    merchantEmailKeys: status.merchantEmail,
    mode: process.env.PAYPAL_MODE || process.env.PAYPAL_ENV || 'sandbox',
  })
}
