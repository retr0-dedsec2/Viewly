import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { findUserById, clearTwoFactorCode } from '@/lib/auth-db'
import { generateToken } from '@/lib/auth'
import { setAuthCookie } from '@/lib/auth-tokens'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, code } = body

    if (!userId || !code) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const user = await findUserById(userId)
    if (!user || !user.twoFactorEnabled || !user.twoFactorCode || !user.twoFactorExpiresAt) {
      return NextResponse.json({ error: 'Two-factor not enabled or invalid user' }, { status: 400 })
    }

    if (user.twoFactorExpiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Code expired' }, { status: 400 })
    }

    const isValid = await bcrypt.compare(code, user.twoFactorCode)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 401 })
    }

    await clearTwoFactorCode(user.id)

    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      subscriptionPlan: user.subscriptionPlan,
    })

    const response = NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        hasAds: user.hasAds,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt,
      },
    })
    setAuthCookie(response, token)
    return response
  } catch (error) {
    console.error('2FA verify error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
