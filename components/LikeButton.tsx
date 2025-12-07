'use client'

import { Heart } from 'lucide-react'
import { Music } from '@/types/music'
import { isLiked, toggleLikedSong, LIKED_SONGS_EVENT } from '@/lib/liked-songs'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'

interface LikeButtonProps {
  track: Music
  size?: number
  className?: string
}

export default function LikeButton({ track, size = 20, className = '' }: LikeButtonProps) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    if (!user) return

    const syncState = (event?: Event) => {
      const detail = (event as CustomEvent<{ userId?: string }> | undefined)?.detail
      if (detail?.userId && detail.userId !== user.id) return
      setLiked(isLiked(track.id, user.id))
    }

    // Initial hydrate
    syncState()

    const handleStorageChange = () => syncState()

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener(LIKED_SONGS_EVENT, syncState as EventListener)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener(LIKED_SONGS_EVENT, syncState as EventListener)
    }
  }, [track.id, user])

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) return

    // Optimistic toggle; revert on failure
    setLiked((prev) => !prev)
    try {
      await toggleLikedSong(track, user.id)
    } catch (error) {
      console.error('Failed to toggle like:', error)
      setLiked((prev) => !prev)
    }
  }

  if (!user) return null

  return (
    <button
      onClick={handleClick}
      className={`hover:scale-110 transition-transform ${className}`}
      aria-label={liked ? 'Remove from liked songs' : 'Add to liked songs'}
    >
      <Heart
        size={size}
        className={liked ? 'text-spotify-green fill-spotify-green' : 'text-gray-400 hover:text-white'}
      />
    </button>
  )
}

