import { NextRequest, NextResponse } from 'next/server'
import { consumeQuota, getQuotaSnapshot } from '@/lib/youtube-quota'

// Minimal helper for building playable items when YouTube quota/errors occur.
function msToIsoDuration(ms?: number) {
  if (!ms || ms <= 0) return 'PT0S'
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `PT${minutes}M${seconds}S`
}

async function fetchItunesFallback(limit = 20) {
  const url = `https://itunes.apple.com/search?media=music&limit=${limit}&term=${encodeURIComponent(
    'top hits'
  )}`
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`iTunes fallback failed: ${res.status}`)
    const json = await res.json()
    const items =
      json?.results?.map((track: any) => {
        const artwork = track.artworkUrl100 || ''
        const highResThumb = artwork.replace('100x100', '480x480')
        const thumb = highResThumb || artwork || 'https://via.placeholder.com/480'
        const previewUrl = track.previewUrl || ''
        return {
          id: { videoId: String(track.trackId || track.collectionId || track.artistId || Math.random()) },
          snippet: {
            title: track.trackName || track.collectionName || 'Unknown title',
            channelTitle: track.artistName || 'Unknown artist',
            thumbnails: {
              default: { url: thumb },
              medium: { url: thumb },
              high: { url: thumb },
            },
            description: previewUrl,
          },
          contentDetails: {
            duration: msToIsoDuration(track.trackTimeMillis),
          },
          playback: {
            source: 'itunes',
            previewUrl,
          },
        }
      }) || []

    return {
      items,
      fallback: true,
      source: 'itunes',
      fallbackReason: 'youtube_quota_or_error',
      quota: getQuotaSnapshot('music'),
    }
  } catch (error) {
    console.error('Popular iTunes fallback failed:', error)
    return { items: [], fallback: true, source: 'itunes', quota: getQuotaSnapshot('music') }
  }
}

const POPULAR_CACHE_TTL_MS = 1000 * 60 * 10 // 10 minutes
let popularCache:
  | {
      data: any
      expires: number
    }
  | null = null

export async function GET(request: NextRequest) {
  try {
    if (popularCache && popularCache.expires > Date.now()) {
      return NextResponse.json(popularCache.data)
    }

    const apiKey = process.env.YOUTUBE_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'YOUTUBE_API_KEY is missing on the server' },
        { status: 503 }
      )
    }

    // Respect per-minute music quota; if exceeded, fall back to iTunes previews.
    const quota = consumeQuota('music')
    if (!quota.allowed) {
      const fallback = await fetchItunesFallback(20)
      popularCache = { data: fallback, expires: Date.now() + POPULAR_CACHE_TTL_MS }
      return NextResponse.json(fallback)
    }

    // Get popular music videos
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&chart=mostPopular&videoCategoryId=10&maxResults=20&key=${apiKey}`
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('YouTube popular failed:', response.status, errorText)
      const fallback = await fetchItunesFallback(20)
      popularCache = { data: fallback, expires: Date.now() + POPULAR_CACHE_TTL_MS }
      return NextResponse.json(
        fallback.items.length
          ? fallback
          : { error: 'YouTube API request failed', status: response.status, details: errorText },
        { status: fallback.items.length ? 200 : 502 }
      )
    }

    const data = await response.json()
    popularCache = {
      data,
      expires: Date.now() + POPULAR_CACHE_TTL_MS,
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error('YouTube popular error:', error)
    return NextResponse.json(
      { error: 'Failed to load popular music', details: (error as any)?.message || String(error) },
      { status: 500 }
    )
  }
}
