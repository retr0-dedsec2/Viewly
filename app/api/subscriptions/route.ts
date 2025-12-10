import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, generateToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAuthToken, setAuthCookie } from '@/lib/auth-tokens'
import { calculateExpiryDate, getUserWithActiveSubscription, resolveDurationMs } from '@/lib/subscriptions'

export const dynamic = 'force-dynamic'

function getAuthPayload(req: NextRequest) {
  const token = getAuthToken(req)
  if (!token) return null
  return verifyToken(token)
}

export async function GET(req: NextRequest) {
  const payload = getAuthPayload(req)
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await getUserWithActiveSubscription(payload.userId)

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const latestPayment = await prisma.payment.findFirst({
    where: { userId: payload.userId },
    orderBy: { createdAt: 'desc' },
  })

  const subscription = {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    subscriptionPlan: user.subscriptionPlan,
    subscriptionExpiresAt: user.subscriptionExpiresAt,
    hasAds: user.hasAds,
    createdAt: user.createdAt,
  }

  return NextResponse.json({
    subscription,
    latestPayment: latestPayment
      ? {
          id: latestPayment.id,
          status: latestPayment.status,
          amount: latestPayment.amount,
          currency: latestPayment.currency,
          createdAt: latestPayment.createdAt,
          orderId: latestPayment.orderId,
        }
      : null,
  })
}

export async function POST(req: NextRequest) {
  try {
    const payload = getAuthPayload(req)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan, durationDays, durationMonths, extendExisting } = await req.json()
    if (!['FREE', 'PREMIUM'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }
    if (
      (durationDays !== undefined && (typeof durationDays !== 'number' || durationDays <= 0)) ||
      (durationMonths !== undefined && (typeof durationMonths !== 'number' || durationMonths <= 0))
    ) {
      return NextResponse.json({ error: 'Invalid duration' }, { status: 400 })
    }

    const user = await getUserWithActiveSubscription(payload.userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isPremium = plan === 'PREMIUM'
    const durationMs = resolveDurationMs({ durationDays, durationMonths })
    const baseDate =
      (extendExisting ?? true) &&
      user.subscriptionPlan === 'PREMIUM' &&
      user.subscriptionExpiresAt &&
      user.subscriptionExpiresAt.getTime() > Date.now()
        ? user.subscriptionExpiresAt
        : new Date()
    const subscriptionExpiresAt = isPremium ? calculateExpiryDate(durationMs, baseDate) : null

    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        subscriptionPlan: plan,
        subscriptionExpiresAt,
        hasAds: !isPremium,
      },
    })

    const token = generateToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      role: updatedUser.role,
      subscriptionPlan: updatedUser.subscriptionPlan,
    })

    const response = NextResponse.json({
      token,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        avatar: updatedUser.avatar,
        role: updatedUser.role,
        subscriptionPlan: updatedUser.subscriptionPlan,
        subscriptionExpiresAt: updatedUser.subscriptionExpiresAt,
        hasAds: updatedUser.hasAds,
        createdAt: updatedUser.createdAt,
      },
      message: isPremium
        ? `Subscription upgraded to Premium until ${updatedUser.subscriptionExpiresAt?.toLocaleDateString()}.`
        : 'Switched to Free plan. Ads have been re-enabled.',
    })
    setAuthCookie(response, token)
    return response
  } catch (error) {
    console.error('Subscription update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
