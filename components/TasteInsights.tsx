'use client'

import { Flame, Compass, Sparkles, Radio } from 'lucide-react'
import { TasteProfile } from '@/lib/taste-profile'

interface TasteInsightsProps {
  profile: TasteProfile | null
  onPromptSelect?: (prompt: string) => void
}

export default function TasteInsights({ profile, onPromptSelect }: TasteInsightsProps) {
  const hasData =
    profile &&
    (profile.topArtists.length > 0 ||
      profile.topGenres.length > 0 ||
      profile.totalLiked > 0 ||
      profile.totalSearches > 0)

  const primaryPrompt =
    profile?.topArtists[0] ||
    (profile?.topGenres && profile.topGenres[0]) ||
    (profile?.favoriteMoods && profile.favoriteMoods[0])

  const prompt = primaryPrompt ? `Play more like ${primaryPrompt}` : 'Find music for me'

  return (
    <div className="bg-gradient-to-br from-spotify-light to-spotify-gray border border-gray-800 rounded-2xl p-4 sm:p-5 lg:p-6 shadow-xl">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-spotify-green/20 flex items-center justify-center">
            <Compass className="text-spotify-green" size={18} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">Taste Radar</p>
            <h3 className="text-lg sm:text-xl font-bold text-white">Your music DNA</h3>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Radio size={16} />
          <span>{profile?.totalLiked || 0} likes · {profile?.totalSearches || 0} searches</span>
        </div>
      </div>

      {hasData ? (
        <>
          <p className="text-gray-300 text-sm mb-4">{profile?.summary}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-black/20 rounded-xl p-3 border border-gray-800/60">
              <div className="flex items-center gap-2 mb-2">
                <Flame size={16} className="text-spotify-green" />
                <p className="text-sm text-gray-300 font-semibold">Core artists</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile?.topArtists.length
                  ? profile.topArtists.map((artist) => (
                      <span
                        key={artist}
                        className="px-3 py-1 rounded-full bg-spotify-green/20 text-spotify-green text-xs"
                      >
                        {artist}
                      </span>
                    ))
                  : <span className="text-gray-500 text-xs">Like songs to reveal artists</span>}
              </div>
            </div>

            <div className="bg-black/20 rounded-xl p-3 border border-gray-800/60">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-spotify-green" />
                <p className="text-sm text-gray-300 font-semibold">Genres & moods</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile?.topGenres.slice(0, 3).map((genre) => (
                  <span
                    key={genre}
                    className="px-3 py-1 rounded-full bg-spotify-light text-white text-xs"
                  >
                    {genre}
                  </span>
                ))}
                {profile?.favoriteMoods.map((mood) => (
                  <span
                    key={mood}
                    className="px-3 py-1 rounded-full bg-spotify-green/15 text-spotify-green text-xs"
                  >
                    {mood}
                  </span>
                ))}
                {!profile?.topGenres.length && !profile?.favoriteMoods.length && (
                  <span className="text-gray-500 text-xs">Search for a genre to tune this section</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {profile?.keywords.map((keyword) => (
              <span
                key={keyword}
                className="px-3 py-1 rounded-full bg-spotify-gray text-gray-200 text-xs border border-gray-800"
              >
                {keyword}
              </span>
            ))}
            {profile?.recentSearches.map((query) => (
              <span
                key={query}
                className="px-3 py-1 rounded-full bg-spotify-gray/60 text-gray-200 text-xs border border-gray-800/60"
              >
                {query}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={() => onPromptSelect?.(prompt)}
              className="px-4 py-2 bg-spotify-green text-black rounded-full text-sm font-semibold hover:bg-green-500 active:scale-95 transition-all"
            >
              {prompt}
            </button>
            {profile?.topGenres[0] && (
              <button
                onClick={() => onPromptSelect?.(`Best new ${profile.topGenres[0]} tracks`)}
                className="px-4 py-2 bg-white/10 text-white rounded-full text-sm border border-gray-700 hover:bg-white/15 active:scale-95 transition-all"
              >
                Explore {profile.topGenres[0]}
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="text-sm text-gray-400">
          Start searching or liking songs and we&apos;ll map out your taste profile in real time.
        </div>
      )}
    </div>
  )
}
