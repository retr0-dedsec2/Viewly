export interface Music {
  id: string
  title: string
  artist: string
  album: string
  duration: number // in seconds
  cover: string
  slug?: string
  source?: 'YOUTUBE' | 'CUSTOM'
  url?: string
  videoId?: string // YouTube video ID
  audioUrl?: string
}
