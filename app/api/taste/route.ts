import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthToken } from '@/lib/auth-tokens'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const genreKeywords: Record<string, string[]> = {
  pop: ['pop', 'chart', 'top 40', 'dance'],
  rock: ['rock', 'metal', 'punk', 'grunge', 'emo'],
  'hip-hop': ['hip hop', 'hip-hop', 'rap', 'trap', 'drill'],
  electronic: ['edm', 'electronic', 'house', 'techno', 'club', 'dubstep'],
  jazz: ['jazz', 'sax', 'swing'],
  classical: ['classical', 'symphony', 'orchestra', 'piano', 'violin'],
  rnb: ['r&b', 'rnb', 'soul'],
  latin: ['latin', 'reggaeton', 'bachata', 'salsa'],
  country: ['country', 'folk', 'americana'],
  kpop: ['kpop', 'k-pop', 'k pop'],
  indie: ['indie', 'alt', 'alternative'],
}

const moodKeywords: Record<string, string[]> = {
  chill: ['chill', 'lofi', 'relax', 'calm'],
  happy: ['happy', 'feel good', 'sunny', 'bright'],
  sad: ['sad', 'melancholy', 'cry', 'blue'],
  energetic: ['workout', 'gym', 'energetic', 'pump', 'run'],
  party: ['party', 'club', 'dance'],
  focus: ['focus', 'study', 'concentrate'],
}

const stopWords = new Set([
  'the',
  'and',
  'for',
  'with',
  'feat',
  'official',
  'lyrics',
  'music',
  'video',
  'remix',
  'by',
  'to',
  'a',
  'of',
  'in',
  'on',
  'live',
  'mix',
  'find',
  'play',
  'me',
  'my',
  'song',
  'songs',
  'more',
  'new',
  'please',
])

function rankFromMap(counts: Map<string, number>, limit: number) {
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([item]) => item)
}

function accumulateKeywords(text: string, bucket: Map<string, number>) {
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word && !stopWords.has(word))
    .forEach((word) => bucket.set(word, (bucket.get(word) || 0) + 1))
}

function collectFromKeywords(
  text: string,
  dictionary: Record<string, string[]>,
  target: Map<string, number>
) {
  const lower = text.toLowerCase()
  Object.entries(dictionary).forEach(([label, keys]) => {
    if (keys.some((key) => lower.includes(key))) {
      target.set(label, (target.get(label) || 0) + 1)
    }
  })
}

function buildTasteProfile(
  likedSongs: Array<{ trackTitle: string; trackArtist: string }>,
  searchHistory: Array<{ query: string }>
) {
  const artistCounts = new Map<string, number>()
  const genreCounts = new Map<string, number>()
  const moodCounts = new Map<string, number>()
  const keywordCounts = new Map<string, number>()

  likedSongs.forEach((song) => {
    if (song.trackArtist) {
      artistCounts.set(song.trackArtist, (artistCounts.get(song.trackArtist) || 0) + 1)
    }
    const text = `${song.trackTitle} ${song.trackArtist}`
    collectFromKeywords(text, genreKeywords, genreCounts)
    collectFromKeywords(text, moodKeywords, moodCounts)
    accumulateKeywords(text, keywordCounts)
  })

  searchHistory.forEach((entry) => {
    const query = entry.query || ''
    collectFromKeywords(query, genreKeywords, genreCounts)
    collectFromKeywords(query, moodKeywords, moodCounts)
    accumulateKeywords(query, keywordCounts)
  })

  const topArtists = rankFromMap(artistCounts, 5)
  const topGenres = rankFromMap(genreCounts, 5)
  const favoriteMoods = rankFromMap(moodCounts, 3)
  const keywords = rankFromMap(keywordCounts, 8)

  const primary = topGenres[0] || topArtists[0] || 'music'
  const tone = favoriteMoods[0] ? `${favoriteMoods[0]} vibes` : 'go-to picks'
  const summary = `You lean toward ${primary} with ${tone}.`

  return {
    topArtists,
    topGenres,
    favoriteMoods,
    keywords,
    recentSearches: searchHistory.slice(0, 3).map((s) => s.query),
    totalLiked: likedSongs.length,
    totalSearches: searchHistory.length,
    summary,
  }
}

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

  const profile = buildTasteProfile(likedSongs, searchHistory)

  return NextResponse.json({ profile })
}
