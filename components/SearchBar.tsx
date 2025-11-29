'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { Music } from '@/types/music'
import { convertYouTubeToMusic } from '@/lib/youtube'
import { sanitizeSearchQuery } from '@/lib/sanitize'
import { recordSearchQuery } from '@/lib/search-history'
import { useAuth } from '@/contexts/AuthContext'
import { getToken } from '@/lib/auth-client'

interface SearchBarProps {
  onSearchResults: (results: Music[]) => void
  onClose?: () => void
  onSearchLogged?: (query: string) => void
}

export default function SearchBar({ onSearchResults, onClose, onSearchLogged }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const { user } = useAuth()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isSearching) return

    setIsSearching(true)
    try {
      const { sanitized, isRejected } = sanitizeSearchQuery(query)
      if (isRejected) {
        setIsSearching(false)
        return
      }

      const token = getToken()
      const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(sanitized)}&maxResults=20`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      const data = await response.json()

      if (data.items) {
        const musicResults = data.items.map((item: any) => convertYouTubeToMusic(item))
        onSearchResults(musicResults)
        recordSearchQuery(sanitized, user?.id)
        onSearchLogged?.(sanitized)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value.replace(/[<>]/g, ''))}
          placeholder="Search for songs, artists, albums..."
          className="w-full bg-spotify-light text-white px-10 sm:px-12 py-2.5 sm:py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-spotify-green placeholder-gray-400 text-sm sm:text-base transition-all"
        />
        <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              if (onClose) onClose()
            }}
            className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        )}
        {isSearching && (
          <div className="absolute right-10 sm:right-12 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-gray-400 border-t-white rounded-full animate-spin"></div>
          </div>
        )}
      </form>
    </div>
  )
}

