import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getAuthToken } from '@/lib/auth-tokens'
import { getCredentialStatus } from '@/lib/paypal'

type KeyStatus = { key: string; present: boolean }

const youtubeKeys = ['YOUTUBE_API_KEY', 'NEXT_PUBLIC_YOUTUBE_API_KEY']
const adsenseKeys = ['NEXT_PUBLIC_ADSENSE_CLIENT', 'NEXT_PUBLIC_ADSENSE_SLOT']

function collectKeys(keys: string[]): KeyStatus[] {
  return keys.map((key) => ({ key, present: Boolean(process.env[key]) }))
}

export async function GET(req: NextRequest) {
  const token = getAuthToken(req)
  const payload = token ? verifyToken(token) : null

  if (!payload || payload.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const paypalStatus = getCredentialStatus()

  return NextResponse.json({
    music: {
      youtube: {
        keys: collectKeys(youtubeKeys),
      },
      humming: {
        host: Boolean(process.env.ACR_HOST),
        accessKey: Boolean(process.env.ACR_ACCESS_KEY),
        accessSecret: Boolean(process.env.ACR_ACCESS_SECRET),
      },
      adsense: {
        client: Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT),
        slot: Boolean(process.env.NEXT_PUBLIC_ADSENSE_SLOT),
        keys: collectKeys(adsenseKeys),
      },
    },
    paypal: {
      mode: (process.env.PAYPAL_MODE || process.env.PAYPAL_ENV || 'sandbox').toLowerCase(),
      credentials: paypalStatus,
    },
  })
}
