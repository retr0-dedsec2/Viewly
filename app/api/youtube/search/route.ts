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
      return NextResponse.json({
        items: [
          {
            id: { videoId: 'dQw4w9WgXcQ' },
            snippet: {
              title: `${query} - Music Video`,
              channelTitle: 'Artist Name',
              thumbnails: {
                high: {
                  url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
                },
              },
            },
            contentDetails: {
              duration: 'PT3M33S',
            },
          },
        ],
      })
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

    if (!response.ok) {
      throw new Error('YouTube API request failed')
    }

    const data = await response.json()

    // Get video details including duration
    if (data.items && data.items.length > 0) {
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
      { error: 'Failed to search YouTube' },
      { status: 500 }
    )
  }
}

