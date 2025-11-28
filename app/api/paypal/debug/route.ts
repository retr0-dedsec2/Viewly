import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getCredentialStatus } from '@/lib/paypal'

export async function GET(req: NextRequest) {
  // Require authentication; allow admins to inspect credential presence without exposing secrets.
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  const payload = token ? verifyToken(token) : null

  if (!payload || payload.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const status = getCredentialStatus()

  return NextResponse.json({
    clientIdKeys: status.clientId,
    clientSecretKeys: status.clientSecret,
    mode: process.env.PAYPAL_MODE || process.env.PAYPAL_ENV || 'sandbox',
  })
}
