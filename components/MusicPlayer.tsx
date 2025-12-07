'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, Shuffle, Repeat } from 'lucide-react'
import { Music } from '@/types/music'
import YoutubePlayer, { YoutubePlayerRef } from './YoutubePlayer'

interface MusicPlayerProps {
  track: Music | null
  isPlaying: boolean
  onTogglePlay: () => void
  audioRef?: React.RefObject<HTMLAudioElement>
  onNext?: () => void
  onPrevious?: () => void
}

export default function MusicPlayer({ track, isPlaying, onTogglePlay, audioRef, onNext, onPrevious }: MusicPlayerProps) {
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(100)
  const youtubePlayerRef = useRef<YoutubePlayerRef>(null)

  useEffect(() => {
    setCurrentTime(0)
    setDuration(0)
  }, [track?.id])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    setCurrentTime(newTime)
    if (track?.videoId && youtubePlayerRef.current) {
      youtubePlayerRef.current.seekTo(newTime)
    } else if (audioRef?.current) {
      audioRef.current.currentTime = newTime
    }
  }

  const handleTimeUpdate = (current: number, total: number) => {
    setCurrentTime(current)
    setDuration(total)
  }

  const handleStateChange = (state: number) => {
    // YouTube player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
    if (state === 0) {
      // Video ended
      if (onNext) {
        onNext()
      }
    }
  }

  useEffect(() => {
    if (audioRef?.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume, audioRef])

  if (!track) return null

  const displayDuration = duration || track.duration

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 lg:h-24 bg-spotify-light border-t border-gray-800 px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-2 lg:gap-4 z-50 pb-[env(safe-area-inset-bottom,0)]">
      {track.videoId && (
        <YoutubePlayer
          ref={youtubePlayerRef}
          videoId={track.videoId}
          isPlaying={isPlaying}
          volume={volume}
          onTimeUpdate={handleTimeUpdate}
          onStateChange={handleStateChange}
        />
      )}
      {track.url && !track.videoId && audioRef && (
        <audio
          ref={audioRef}
          src={track.url}
          onTimeUpdate={(e) => handleTimeUpdate(e.currentTarget.currentTime, e.currentTarget.duration)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onEnded={onNext}
        />
      )}
      
      {/* Track Info - Hidden on mobile, visible on tablet+ */}
      <div className="hidden md:flex items-center gap-3 lg:gap-4 flex-1 min-w-0">
        <img
          src={track.cover}
          alt={track.title}
          className="w-12 h-12 lg:w-14 lg:h-14 rounded object-cover flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-white font-medium truncate text-sm lg:text-base">{track.title}</p>
          <p className="text-gray-400 text-xs lg:text-sm truncate">{track.artist}</p>
        </div>
      </div>

      {/* Mobile Track Info */}
      <div className="md:hidden flex items-center gap-2 flex-1 min-w-0">
        <img
          src={track.cover}
          alt={track.title}
          className="w-10 h-10 rounded object-cover flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-white font-medium truncate text-xs">{track.title}</p>
          <p className="text-gray-400 text-xs truncate">{track.artist}</p>
        </div>
      </div>

      {/* Player Controls */}
      <div className="flex-1 flex flex-col items-center gap-1 lg:gap-2">
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
          <button className="hidden sm:block text-gray-400 hover:text-white transition-colors">
            <Shuffle size={18} className="lg:w-5 lg:h-5" />
          </button>
          <button 
            onClick={onPrevious}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <SkipBack size={18} className="lg:w-5 lg:h-5" />
          </button>
          <button
            onClick={onTogglePlay}
            className="w-10 h-10 lg:w-12 lg:h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg"
          >
            {isPlaying ? <Pause size={18} fill="currentColor" className="lg:w-5 lg:h-5" /> : <Play size={18} fill="currentColor" className="lg:w-5 lg:h-5" />}
          </button>
          <button 
            onClick={onNext}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <SkipForward size={18} className="lg:w-5 lg:h-5" />
          </button>
          <button className="hidden sm:block text-gray-400 hover:text-white transition-colors">
            <Repeat size={18} className="lg:w-5 lg:h-5" />
          </button>
        </div>
        {/* Progress Bar - Hidden on mobile, visible on tablet+ */}
        <div className="hidden md:flex items-center gap-2 w-full max-w-2xl">
          <span className="text-xs text-gray-400 w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={displayDuration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-white hover:accent-spotify-green transition-colors"
          />
          <span className="text-xs text-gray-400 w-10">
            {formatTime(displayDuration)}
          </span>
        </div>
      </div>

      {/* Volume Control - Hidden on mobile, visible on desktop */}
      <div className="hidden lg:flex items-center justify-end gap-2 flex-1">
        <Volume2 size={20} className="text-gray-400" />
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => setVolume(parseInt(e.target.value))}
          className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-white hover:accent-spotify-green transition-colors"
        />
      </div>
    </div>
  )
}

