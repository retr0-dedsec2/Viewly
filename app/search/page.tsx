'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Search, Filter, Music, Info } from 'lucide-react'
import { Music as MusicType } from '@/types/music'
import { convertYouTubeToMusic } from '@/lib/youtube'
import Sidebar from '@/components/Sidebar'
import MobileMenu from '@/components/MobileMenu'
import MobileHeader from '@/components/MobileHeader'
import LikeButton from '@/components/LikeButton'
import AdBanner from '@/components/AdBanner'
import GoogleAd from '@/components/GoogleAd'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { sanitizeSearchQuery } from '@/lib/sanitize'
import { usePlayer } from '@/contexts/PlayerContext'
import { buildTargetedQuery, detectMusicIntent, scoreTrackAgainstIntent } from '@/lib/music-intent'
import { withCsrfHeader } from '@/lib/csrf'
import { getSearchHistory, recordSearchQuery } from '@/lib/search-history'
import SearchSuggestions, { SuggestionItem } from '@/components/SearchSuggestions'
import ShareButtons from '@/components/ShareButtons'
import SongDetailsModal from '@/components/SongDetailsModal'

type TasteProfile = {
  topArtists: string[]
  topGenres: string[]
}

export default function SearchPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MusicType[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [filter, setFilter] = useState<'all' | 'songs' | 'artists' | 'albums'>('all')
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'rating' | 'viewCount'>('relevance')
  const [tasteProfile, setTasteProfile] = useState<TasteProfile>({ topArtists: [], topGenres: [] })
  const [intentNote, setIntentNote] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [aiSuggestions, setAiSuggestions] = useState<SuggestionItem[]>([])
  const [selectedTrack, setSelectedTrack] = useState<MusicType | null>(null)
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const { currentTrack, playQueue } = usePlayer()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (!user?.id) return
    const controller = new AbortController()
    const fetchTaste = async () => {
      try {
        const res = await fetch('/api/ai/recommendations', {
          method: 'POST',
          headers: withCsrfHeader({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ userId: user.id }),
          signal: controller.signal,
        })
        if (!res.ok) return
        const data = await res.json()
        if (data?.preferences) {
          setTasteProfile({
            topArtists: data.preferences.topArtists || [],
            topGenres: data.preferences.topGenres || [],
          })
        }
      } catch (error) {
        if ((error as any).name === 'AbortError') return
        console.error('Failed to load taste profile', error)
      }
    }

    fetchTaste()
    return () => controller.abort()
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) {
      setRecentSearches([])
      return
    }
    setRecentSearches(getSearchHistory(user.id).map((entry) => entry.query))
  }, [user?.id])

  const fetchAiSuggestions = useCallback(async () => {
    if (!user?.id) return
    try {
      const res = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: withCsrfHeader({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ userId: user.id }),
      })
      if (!res.ok) return
      const data = await res.json()
      const mapped =
        data?.recommendations?.map((rec: any) => ({
          label: rec.query as string,
          hint: rec.reason as string,
          source: 'ai' as const,
        })) || []
      setAiSuggestions(mapped)
    } catch (error) {
      console.error('AI suggestions failed', error)
    }
  }, [user?.id])

  useEffect(() => {
    fetchAiSuggestions()
  }, [fetchAiSuggestions])

  const combinedSuggestions = useMemo(() => {
    const entries: SuggestionItem[] = []
    const filterMatch = (value: string) =>
      !query.trim() || value.toLowerCase().includes(query.toLowerCase())

    recentSearches
      .filter(filterMatch)
      .slice(0, 6)
      .forEach((entry) => entries.push({ label: entry, source: 'recent' }))

    aiSuggestions
      .filter((entry) => filterMatch(entry.label))
      .slice(0, 6)
      .forEach((entry) => entries.push(entry))

    const unique = new Map<string, SuggestionItem>()
    entries.forEach((item) => {
      if (!unique.has(item.label.toLowerCase())) {
        unique.set(item.label.toLowerCase(), item)
      }
    })
    return Array.from(unique.values()).slice(0, 10)
  }, [aiSuggestions, query, recentSearches])

  const executeSearch = useCallback(
    async (value: string) => {
      if (!value.trim() || isSearching) return

      const { sanitized, isRejected } = sanitizeSearchQuery(value)
      if (isRejected) {
        setResults([])
        return
      }

      setIsSearching(true)
      try {
        const intent = detectMusicIntent(sanitized, tasteProfile.topArtists, tasteProfile.topGenres)
        const targetedQuery = buildTargetedQuery(sanitized, intent)

        setIntentNote(
          intent.artist
            ? `Ciblage sur ${intent.artist} ${intent.genre ? `(${intent.genre})` : ''}`
            : intent.genre
              ? `Recherche affinée sur le genre ${intent.genre}`
              : intent.mood
                ? `Recherche ${intent.mood} priorisée`
                : '',
        )

        const params = new URLSearchParams({
          q: targetedQuery,
          maxResults: '50',
          order: sortBy,
        })

        const response = await fetch(`/api/youtube/search?${params}`)
        const data = await response.json()

        if (data.items) {
          const musicResults: MusicType[] = data.items.map((item: any) => convertYouTubeToMusic(item))
          const scored = musicResults
            .map((track: MusicType) => ({
              track,
              score: scoreTrackAgainstIntent(track, intent, tasteProfile.topArtists),
            }))
            .sort((a, b) => b.score - a.score)
            .map((entry) => entry.track)
          setResults(scored)
          recordSearchQuery(sanitized, user?.id)
          setRecentSearches(getSearchHistory(user?.id).map((entry) => entry.query))
          setShowSuggestions(false)
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsSearching(false)
      }
    },
    [isSearching, sortBy, tasteProfile.topArtists, tasteProfile.topGenres, user?.id]
  )

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    await executeSearch(query)
  }

  const handleSuggestionSelect = (value: string) => {
    setQuery(value)
    executeSearch(value)
  }

  const handlePlay = (track: MusicType) => {
    const index = results.findIndex((t) => t.id === track.id)
    playQueue(results, index >= 0 ? index : 0)
  }

  const userHasAds = user ? (user.hasAds ?? user.subscriptionPlan === 'FREE') : false

  return (
    <>
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
              
              <form
                onSubmit={handleSearch}
                className="mb-6 relative"
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
              >
                <div className="relative">
                  <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value.replace(/[<>]/g, ''))
                      setShowSuggestions(true)
                    }}
                    placeholder="Search for songs, artists, albums..."
                    className="w-full bg-spotify-light text-white px-10 sm:px-14 py-3 sm:py-4 rounded-full focus:outline-none focus:ring-2 focus:ring-spotify-green text-sm sm:text-base lg:text-lg transition-all"
                  />
                  {isSearching && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <div className="w-6 h-6 border-2 border-gray-400 border-t-white rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <SearchSuggestions
                  visible={showSuggestions}
                  items={combinedSuggestions}
                  onSelect={handleSuggestionSelect}
                />
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
              {intentNote && <p className="text-xs text-gray-400 mt-3">Focus: {intentNote}</p>}

              {/* Serve ads only when real search results exist to avoid thin-content ad placements */}
              {userHasAds && results.length > 0 && (
                <AdBanner onUpgradeClick={() => router.push('/subscriptions')} />
              )}
              {userHasAds && results.length > 0 && <GoogleAd className="mb-6" />}
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
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex-shrink-0 flex items-center gap-2 sm:gap-3"
                    >
                      <ShareButtons track={track} dense />
                      <button
                        onClick={() => setSelectedTrack(track)}
                        className="p-2 rounded-full bg-black/20 hover:bg-black/40 border border-gray-800 text-white transition-colors"
                        aria-label={`More about ${track.title}`}
                      >
                        <Info size={16} />
                      </button>
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
      </div>
      <SongDetailsModal track={selectedTrack} onClose={() => setSelectedTrack(null)} />
    </>
  )
}

