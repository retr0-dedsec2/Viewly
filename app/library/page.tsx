'use client'

import { useState, useEffect } from 'react'
import { Library, Plus, Play, Trash2 } from 'lucide-react'
import { Music } from '@/types/music'
import Sidebar from '@/components/Sidebar'
import MobileMenu from '@/components/MobileMenu'
import MobileHeader from '@/components/MobileHeader'
import LikeButton from '@/components/LikeButton'
import AdBanner from '@/components/AdBanner'
import GoogleAd from '@/components/GoogleAd'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { withCsrfHeader } from '@/lib/csrf'
import { usePlayer } from '@/contexts/PlayerContext'

type PlaylistTheme = {
  key: string
  name: string
  gradient: string
  accent: string
}

// Curated set of gradients so every playlist feels distinct
const playlistThemes: PlaylistTheme[] = [
  {
    key: 'neon',
    name: 'Neon Pulse',
    gradient: 'linear-gradient(135deg, #ff6a00 0%, #ee0979 100%)',
    accent: '#ff6a00',
  },
  {
    key: 'midnight',
    name: 'Midnight Drive',
    gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    accent: '#5e5be6',
  },
  {
    key: 'sunset',
    name: 'Sunset Bloom',
    gradient: 'linear-gradient(135deg, #f83600 0%, #f9d423 100%)',
    accent: '#f2841f',
  },
  {
    key: 'aurora',
    name: 'Aurora Mist',
    gradient: 'linear-gradient(135deg, #48c6ef 0%, #6f86d6 100%)',
    accent: '#48c6ef',
  },
  {
    key: 'forest',
    name: 'Forest Haze',
    gradient: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #1a2a6c 100%)',
    accent: '#2a9d8f',
  },
  {
    key: 'retro',
    name: 'Retro Wave',
    gradient: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)',
    accent: '#fd1d1d',
  },
]

const getPlaylistTheme = (id: string, name: string) => {
  const source = id || name
  let hash = 0
  for (let i = 0; i < source.length; i++) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0
  }
  return playlistThemes[hash % playlistThemes.length]
}

export default function LibraryPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [playlists, setPlaylists] = useState<Array<{ id: string; name: string; tracks: Music[] }>>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const { currentTrack, playQueue } = usePlayer()
  const userHasAds = user ? (user.hasAds ?? user.subscriptionPlan === 'FREE') : false

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // Load playlists from database API
    fetchPlaylists()
  }, [isAuthenticated, user, router])

  const fetchPlaylists = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const response = await fetch('/api/playlists', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        // Transform database playlists to match the expected format
        const formattedPlaylists = data.playlists.map((playlist: any) => ({
          id: playlist.id,
          name: playlist.name,
          tracks: playlist.tracks.map((track: any) => ({
            id: track.trackId,
            title: track.trackTitle,
            artist: track.trackArtist,
            cover: track.trackCover,
            videoId: track.trackVideoId,
            duration: track.trackDuration,
          }))
        }))
        setPlaylists(formattedPlaylists)
      }
    } catch (error) {
      console.error('Error fetching playlists:', error)
      // Fallback to localStorage
      const stored = localStorage.getItem(`playlists_${user?.id}`)
      if (stored) {
        setPlaylists(JSON.parse(stored))
      }
    }
  }

  const createPlaylist = async () => {
    if (!newPlaylistName.trim()) return

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: withCsrfHeader({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }),
        body: JSON.stringify({
          name: newPlaylistName,
          description: `Created manually by user`,
          tracks: []
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Refresh playlists from database
        fetchPlaylists()
        setNewPlaylistName('')
        setShowCreateForm(false)
        setSelectedPlaylist(data.playlist.id)
      } else {
        console.error('Failed to create playlist')
      }
    } catch (error) {
      console.error('Error creating playlist:', error)
      // Fallback to localStorage method
      const newPlaylist = {
        id: Date.now().toString(),
        name: newPlaylistName,
        tracks: [] as Music[],
      }

      const updated = [...playlists, newPlaylist]
      setPlaylists(updated)
      if (user) {
        localStorage.setItem(`playlists_${user.id}`, JSON.stringify(updated))
      }
      setNewPlaylistName('')
      setShowCreateForm(false)
      setSelectedPlaylist(newPlaylist.id)
    }
  }

  const deletePlaylist = async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const response = await fetch(`/api/playlists?id=${id}`, {
        method: 'DELETE',
        headers: withCsrfHeader({
          'Authorization': `Bearer ${token}`,
        }),
      })

      if (response.ok) {
        // Refresh playlists from database
        fetchPlaylists()
        if (selectedPlaylist === id) {
          setSelectedPlaylist(null)
        }
      } else {
        console.error('Failed to delete playlist')
      }
    } catch (error) {
      console.error('Error deleting playlist:', error)
      // Fallback to localStorage method
      const updated = playlists.filter((p) => p.id !== id)
      setPlaylists(updated)
      if (user) {
        localStorage.setItem(`playlists_${user.id}`, JSON.stringify(updated))
      }
      if (selectedPlaylist === id) {
        setSelectedPlaylist(null)
      }
    }
  }

  const handlePlay = (track: Music, tracks: Music[]) => {
    const index = tracks.findIndex((t) => t.id === track.id)
    playQueue(tracks, index >= 0 ? index : 0)
  }

  const selectedPlaylistData = playlists.find((p) => p.id === selectedPlaylist)
  const selectedTheme = selectedPlaylistData
    ? getPlaylistTheme(selectedPlaylistData.id, selectedPlaylistData.name)
    : null

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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Your Library</h1>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center gap-2 bg-spotify-green hover:bg-green-600 active:scale-95 text-white px-4 py-2 rounded-full transition-all text-sm sm:text-base"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Create Playlist</span>
                <span className="sm:hidden">Create</span>
              </button>
            </div>

            {/* Only show ads when there is meaningful library content to comply with AdSense */}
            {userHasAds && playlists.length > 0 && (
              <AdBanner onUpgradeClick={() => router.push('/subscriptions')} />
            )}
            {userHasAds && playlists.length > 0 && <GoogleAd className="mb-6" />}

            {showCreateForm && (
              <div className="bg-spotify-light p-4 rounded-lg mb-4">
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Playlist name"
                  className="w-full bg-spotify-gray text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-spotify-green mb-2"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      createPlaylist()
                    }
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={createPlaylist}
                    className="bg-spotify-green hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateForm(false)
                      setNewPlaylistName('')
                    }}
                    className="bg-spotify-gray hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {playlists.length === 0 ? (
              <div className="text-center py-12 sm:py-20">
                <Library size={48} className="sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-base sm:text-lg mb-4">Create your first playlist</p>
              </div>
            ) : (
              <>
                {/* Mobile-friendly horizontal carousel */}
                <div className="md:hidden -mx-2 px-2 pb-4 space-y-3">
                  <h2 className="text-white font-semibold text-lg">Your playlists</h2>
                  <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory">
                    {playlists.map((playlist) => {
                      const theme = getPlaylistTheme(playlist.id, playlist.name)
                      return (
                        <button
                          key={playlist.id}
                          className="relative min-w-[220px] text-left overflow-hidden rounded-xl p-4 snap-start border border-white/5 active:scale-[0.98] transition-transform"
                          style={{
                            backgroundImage: theme.gradient,
                            boxShadow:
                              selectedPlaylist === playlist.id ? `0 0 0 2px ${theme.accent}` : undefined,
                          }}
                          onClick={() => setSelectedPlaylist(playlist.id)}
                        >
                          <div className="absolute inset-0 bg-black/30" />
                          <div className="absolute top-2 right-2 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deletePlaylist(playlist.id)
                              }}
                              className="text-gray-200 hover:text-red-300"
                              aria-label="Delete playlist"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="relative flex items-center justify-between mb-2">
                            <div>
                              <span
                                className="inline-block text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wider"
                                style={{
                                  backgroundColor: `${theme.accent}1A`,
                                  color: theme.accent,
                                }}
                              >
                                {theme.name}
                              </span>
                              <h3 className="text-white font-semibold truncate mt-2">{playlist.name}</h3>
                            </div>
                            <span className="text-gray-100 text-xs bg-black/30 px-2 py-1 rounded-full">
                              {playlist.tracks.length} songs
                            </span>
                          </div>
                          <div className="relative text-gray-100 text-xs">
                            Tap to view tracks
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Desktop / tablet grid */}
                <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {playlists.map((playlist) => {
                    const theme = getPlaylistTheme(playlist.id, playlist.name)
                    return (
                      <div
                        key={playlist.id}
                        className="relative overflow-hidden p-4 rounded-lg cursor-pointer transition-transform duration-150 hover:scale-[1.02] border border-white/5"
                        style={{
                          backgroundImage: theme.gradient,
                          boxShadow:
                            selectedPlaylist === playlist.id
                              ? `0 0 0 2px ${theme.accent}`
                              : undefined,
                        }}
                        onClick={() => setSelectedPlaylist(playlist.id)}
                      >
                        <div className="absolute inset-0 bg-black/30" />
                        <div className="flex items-center justify-between mb-2">
                          <div className="relative">
                            <span
                              className="inline-block text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wider"
                              style={{
                                backgroundColor: `${theme.accent}1A`,
                                color: theme.accent,
                              }}
                            >
                              {theme.name}
                            </span>
                            <h3 className="text-white font-semibold truncate mt-2">{playlist.name}</h3>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deletePlaylist(playlist.id)
                            }}
                            className="text-gray-200 hover:text-red-300 relative z-10"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <p className="relative text-gray-100 text-sm drop-shadow-sm">{playlist.tracks.length} songs</p>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {selectedPlaylistData && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="h-10 w-10 rounded-lg shadow-lg"
                  style={{
                    backgroundImage: selectedTheme?.gradient,
                  }}
                />
                <div>
                  <p
                    className="text-xs uppercase tracking-wide font-semibold"
                    style={{ color: selectedTheme?.accent }}
                  >
                    {selectedTheme?.name}
                  </p>
                  <h2 className="text-2xl font-bold text-white">{selectedPlaylistData.name}</h2>
                </div>
              </div>
              {selectedPlaylistData.tracks.length === 0 ? (
                <p className="text-gray-400">This playlist is empty</p>
              ) : (
                <div className="space-y-2">
                  {selectedPlaylistData.tracks.map((track) => (
                    <div
                      key={track.id}
                      className={`flex items-center gap-4 p-3 rounded-lg hover:bg-spotify-light cursor-pointer transition-colors ${
                        currentTrack?.id === track.id ? 'bg-spotify-light' : ''
                      }`}
                      onClick={() => handlePlay(track, selectedPlaylistData.tracks)}
                    >
                      <div className="w-12 h-12 flex-shrink-0 relative group">
                        <img
                          src={track.cover}
                          alt={track.title}
                          className="w-full h-full object-cover rounded"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded flex items-center justify-center transition-all">
                          <Play
                            size={16}
                            fill="white"
                            className="opacity-0 group-hover:opacity-100"
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium truncate ${
                            currentTrack?.id === track.id ? 'text-spotify-green' : 'text-white'
                          }`}
                        >
                          {track.title}
                        </p>
                        <p className="text-gray-400 text-sm truncate">{track.artist}</p>
                      </div>
                      <div className="text-gray-400 text-sm">
                        {Math.floor(track.duration / 60)}:
                        {(track.duration % 60).toString().padStart(2, '0')}
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <LikeButton track={track} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

