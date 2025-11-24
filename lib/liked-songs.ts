'use client'

import { Music } from '@/types/music'

const LIKED_SONGS_KEY = 'liked_songs'

export function getLikedSongs(userId?: string): Music[] {
  if (typeof window === 'undefined' || !userId) return []
  
  const key = `${LIKED_SONGS_KEY}_${userId}`
  const stored = localStorage.getItem(key)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  return []
}

export function saveLikedSongs(songs: Music[], userId?: string) {
  if (typeof window === 'undefined' || !userId) return
  
  const key = `${LIKED_SONGS_KEY}_${userId}`
  localStorage.setItem(key, JSON.stringify(songs))
}

export function addLikedSong(track: Music, userId?: string) {
  if (!userId) return
  
  const liked = getLikedSongs(userId)
  if (!liked.find((s) => s.id === track.id)) {
    liked.push(track)
    saveLikedSongs(liked, userId)
  }
}

export function removeLikedSong(trackId: string, userId?: string) {
  if (!userId) return
  
  const liked = getLikedSongs(userId)
  const filtered = liked.filter((s) => s.id !== trackId)
  saveLikedSongs(filtered, userId)
}

export function isLiked(trackId: string, userId?: string): boolean {
  if (!userId) return false
  
  const liked = getLikedSongs(userId)
  return liked.some((s) => s.id === trackId)
}

export function toggleLikedSong(track: Music, userId?: string) {
  if (!userId) return
  
  if (isLiked(track.id, userId)) {
    removeLikedSong(track.id, userId)
  } else {
    addLikedSong(track, userId)
  }
}

