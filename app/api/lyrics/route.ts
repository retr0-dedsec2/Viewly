import { NextRequest, NextResponse } from 'next/server'
import { getAuthToken } from '@/lib/auth-tokens'
import { verifyToken } from '@/lib/auth'

type CachedLyrics = {
  lyrics: string
  expiresAt: number
}

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour
const FREE_QUOTA = 3
const QUOTA_WINDOW_MS = 60 * 60 * 1000 // 1 hour

const lyricCache = new Map<string, CachedLyrics>()
const quotaTracker = new Map<string, { count: number; windowStart: number }>()

function normalizeKey(artist: string, title: string) {
  return `${artist.trim().toLowerCase()}|${title.trim().toLowerCase()}`
}

function getClientId(req: NextRequest, userId?: string | null) {
  if (userId) return `user:${userId}`
  const forwarded = req.headers.get('x-forwarded-for') || ''
  const ip = forwarded.split(',')[0]?.trim() || 'unknown'
  return `ip:${ip}`
}

function checkQuota(identity: string) {
  const now = Date.now()
  const entry = quotaTracker.get(identity)
  if (!entry || now - entry.windowStart > QUOTA_WINDOW_MS) {
    quotaTracker.set(identity, { count: 0, windowStart: now })
    return { remaining: FREE_QUOTA, exceeded: false }
  }
  const remaining = Math.max(FREE_QUOTA - entry.count, 0)
  return { remaining, exceeded: entry.count >= FREE_QUOTA }
}

function consumeQuota(identity: string) {
  const now = Date.now()
  const entry = quotaTracker.get(identity)
  if (!entry || now - entry.windowStart > QUOTA_WINDOW_MS) {
    quotaTracker.set(identity, { count: 1, windowStart: now })
    return { remaining: FREE_QUOTA - 1 }
  }
  entry.count += 1
  quotaTracker.set(identity, entry)
  return { remaining: Math.max(FREE_QUOTA - entry.count, 0) }
}

async function fetchFromLrcLib(artist: string, title: string) {
  const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`
  const res = await fetch(url, { next: { revalidate: 300 } })
  if (!res.ok) return null
  const data = await res.json()
  return data?.plainLyrics || data?.syncedLyrics || null
}

async function fetchFromLyricsOvh(artist: string, title: string) {
  const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
  const res = await fetch(url, { next: { revalidate: 300 } })
  if (!res.ok) return null
  const data = await res.json()
  return data?.lyrics || null
}

export async function GET(req: NextRequest) {
  const artist = req.nextUrl.searchParams.get('artist') || ''
  const title = req.nextUrl.searchParams.get('title') || ''

  if (!artist || !title) {
    return NextResponse.json({ error: 'artist and title are required' }, { status: 400 })
  }

  const token = getAuthToken(req)
  const payload = token ? verifyToken(token) : null
  const isPremium = payload?.subscriptionPlan === 'PREMIUM'
  const cacheKey = normalizeKey(artist, title)
  const identity = getClientId(req, payload?.userId)

  const cached = lyricCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({
      lyrics: cached.lyrics,
      cached: true,
      remainingQuota: isPremium ? null : checkQuota(identity).remaining,
    })
  }

  const quota = checkQuota(identity)
  if (!isPremium && quota.exceeded) {
    return NextResponse.json(
      {
        error: 'Lyrics quota reached for the free plan. Try again in a bit or upgrade to Premium.',
        remainingQuota: 0,
      },
      { status: 429 }
    )
  }

  try {
    const remaining = isPremium ? null : consumeQuota(identity).remaining

    const primary = await fetchFromLrcLib(artist, title)
    if (primary) {
      lyricCache.set(cacheKey, { lyrics: primary, expiresAt: Date.now() + CACHE_TTL_MS })
      return NextResponse.json({
        lyrics: primary,
        cached: false,
        remainingQuota: remaining,
      })
    }

    const fallback = await fetchFromLyricsOvh(artist, title)
    if (fallback) {
      lyricCache.set(cacheKey, { lyrics: fallback, expiresAt: Date.now() + CACHE_TTL_MS })
      return NextResponse.json({
        lyrics: fallback,
        cached: false,
        remainingQuota: remaining,
      })
    }

    return NextResponse.json(
      {
        lyrics: null,
        remainingQuota: remaining,
      },
      { status: 404 }
    )
  } catch (error) {
    console.error('Lyrics API error', error)
    return NextResponse.json({ error: 'Failed to fetch lyrics' }, { status: 500 })
  }
}
