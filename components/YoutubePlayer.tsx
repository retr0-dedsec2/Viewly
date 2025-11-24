'use client'

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react'

interface YoutubePlayerProps {
  videoId: string | null
  isPlaying: boolean
  onStateChange?: (state: number) => void
  onTimeUpdate?: (currentTime: number, duration: number) => void
  volume?: number
}

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

export interface YoutubePlayerRef {
  seekTo: (seconds: number) => void
}

const YoutubePlayer = forwardRef<YoutubePlayerRef, YoutubePlayerProps>(({
  videoId,
  isPlaying,
  onStateChange,
  onTimeUpdate,
  volume = 100,
}, ref) => {
  const playerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isReady, setIsReady] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const onStateChangeRef = useRef(onStateChange)

  // Keep callback ref updated
  useEffect(() => {
    onStateChangeRef.current = onStateChange
  }, [onStateChange])

  useImperativeHandle(ref, () => ({
    seekTo: (seconds: number) => {
      if (isReady && playerRef.current && typeof playerRef.current.seekTo === 'function') {
        try {
          playerRef.current.seekTo(seconds, true)
        } catch (e) {
          console.error('Error seeking:', e)
        }
      }
    },
  }))

  const createPlayer = (id: string) => {
    if (!containerRef.current || !window.YT) return

    // Destroy existing player if it exists
    if (playerRef.current) {
      try {
        playerRef.current.destroy()
      } catch (e) {
        // Ignore destroy errors
      }
      playerRef.current = null
    }

    setIsReady(false)

    try {
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '0',
        width: '0',
        videoId: id,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            setIsReady(true)
            if (onStateChangeRef.current && playerRef.current) {
              try {
                playerRef.current.addEventListener('onStateChange', (e: any) => {
                  if (onStateChangeRef.current) {
                    onStateChangeRef.current(e.data)
                  }
                })
              } catch (e) {
                console.error('Error adding state change listener:', e)
              }
            }
          },
          onError: (e: any) => {
            console.error('YouTube player error:', e)
            setIsReady(false)
          },
        },
      })
    } catch (e) {
      console.error('Error creating YouTube player:', e)
      setIsReady(false)
    }
  }

  useEffect(() => {
    if (!videoId) {
      setIsReady(false)
      return
    }

    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

      window.onYouTubeIframeAPIReady = () => {
        if (videoId) {
          createPlayer(videoId)
        }
      }
    } else {
      // API already loaded, create player
      createPlayer(videoId)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (playerRef.current) {
        try {
          playerRef.current.destroy()
        } catch (e) {
          // Ignore destroy errors
        }
        playerRef.current = null
      }
      setIsReady(false)
    }
  }, [videoId])

  useEffect(() => {
    if (!isReady || !playerRef.current || !videoId) return

    try {
      if (isPlaying) {
        if (typeof playerRef.current.playVideo === 'function') {
          playerRef.current.playVideo()
        }
      } else {
        if (typeof playerRef.current.pauseVideo === 'function') {
          playerRef.current.pauseVideo()
        }
      }
    } catch (e) {
      console.error('Error controlling playback:', e)
    }
  }, [isPlaying, isReady, videoId])

  useEffect(() => {
    if (!isReady || !playerRef.current || !videoId) return

    try {
      if (typeof playerRef.current.setVolume === 'function') {
        playerRef.current.setVolume(volume)
      }
    } catch (e) {
      console.error('Error setting volume:', e)
    }
  }, [volume, isReady, videoId])

  useEffect(() => {
    if (!isReady || !playerRef.current || !onTimeUpdate || !videoId) return

    intervalRef.current = setInterval(() => {
      try {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function' && typeof playerRef.current.getDuration === 'function') {
          const currentTime = playerRef.current.getCurrentTime()
          const duration = playerRef.current.getDuration()
          if (onTimeUpdate && !isNaN(currentTime) && !isNaN(duration)) {
            onTimeUpdate(currentTime, duration)
          }
        }
      } catch (e) {
        // Ignore errors
      }
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isReady, onTimeUpdate, videoId])

  return <div ref={containerRef} style={{ display: 'none' }} />
})

YoutubePlayer.displayName = 'YoutubePlayer'

export default YoutubePlayer
