import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAuthToken } from '@/lib/auth-tokens'
import {
  calculateExpiryDate,
  enforceSubscriptionExpiry,
  getUserWithActiveSubscription,
  resolveDurationMs,
} from '@/lib/subscriptions'

export const dynamic = 'force-dynamic'

function isAdmin(req: NextRequest) {
  const token = getAuthToken(req)
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload || payload.role !== 'ADMIN') return null
  return payload
}

export async function GET(req: NextRequest) {
  const payload = isAdmin(req)
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      subscriptionPlan: true,
      subscriptionExpiresAt: true,
      hasAds: true,
      createdAt: true,
    },
  })

  const normalized = await Promise.all(users.map((user) => enforceSubscriptionExpiry(user as any)))
  const safeUsers = normalized.map((u) => ({
    id: u.id,
    email: u.email,
    username: u.username,
    role: u.role,
    subscriptionPlan: u.subscriptionPlan,
    subscriptionExpiresAt: u.subscriptionExpiresAt,
    hasAds: (u as any).hasAds,
    createdAt: u.createdAt,
  }))

  return NextResponse.json({ users: safeUsers })
}

export async function PATCH(req: NextRequest) {
  const payload = isAdmin(req)
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { userId, role, subscriptionPlan, durationDays, durationMonths, extendExisting } = body

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }
  if (
    (durationDays !== undefined && (typeof durationDays !== 'number' || durationDays <= 0)) ||
    (durationMonths !== undefined && (typeof durationMonths !== 'number' || durationMonths <= 0))
  ) {
    return NextResponse.json({ error: 'Invalid duration' }, { status: 400 })
  }

  const existing = await getUserWithActiveSubscription(userId)
  if (!existing) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const updateData: any = {}
  if (role) {
    if (!['USER', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }
    updateData.role = role
  }

  if (subscriptionPlan) {
    if (!['FREE', 'PREMIUM'].includes(subscriptionPlan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }
    const isPremium = subscriptionPlan === 'PREMIUM'
    const durationMs = resolveDurationMs({ durationDays, durationMonths })
    const baseDate =
      (extendExisting ?? true) &&
      existing.subscriptionPlan === 'PREMIUM' &&
      existing.subscriptionExpiresAt &&
      existing.subscriptionExpiresAt.getTime() > Date.now()
        ? existing.subscriptionExpiresAt
        : new Date()
    updateData.subscriptionPlan = subscriptionPlan
    updateData.subscriptionExpiresAt = isPremium ? calculateExpiryDate(durationMs, baseDate) : null
    updateData.hasAds = !isPremium
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        role: updatedUser.role,
        subscriptionPlan: updatedUser.subscriptionPlan,
        subscriptionExpiresAt: updatedUser.subscriptionExpiresAt,
        hasAds: updatedUser.hasAds,
        createdAt: updatedUser.createdAt,
      },
    })
  } catch (error) {
    console.error('Admin user update error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
