import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function isAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
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

  return NextResponse.json({ users })
}

export async function PATCH(req: NextRequest) {
  const payload = isAdmin(req)
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { userId, role, subscriptionPlan } = body

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
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
    updateData.subscriptionPlan = subscriptionPlan
    updateData.subscriptionExpiresAt = isPremium
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      : null
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
