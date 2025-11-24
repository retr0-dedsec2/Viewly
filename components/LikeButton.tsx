'use client'

import { Heart } from 'lucide-react'
import { Music } from '@/types/music'
import { isLiked, toggleLikedSong } from '@/lib/liked-songs'
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
    if (user) {
      setLiked(isLiked(track.id, user.id))
    }
    
    // Listen for storage changes to update like status
    const handleStorageChange = () => {
      if (user) {
        setLiked(isLiked(track.id, user.id))
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    // Also check periodically for changes (since storage event doesn't fire in same tab)
    const interval = setInterval(() => {
      if (user) {
        setLiked(isLiked(track.id, user.id))
      }
    }, 500)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [track.id, user])

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) return

    toggleLikedSong(track, user.id)
    setLiked(!liked)
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

