'use client'

import { Music } from '@/types/music'
import { Play } from 'lucide-react'
import SearchBar from './SearchBar'
import LikeButton from './LikeButton'
import AdBanner from './AdBanner'
import TasteInsights from './TasteInsights'
import { TasteProfile } from '@/lib/taste-profile'

interface MainContentProps {
  playlist: Music[]
  onPlay: (track: Music) => void
  currentTrack: Music | null
  onSearchResults?: (results: Music[]) => void
  showAds?: boolean
  onUpgradeClick?: () => void
  tasteProfile?: TasteProfile | null
  onTastePrompt?: (prompt: string) => void
  onSearchLogged?: (query: string) => void
}

export default function MainContent({
  playlist,
  onPlay,
  currentTrack,
  onSearchResults,
  showAds,
  onUpgradeClick,
  tasteProfile,
  onTastePrompt,
  onSearchLogged,
}: MainContentProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6 lg:mb-8">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">Good evening</h2>
        <p className="text-gray-400 text-sm sm:text-base">Discover music with your AI assistant</p>
      </div>

      <div className="mb-6 lg:mb-8">
        <SearchBar onSearchResults={onSearchResults || (() => {})} onSearchLogged={onSearchLogged} />
      </div>

      {showAds && <AdBanner onUpgradeClick={onUpgradeClick} />}

      {/* Quick Access */}
      <div className="mb-8 lg:mb-12">
        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-4">Made for You</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {playlist.slice(0, 5).map((track) => (
            <div
              key={track.id}
              className="bg-spotify-light hover:bg-spotify-gray active:scale-[0.98] p-3 sm:p-4 rounded-lg cursor-pointer group transition-all animate-fade-in"
              onClick={() => onPlay(track)}
            >
              <div className="relative mb-2 sm:mb-3">
                <img
                  src={track.cover}
                  alt={track.album}
                  className="w-full aspect-square object-cover rounded shadow-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded flex items-center justify-center transition-all">
                  <button className="opacity-0 group-hover:opacity-100 w-10 h-10 sm:w-12 sm:h-12 bg-spotify-green rounded-full flex items-center justify-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all hover:scale-110">
                    <Play size={18} className="sm:w-5 sm:h-5" fill="white" />
                  </button>
                </div>
              </div>
              <h4 className="text-white font-semibold truncate text-sm sm:text-base">{track.album}</h4>
              <p className="text-gray-400 text-xs sm:text-sm truncate">{track.artist}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Playlist */}
      <div>
        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-4">Recently Played</h3>
        <div className="space-y-1 sm:space-y-2">
          {playlist.map((track, index) => (
            <div
              key={track.id}
              className={`flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-spotify-light active:scale-[0.98] cursor-pointer transition-all ${
                currentTrack?.id === track.id ? 'bg-spotify-light ring-1 ring-spotify-green' : ''
              }`}
              onClick={() => onPlay(track)}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 relative group">
                <img
                  src={track.cover}
                  alt={track.title}
                  className="w-full h-full object-cover rounded shadow-md"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded flex items-center justify-center transition-all">
                  <Play
                    size={14}
                    className="sm:w-4 sm:h-4 opacity-0 group-hover:opacity-100"
                    fill="white"
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
      </div>
    </div>
  )
}

