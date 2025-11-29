import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthToken } from '@/lib/auth-tokens'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function authOrThrow(req: NextRequest) {
  const token = getAuthToken(req)
  if (!token) {
    return { error: NextResponse.json({ error: 'Authorization required' }, { status: 401 }) }
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return { error: NextResponse.json({ error: 'Invalid token' }, { status: 401 }) }
  }

  return { userId: decoded.userId }
}

export async function GET(req: NextRequest) {
  const auth = authOrThrow(req)
  if ('error' in auth) return auth.error

  const liked = await prisma.likedSong.findMany({
    where: { userId: auth.userId },
    orderBy: { likedAt: 'desc' },
  })

  return NextResponse.json({
    liked: liked.map((item) => ({
      id: item.trackId,
      title: item.trackTitle,
      artist: item.trackArtist,
      album: item.trackAlbum,
      cover: item.trackCover,
      videoId: item.trackVideoId,
      duration: item.trackDuration,
    })),
  })
}

export async function POST(req: NextRequest) {
  const auth = authOrThrow(req)
  if ('error' in auth) return auth.error

  const body = await req.json()
  const track = body?.track

  if (!track?.id || !track?.title || !track?.artist) {
    return NextResponse.json({ error: 'Track id, title, and artist are required' }, { status: 400 })
  }

  await prisma.likedSong.upsert({
    where: {
      userId_trackId: {
        userId: auth.userId,
        trackId: track.id,
      },
    },
    update: {
      trackTitle: track.title,
      trackArtist: track.artist,
      trackAlbum: track.album || track.title,
      trackCover: track.cover || '',
      trackVideoId: track.videoId || null,
      trackDuration: track.duration || 0,
    },
    create: {
      userId: auth.userId,
      trackId: track.id,
      trackTitle: track.title,
      trackArtist: track.artist,
      trackAlbum: track.album || track.title,
      trackCover: track.cover || '',
      trackVideoId: track.videoId || null,
      trackDuration: track.duration || 0,
    },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const auth = authOrThrow(req)
  if ('error' in auth) return auth.error

  const { searchParams } = new URL(req.url)
  const trackId = searchParams.get('trackId')

  if (!trackId) {
    return NextResponse.json({ error: 'trackId is required' }, { status: 400 })
  }

  await prisma.likedSong.deleteMany({
    where: { userId: auth.userId, trackId },
  })

  return NextResponse.json({ success: true })
}
