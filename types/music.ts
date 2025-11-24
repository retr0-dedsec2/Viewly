export interface Music {
  id: string
  title: string
  artist: string
  album: string
  duration: number // in seconds
  cover: string
  url?: string
  videoId?: string // YouTube video ID
}

