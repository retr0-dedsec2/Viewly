import { Music } from '@/types/music'
import type { SearchEntry } from './search-history'
import { normalizeTasteQuery } from './taste-queries'

export type TasteProfile = {
  topArtists: string[]
  topGenres: string[]
  favoriteMoods: string[]
  keywords: string[]
  recentSearches: string[]
  totalLiked: number
  totalSearches: number
  summary: string
}

// Allows reusing the taste engine for both client-side (Music) and server-side (Prisma) shapes.
export type TasteSongInput = Partial<Music> & {
  trackTitle?: string
  trackArtist?: string
  trackAlbum?: string
  likedAt?: Date | number | string
}

export type TasteSearchInput = Partial<SearchEntry> & {
  createdAt?: Date | number | string
}

const genreKeywords: Record<string, string[]> = {
  pop: ['pop', 'chart', 'top 40', 'dance'],
  rock: ['rock', 'metal', 'punk', 'grunge', 'emo'],
  'hip-hop': ['hip hop', 'hip-hop', 'rap', 'trap', 'drill'],
  electronic: ['edm', 'electronic', 'house', 'techno', 'club', 'dubstep', 'dnb', 'drum and bass'],
  jazz: ['jazz', 'sax', 'swing'],
  classical: ['classical', 'symphony', 'orchestra', 'piano', 'violin'],
  rnb: ['r&b', 'rnb', 'soul'],
  latin: ['latin', 'reggaeton', 'bachata', 'salsa'],
  country: ['country', 'folk', 'americana'],
  kpop: ['kpop', 'k-pop', 'k pop'],
  indie: ['indie', 'alt', 'alternative'],
  afro: ['afrobeats', 'afro', 'afrobeat'],
  reggae: ['reggae', 'dancehall', 'dub'],
  blues: ['blues'],
  lofi: ['lofi', 'lo-fi'],
}

const moodKeywords: Record<string, string[]> = {
  chill: ['chill', 'lofi', 'relax', 'calm', 'ambient'],
  happy: ['happy', 'feel good', 'sunny', 'bright', 'uplifting'],
  sad: ['sad', 'melancholy', 'cry', 'blue', 'heartbreak'],
  energetic: ['workout', 'gym', 'energetic', 'pump', 'run', 'driving'],
  party: ['party', 'club', 'dance', 'celebrate'],
  focus: ['focus', 'study', 'concentrate', 'deep work'],
  romantic: ['love', 'romantic', 'date', 'slow dance'],
  nostalgic: ['nostalgia', 'throwback', 'oldies', 'classic'],
}

const stopWords = new Set([
  'the',
  'and',
  'for',
  'with',
  'feat',
  'feat.',
  'ft',
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
  'from',
  'soundtrack',
])

function toTimestamp(value?: number | string | Date) {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? undefined : parsed
  }
  return value.getTime()
}

function rankFromMap(counts: Map<string, number>, limit: number) {
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([item]) => item)
}

function bumpScore(map: Map<string, number>, key: string, weight = 1) {
  map.set(key, (map.get(key) || 0) + weight)
}

function recencyBoost(timestamp?: number) {
  if (!timestamp) return 1
  const ageDays = (Date.now() - timestamp) / (1000 * 60 * 60 * 24)
  if (ageDays <= 2) return 1.6
  if (ageDays <= 7) return 1.35
  if (ageDays <= 30) return 1.1
  return 0.9
}

function accumulateKeywords(text: string, bucket: Map<string, number>, weight = 1) {
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word && !stopWords.has(word))
    .forEach((word) => bumpScore(bucket, word, weight))
}

function collectFromKeywords(
  text: string,
  dictionary: Record<string, string[]>,
  target: Map<string, number>,
  weight = 1
) {
  const lower = text.toLowerCase()
  Object.entries(dictionary).forEach(([label, keys]) => {
    if (keys.some((key) => lower.includes(key))) {
      bumpScore(target, label, weight)
    }
  })
}

function normalizeSearches(searchHistory: TasteSearchInput[]) {
  const seen = new Set<string>()
  const normalized: SearchEntry[] = []

  for (const entry of searchHistory) {
    const normalizedQuery = normalizeTasteQuery(entry?.query || '')
    if (!normalizedQuery) continue

    const key = normalizedQuery.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    const timestamp = toTimestamp(entry.timestamp ?? entry.createdAt) ?? Date.now()
    normalized.push({ query: normalizedQuery, timestamp })
  }

  return normalized.sort((a, b) => b.timestamp - a.timestamp)
}

function buildSongText(song: TasteSongInput) {
  const artist = (song.artist || song.trackArtist || '').trim()
  const title = (song.title || song.trackTitle || '').trim()
  const album = (song.album || song.trackAlbum || '').trim()
  return { artist, title, album }
}

export function buildTasteProfile(
  likedSongs: TasteSongInput[],
  searchHistory: TasteSearchInput[]
): TasteProfile {
  const uniqueSearches = normalizeSearches(searchHistory)

  const artistCounts = new Map<string, number>()
  const genreCounts = new Map<string, number>()
  const moodCounts = new Map<string, number>()
  const keywordCounts = new Map<string, number>()

  likedSongs.forEach((song) => {
    const { artist, title, album } = buildSongText(song)
    const songText = `${title} ${album} ${artist}`.trim()
    const weight = 1.2 * recencyBoost(toTimestamp(song.likedAt))

    if (artist) {
      bumpScore(artistCounts, artist, weight * 1.4)
    }

    if (songText) {
      collectFromKeywords(songText, genreKeywords, genreCounts, weight)
      collectFromKeywords(songText, moodKeywords, moodCounts, weight * 0.9)
      accumulateKeywords(songText, keywordCounts, weight * 0.75)
    }
  })

  uniqueSearches.forEach((entry) => {
    const query = entry.query || ''
    const weight = 0.85 * recencyBoost(entry.timestamp)
    collectFromKeywords(query, genreKeywords, genreCounts, weight)
    collectFromKeywords(query, moodKeywords, moodCounts, weight)
    accumulateKeywords(query, keywordCounts, weight * 0.8)
  })

  const topArtists = rankFromMap(artistCounts, 5)
  const topGenres = rankFromMap(genreCounts, 5)
  const favoriteMoods = rankFromMap(moodCounts, 4)
  const keywords = rankFromMap(keywordCounts, 8)

  const primary = topGenres[0] || topArtists[0] || keywords[0] || 'music'
  const tone =
    favoriteMoods[0] || topArtists[0] || topGenres[0]
      ? favoriteMoods[0]
        ? `${favoriteMoods[0]} energy`
        : 'favorites'
      : 'exploration'

  const summary =
    topArtists.length || topGenres.length || keywords.length
      ? `You lean toward ${primary} with ${tone}.`
      : 'Start liking songs or searching artists to map your taste.'

  return {
    topArtists,
    topGenres,
    favoriteMoods,
    keywords,
    recentSearches: uniqueSearches.slice(0, 4).map((s) => s.query),
    totalLiked: likedSongs.length,
    totalSearches: uniqueSearches.length,
    summary,
  }
}
