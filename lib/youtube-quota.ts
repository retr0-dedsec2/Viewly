const WINDOW_MS = 60_000

type Bucket = 'search' | 'music'

type QuotaState = {
  windowStart: number
  used: number
  limit: number
}

function parseLimit(envValue: string | undefined, fallback: number) {
  const parsed = parseInt(envValue || '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const defaultLimit = parseLimit(process.env.YOUTUBE_QUERIES_PER_MIN, 60)
const musicLimit = parseLimit(
  process.env.MUSIC_YOUTUBE_QUERIES_PER_MIN || process.env.YOUTUBE_QUERIES_PER_MIN,
  defaultLimit
)

const quotaState: Record<Bucket, QuotaState> = {
  search: { windowStart: 0, used: 0, limit: defaultLimit },
  music: { windowStart: 0, used: 0, limit: musicLimit },
}

function resetWindow(bucket: Bucket, now: number) {
  quotaState[bucket].windowStart = now
  quotaState[bucket].used = 0
}

export function consumeQuota(bucket: Bucket = 'search', cost = 1) {
  const now = Date.now()
  const state = quotaState[bucket]

  if (now - state.windowStart >= WINDOW_MS) {
    resetWindow(bucket, now)
  }

  if (state.used + cost > state.limit) {
    return {
      allowed: false,
      remaining: Math.max(state.limit - state.used, 0),
      limit: state.limit,
      windowExpiresInMs: Math.max(WINDOW_MS - (now - state.windowStart), 0),
    }
  }

  state.used += cost
  return {
    allowed: true,
    remaining: Math.max(state.limit - state.used, 0),
    limit: state.limit,
    windowExpiresInMs: Math.max(WINDOW_MS - (now - state.windowStart), 0),
  }
}

export function getQuotaSnapshot(bucket: Bucket = 'search') {
  const now = Date.now()
  const state = quotaState[bucket]
  if (now - state.windowStart >= WINDOW_MS) {
    return {
      remaining: state.limit,
      limit: state.limit,
      windowExpiresInMs: WINDOW_MS,
    }
  }
  return {
    remaining: Math.max(state.limit - state.used, 0),
    limit: state.limit,
    windowExpiresInMs: Math.max(WINDOW_MS - (now - state.windowStart), 0),
  }
}
