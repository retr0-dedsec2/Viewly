import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getAuthToken, setAuthCookie } from '@/lib/auth-tokens'
import { verifyToken, generateToken } from '@/lib/auth'

export async function PATCH(req: NextRequest) {
  try {
    const token = getAuthToken(req)
    const payload = token ? verifyToken(token) : null

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, username, currentPassword, newPassword, avatar } = await req.json()

    const updateData: any = {}

    if (email) {
      const exists = await prisma.user.findUnique({ where: { email } })
      if (exists && exists.id !== payload.userId) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
      }
      updateData.email = email
    }

    if (username) {
      updateData.username = username
    }

    if (avatar !== undefined) {
      updateData.avatar = avatar?.trim() || null
    }

    if (newPassword) {
      const user = await prisma.user.findUnique({ where: { id: payload.userId } })
      if (!user || !user.password) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password required' }, { status: 400 })
      }
      const valid = await bcrypt.compare(currentPassword, user.password)
      if (!valid) {
        return NextResponse.json({ error: 'Invalid current password' }, { status: 401 })
      }
      const hashed = await bcrypt.hash(newPassword, 10)
      updateData.password = hashed
    }

    if (!Object.keys(updateData).length) {
      return NextResponse.json({ error: 'No changes provided' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: payload.userId },
      data: updateData,
    })

    const refreshedToken = generateToken({
      userId: updated.id,
      email: updated.email,
      username: updated.username,
      role: updated.role,
      subscriptionPlan: updated.subscriptionPlan,
    })

    const response = NextResponse.json({
      user: {
        id: updated.id,
        email: updated.email,
        username: updated.username,
        avatar: updated.avatar,
        role: updated.role,
        subscriptionPlan: updated.subscriptionPlan,
        subscriptionExpiresAt: updated.subscriptionExpiresAt,
        hasAds: updated.hasAds,
        createdAt: updated.createdAt,
      },
      token: refreshedToken,
      message: 'Account updated successfully',
    })
    setAuthCookie(response, refreshedToken)
    return response
  } catch (error) {
    console.error('Account update error', error)
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 })
  }
}
