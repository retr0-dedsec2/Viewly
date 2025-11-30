import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthToken } from '@/lib/auth-tokens'
import { verifyToken } from '@/lib/auth'
import { buildTasteProfile } from '@/lib/taste-profile'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = getAuthToken(req)
  if (!token) {
    return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const [likedSongs, searchHistory] = await Promise.all([
    prisma.likedSong.findMany({
      where: { userId: decoded.userId },
      orderBy: { likedAt: 'desc' },
      take: 50,
    }),
    prisma.searchHistory.findMany({
      where: { userId: decoded.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ])

  const profile = buildTasteProfile(
    likedSongs.map((song) => ({
      title: song.trackTitle,
      artist: song.trackArtist,
      album: song.trackAlbum,
      likedAt: song.likedAt,
    })),
    searchHistory.map((entry) => ({ query: entry.query, createdAt: entry.createdAt }))
  )

  return NextResponse.json({ profile })
}
