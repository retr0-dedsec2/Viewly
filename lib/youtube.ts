// YouTube utility functions

export function parseDuration(duration: string): number {
  // Parse ISO 8601 duration (e.g., PT3M33S) to seconds
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0

  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  const seconds = parseInt(match[3] || '0', 10)

  return hours * 3600 + minutes * 60 + seconds
}

export function convertYouTubeToMusic(youtubeItem: any): any {
  // Some sources (iTunes fallback) store playback metadata under `playback`.
  const playback = youtubeItem.playback || {}
  const previewUrl = playback.previewUrl || youtubeItem.snippet?.description || undefined
  const coverOverride =
    playback.cover ||
    playback.thumbnail ||
    ''
  // iTunes previews should use audio preview URLs instead of forcing a bogus YouTube ID.
  const isITunesSource = playback.source === 'itunes'

  const resolvedVideoId = isITunesSource ? undefined : (youtubeItem.id?.videoId || youtubeItem.id)
  return {
    id: youtubeItem.id?.videoId || youtubeItem.id,
    title: youtubeItem.snippet?.title || '',
    artist: youtubeItem.snippet?.channelTitle || 'Unknown Artist',
    album: youtubeItem.snippet?.title || '',
    duration: youtubeItem.contentDetails?.duration
      ? parseDuration(youtubeItem.contentDetails.duration)
      : 0,
    cover:
      youtubeItem.snippet?.thumbnails?.high?.url ||
      youtubeItem.snippet?.thumbnails?.medium?.url ||
      youtubeItem.snippet?.thumbnails?.default?.url ||
      coverOverride,
    url: previewUrl && (!youtubeItem.id?.videoId || isITunesSource) ? previewUrl : undefined,
    videoId: resolvedVideoId,
  }
}
