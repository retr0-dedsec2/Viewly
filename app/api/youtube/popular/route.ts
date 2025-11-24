import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY

    if (!apiKey) {
      // Return popular music videos as fallback
      return NextResponse.json({
        items: [
          {
            id: 'kJQP7kiw5Fk',
            snippet: {
              title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
              channelTitle: 'Luis Fonsi',
              thumbnails: {
                high: {
                  url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
                },
              },
            },
            contentDetails: {
              duration: 'PT3M48S',
            },
          },
          {
            id: 'kJQP7kiw5Fk',
            snippet: {
              title: 'Ed Sheeran - Shape of You',
              channelTitle: 'Ed Sheeran',
              thumbnails: {
                high: {
                  url: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=300&h=300&fit=crop',
                },
              },
            },
            contentDetails: {
              duration: 'PT3M53S',
            },
          },
        ],
      })
    }

    // Get popular music videos
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&chart=mostPopular&videoCategoryId=10&maxResults=20&key=${apiKey}`
    )

    if (!response.ok) {
      throw new Error('YouTube API request failed')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('YouTube popular error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch popular videos' },
      { status: 500 }
    )
  }
}

