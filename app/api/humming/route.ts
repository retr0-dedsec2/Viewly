import { NextRequest, NextResponse } from 'next/server'
import { Music } from '@/types/music'

const AUDD_ENDPOINT = 'https://api.audd.io/'

function extractYouTubeId(url?: string | null) {
  if (!url) return undefined
  const match = url.match(/v=([\\w-]{6,})/) || url.match(/youtu\\.be\\/([\\w-]{6,})/)
  return match?.[1]
}

function mapToMusic(result: any): Music {
  const cover =
    result?.spotify?.album?.images?.[0]?.url ||
    result?.apple_music?.artworkUrl100 ||
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop'

  const id =
    result?.spotify?.id ||
    result?.apple_music?.id ||
    extractYouTubeId(result?.youtube?.link) ||
    `${result?.artist || 'unknown'}-${result?.title || 'track'}`.toLowerCase().replace(/\\s+/g, '-')

  return {
    id,
    title: result?.title || 'Unknown title',
    artist: result?.artist || 'Unknown artist',
    album: result?.album || result?.spotify?.album?.name || 'Unknown album',
    duration: Math.round(result?.timecode || 0),
    cover,
    videoId: extractYouTubeId(result?.youtube?.link),
  }
}

export async function POST(req: NextRequest) {
  const token = process.env.AUDD_API_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'Humming recognition is not configured.' }, { status: 500 })
  }

  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 })
    }

    const forwardForm = new FormData()
    forwardForm.append('api_token', token)
    forwardForm.append('return', 'apple_music,spotify,youtube')
    forwardForm.append('file', file)

    const res = await fetch(AUDD_ENDPOINT, {
      method: 'POST',
      body: forwardForm,
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('Audd request failed', errorText)
      return NextResponse.json({ error: 'Humming service unavailable' }, { status: 502 })
    }

    const data = await res.json()
    if (!data?.result) {
      return NextResponse.json({ error: 'No match found' }, { status: 404 })
    }

    const track = mapToMusic(data.result)
    return NextResponse.json({ track })
  } catch (error) {
    console.error('Humming route error', error)
    return NextResponse.json({ error: 'Unable to process humming audio' }, { status: 500 })
  }
}
