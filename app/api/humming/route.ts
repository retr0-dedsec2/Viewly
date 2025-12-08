import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { Music } from '@/types/music'

function extractYouTubeId(url?: string | null) {
  if (!url) return undefined
  const match = url.match(/v=([\w-]{6,})/) || url.match(/youtu\.be\/([\w-]{6,})/)
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
    `${result?.artist || 'unknown'}-${result?.title || 'track'}`.toLowerCase().replace(/\s+/g, '-')

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
  const host = process.env.ACR_HOST
  const accessKey = process.env.ACR_ACCESS_KEY
  const accessSecret = process.env.ACR_ACCESS_SECRET

  if (!host || !accessKey || !accessSecret) {
    return NextResponse.json({ error: 'Humming recognition is not configured.' }, { status: 500 })
  }

  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const sampleBytes = buffer.byteLength

    const dataType = 'audio'
    const signatureVersion = '1'
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const stringToSign = ['POST', '/v1/identify', accessKey, dataType, signatureVersion, timestamp].join('\n')
    const signature = crypto.createHmac('sha1', accessSecret).update(stringToSign).digest('base64')

    const forwardForm = new FormData()
    forwardForm.append('sample', new Blob([buffer]), 'humming.webm')
    forwardForm.append('sample_bytes', sampleBytes.toString())
    forwardForm.append('access_key', accessKey)
    forwardForm.append('data_type', dataType)
    forwardForm.append('signature_version', signatureVersion)
    forwardForm.append('signature', signature)
    forwardForm.append('timestamp', timestamp)

    const endpoint = host.startsWith('http') ? `${host}/v1/identify` : `https://${host}/v1/identify`
    const res = await fetch(endpoint, {
      method: 'POST',
      body: forwardForm,
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('ACR request failed', errorText)
      return NextResponse.json({ error: 'Humming service unavailable' }, { status: 502 })
    }

    const data = await res.json()
    const result = data?.metadata?.music?.[0]
    if (!result) {
      return NextResponse.json({ error: 'No match found' }, { status: 404 })
    }

    const track = mapToMusic({
      title: result.title,
      artist: result.artists?.[0]?.name,
      album: result.album?.name,
      spotify: result.external_metadata?.spotify,
      apple_music: result.external_metadata?.apple_music,
      youtube: { link: result.external_metadata?.youtube?.vid ? `https://youtu.be/${result.external_metadata.youtube.vid}` : undefined },
      timecode: result.play_offset_ms ? result.play_offset_ms / 1000 : 0,
    })

    return NextResponse.json({ track })
  } catch (error) {
    console.error('Humming route error', error)
    return NextResponse.json({ error: 'Unable to process humming audio' }, { status: 500 })
  }
}
