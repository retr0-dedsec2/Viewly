import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { message, userId } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get user context for personalized responses
    let userContext = null
    if (userId) {
      const likedSongs = await prisma.likedSong.findMany({
        where: { userId },
        take: 10,
        orderBy: { likedAt: 'desc' },
      })

      const recentSearches = await prisma.searchHistory.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
      })

      userContext = {
        likedSongs: likedSongs.map((s) => s.trackArtist),
        recentSearches: recentSearches.map((s) => s.query),
      }
    }

    // Enhanced AI responses with YouTube integration
    const messageLower = message.toLowerCase()

    // Check if user wants to search for music
    if (
      messageLower.includes('search') ||
      messageLower.includes('find') ||
      messageLower.includes('play') ||
      messageLower.includes('listen')
    ) {
      // Extract search query
      const searchQuery = message
        .replace(/search|find|play|listen|for|music|song|to/gi, '')
        .trim()

      return NextResponse.json({
        response: `I'll help you search for "${searchQuery}". Let me find the best tracks on YouTube for you!`,
        action: 'search',
        query: searchQuery,
      })
    }

    // Check if user wants recommendations
    if (
      messageLower.includes('recommend') ||
      messageLower.includes('suggest') ||
      messageLower.includes('similar')
    ) {
      let recommendationText = "Based on your preferences, I'd recommend:"

      if (userContext && userContext.likedSongs.length > 0) {
        const topArtists = userContext.likedSongs.slice(0, 3).join(', ')
        recommendationText += `\n\nArtists you might like: ${topArtists}`
      }

      recommendationText +=
        '\n\nWould you like me to search for similar tracks on YouTube?'

      return NextResponse.json({
        response: recommendationText,
        action: 'recommend',
      })
    }

    // Personalized responses based on user context
    if (userContext && userContext.likedSongs.length > 0) {
      const topArtist = userContext.likedSongs[0]
      const responses = [
        `I see you enjoy ${topArtist}! I can help you discover more music like that. Would you like me to search YouTube for similar artists?`,
        `Based on your music taste, I'd love to help you find new tracks. What genre or artist are you in the mood for?`,
        `I can help you explore music on YouTube. Would you like to search for something specific or get personalized recommendations?`,
      ]

      return NextResponse.json({
        response: responses[Math.floor(Math.random() * responses.length)],
      })
    }

    // Default intelligent responses
    const responses = [
      `I understand you're interested in "${message}". I can help you search YouTube for music, create playlists, or find recommendations. What would you like to do?`,
      `Great! I can help you discover music on YouTube. Would you like me to search for "${message}" or find similar tracks?`,
      `I'd love to help! I can search YouTube for music, recommend tracks based on your taste, or help you create playlists. What interests you?`,
    ]

    const randomResponse = responses[Math.floor(Math.random() * responses.length)]

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 600))

    return NextResponse.json({
      response: randomResponse,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}
