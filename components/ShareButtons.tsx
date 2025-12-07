'use client'

import { Music } from '@/types/music'
import { Facebook, Twitter } from 'lucide-react'

type ShareButtonsProps = {
  track: Music
  size?: number
  dense?: boolean
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

export default function ShareButtons({ track, size = 28, dense }: ShareButtonsProps) {
  const shareUrl = track.videoId ? `https://www.youtube.com/watch?v=${track.videoId}` : window.location.href
  const shareText = `${track.title} - ${track.artist}`
  const spotifySearchUrl = `https://open.spotify.com/search/${encodeURIComponent(`${track.title} ${track.artist}`)}`

  const shareTo = (platform: 'twitter' | 'facebook' | 'spotify') => {
    const encodedUrl = encodeURIComponent(shareUrl)
    const encodedText = encodeURIComponent(shareText)

    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, '_blank')
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank')
    } else if (platform === 'spotify') {
      window.open(spotifySearchUrl, '_blank')
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: track.title, text: shareText, url: shareUrl })
      } catch {
        // ignore
      }
    } else {
      shareTo('twitter')
    }
  }

  const iconSize = dense ? 16 : size
  const buttonClasses =
    'p-2 rounded-full bg-black/20 hover:bg-black/40 border border-gray-800 text-white transition-colors'

  return (
    <div className={`flex items-center ${dense ? 'gap-1.5' : 'gap-2'}`}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          shareTo('twitter')
        }}
        className={buttonClasses}
        aria-label="Share on Twitter"
      >
        <Twitter size={iconSize} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          shareTo('facebook')
        }}
        className={buttonClasses}
        aria-label="Share on Facebook"
      >
        <Facebook size={iconSize} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          shareTo('spotify')
        }}
        className={buttonClasses}
        aria-label="Open on Spotify"
      >
        <SpotifyIcon className={dense ? 'w-4 h-4' : 'w-5 h-5'} />
      </button>
      {!dense && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleNativeShare()
          }}
          className="px-3 py-2 rounded-full bg-spotify-green text-black font-semibold hover:bg-green-500 transition-colors"
        >
          Share
        </button>
      )}
    </div>
  )
}
