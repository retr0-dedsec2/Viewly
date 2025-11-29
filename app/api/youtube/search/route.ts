import { NextRequest, NextResponse } from 'next/server'
import { sanitizeSearchQuery } from '@/lib/sanitize'

export const dynamic = 'force-dynamic'

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

    // Build YouTube API URL with order parameter
    const orderParam = safeOrder === 'relevance' ? '' : `&order=${safeOrder}`
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&q=${encodeURIComponent(
        query
      )}&maxResults=${maxResults}${orderParam}&key=${apiKey}`
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

    return NextResponse.json(data)
  } catch (error) {
    console.error('YouTube search error:', error)
    return NextResponse.json(
      { error: 'Failed to search YouTube' },
      { status: 500 }
    )
  }
}

