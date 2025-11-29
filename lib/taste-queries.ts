// Normalize search queries before storing them for taste analysis.
// Removes generic helper phrases like "find music for me" so profiles focus on the artist/genre.
const genericPrefix = new RegExp(
  /^(find( me)?( music)?( for me)?|play( some)?( music)?|suggest( me)?( music)?|recommend( me)?( music)?|search( for)?)/i
)

const fillerWords = new Set(['please', 'some', 'music', 'song', 'songs', 'for', 'me'])

export function normalizeTasteQuery(query: string): string | null {
  if (!query) return null

  let cleaned = query.trim().replace(/\s+/g, ' ')
  cleaned = cleaned.replace(genericPrefix, '').trim()

  // Drop leading filler tokens
  const tokens = cleaned
    .replace(/[^a-z0-9\s'-]/gi, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !fillerWords.has(word.toLowerCase()))

  const normalized = tokens.join(' ').trim()
  return normalized.length ? normalized : null
}
