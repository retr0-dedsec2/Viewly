import { Music } from '@/types/music'
import { normalizeTasteQuery } from './taste-queries'

export type MusicIntentFocus = 'artist' | 'track' | 'mood' | 'genre' | 'keyword'

export type MusicIntent = {
  focus: MusicIntentFocus
  artist?: string
  mood?: string
  genre?: string
  tokens: string[]
  boostedTerms: string[]
}

const GENRES = [
  'pop',
  'rock',
  'hip hop',
  'hip-hop',
  'rap',
  'electronic',
  'edm',
  'dance',
  'jazz',
  'classical',
  'country',
  'reggae',
  'r&b',
  'rnb',
  'indie',
  'folk',
  'afro',
  'afrobeats',
]

const MOODS = ['chill', 'happy', 'sad', 'romantic', 'party', 'workout', 'focus', 'energetic']

function tokenize(query: string) {
  return normalizeTasteQuery(query)
    ?.toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 10) || []
}

export function detectMusicIntent(query: string, favoriteArtists: string[] = [], favoriteGenres: string[] = []): MusicIntent {
  const lower = query.toLowerCase()
  const tokens = tokenize(query)
  const boostedTerms: string[] = []
  let focus: MusicIntentFocus = 'keyword'
  let artist: string | undefined
  let mood: string | undefined
  let genre: string | undefined

  const byMatch = lower.match(/by\s+([a-z0-9\s]+)/i)
  if (byMatch?.[1]) {
    artist = byMatch[1].trim()
    boostedTerms.push(artist)
  }

  const moodHit = MOODS.find((m) => lower.includes(m))
  if (moodHit) {
    mood = moodHit
    focus = 'mood'
    boostedTerms.push(moodHit)
  }

  const genreHit = GENRES.find((g) => lower.includes(g))
  if (genreHit) {
    genre = genreHit
    focus = 'genre'
    boostedTerms.push(genreHit)
  }

  const favoriteHit = favoriteArtists.find((a) => lower.includes(a.toLowerCase()))
  if (favoriteHit) {
    artist = favoriteHit
    focus = 'artist'
    boostedTerms.unshift(favoriteHit)
  }

  if (!focus || focus === 'keyword') {
    if (artist) focus = 'artist'
    else if (tokens.length >= 3) focus = 'track'
  }

  if (!genre && favoriteGenres.length) {
    genre = favoriteGenres[0]
  }

  if (genre) boostedTerms.push(genre)

  return {
    focus,
    artist,
    mood,
    genre,
    tokens,
    boostedTerms: Array.from(new Set(boostedTerms.filter(Boolean))),
  }
}

export function buildTargetedQuery(original: string, intent: MusicIntent) {
  const parts = [normalizeTasteQuery(original) || '']
  intent.boostedTerms.forEach((term) => {
    if (term && !parts.join(' ').includes(term)) {
      parts.push(term)
    }
  })
  return parts
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function scoreTrackAgainstIntent(track: Music, intent: MusicIntent, favoriteArtists: string[] = []) {
  const title = track.title.toLowerCase()
  const artist = track.artist.toLowerCase()

  let score = 0

  intent.tokens.forEach((token) => {
    if (title.includes(token)) score += 2
    if (artist.includes(token)) score += 3
  })

  if (intent.artist && artist.includes(intent.artist.toLowerCase())) {
    score += 4
  }

  if (intent.mood) {
    if (title.includes(intent.mood)) score += 1.5
    if (artist.includes(intent.mood)) score += 1
  }

  if (favoriteArtists.some((fav) => artist.includes(fav.toLowerCase()))) {
    score += 2
  }

  return score
}
