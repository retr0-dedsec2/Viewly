import { prisma } from './prisma'
import { Music } from '@/types/music'
import { Song } from '@prisma/client'

export type CreateSongInput = {
  title: string
  artist: string
  album?: string
  cover?: string
  duration?: number
  videoId?: string
  audioUrl?: string
}

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=600&fit=crop&auto=format'

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function generateUniqueSlug(title: string) {
  const base = slugify(title) || 'song'
  let slug = base
  let counter = 1

  // Loop until slug is unique in DB
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.song.findUnique({ where: { slug } })
    if (!existing) break
    slug = `${base}-${counter}`
    counter += 1
  }

  return slug
}

function toMusic(song: Song): Music {
  return {
    id: song.id,
    slug: song.slug,
    title: song.title,
    artist: song.artist,
    album: song.album || 'Single',
    duration: song.duration || 0,
    cover: song.cover || FALLBACK_COVER,
    videoId: song.videoId || undefined,
    audioUrl: song.audioUrl || undefined,
    source: 'CUSTOM',
  }
}

export async function createSong(input: CreateSongInput, createdById?: string) {
  const slug = await generateUniqueSlug(input.title)
  const duration = typeof input.duration === 'number' && input.duration > 0 ? Math.round(input.duration) : null
  const cover = input.cover?.trim() || FALLBACK_COVER

  const song = await prisma.song.create({
    data: {
      slug,
      title: input.title.trim(),
      artist: input.artist.trim(),
      album: input.album?.trim() || 'Single',
      cover,
      duration,
      videoId: input.videoId?.trim() || null,
      audioUrl: input.audioUrl?.trim() || null,
      createdById: createdById || null,
    },
  })

  return toMusic(song)
}

export async function getSongByIdOrSlug(idOrSlug: string) {
  if (!idOrSlug) return null

  const song = await prisma.song.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }, { videoId: idOrSlug }],
    },
  })

  return song ? toMusic(song) : null
}

export async function listRecentSongs(limit = 20) {
  const safeLimit = Math.min(Math.max(limit, 1), 50)
  const songs = await prisma.song.findMany({
    orderBy: { createdAt: 'desc' },
    take: safeLimit,
  })

  return songs.map(toMusic)
}
