import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getAuthToken } from '@/lib/auth-tokens'
import { createSong, listRecentSongs } from '@/lib/songs'

export const dynamic = 'force-dynamic'

function getPayload(req: NextRequest) {
  const token = getAuthToken(req)
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  if (!['ADMIN', 'ARTIST'].includes(payload.role)) return null
  return payload
}

export async function GET(req: NextRequest) {
  const payload = getPayload(req)
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limitParam = req.nextUrl.searchParams.get('limit')
  const limit = limitParam ? Number(limitParam) : 20
  const songs = await listRecentSongs(Number.isFinite(limit) ? limit : 20)

  return NextResponse.json({ songs })
}

export async function POST(req: NextRequest) {
  const payload = getPayload(req)
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { title, artist, album, cover, duration, videoId, audioUrl } = body

  if (!title || !artist) {
    return NextResponse.json({ error: 'Title and artist are required' }, { status: 400 })
  }
  if (!videoId && !audioUrl) {
    return NextResponse.json(
      { error: 'Provide a YouTube videoId or an audioUrl to publish the song' },
      { status: 400 }
    )
  }

  const normalizedDuration =
    typeof duration === 'string' && duration.trim() !== ''
      ? Number(duration)
      : typeof duration === 'number'
        ? duration
        : undefined

  try {
    const song = await createSong(
      {
        title,
        artist,
        album,
        cover,
        duration: Number.isFinite(normalizedDuration) ? normalizedDuration : undefined,
        videoId,
        audioUrl,
      },
      payload.userId
    )

    return NextResponse.json({ song }, { status: 201 })
  } catch (error) {
    console.error('Song creation error', error)
    return NextResponse.json({ error: 'Unable to create song' }, { status: 500 })
  }
}
