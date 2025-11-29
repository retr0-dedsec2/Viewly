'use client'

const HISTORY_KEY = 'search_history'
const MAX_ENTRIES = 40

export type SearchEntry = {
  query: string
  timestamp: number
}

function getKey(userId?: string) {
  return userId ? `${HISTORY_KEY}_${userId}` : null
}

export function getSearchHistory(userId?: string): SearchEntry[] {
  if (typeof window === 'undefined') return []
  const key = getKey(userId)
  if (!key) return []

  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SearchEntry[]
    return Array.isArray(parsed)
      ? parsed
          .filter((entry) => entry?.query)
          .sort((a, b) => b.timestamp - a.timestamp)
      : []
  } catch {
    return []
  }
}

export function recordSearchQuery(query: string, userId?: string) {
  if (typeof window === 'undefined') return
  const key = getKey(userId)
  if (!key) return

  const cleaned = query.trim()
  if (!cleaned) return

  const history = getSearchHistory(userId)
  const deduped = history.filter(
    (entry) => entry.query.toLowerCase() !== cleaned.toLowerCase()
  )

  const next: SearchEntry[] = [
    { query: cleaned, timestamp: Date.now() },
    ...deduped,
  ].slice(0, MAX_ENTRIES)

  localStorage.setItem(key, JSON.stringify(next))
}

export function clearSearchHistory(userId?: string) {
  if (typeof window === 'undefined') return
  const key = getKey(userId)
  if (!key) return
  localStorage.removeItem(key)
}
