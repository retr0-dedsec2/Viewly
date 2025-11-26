'use client'

import { useState, useEffect, useRef } from 'react'
import { Library, Plus, Play, Trash2 } from 'lucide-react'
import { Music } from '@/types/music'
import Sidebar from '@/components/Sidebar'
import MusicPlayer from '@/components/MusicPlayer'
import MobileMenu from '@/components/MobileMenu'
import MobileHeader from '@/components/MobileHeader'
import LikeButton from '@/components/LikeButton'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function LibraryPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [playlists, setPlaylists] = useState<Array<{ id: string; name: string; tracks: Music[] }>>([])
  const [currentTrack, setCurrentTrack] = useState<Music | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()

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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
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
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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

  const handlePlay = (track: Music) => {
    setCurrentTrack(track)
    setIsPlaying(true)
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const selectedPlaylistData = playlists.find((p) => p.id === selectedPlaylist)

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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className={`bg-spotify-light p-4 rounded-lg cursor-pointer hover:bg-spotify-gray transition-colors ${
                      selectedPlaylist === playlist.id ? 'ring-2 ring-spotify-green' : ''
                    }`}
                    onClick={() => setSelectedPlaylist(playlist.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-semibold truncate">{playlist.name}</h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deletePlaylist(playlist.id)
                        }}
                        className="text-gray-400 hover:text-red-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-gray-400 text-sm">{playlist.tracks.length} songs</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedPlaylistData && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">{selectedPlaylistData.name}</h2>
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
                      onClick={() => handlePlay(track)}
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
        <MusicPlayer
          track={currentTrack}
          isPlaying={isPlaying}
          onTogglePlay={togglePlayPause}
          audioRef={audioRef}
        />
      </div>
    </div>
  )
}

