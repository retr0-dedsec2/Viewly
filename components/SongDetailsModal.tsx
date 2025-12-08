'use client'

import { useEffect, useMemo, useState } from 'react'
import { Music } from '@/types/music'
import { Clock, ExternalLink, Facebook, Twitter, X as CloseIcon } from 'lucide-react'
import ModalErrorBoundary from './ModalErrorBoundary'
import { useLanguage } from '@/contexts/LanguageContext'

type SongDetailsModalProps = {
  track: Music | null
  onClose: () => void
}

function formatDuration(seconds?: number) {
  if (!seconds) return 'Unknown'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const SpotifyIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12 1.5A10.5 10.5 0 1 0 22.5 12 10.512 10.512 0 0 0 12 1.5Zm4.806 14.847a.656.656 0 0 1-.9.218c-2.46-1.5-5.56-1.838-9.198-1.005a.657.657 0 0 1-.284-1.283c3.984-.883 7.39-.504 10.08 1.123a.656.656 0 0 1 .302.947Zm1.278-2.853a.821.821 0 0 1-1.126.273c-2.818-1.73-7.118-2.23-10.45-1.217a.822.822 0 1 1-.476-1.575c3.787-1.144 8.558-.584 11.826 1.43a.82.82 0 0 1 .226 1.089Zm.114-2.977C15.05 8.448 8.876 8.272 5.42 9.313a.986.986 0 1 1-.572-1.89c3.87-1.172 10.6-.96 14.91 1.547a.986.986 0 0 1-1.036 1.695Z" />
  </svg>
)

export default function SongDetailsModal({ track, onClose }: SongDetailsModalProps) {
  const videoUrl = track?.videoId ? `https://www.youtube.com/watch?v=${track.videoId}` : undefined
  const spotifySearchUrl = useMemo(
    () => (track ? `https://open.spotify.com/search/${encodeURIComponent(`${track.title} ${track.artist}`)}` : ''),
    [track]
  )
  const googleSearchUrl = useMemo(
    () => (track ? `https://www.google.com/search?q=${encodeURIComponent(`${track.title} ${track.artist}`)}` : ''),
    [track]
  )
  const [shareUrl, setShareUrl] = useState<string>('')
  const { t } = useLanguage()

  if (!track) return null

  const shareText = `${track.title} - ${track.artist}`

  const shareTo = (platform: 'twitter' | 'facebook' | 'spotify') => {
    if (!shareUrl) return
    const encodedUrl = encodeURIComponent(shareUrl)
    const encodedText = encodeURIComponent(shareText)

    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, '_blank')
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank')
    } else if (platform === 'spotify') {
      window.open(spotifySearchUrl || shareUrl, '_blank')
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: track.title, text: shareText, url: shareUrl })
      } catch {
        // ignore errors from closed share sheet
      }
    } else {
      shareTo('twitter')
    }
  }

  useEffect(() => {
    if (!track) return
    if (videoUrl) {
      setShareUrl(videoUrl)
      return
    }
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href)
    }
  }, [track, videoUrl])

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <ModalErrorBoundary>
        <div className="bg-spotify-light w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-white p-2 rounded-full hover:bg-black/30 transition-colors"
            aria-label="Close details"
          >
            <CloseIcon size={20} />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-[260px,1fr]">
            <div className="p-4 sm:p-6">
              <div className="rounded-xl overflow-hidden shadow-lg">
                <img src={track.cover} alt={track.title} className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="p-5 sm:p-7 space-y-4 sm:space-y-6">
              <div>
                <p className="text-xs uppercase text-gray-400 tracking-widest mb-1">{t('nowExploring')}</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{track.title}</h3>
                <p className="text-gray-300 text-sm sm:text-base mt-1">{track.artist}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-black/20 rounded-lg p-3 border border-gray-800">
                  <p className="text-gray-400 text-xs">{t('album')}</p>
                  <p className="text-white font-semibold truncate">{track.album || 'Unknown'}</p>
                </div>
                <div className="bg-black/20 rounded-lg p-3 border border-gray-800">
                  <p className="text-gray-400 text-xs">{t('duration')}</p>
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Clock size={16} />
                    <span>{formatDuration(track.duration)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-400">{t('explore')}</p>
                <div className="flex flex-wrap gap-2">
                  {videoUrl && (
                    <a
                      href={videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-full bg-black/30 border border-gray-800 text-white flex items-center gap-2 hover:bg-black/50 transition-colors"
                    >
                      {t('openVideo')}
                      <ExternalLink size={16} />
                    </a>
                  )}
                  <a
                    href={spotifySearchUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-full bg-black/30 border border-gray-800 text-white flex items-center gap-2 hover:bg-black/50 transition-colors"
                  >
                    {t('openSpotify')}
                    <ExternalLink size={16} />
                  </a>
                  <a
                    href={googleSearchUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-full bg-black/30 border border-gray-800 text-white flex items-center gap-2 hover:bg-black/50 transition-colors"
                  >
                    {t('googleSearch')}
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">{t('share')}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => shareTo('twitter')}
                    className="p-2 rounded-full bg-black/30 hover:bg-black/50 border border-gray-800 text-white transition-colors"
                    aria-label="Share on Twitter"
                  >
                    <Twitter size={18} />
                  </button>
                  <button
                    onClick={() => shareTo('facebook')}
                    className="p-2 rounded-full bg-black/30 hover:bg-black/50 border border-gray-800 text-white transition-colors"
                    aria-label="Share on Facebook"
                  >
                    <Facebook size={18} />
                  </button>
                  <button
                    onClick={() => shareTo('spotify')}
                    className="p-2 rounded-full bg-black/30 hover:bg-black/50 border border-gray-800 text-white transition-colors"
                    aria-label="Open on Spotify"
                  >
                    <SpotifyIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNativeShare}
                    className="px-3 py-2 rounded-full bg-spotify-green text-black font-semibold hover:bg-green-500 transition-colors"
                  >
                    {t('quickShare')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ModalErrorBoundary>
    </div>
  )
}
