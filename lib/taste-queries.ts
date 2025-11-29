// Normalize search queries before storing them for taste analysis.
// Removes helper phrases like "find music for me" so profiles focus on the artist/genre.
const genericPrefix = /^(find( me)?( music)?( for me)?|play( some)?( music)?|suggest( me)?( music)?|recommend( me)?( music)?|search( for)?)/i

const fillerWords = new Set([
  'please',
  'some',
  'music',
  'song',
  'songs',
  'for',
  'me',
  'the',
  'a',
  'to',
  'listen',
  'play',
  'find',
  'search',
  'recommend',
  'suggest',
])

function dedupeTokens(tokens: string[]) {
  const seen = new Set<string>()
  const result: string[] = []
  tokens.forEach((word) => {
    const lower = word.toLowerCase()
    if (!seen.has(lower)) {
      seen.add(lower)
      result.push(word)
    }
  })
  return result
}

export function normalizeTasteQuery(query: string): string | null {
  if (!query) return null

  let cleaned = query.trim().replace(/\s+/g, ' ')
  cleaned = cleaned.replace(genericPrefix, '').trim()

  // Remove generic words anywhere in the string
  const tokens = cleaned
    .replace(/[^a-z0-9\s'-]/gi, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !fillerWords.has(word.toLowerCase()))

  const unique = dedupeTokens(tokens)
  const normalized = unique.join(' ').trim()
  return normalized.length ? normalized : null
}
