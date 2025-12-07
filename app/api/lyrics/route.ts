import { NextRequest, NextResponse } from 'next/server'

async function fetchFromLrcLib(artist: string, title: string) {
  const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`
  const res = await fetch(url, { next: { revalidate: 60 } })
  if (!res.ok) return null
  const data = await res.json()
  return data?.plainLyrics || data?.syncedLyrics || null
}

async function fetchFromLyricsOvh(artist: string, title: string) {
  const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  return data?.lyrics || null
}

export async function GET(req: NextRequest) {
  const artist = req.nextUrl.searchParams.get('artist') || ''
  const title = req.nextUrl.searchParams.get('title') || ''

  if (!artist || !title) {
    return NextResponse.json({ error: 'artist and title are required' }, { status: 400 })
  }

  try {
    const primary = await fetchFromLrcLib(artist, title)
    if (primary) {
      return NextResponse.json({ lyrics: primary })
    }

    const fallback = await fetchFromLyricsOvh(artist, title)
    if (fallback) {
      return NextResponse.json({ lyrics: fallback })
    }

    return NextResponse.json({ lyrics: null }, { status: 404 })
  } catch (error) {
    console.error('Lyrics API error', error)
    return NextResponse.json({ error: 'Failed to fetch lyrics' }, { status: 500 })
  }
}
