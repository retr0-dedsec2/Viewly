import { NextRequest, NextResponse } from 'next/server'
import { getAuthToken } from '@/lib/auth-tokens'
import { verifyToken } from '@/lib/auth'
import { clearTwoFactorCode, setTwoFactorEnabled, findUserById } from '@/lib/auth-db'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest) {
  try {
    const token = getAuthToken(req)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await req.json()
    const { enabled } = body

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const user = await setTwoFactorEnabled(payload.userId, enabled)
    if (!enabled) {
      await clearTwoFactorCode(user.id)
    }

    const refreshed = await findUserById(user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        hasAds: user.hasAds,
        twoFactorEnabled: refreshed?.twoFactorEnabled,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error('Two-factor toggle failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
