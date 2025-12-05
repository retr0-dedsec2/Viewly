import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PaymentStatus } from '@prisma/client'
import { getAuthToken } from '@/lib/auth-tokens'
import { verifyToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const token = getAuthToken(req)
  const payload = token ? verifyToken(token) : null

  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orderToken = req.nextUrl.searchParams.get('token') || req.nextUrl.searchParams.get('orderId')
  if (!orderToken) {
    return NextResponse.json({ error: 'Missing PayPal order token' }, { status: 400 })
  }

  await prisma.payment.updateMany({
    where: { orderId: orderToken },
    data: { status: PaymentStatus.CANCELLED },
  })

  return NextResponse.json({ status: 'cancelled' })
}
