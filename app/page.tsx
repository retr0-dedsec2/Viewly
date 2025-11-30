'use client'

import { useState, useEffect, useCallback } from 'react'
import Sidebar from '@/components/Sidebar'
import AIChat from '@/components/AIChat'
import MainContent from '@/components/MainContent'
import MobileMenu from '@/components/MobileMenu'
import MobileHeader from '@/components/MobileHeader'
import { Music } from '@/types/music'
import { convertYouTubeToMusic } from '@/lib/youtube'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { sanitizeSearchQuery } from '@/lib/sanitize'
import { getLikedSongs } from '@/lib/liked-songs'
import { getSearchHistory, recordSearchQuery } from '@/lib/search-history'
import { buildTasteProfile, TasteProfile } from '@/lib/taste-profile'
import { usePlayer } from '@/contexts/PlayerContext'

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [playlist, setPlaylist] = useState<Music[]>([])
  const [autoRecommended, setAutoRecommended] = useState(false)
  const [showAIChat, setShowAIChat] = useState(false)
  const [tasteProfile, setTasteProfile] = useState<TasteProfile | null>(null)
  const { user } = useAuth()
  const router = useRouter()
  const { playQueue, currentTrack } = usePlayer()

  // Load popular YouTube music on mount
  useEffect(() => {
    const loadPopularMusic = async () => {
      try {
        const response = await fetch('/api/youtube/popular')
        const data = await response.json()

        if (data.items) {
          const musicTracks = data.items.map((item: any) => convertYouTubeToMusic(item))
          setPlaylist(musicTracks)
        }
      } catch (error) {
        console.error('Error loading popular music:', error)
        // Fallback to sample tracks if API fails
        const sampleTracks: Music[] = [
          {
            id: 'kJQP7kiw5Fk',
            title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
            artist: 'Luis Fonsi',
            album: 'Despacito',
            duration: 228,
            cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
            videoId: 'kJQP7kiw5Fk',
          },
        ]
        setPlaylist(sampleTracks)
      }
    }

    loadPopularMusic()
  }, [])

  const refreshTasteProfile = useCallback(async () => {
    if (!user) {
      setTasteProfile(null)
      return
    }
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
      const res = await fetch('/api/taste', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (res.ok) {
        const data = await res.json()
        setTasteProfile(data.profile)
        return
      }
    } catch (error) {
      console.error('Taste profile API failed, falling back to local cache', error)
    }

    // Fallback to local data if API fails
    const liked = await getLikedSongs(user.id)
    const searches = getSearchHistory(user.id)
    setTasteProfile(buildTasteProfile(liked, searches))
  }, [user])

  const buildRecommendationQuery = (profile: TasteProfile | null) => {
    if (!profile) return null
    if (profile.topArtists.length > 0) return profile.topArtists[0]
    if (profile.topGenres.length > 0) return `${profile.topGenres[0]} music`
    if (profile.favoriteMoods.length > 0) return `${profile.favoriteMoods[0]} music`
    if (profile.keywords.length > 0) return profile.keywords[0]
    return null
  }

  const loadPersonalizedMusic = useCallback(
    async (profile: TasteProfile | null) => {
      const query = buildRecommendationQuery(profile)
      if (!query || !user) return

      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
        const response = await fetch(
          `/api/youtube/search?q=${encodeURIComponent(query)}&maxResults=20&order=viewCount`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }
        )

        if (response.ok) {
          const data = await response.json()
          if (data.items) {
            const musicTracks = data.items.map((item: any) => convertYouTubeToMusic(item))
            setPlaylist(musicTracks)
            setAutoRecommended(true)
          }
        }
      } catch (error) {
        console.error('Error loading personalized music:', error)
      }
    },
    [user]
  )

  useEffect(() => {
    refreshTasteProfile()
  }, [user, refreshTasteProfile])

  useEffect(() => {
    if (!user) {
      setAutoRecommended(false)
    }
  }, [user])

  // When taste profile updates, auto-load recommendations once for the session
  useEffect(() => {
    if (user && tasteProfile && !autoRecommended) {
      loadPersonalizedMusic(tasteProfile)
    }
  }, [user, tasteProfile, autoRecommended, loadPersonalizedMusic])

  useEffect(() => {
    if (!user) return

    const handleStorageChange = () => refreshTasteProfile()
    const interval = setInterval(handleStorageChange, 1500)

    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [user])

  const handlePlay = (track: Music) => {
    const index = playlist.findIndex((t) => t.id === track.id)
    playQueue(playlist, index >= 0 ? index : 0)
  }

  const handleSearchResults = (results: Music[]) => {
    setPlaylist(results)
    refreshTasteProfile()
  }

  const handleAISearch = async (query: string) => {
    try {
      const { sanitized, isRejected } = sanitizeSearchQuery(query)
      if (isRejected) return
      recordSearchQuery(sanitized, user?.id)

      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
      const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(sanitized)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      const data = await response.json()
      
      if (data.items) {
        const musicTracks = data.items.map((item: any) => convertYouTubeToMusic(item))
        setPlaylist(musicTracks)
        refreshTasteProfile()
      }
    } catch (error) {
      console.error('Error searching via AI:', error)
    }
  }

  const showAds = user ? (user.hasAds ?? user.subscriptionPlan === 'FREE') : true

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-b from-spotify-dark via-spotify-gray to-black">
      {/* Mobile Header */}
      <MobileHeader onMenuClick={() => setMobileMenuOpen(true)} />
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:block lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:z-10">
        <Sidebar />
      </div>
      
      {/* Mobile Menu */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col pt-16 lg:pt-0 lg:pl-64 pb-20 lg:pb-24">
        <MainContent
          playlist={playlist}
          onPlay={handlePlay}
          currentTrack={currentTrack}
          onSearchResults={handleSearchResults}
          showAds={showAds}
          onUpgradeClick={() => router.push('/subscriptions')}
          tasteProfile={tasteProfile}
          onTastePrompt={handleAISearch}
          onSearchLogged={refreshTasteProfile}
        />
      </div>
      {/* AI Chat */}
      {showAIChat && (
        <AIChat 
          onClose={() => setShowAIChat(false)} 
          onSearchRequest={handleAISearch}
        />
      )}
      
      {/* AI Chat Toggle Button */}
      <button
        onClick={() => setShowAIChat(!showAIChat)}
        className="fixed bottom-28 lg:bottom-32 right-4 lg:right-6 w-12 h-12 lg:w-14 lg:h-14 bg-spotify-green hover:bg-green-600 active:scale-95 rounded-full flex items-center justify-center shadow-2xl z-50 transition-all"
        aria-label="Toggle AI Assistant"
      >
        <svg
          className="w-5 h-5 lg:w-6 lg:h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </button>
    </div>
  )
}

