import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buildTasteProfile } from '@/lib/taste-profile'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const [userLikedSongs, userSearchHistory] = await Promise.all([
      prisma.likedSong.findMany({
        where: { userId },
        orderBy: { likedAt: 'desc' },
        take: 30,
      }),
      prisma.searchHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    ])

    const profile = buildTasteProfile(
      userLikedSongs.map((song) => ({
        title: song.trackTitle,
        artist: song.trackArtist,
        album: song.trackAlbum,
        likedAt: song.likedAt,
      })),
      userSearchHistory.map((entry) => ({ query: entry.query, createdAt: entry.createdAt }))
    )

    const recommendations: Array<{ type: string; query: string; reason: string }> = []

    profile.topArtists.slice(0, 3).forEach((artist) => {
      recommendations.push({
        type: 'similar_artist',
        query: `songs similar to ${artist}`,
        reason: `Because you keep liking ${artist}`,
      })
    })

    profile.topGenres.slice(0, 3).forEach((genre) => {
      recommendations.push({
        type: 'genre',
        query: `${genre} music`,
        reason: `Popular ${genre} tracks`,
      })
    })

    profile.favoriteMoods.slice(0, 2).forEach((mood) => {
      recommendations.push({
        type: 'mood',
        query: `${mood} playlist`,
        reason: `Matches your ${mood} sessions`,
      })
    })

    profile.recentSearches.slice(0, 4).forEach((search) => {
      recommendations.push({
        type: 'related_search',
        query: search,
        reason: 'Based on your recent searches',
      })
    })

    // Add a keyword-driven exploration hook for variety
    if (profile.keywords[0]) {
      recommendations.push({
        type: 'keyword',
        query: `${profile.keywords[0]} music`,
        reason: `You look for ${profile.keywords[0]} often`,
      })
    }

    return NextResponse.json({
      recommendations: recommendations.slice(0, 10),
      preferences: {
        topArtists: profile.topArtists,
        topGenres: profile.topGenres,
        favoriteMoods: profile.favoriteMoods,
        totalLikedSongs: userLikedSongs.length,
        totalSearches: userSearchHistory.length,
        summary: profile.summary,
      },
    })
  } catch (error) {
    console.error('AI recommendations error:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}

