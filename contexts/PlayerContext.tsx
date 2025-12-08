'use client'

import { createContext, useContext, useState, useRef, useCallback, ReactNode, useEffect } from 'react'
import { Music } from '@/types/music'
import MusicPlayer from '@/components/MusicPlayer'

type PlayerContextValue = {
  currentTrack: Music | null
  isPlaying: boolean
  queue: Music[]
  currentIndex: number
  playQueue: (tracks: Music[], startIndex?: number) => void
  playTrack: (track: Music, tracks?: Music[]) => void
  togglePlayPause: () => void
  playNext: () => void
  playPrevious: () => void
  clear: () => void
}

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Music | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [queue, setQueue] = useState<Music[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const audioRef = useRef<HTMLAudioElement>(null)

  const playQueue = useCallback((tracks: Music[], startIndex = 0) => {
    if (tracks.length === 0) {
      setCurrentTrack(null)
      setQueue([])
      setCurrentIndex(-1)
      setIsPlaying(false)
      return
    }

    const safeIndex = Math.min(Math.max(startIndex, 0), tracks.length - 1)
    setQueue(tracks)
    setCurrentIndex(safeIndex)
    setCurrentTrack(tracks[safeIndex])
    setIsPlaying(true)
  }, [])

  const playTrack = useCallback(
    (track: Music, tracks?: Music[]) => {
      const activeQueue = tracks && tracks.length > 0 ? tracks : queue
      if (activeQueue.length === 0) {
        playQueue([track], 0)
        return
      }

      const index = activeQueue.findIndex((t) => t.id === track.id)
      playQueue(activeQueue, index >= 0 ? index : 0)
    },
    [playQueue, queue]
  )

  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev
      if (audioRef.current && !currentTrack?.videoId) {
        if (next) {
          audioRef.current.play().catch(() => {})
        } else {
          audioRef.current.pause()
        }
      }
      return next
    })
  }, [currentTrack])

  const playNext = useCallback(() => {
    if (queue.length === 0) return
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % queue.length : 0
    setCurrentIndex(nextIndex)
    setCurrentTrack(queue[nextIndex])
    setIsPlaying(true)
  }, [currentIndex, queue])

  const playPrevious = useCallback(() => {
    if (queue.length === 0) return
    const prevIndex = currentIndex <= 0 ? queue.length - 1 : currentIndex - 1
    setCurrentIndex(prevIndex)
    setCurrentTrack(queue[prevIndex])
    setIsPlaying(true)
  }, [currentIndex, queue])

  const clear = useCallback(() => {
    setIsPlaying(false)
    setCurrentTrack(null)
    setQueue([])
    setCurrentIndex(-1)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [])

  useEffect(() => {
    if (!audioRef.current || !currentTrack || currentTrack.videoId) return
    if (isPlaying) {
      audioRef.current.play().catch(() => {})
    } else {
      audioRef.current.pause()
    }
  }, [currentTrack, isPlaying])

  const value: PlayerContextValue = {
    currentTrack,
    isPlaying,
    queue,
    currentIndex,
    playQueue,
    playTrack,
    togglePlayPause,
    playNext,
    playPrevious,
    clear,
  }

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <div className="h-20 lg:h-24" aria-hidden="true" />
      <MusicPlayer
        track={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={togglePlayPause}
        audioRef={audioRef}
        onNext={playNext}
        onPrevious={playPrevious}
      />
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) {
    throw new Error('usePlayer must be used within a PlayerProvider')
  }
  return ctx
}
