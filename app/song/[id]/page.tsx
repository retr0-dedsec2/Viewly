import { notFound } from 'next/navigation'
import { convertYouTubeToMusic } from '@/lib/youtube'
import { getSongByIdOrSlug } from '@/lib/songs'
import { Music } from '@/types/music'

type VideoResponse = {
  items?: any[]
}

function formatDuration(seconds?: number) {
  if (!seconds) return 'Unknown'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

async function fetchSong(id: string): Promise<Music | null> {
  if (!id) return null

  const custom = await getSongByIdOrSlug(id)
  if (custom) {
    return {
      ...custom,
      id: custom.slug || custom.id,
      album: custom.album || 'Single',
      cover:
        custom.cover ||
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=600&fit=crop&auto=format',
      duration: custom.duration || 0,
      source: 'CUSTOM',
    }
  }

  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    return {
      id,
      title: 'Song details unavailable',
      artist: 'Unknown artist',
      album: 'Unknown album',
      duration: 0,
      cover:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=600&fit=crop&auto=format',
      videoId: id,
    }
  }

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${id}&key=${apiKey}`,
    {
      next: { revalidate: 300 },
    }
  )

  if (!res.ok) return null

  const data: VideoResponse = await res.json()
  const item = data.items?.[0]
  if (!item) return null

  return convertYouTubeToMusic(item)
}

export default async function SongPage({ params }: { params: { id: string } }) {
  const song = await fetchSong(params.id)

  if (!song) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-spotify-dark via-spotify-gray to-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <a
          href="/"
          className="text-sm text-gray-300 hover:text-spotify-green transition-colors inline-block mb-6"
        >
          Back to home
        </a>

        <div className="grid grid-cols-1 md:grid-cols-[260px,1fr] gap-8 bg-spotify-light border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-5">
            <div className="rounded-xl overflow-hidden shadow-lg bg-black/30">
              <img src={song.cover} alt={song.title} className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <p className="text-xs uppercase text-gray-400 tracking-widest mb-1">Song details</p>
              <h1 className="text-3xl font-bold leading-tight">{song.title}</h1>
              <p className="text-gray-300 mt-1">{song.artist}</p>
              {song.source === 'CUSTOM' && (
                <span className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-spotify-green/10 text-spotify-green text-xs font-semibold">
                  Created by artist/admin
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-black/20 rounded-lg p-3 border border-gray-800">
                <p className="text-gray-400 text-xs">Album</p>
                <p className="text-white font-semibold truncate">{song.album || 'Unknown'}</p>
              </div>
              <div className="bg-black/20 rounded-lg p-3 border border-gray-800">
                <p className="text-gray-400 text-xs">Duration</p>
                <p className="text-white font-semibold">{formatDuration(song.duration)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {song.audioUrl && (
                <div className="w-full bg-black/30 border border-gray-800 rounded-xl p-4">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Preview</p>
                  <audio
                    controls
                    src={song.audioUrl}
                    className="w-full rounded-lg accent-spotify-green"
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
              {song.videoId && (
                <a
                  href={`https://www.youtube.com/watch?v=${song.videoId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-full bg-spotify-green text-black font-semibold hover:bg-green-500 transition-colors"
                >
                  Open on YouTube
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
