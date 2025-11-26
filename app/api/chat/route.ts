import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// AI Playlist Creation Function
async function handlePlaylistCreation(message: string) {
  const lowerMessage = message.toLowerCase()
  let genre = 'pop'
  let mood = 'upbeat'
  
  // Extract genre from message
  if (lowerMessage.includes('rock')) genre = 'rock'
  else if (lowerMessage.includes('hip hop') || lowerMessage.includes('rap') || lowerMessage.includes('hip-hop')) genre = 'hip hop'
  else if (lowerMessage.includes('electronic') || lowerMessage.includes('edm') || lowerMessage.includes('dance')) genre = 'electronic'
  else if (lowerMessage.includes('jazz')) genre = 'jazz'
  else if (lowerMessage.includes('classical')) genre = 'classical'
  else if (lowerMessage.includes('country')) genre = 'country'
  else if (lowerMessage.includes('reggae')) genre = 'reggae'
  else if (lowerMessage.includes('r&b') || lowerMessage.includes('rnb')) genre = 'r&b'
  else if (lowerMessage.includes('indie')) genre = 'indie'
  else if (lowerMessage.includes('folk')) genre = 'folk'
  
  // Extract mood from message
  if (lowerMessage.includes('sad') || lowerMessage.includes('melancholy') || lowerMessage.includes('emotional')) mood = 'sad'
  else if (lowerMessage.includes('happy') || lowerMessage.includes('upbeat') || lowerMessage.includes('energetic')) mood = 'happy'
  else if (lowerMessage.includes('chill') || lowerMessage.includes('relaxing') || lowerMessage.includes('calm')) mood = 'chill'
  else if (lowerMessage.includes('romantic') || lowerMessage.includes('love')) mood = 'romantic'
  else if (lowerMessage.includes('workout') || lowerMessage.includes('gym') || lowerMessage.includes('exercise')) mood = 'workout'
  else if (lowerMessage.includes('party') || lowerMessage.includes('dance')) mood = 'party'
  
  // Generate playlist based on genre and mood
  const playlistSongs = generatePlaylistSongs(genre, mood)
  
  return `🎵 **${mood.charAt(0).toUpperCase() + mood.slice(1)} ${genre.charAt(0).toUpperCase() + genre.slice(1)} Playlist Created!**

Here are ${playlistSongs.length} amazing songs I've curated for you:

${playlistSongs.map((song, index) => 
  `**${index + 1}.** ${song.title} - *${song.artist}*`
).join('\n')}

💡 **To play these songs:**
• Use the search bar above to find any of these tracks
• I can search for specific songs - just ask "search for [song name]"
• Want a different mood or genre? Just ask me to create another playlist!

🎧 **Pro tip:** Say "search for ${playlistSongs[0].title}" to start listening right now!`
}

// Song Database for AI Playlist Generation
function generatePlaylistSongs(genre: string, mood: string) {
  const songDatabase: Record<string, Record<string, Array<{title: string, artist: string}>>> = {
    pop: {
      happy: [
        { title: "Blinding Lights", artist: "The Weeknd" },
        { title: "Levitating", artist: "Dua Lipa" },
        { title: "Watermelon Sugar", artist: "Harry Styles" },
        { title: "Good 4 U", artist: "Olivia Rodrigo" },
        { title: "Stay", artist: "The Kid LAROI & Justin Bieber" },
        { title: "Flowers", artist: "Miley Cyrus" },
        { title: "Anti-Hero", artist: "Taylor Swift" }
      ],
      sad: [
        { title: "Someone Like You", artist: "Adele" },
        { title: "All Too Well", artist: "Taylor Swift" },
        { title: "When the Party's Over", artist: "Billie Eilish" },
        { title: "drivers license", artist: "Olivia Rodrigo" },
        { title: "Hurt", artist: "Johnny Cash" }
      ],
      chill: [
        { title: "Heat Waves", artist: "Glass Animals" },
        { title: "Sunflower", artist: "Post Malone & Swae Lee" },
        { title: "Circles", artist: "Post Malone" },
        { title: "Peaches", artist: "Justin Bieber" },
        { title: "Shivers", artist: "Ed Sheeran" }
      ],
      romantic: [
        { title: "Perfect", artist: "Ed Sheeran" },
        { title: "All of Me", artist: "John Legend" },
        { title: "Thinking Out Loud", artist: "Ed Sheeran" },
        { title: "Make You Feel My Love", artist: "Adele" },
        { title: "A Thousand Years", artist: "Christina Perri" }
      ]
    },
    rock: {
      happy: [
        { title: "Don't Stop Me Now", artist: "Queen" },
        { title: "Mr. Brightside", artist: "The Killers" },
        { title: "Sweet Child O' Mine", artist: "Guns N' Roses" },
        { title: "Bohemian Rhapsody", artist: "Queen" },
        { title: "Living on a Prayer", artist: "Bon Jovi" }
      ],
      workout: [
        { title: "Eye of the Tiger", artist: "Survivor" },
        { title: "We Will Rock You", artist: "Queen" },
        { title: "Thunder", artist: "Imagine Dragons" },
        { title: "Believer", artist: "Imagine Dragons" },
        { title: "Warriors", artist: "Imagine Dragons" }
      ]
    },
    "hip hop": {
      party: [
        { title: "HUMBLE.", artist: "Kendrick Lamar" },
        { title: "God's Plan", artist: "Drake" },
        { title: "Industry Baby", artist: "Lil Nas X" },
        { title: "Without Me", artist: "Eminem" },
        { title: "SICKO MODE", artist: "Travis Scott" }
      ],
      workout: [
        { title: "Till I Collapse", artist: "Eminem" },
        { title: "Stronger", artist: "Kanye West" },
        { title: "All the Way Up", artist: "Fat Joe & Remy Ma" },
        { title: "POWER", artist: "Kanye West" },
        { title: "Remember the Name", artist: "Fort Minor" }
      ]
    },
    electronic: {
      party: [
        { title: "Titanium", artist: "David Guetta ft. Sia" },
        { title: "Animals", artist: "Martin Garrix" },
        { title: "Clarity", artist: "Zedd ft. Foxes" },
        { title: "Bangarang", artist: "Skrillex" },
        { title: "Levels", artist: "Avicii" }
      ],
      chill: [
        { title: "Midnight City", artist: "M83" },
        { title: "Something About Us", artist: "Daft Punk" },
        { title: "Breathe Me", artist: "Sia" },
        { title: "Teardrop", artist: "Massive Attack" },
        { title: "Porcelain", artist: "Moby" }
      ]
    }
  }
  
  const genreSongs = songDatabase[genre] || songDatabase.pop
  const moodSongs = genreSongs[mood] || genreSongs.happy || genreSongs[Object.keys(genreSongs)[0]]
  
  return moodSongs.slice(0, Math.min(7, moodSongs.length))
}

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

    // Check if user wants to create a playlist
    if (
      messageLower.includes('playlist') ||
      messageLower.includes('create') ||
      messageLower.includes('make')
    ) {
      const playlistResponse = await handlePlaylistCreation(message)
      return NextResponse.json({
        response: playlistResponse,
        action: 'playlist',
      })
    }

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
        response: `🔍 I'll help you search for "${searchQuery}". Let me find the best tracks on YouTube for you!`,
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
