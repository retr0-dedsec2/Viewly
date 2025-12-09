import { NextRequest, NextResponse } from 'next/server'
import { sanitizeSearchQuery } from '@/lib/sanitize'
import { getAuthToken } from '@/lib/auth-tokens'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeTasteQuery } from '@/lib/taste-queries'

export const dynamic = 'force-dynamic'

const CACHE_TTL_MS = 1000 * 60 * 5 // 5 minutes
const CACHE_MAX_ENTRIES = 50
const searchCache = new Map<
  string,
  { data: any; expires: number }
>()

const SAMPLE_DATA = {
  items: [
    {
      id: { videoId: 'kJQP7kiw5Fk' },
      snippet: {
        title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
        channelTitle: 'Luis Fonsi',
        thumbnails: {
          high: { url: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg' },
        },
      },
      contentDetails: { duration: 'PT4M42S' },
    },
    {
      id: { videoId: 'fRh_vgS2dFE' },
      snippet: {
        title: 'Justin Bieber - Sorry (PURPOSE : The Movement)',
        channelTitle: 'Justin Bieber',
        thumbnails: {
          high: { url: 'https://i.ytimg.com/vi/fRh_vgS2dFE/hqdefault.jpg' },
        },
      },
      contentDetails: { duration: 'PT3M20S' },
    },
    {
      id: { videoId: '3JZ4pnNtyxQ' },
      snippet: {
        title: 'Mark Ronson - Uptown Funk ft. Bruno Mars',
        channelTitle: 'Mark Ronson',
        thumbnails: {
          high: { url: 'https://i.ytimg.com/vi/OPf0YbXqDm0/hqdefault.jpg' },
        },
      },
      contentDetails: { duration: 'PT4M31S' },
    },
  ],
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
  try {
    const searchParams = request.nextUrl.searchParams
    const rawQuery = searchParams.get('q') || ''
    const maxResults = searchParams.get('maxResults') || '10'
    const order = searchParams.get('order') || 'relevance'

    const { sanitized, isRejected } = sanitizeSearchQuery(rawQuery)
    if (isRejected || !sanitized) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }
    const query = sanitized

    const safeMaxResults = Math.min(Math.max(parseInt(maxResults, 10) || 10, 1), 25)

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

    // YouTube Data API v3 endpoint
    // Note: You'll need to add your YouTube API key to .env.local
    const apiKey = process.env.YOUTUBE_API_KEY

    if (!apiKey) {
      // Fallback: Return mock data if API key is not configured
      return NextResponse.json(SAMPLE_DATA)
    }

    const allowedOrders = new Set(['relevance', 'date', 'rating', 'viewCount'])
    const safeOrder = allowedOrders.has(order) ? order : 'relevance'

    const cacheKey = `${query}::${safeMaxResults}::${safeOrder}`
    const cached = getCache(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Build YouTube API URL with order parameter
    const orderParam = safeOrder === 'relevance' ? '' : `&order=${safeOrder}`
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&q=${encodeURIComponent(
        query
      )}&maxResults=${safeMaxResults}${orderParam}&key=${apiKey}`
    )

    const data = response.ok ? await response.json() : SAMPLE_DATA

    // Get video details including duration
    if (response.ok && data.items && data.items.length > 0) {
      const videoIds = data.items.map((item: any) => item.id.videoId).join(',')
      const detailsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${apiKey}`
      )

      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json()
        // Merge duration info
        data.items = data.items.map((item: any) => {
          const details = detailsData.items.find(
            (d: any) => d.id === item.id.videoId
          )
          return {
            ...item,
            contentDetails: details?.contentDetails,
          }
        })
      }
    }

    setCache(cacheKey, data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('YouTube search error:', error)
    return NextResponse.json(
      // Fallback to sample data on error so the UI can still show tracks
      SAMPLE_DATA
    )
  }
}
