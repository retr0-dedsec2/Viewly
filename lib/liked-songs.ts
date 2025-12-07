'use client'

import { Music } from '@/types/music'
import { getToken } from './auth-client'
import { withCsrfHeader } from './csrf'

const LIKED_SONGS_KEY = 'liked_songs'
export const LIKED_SONGS_EVENT = 'liked-songs-updated'

function storageKey(userId: string) {
  return `${LIKED_SONGS_KEY}_${userId}`
}

function emitLikedSongsUpdate(userId?: string) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(LIKED_SONGS_EVENT, {
      detail: { userId },
    })
  )
}

function readLocal(userId?: string): Music[] {
  if (typeof window === 'undefined' || !userId) return []
  const key = storageKey(userId)
  const stored = localStorage.getItem(key)
  if (!stored) return []
  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

function writeLocal(songs: Music[], userId?: string) {
  if (typeof window === 'undefined' || !userId) return
  localStorage.setItem(storageKey(userId), JSON.stringify(songs))
  emitLikedSongsUpdate(userId)
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = withCsrfHeader({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  })

  const res = await fetch(path, { ...options, headers, credentials: 'include' })
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`)
  }
  return res.json()
}

export async function getLikedSongs(userId?: string): Promise<Music[]> {
  if (!userId) return []

  try {
    const data = await api<{ liked: Music[] }>('/api/liked')
    writeLocal(data.liked, userId)
    return data.liked
  } catch (error) {
    // Fallback to local cache
    return readLocal(userId)
  }
}

export function isLiked(trackId: string, userId?: string): boolean {
  if (!userId) return false
  const liked = readLocal(userId)
  return liked.some((s) => s.id === trackId)
}

export async function addLikedSong(track: Music, userId?: string) {
  if (!userId) return
  try {
    await api('/api/liked', {
      method: 'POST',
      body: JSON.stringify({ track }),
    })
    const current = readLocal(userId)
    const merged = current.find((s) => s.id === track.id) ? current : [...current, track]
    writeLocal(merged, userId)
  } catch (error) {
    const current = readLocal(userId)
    if (!current.find((s) => s.id === track.id)) {
      current.push(track)
      writeLocal(current, userId)
    }
  }
}

export async function removeLikedSong(trackId: string, userId?: string) {
  if (!userId) return
  try {
    await api(`/api/liked?trackId=${encodeURIComponent(trackId)}`, {
      method: 'DELETE',
    })
  } catch (error) {
    // ignore API error and still update cache
  } finally {
    const filtered = readLocal(userId).filter((s) => s.id !== trackId)
    writeLocal(filtered, userId)
  }
}

export async function toggleLikedSong(track: Music, userId?: string) {
  if (!userId) return

  if (isLiked(track.id, userId)) {
    await removeLikedSong(track.id, userId)
  } else {
    await addLikedSong(track, userId)
  }
}

