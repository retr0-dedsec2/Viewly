import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { userId, likedSongs, searchHistory } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get user's liked songs and search history from database
    const userLikedSongs = await prisma.likedSong.findMany({
      where: { userId },
      orderBy: { likedAt: 'desc' },
      take: 20,
    })

    const userSearchHistory = await prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Analyze user preferences
    const artists = new Map<string, number>()
    const genres = new Map<string, number>()

    userLikedSongs.forEach((song) => {
      const artist = song.trackArtist
      artists.set(artist, (artists.get(artist) || 0) + 1)
    })

    userSearchHistory.forEach((search) => {
      // Extract potential genre/keywords from search queries
      const keywords = search.query.toLowerCase().split(' ')
      keywords.forEach((keyword) => {
        if (keyword.length > 3) {
          genres.set(keyword, (genres.get(keyword) || 0) + 1)
        }
      })
    })

    // Get top artists and genres
    const topArtists = Array.from(artists.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([artist]) => artist)

    const topGenres = Array.from(genres.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre)

    // Generate AI-powered search queries
    const recommendations = []

    // Recommend similar artists
    for (const artist of topArtists) {
      recommendations.push({
        type: 'similar_artist',
        query: `similar to ${artist}`,
        reason: `Because you like ${artist}`,
      })
    }

    // Recommend based on search history
    for (const search of userSearchHistory.slice(0, 3)) {
      recommendations.push({
        type: 'related_search',
        query: search.query,
        reason: 'Based on your recent searches',
      })
    }

    // Generate genre-based recommendations
    for (const genre of topGenres) {
      recommendations.push({
        type: 'genre',
        query: `${genre} music`,
        reason: `Popular ${genre} tracks`,
      })
    }

    return NextResponse.json({
      recommendations: recommendations.slice(0, 10),
      preferences: {
        topArtists,
        topGenres,
        totalLikedSongs: userLikedSongs.length,
        totalSearches: userSearchHistory.length,
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

