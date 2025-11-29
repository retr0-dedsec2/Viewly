'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, Filter, Music } from 'lucide-react'
import { Music as MusicType } from '@/types/music'
import { convertYouTubeToMusic } from '@/lib/youtube'
import Sidebar from '@/components/Sidebar'
import MusicPlayer from '@/components/MusicPlayer'
import MobileMenu from '@/components/MobileMenu'
import MobileHeader from '@/components/MobileHeader'
import LikeButton from '@/components/LikeButton'
import AdBanner from '@/components/AdBanner'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { sanitizeSearchQuery } from '@/lib/sanitize'

export default function SearchPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MusicType[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<MusicType | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [filter, setFilter] = useState<'all' | 'songs' | 'artists' | 'albums'>('all')
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'rating' | 'viewCount'>('relevance')
  const audioRef = useRef<HTMLAudioElement>(null)
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query.trim() || isSearching) return

    const { sanitized, isRejected } = sanitizeSearchQuery(query)
    if (isRejected) {
      setResults([])
      return
    }

    setIsSearching(true)
    try {
      const params = new URLSearchParams({
        q: sanitized,
        maxResults: '50',
        order: sortBy,
      })

      const response = await fetch(`/api/youtube/search?${params}`)
      const data = await response.json()

      if (data.items) {
        const musicResults = data.items.map((item: any) => convertYouTubeToMusic(item))
        setResults(musicResults)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handlePlay = (track: MusicType) => {
    setCurrentTrack(track)
    setIsPlaying(true)
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const showAds = user ? (user.hasAds ?? user.subscriptionPlan === 'FREE') : true

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-b from-spotify-dark via-spotify-gray to-black">
      <MobileHeader onMenuClick={() => setMobileMenuOpen(true)} />
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col lg:ml-64 pt-16 lg:pt-0 pb-20 lg:pb-24">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mb-6 lg:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">Search</h1>
            
            <form onSubmit={handleSearch} className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value.replace(/[<>]/g, ''))}
                  placeholder="Search for songs, artists, albums..."
                  className="w-full bg-spotify-light text-white px-10 sm:px-14 py-3 sm:py-4 rounded-full focus:outline-none focus:ring-2 focus:ring-spotify-green text-sm sm:text-base lg:text-lg transition-all"
                />
                {isSearching && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="w-6 h-6 border-2 border-gray-400 border-t-white rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </form>

            <div className="flex gap-4 items-center">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-spotify-green text-white'
                      : 'bg-spotify-light text-gray-300 hover:bg-spotify-gray'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('songs')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    filter === 'songs'
                      ? 'bg-spotify-green text-white'
                      : 'bg-spotify-light text-gray-300 hover:bg-spotify-gray'
                  }`}
                >
                  Songs
                </button>
                <button
                  onClick={() => setFilter('artists')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    filter === 'artists'
                      ? 'bg-spotify-green text-white'
                      : 'bg-spotify-light text-gray-300 hover:bg-spotify-gray'
                  }`}
                >
                  Artists
                </button>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <Filter size={18} className="text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-spotify-light text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-spotify-green"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Date</option>
                  <option value="rating">Rating</option>
                  <option value="viewCount">Views</option>
                </select>
              </div>
            </div>

            {showAds && <AdBanner onUpgradeClick={() => router.push('/subscriptions')} />}
          </div>

          {results.length > 0 ? (
            <div className="space-y-1 sm:space-y-2">
              {results.map((track) => (
                <div
                  key={track.id}
                  className={`flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-spotify-light cursor-pointer transition-all active:scale-[0.98] ${
                    currentTrack?.id === track.id ? 'bg-spotify-light ring-1 ring-spotify-green' : ''
                  }`}
                  onClick={() => handlePlay(track)}
                >
                  <div className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 relative group">
                    <img
                      src={track.cover}
                      alt={track.title}
                      className="w-full h-full object-cover rounded"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded flex items-center justify-center transition-all">
                      <Music
                        size={20}
                        className="text-white opacity-0 group-hover:opacity-100"
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-medium truncate text-sm sm:text-base ${
                        currentTrack?.id === track.id ? 'text-spotify-green' : 'text-white'
                      }`}
                    >
                      {track.title}
                    </p>
                    <p className="text-gray-400 text-xs sm:text-sm truncate">{track.artist}</p>
                  </div>
                  <div className="text-gray-400 text-xs sm:text-sm hidden sm:block">
                    {Math.floor(track.duration / 60)}:
                    {(track.duration % 60).toString().padStart(2, '0')}
                  </div>
                  <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                    <LikeButton track={track} size={16} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Search size={64} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">
                {query ? 'No results found' : 'Start searching for music...'}
              </p>
            </div>
          )}
        </div>
      </div>
      <MusicPlayer
        track={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={togglePlayPause}
        audioRef={audioRef}
      />
    </div>
  )
}

