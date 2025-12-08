'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Music } from '@/types/music'
import { convertYouTubeToMusic } from '@/lib/youtube'
import { sanitizeSearchQuery } from '@/lib/sanitize'
import { getSearchHistory, recordSearchQuery } from '@/lib/search-history'
import { useAuth } from '@/contexts/AuthContext'
import { getToken } from '@/lib/auth-client'
import SearchSuggestions, { SuggestionItem } from './SearchSuggestions'
import { withCsrfHeader } from '@/lib/csrf'
import { useLanguage } from '@/contexts/LanguageContext'

interface SearchBarProps {
  onSearchResults: (results: Music[]) => void
  onClose?: () => void
  onSearchLogged?: (query: string) => void
}

export default function SearchBar({ onSearchResults, onClose, onSearchLogged }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [aiSuggestions, setAiSuggestions] = useState<SuggestionItem[]>([])
  const { user } = useAuth()
  const { t } = useLanguage()

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
      console.error('AI suggestion error:', error)
    }
  }, [user?.id])

  useEffect(() => {
    fetchAiSuggestions()
  }, [fetchAiSuggestions])

  const combinedSuggestions = useMemo(() => {
    const suggestions: SuggestionItem[] = []
    const filterMatch = (value: string) =>
      !query.trim() || value.toLowerCase().includes(query.toLowerCase())

    recentSearches
      .filter(filterMatch)
      .slice(0, 6)
      .forEach((entry) => suggestions.push({ label: entry, source: 'recent' }))

    aiSuggestions
      .filter((entry) => filterMatch(entry.label))
      .slice(0, 6)
      .forEach((entry) => suggestions.push(entry))

    const unique = new Map<string, SuggestionItem>()
    suggestions.forEach((item) => {
      if (!unique.has(item.label.toLowerCase())) {
        unique.set(item.label.toLowerCase(), item)
      }
    })
    return Array.from(unique.values()).slice(0, 8)
  }, [aiSuggestions, query, recentSearches])

  const executeSearch = useCallback(
    async (value: string) => {
      if (!value.trim() || isSearching) return

      setIsSearching(true)
      try {
        const { sanitized, isRejected } = sanitizeSearchQuery(value)
        if (isRejected) {
          setIsSearching(false)
          return
        }

        const token = getToken()
        const response = await fetch(
          `/api/youtube/search?q=${encodeURIComponent(sanitized)}&maxResults=20`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }
        )
        const data = await response.json()

        if (data.items) {
          const musicResults = data.items.map((item: any) => convertYouTubeToMusic(item))
          onSearchResults(musicResults)
          recordSearchQuery(sanitized, user?.id)
          onSearchLogged?.(sanitized)
          setRecentSearches(getSearchHistory(user?.id).map((entry) => entry.query))
          setShowSuggestions(false)
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsSearching(false)
      }
    },
    [isSearching, onSearchLogged, onSearchResults, user?.id]
  )

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    await executeSearch(query)
  }

  const handleSuggestionSelect = (value: string) => {
    setQuery(value)
    executeSearch(value)
  }

  return (
    <div className="w-full relative">
      <form
        onSubmit={handleSearch}
        className="relative"
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value.replace(/[<>]/g, ''))
            setShowSuggestions(true)
          }}
          placeholder={t('searchPlaceholder')}
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
      <SearchSuggestions
        visible={showSuggestions}
        items={combinedSuggestions}
        onSelect={handleSuggestionSelect}
      />
    </div>
  )
}

