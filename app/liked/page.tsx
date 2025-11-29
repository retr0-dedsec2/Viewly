'use client'

import { useState, useEffect, useRef } from 'react'
import { Heart, Play, Trash2 } from 'lucide-react'
import { Music } from '@/types/music'
import Sidebar from '@/components/Sidebar'
import MusicPlayer from '@/components/MusicPlayer'
import MobileMenu from '@/components/MobileMenu'
import MobileHeader from '@/components/MobileHeader'
import LikeButton from '@/components/LikeButton'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getLikedSongs, removeLikedSong } from '@/lib/liked-songs'

export default function LikedPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [likedSongs, setLikedSongs] = useState<Music[]>([])
  const [currentTrack, setCurrentTrack] = useState<Music | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(-1)
  const audioRef = useRef<HTMLAudioElement>(null)
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    const load = async () => {
      if (user) {
        const songs = await getLikedSongs(user.id)
        setLikedSongs(songs)
      }
    }
    load()
  }, [isAuthenticated, user, router])

  // Refresh liked songs when user changes or when songs are liked/unliked
  useEffect(() => {
    const handleStorageChange = async () => {
      if (user) {
        const songs = await getLikedSongs(user.id)
        setLikedSongs(songs)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    // Also check periodically for changes (since storage event doesn't fire in same tab)
    const interval = setInterval(handleStorageChange, 1000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [user])

  const handlePlay = (track: Music) => {
    const index = likedSongs.findIndex((t) => t.id === track.id)
    setCurrentIndex(index)
    setCurrentTrack(track)
    setIsPlaying(true)
  }

  const handleNext = () => {
    if (likedSongs.length > 0 && currentIndex >= 0) {
      const nextIndex = (currentIndex + 1) % likedSongs.length
      setCurrentIndex(nextIndex)
      setCurrentTrack(likedSongs[nextIndex])
      setIsPlaying(true)
    }
  }

  const handlePrevious = () => {
    if (likedSongs.length > 0 && currentIndex >= 0) {
      const prevIndex = currentIndex === 0 ? likedSongs.length - 1 : currentIndex - 1
      setCurrentIndex(prevIndex)
      setCurrentTrack(likedSongs[prevIndex])
      setIsPlaying(true)
    }
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
    if (audioRef.current && !currentTrack?.videoId) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
    }
  }

  const handleRemoveLiked = async (trackId: string) => {
    if (!user) return
    await removeLikedSong(trackId, user.id)
    const updated = likedSongs.filter((s) => s.id !== trackId)
    setLikedSongs(updated)
    if (currentTrack?.id === trackId) {
      setCurrentTrack(null)
      setIsPlaying(false)
      setCurrentIndex(-1)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-b from-spotify-dark via-spotify-gray to-black">
      <MobileHeader onMenuClick={() => setMobileMenuOpen(true)} />
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col lg:ml-64 pt-16 lg:pt-0 pb-20 lg:pb-24">
        <div className="flex-1 overflow-y-auto">
          {/* Header with gradient */}
          <div className="bg-gradient-to-b from-spotify-green/20 to-spotify-dark p-4 sm:p-6 lg:p-8 pb-12 sm:pb-16">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-spotify-green to-green-600 rounded-full flex items-center justify-center shadow-2xl flex-shrink-0">
                <Heart size={24} className="sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white fill-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-300 mb-1 sm:mb-2">Playlist</p>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 truncate">Liked Songs</h1>
                <div className="flex items-center gap-2 text-gray-300 text-xs sm:text-sm">
                  <span className="font-semibold truncate">{user?.username}</span>
                  <span>•</span>
                  <span>{likedSongs.length} songs</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 lg:p-8 pt-4">
            {likedSongs.length === 0 ? (
              <div className="text-center py-12 sm:py-20">
                <Heart size={48} className="sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Songs you like will appear here</h2>
                <p className="text-gray-400 mb-6 text-sm sm:text-base">Save songs by tapping the heart icon.</p>
                <button
                  onClick={() => router.push('/search')}
                  className="bg-white text-black px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-semibold hover:scale-105 active:scale-95 transition-transform text-sm sm:text-base"
                >
                  Find songs
                </button>
              </div>
            ) : (
              <div>
                {/* Play button */}
                <div className="mb-4 sm:mb-6">
                  <button
                    onClick={() => {
                      if (likedSongs.length > 0) {
                        handlePlay(likedSongs[0])
                      }
                    }}
                    className="w-12 h-12 sm:w-14 sm:h-14 bg-spotify-green hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
                  >
                    <Play size={20} className="sm:w-6 sm:h-6" fill="black" />
                  </button>
                </div>

                {/* Songs list */}
                <div className="space-y-1 sm:space-y-2">
                  <div className="hidden md:grid grid-cols-[16px_1fr_1fr_200px_50px] gap-4 px-4 py-2 text-gray-400 text-sm border-b border-gray-800 mb-2">
                    <div>#</div>
                    <div>Title</div>
                    <div>Album</div>
                    <div>Date added</div>
                    <div></div>
                  </div>
                  {likedSongs.map((track, index) => (
                    <div
                      key={track.id}
                      className={`md:grid md:grid-cols-[16px_1fr_1fr_200px_50px] md:gap-4 flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 px-3 sm:px-4 py-2 md:py-2 rounded-lg hover:bg-spotify-light cursor-pointer transition-all active:scale-[0.98] group ${
                        currentTrack?.id === track.id ? 'bg-spotify-light ring-1 ring-spotify-green' : ''
                      }`}
                      onClick={() => handlePlay(track)}
                    >
                      <div className="text-gray-400 group-hover:hidden text-xs md:text-sm md:w-4">
                        {index + 1}
                      </div>
                      <div className="hidden group-hover:block md:w-4">
                        <Play size={14} className="md:w-4 md:h-4 text-white" />
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 md:flex-none">
                        <img
                          src={track.cover}
                          alt={track.title}
                          className="w-10 h-10 sm:w-12 sm:h-12 md:w-10 md:h-10 rounded object-cover flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={`font-medium truncate text-sm sm:text-base ${
                              currentTrack?.id === track.id ? 'text-spotify-green' : 'text-white'
                            }`}
                          >
                            {track.title}
                          </p>
                          <p className="text-gray-400 text-xs sm:text-sm truncate">{track.artist}</p>
                          <p className="text-gray-400 text-xs md:hidden">{track.album}</p>
                        </div>
                      </div>
                      <div className="hidden md:block text-gray-400 text-sm truncate">{track.album}</div>
                      <div className="hidden md:block text-gray-400 text-sm">
                        {new Date().toLocaleDateString()}
                      </div>
                      <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 flex-shrink-0">
                        <LikeButton track={track} size={16} />
                        <button
                          onClick={() => handleRemoveLiked(track.id)}
                          className="text-gray-400 hover:text-red-300"
                          aria-label="Remove from liked"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <MusicPlayer
          track={currentTrack}
          isPlaying={isPlaying}
          onTogglePlay={togglePlayPause}
          audioRef={audioRef}
          onNext={handleNext}
          onPrevious={handlePrevious}
        />
      </div>
    </div>
  )
}

