import { NextRequest, NextResponse } from 'next/server'

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

    // Get popular music videos
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&chart=mostPopular&videoCategoryId=10&maxResults=20&key=${apiKey}`
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('YouTube popular failed:', response.status, errorText)
      return NextResponse.json(
        { error: 'YouTube API request failed', status: response.status, details: errorText },
        { status: 502 }
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
