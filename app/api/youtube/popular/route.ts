import { NextRequest, NextResponse } from 'next/server'

const POPULAR_CACHE_TTL_MS = 1000 * 60 * 10 // 10 minutes
let popularCache:
  | {
      data: any
      expires: number
    }
  | null = null

const SAMPLE_POPULAR = {
  items: [
    {
      id: 'kJQP7kiw5Fk',
      snippet: {
        title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
        channelTitle: 'Luis Fonsi',
        thumbnails: {
          high: {
            url: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
          },
        },
      },
      contentDetails: {
        duration: 'PT3M48S',
      },
    },
    {
      id: 'JGwWNGJdvx8',
      snippet: {
        title: 'Ed Sheeran - Shape of You',
        channelTitle: 'Ed Sheeran',
        thumbnails: {
          high: {
            url: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg',
          },
        },
      },
      contentDetails: {
        duration: 'PT3M53S',
      },
    },
    {
      id: 'fRh_vgS2dFE',
      snippet: {
        title: 'Justin Bieber - Sorry (PURPOSE : The Movement)',
        channelTitle: 'Justin Bieber',
        thumbnails: {
          high: {
            url: 'https://i.ytimg.com/vi/fRh_vgS2dFE/hqdefault.jpg',
          },
        },
      },
      contentDetails: {
        duration: 'PT3M20S',
      },
    },
  ],
}

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
      throw new Error('YouTube API request failed')
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
      { error: 'Failed to fetch popular videos' },
      { status: 500 }
    )
  }
}

