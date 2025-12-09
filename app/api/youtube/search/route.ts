import { NextRequest, NextResponse } from 'next/server'
import { sanitizeSearchQuery } from '@/lib/sanitize'
import { getAuthToken } from '@/lib/auth-tokens'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeTasteQuery } from '@/lib/taste-queries'

export const dynamic = 'force-dynamic'

const CACHE_TTL_MS = 1000 * 60 * 5 // 5 minutes
const CACHE_MAX_ENTRIES = 50
const searchCache = new Map<string, { data: any; expires: number }>()

function msToIsoDuration(ms?: number) {
  if (!ms || ms <= 0) return 'PT0S'
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `PT${minutes}M${seconds}S`
}

function buildSampleData(query: string) {
  const base = [
    {
      id: { videoId: 'kJQP7kiw5Fk' },
      snippet: {
        title: `${query} (mix)`,
        channelTitle: 'Viewly Recommendations',
        thumbnails: {
          high: { url: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg' },
        },
      },
      contentDetails: { duration: 'PT3M30S' },
    },
    {
      id: { videoId: 'fRh_vgS2dFE' },
      snippet: {
        title: `${query} (official audio)`,
        channelTitle: 'Viewly Recommendations',
        thumbnails: {
          high: { url: 'https://i.ytimg.com/vi/fRh_vgS2dFE/hqdefault.jpg' },
        },
      },
      contentDetails: { duration: 'PT4M02S' },
    },
    {
      id: { videoId: 'OPf0YbXqDm0' },
      snippet: {
        title: `${query} (remix)`,
        channelTitle: 'Viewly Recommendations',
        thumbnails: {
          high: { url: 'https://i.ytimg.com/vi/OPf0YbXqDm0/hqdefault.jpg' },
        },
      },
      contentDetails: { duration: 'PT2M58S' },
    },
  ]
  return { items: base, fallback: true }
}

async function fetchITunesFallback(query: string, limit: number) {
  const url = `https://itunes.apple.com/search?media=music&limit=${limit}&term=${encodeURIComponent(
    query
  )}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`iTunes fallback failed: ${res.status}`)
  }
  const json = await res.json()
  const items =
    json?.results?.map((track: any) => {
      const artwork = track.artworkUrl100 || ''
      const highResThumb = artwork.replace('100x100', '480x480')
      return {
        id: { videoId: String(track.trackId || track.collectionId || track.artistId || Math.random()) },
        snippet: {
          title: track.trackName || track.collectionName || 'Unknown title',
          channelTitle: track.artistName || 'Unknown artist',
          thumbnails: {
            high: { url: highResThumb || artwork || 'https://via.placeholder.com/480' },
          },
        },
        contentDetails: {
          duration: msToIsoDuration(track.trackTimeMillis),
        },
      }
    }) || []

  return { items, fallback: true, source: 'itunes' }
}

function getCache(key: string) {
  const cached = searchCache.get(key)
  if (cached && cached.expires > Date.now()) return cached.data
  if (cached) searchCache.delete(key)
  return null
}

function setCache(key: string, data: any) {
  searchCache.set(key, { data, expires: Date.now() + CACHE_TTL_MS })

  if (searchCache.size > CACHE_MAX_ENTRIES) {
    const entries = Array.from(searchCache.entries()).sort((a, b) => a[1].expires - b[1].expires)
    for (const [entryKey] of entries.slice(0, searchCache.size - CACHE_MAX_ENTRIES)) {
      searchCache.delete(entryKey)
    }
  }
}

export async function GET(request: NextRequest) {
  let query = ''
  try {
    const searchParams = request.nextUrl.searchParams
    const rawQuery = searchParams.get('q') || ''
    const maxResults = searchParams.get('maxResults') || '12'
    const order = searchParams.get('order') || 'relevance'

    const { sanitized, isRejected } = sanitizeSearchQuery(rawQuery)
    if (isRejected || !sanitized) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }
    query = sanitized

    const safeMaxResults = Math.min(Math.max(parseInt(maxResults, 10) || 12, 1), 25)

    // Log search to user history when authenticated
    try {
      const token = getAuthToken(request)
      const decoded = token ? verifyToken(token) : null
      if (decoded?.userId) {
        const tasteQuery = normalizeTasteQuery(query)
        if (tasteQuery) {
          await prisma.searchHistory.create({
            data: {
              userId: decoded.userId,
              query: tasteQuery,
            },
          })
        }
      }
    } catch (error) {
      console.error('Failed to log search history:', error)
    }

    const apiKey = process.env.YOUTUBE_API_KEY

    if (!apiKey) {
      return NextResponse.json(buildSampleData(query), { status: 200 })
    }

    const allowedOrders = new Set(['relevance', 'date', 'rating', 'viewCount'])
    const safeOrder = allowedOrders.has(order) ? order : 'relevance'

    const cacheKey = `${query}::${safeMaxResults}::${safeOrder}`
    const cached = getCache(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const orderParam = safeOrder === 'relevance' ? '' : `&order=${safeOrder}`
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(
      query
    )}&maxResults=${safeMaxResults}${orderParam}&key=${apiKey}&videoCategoryId=10`

    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('YouTube search failed:', response.status, errorText)

      // Try to serve a previously cached live response for this query
      const cachedAfterFailure = getCache(cacheKey)
      if (cachedAfterFailure) {
        return NextResponse.json(cachedAfterFailure)
      }

      // Try iTunes as a fallback to avoid empty UI when YouTube quota is exceeded
      try {
        const itunesData = await fetchITunesFallback(query, safeMaxResults)
        setCache(cacheKey, itunesData)
        return NextResponse.json(itunesData)
      } catch (itunesError) {
        console.error('iTunes fallback failed:', itunesError)
      }

      return NextResponse.json(buildSampleData(query), { status: 200 })
    }

    const data = await response.json()

    setCache(cacheKey, data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('YouTube search error:', error)
    // Try iTunes as last resort inside catch as well
    try {
      const fallback = await fetchITunesFallback(query, 10)
      return NextResponse.json(fallback)
    } catch (itunesError) {
      console.error('iTunes fallback failed in catch:', itunesError)
    }

    return NextResponse.json(buildSampleData(query), { status: 200 })
  }
}
