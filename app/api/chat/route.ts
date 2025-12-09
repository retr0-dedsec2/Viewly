import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthToken } from '@/lib/auth-tokens'
import { normalizeTasteQuery } from '@/lib/taste-queries'
import { buildTasteProfile } from '@/lib/taste-profile'

export const dynamic = 'force-dynamic'

type PlaylistSeed = {
  name?: string
  songs: Song[]
  reason?: string
}

async function buildFavoriteArtistSeed(userId: string): Promise<PlaylistSeed | null> {
  const [likedSongs, searchHistory] = await Promise.all([
    prisma.likedSong.findMany({
      where: { userId },
      orderBy: { likedAt: 'desc' },
      take: 60,
    }),
    prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  const taste = buildTasteProfile(
    likedSongs.map((song) => ({
      title: song.trackTitle,
      artist: song.trackArtist,
      album: song.trackAlbum,
      likedAt: song.likedAt,
    })),
    searchHistory.map((entry) => ({ query: entry.query, createdAt: entry.createdAt })),
  )

  if (!taste.topArtists.length) return null

  const favoriteArtists = taste.topArtists.slice(0, 3)
  const likedPool: Song[] = likedSongs
    .filter((song) => favoriteArtists.some((artist) => song.trackArtist.toLowerCase().includes(artist.toLowerCase())))
    .map((song) => ({ title: song.trackTitle, artist: song.trackArtist }))

  const fallbackSuggestions: Song[] = favoriteArtists.flatMap((artist) => [
    { title: `${artist} essentials`, artist },
    { title: `${artist} live session`, artist },
  ])

  const searchHints: Song[] = searchHistory.slice(0, 4).map((entry) => ({
    title: entry.query,
    artist: favoriteArtists[0],
  }))

  const songs = dedupeSongs([...likedPool, ...searchHints, ...fallbackSuggestions]).slice(0, 15)

  return {
    name: `${favoriteArtists[0]} favorites mix`,
    songs,
    reason: `vos artistes preferes: ${favoriteArtists.join(', ')}`,
  }
}

function extractRequestedArtist(message: string) {
  const patterns = [
    /playlist\s+(?:de|of)\s+([^.,!?]+)/i,
    /make a playlist of\s+([^.,!?]+)/i,
    /create a playlist of\s+([^.,!?]+)/i,
    /playlist pour\s+([^.,!?]+)/i,
    /cr[ée]e?\s+moi\s+une\s+playlist\s+de\s+([^.,!?]+)/i,
  ]
  for (const regex of patterns) {
    const match = message.match(regex)
    if (match?.[1]) {
      return match[1].trim()
    }
  }
  return null
}

function buildArtistRequestSeed(artist: string): PlaylistSeed {
  const safeArtist = artist.trim()
  const base = [
    { title: `${safeArtist} essentials`, artist: safeArtist },
    { title: `${safeArtist} live`, artist: safeArtist },
    { title: `${safeArtist} acoustic`, artist: safeArtist },
    { title: `${safeArtist} remix`, artist: safeArtist },
  ]
  return {
    name: `${safeArtist} mix`,
    songs: dedupeSongs(base),
    reason: `requested artist: ${safeArtist}`,
  }
}

// AI Playlist Creation Function
async function handlePlaylistCreation(message: string, userId?: string, seed?: PlaylistSeed) {
  const lowerMessage = message.toLowerCase()
  let genre = 'pop'
  let mood = 'upbeat'
  let playlistSongs: Song[] = []
  let playlistName = ''
  
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
  
  // Generate playlist based on genre and mood or favorite artists seed
  playlistSongs = seed?.songs?.length ? dedupeSongs(seed.songs) : generatePlaylistSongs(genre, mood)
  playlistName =
    seed?.name ||
    `${mood.charAt(0).toUpperCase() + mood.slice(1)} ${genre.charAt(0).toUpperCase() + genre.slice(1)}`
  const reasonLine = seed?.reason ? `Based on ${seed.reason}.\n\n` : ''
  const firstTitle = playlistSongs[0]?.title || 'a track you like'
  
  // If user is not authenticated, return suggestion only
  if (!userId) {
    return `🎵 **${playlistName} Playlist Suggestions**

${reasonLine}Here are ${playlistSongs.length} amazing songs I've curated for you:

${playlistSongs.map((song, index) => 
  `**${index + 1}.** ${song.title} - *${song.artist}*`
).join('\n')}

⚠️ **To save this as an actual playlist:**
• **Sign in** to your account first
• Then ask me to create the playlist again
• I'll permanently save it to your library!

🔍 **For now, you can:**
• Use the search bar to find any of these tracks
• Ask me to search for specific songs: "search for [song name]"

🎧 **Pro tip:** Say "search for ${firstTitle}" to start listening right now!`
  }
  
  // If user is authenticated, create actual playlist in database
  try {
    console.log(`Creating playlist for user: ${userId}, name: ${playlistName}`)
    
    // Create playlist directly in database
    const playlist = await prisma.playlist.create({
      data: {
        name: playlistName,
        description: `AI-generated playlist with ${playlistSongs.length} ${genre} songs for ${mood} mood`,
        userId: userId,
      }
    })

    console.log(`Playlist created with ID: ${playlist.id}`)

    // Add tracks to playlist with YouTube search
    if (playlistSongs.length > 0) {
      const trackDataPromises = playlistSongs.map(async (song, index) => {
        let videoId = null
        let cover = 'https://via.placeholder.com/300x300?text=🎵'
        let duration = 180

        // Try to get YouTube video ID
        try {
          const searchQuery = `${song.title} ${song.artist}`
          const searchResponse = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=1&key=${process.env.YOUTUBE_API_KEY}`)
          
          if (searchResponse.ok) {
            const searchData = await searchResponse.json()
            if (searchData.items && searchData.items.length > 0) {
              const video = searchData.items[0]
              videoId = video.id.videoId
              cover = video.snippet.thumbnails?.medium?.url || cover
              
              // Get video duration
              const videoResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`)
              if (videoResponse.ok) {
                const videoData = await videoResponse.json()
                if (videoData.items && videoData.items.length > 0) {
                  const durationISO = videoData.items[0].contentDetails.duration
                  // Convert ISO 8601 duration to seconds (PT4M33S -> 273)
                  const match = durationISO.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
                  if (match) {
                    const hours = parseInt(match[1]) || 0
                    const minutes = parseInt(match[2]) || 0
                    const seconds = parseInt(match[3]) || 0
                    duration = hours * 3600 + minutes * 60 + seconds
                  }
                }
              }
            }
          }
        } catch (error) {
          console.log(`Could not fetch YouTube data for ${song.title} - ${song.artist}`)
        }

        return {
          playlistId: playlist.id,
          trackId: `${song.title.toLowerCase().replace(/\s+/g, '-')}-${song.artist.toLowerCase().replace(/\s+/g, '-')}`,
          trackTitle: song.title,
          trackArtist: song.artist,
          trackCover: cover,
          trackVideoId: videoId,
          trackDuration: duration,
          position: index,
        }
      })

      const trackData = await Promise.all(trackDataPromises)
      
      await prisma.playlistTrack.createMany({
        data: trackData
      })
    }

    return `🎵 **${playlistName} Playlist Created & Saved!**

✅ **Successfully added to your playlists!** You can find it in your **Library** page.

${reasonLine}Here are the ${playlistSongs.length} amazing songs I've curated for you:

${playlistSongs.map((song, index) => 
  `**${index + 1}.** ${song.title} - *${song.artist}*`
).join('\n')}

💡 **What you can do now:**
• 📚 **Check your Library page** to see your new playlist
• 🔍 **Search for any song** to get the YouTube link and play it
• 🎧 **Click on any song** in the playlist to start listening
• 💾 **Your playlist is permanently saved** to your account!

🚀 **Pro tip:** Search for "${firstTitle}" to start listening right now!`
  } catch (error) {
    console.error('Error creating playlist:', error)
    // Return error message instead of success message
    return `❌ **Playlist Creation Failed**

I encountered an error while trying to save your **${playlistName}** playlist to the database.

Here are the songs I had prepared for you:

${reasonLine}${playlistSongs.map((song, index) => 
  `**${index + 1}.** ${song.title} - *${song.artist}*`
).join('\n')}

🔧 **Please try:**
• Refresh the page and sign in again
• Try creating the playlist again
• If the problem persists, check your internet connection

🔍 **For now, you can:**
• Search for any of these tracks manually
• Ask me to search for specific songs: "search for [song name]"

💡 **Pro tip:** Say "search for ${firstTitle}" to start listening!`
  }
}

type Song = { title: string; artist: string }

// Fisher-Yates shuffle with slice to get unique, varied picks per call
function shuffleAndTake<T>(items: T[], count: number) {
  const array = [...items]
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array.slice(0, Math.min(count, array.length))
}

function dedupeSongs(songs: Song[]) {
  const seen = new Set<string>()
  return songs.filter((song) => {
    const key = `${song.title.toLowerCase()}-${song.artist.toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// Song Database for AI Playlist Generation
function generatePlaylistSongs(genre: string, mood: string) {
  const playlistSize = 10
  const songDatabase: Record<string, Record<string, Song[]>> = {
    pop: {
      happy: [
        { title: "Blinding Lights", artist: "The Weeknd" },
        { title: "Levitating", artist: "Dua Lipa" },
        { title: "Watermelon Sugar", artist: "Harry Styles" },
        { title: "Good 4 U", artist: "Olivia Rodrigo" },
        { title: "Stay", artist: "The Kid LAROI & Justin Bieber" },
        { title: "Flowers", artist: "Miley Cyrus" },
        { title: "Anti-Hero", artist: "Taylor Swift" },
        { title: "As It Was", artist: "Harry Styles" },
        { title: "Uptown Funk", artist: "Mark Ronson ft. Bruno Mars" },
        { title: "Can't Stop the Feeling!", artist: "Justin Timberlake" },
        { title: "About Damn Time", artist: "Lizzo" }
      ],
      sad: [
        { title: "Someone Like You", artist: "Adele" },
        { title: "All Too Well", artist: "Taylor Swift" },
        { title: "When the Party's Over", artist: "Billie Eilish" },
        { title: "drivers license", artist: "Olivia Rodrigo" },
        { title: "Hurt", artist: "Johnny Cash" },
        { title: "Skinny Love", artist: "Birdy" },
        { title: "The Night We Met", artist: "Lord Huron" },
        { title: "Let Her Go", artist: "Passenger" }
      ],
      chill: [
        { title: "Heat Waves", artist: "Glass Animals" },
        { title: "Sunflower", artist: "Post Malone & Swae Lee" },
        { title: "Circles", artist: "Post Malone" },
        { title: "Peaches", artist: "Justin Bieber" },
        { title: "Shivers", artist: "Ed Sheeran" },
        { title: "Electric Feel", artist: "MGMT" },
        { title: "Riptide", artist: "Vance Joy" },
        { title: "Cigarette Daydreams", artist: "Cage The Elephant" }
      ],
      romantic: [
        { title: "Perfect", artist: "Ed Sheeran" },
        { title: "All of Me", artist: "John Legend" },
        { title: "Thinking Out Loud", artist: "Ed Sheeran" },
        { title: "Make You Feel My Love", artist: "Adele" },
        { title: "A Thousand Years", artist: "Christina Perri" },
        { title: "Just The Way You Are", artist: "Bruno Mars" },
        { title: "Adore You", artist: "Harry Styles" }
      ]
    },
    rock: {
      happy: [
        { title: "Don't Stop Me Now", artist: "Queen" },
        { title: "Mr. Brightside", artist: "The Killers" },
        { title: "Sweet Child O' Mine", artist: "Guns N' Roses" },
        { title: "Bohemian Rhapsody", artist: "Queen" },
        { title: "Living on a Prayer", artist: "Bon Jovi" },
        { title: "Take Me Out", artist: "Franz Ferdinand" },
        { title: "Buddy Holly", artist: "Weezer" }
      ],
      workout: [
        { title: "Eye of the Tiger", artist: "Survivor" },
        { title: "We Will Rock You", artist: "Queen" },
        { title: "Thunder", artist: "Imagine Dragons" },
        { title: "Believer", artist: "Imagine Dragons" },
        { title: "Warriors", artist: "Imagine Dragons" },
        { title: "Back In Black", artist: "AC/DC" },
        { title: "Smells Like Teen Spirit", artist: "Nirvana" }
      ],
      chill: [
        { title: "Everlong", artist: "Foo Fighters" },
        { title: "Holocene", artist: "Bon Iver" },
        { title: "Yellow", artist: "Coldplay" },
        { title: "Slide", artist: "The Goo Goo Dolls" },
        { title: "Drive", artist: "Incubus" }
      ]
    },
    "hip hop": {
      party: [
        { title: "HUMBLE.", artist: "Kendrick Lamar" },
        { title: "God's Plan", artist: "Drake" },
        { title: "Industry Baby", artist: "Lil Nas X" },
        { title: "Without Me", artist: "Eminem" },
        { title: "SICKO MODE", artist: "Travis Scott" },
        { title: "Hotline Bling", artist: "Drake" },
        { title: "Lose Control", artist: "Missy Elliott ft. Ciara & Fatman Scoop" },
        { title: "Uptown Vibe", artist: "Meek Mill" }
      ],
      workout: [
        { title: "Till I Collapse", artist: "Eminem" },
        { title: "Stronger", artist: "Kanye West" },
        { title: "All the Way Up", artist: "Fat Joe & Remy Ma" },
        { title: "POWER", artist: "Kanye West" },
        { title: "Remember the Name", artist: "Fort Minor" },
        { title: "X Gon' Give It To Ya", artist: "DMX" },
        { title: "Ante Up", artist: "M.O.P." }
      ],
      chill: [
        { title: "Praise The Lord (Da Shine)", artist: "A$AP Rocky" },
        { title: "Sunflower", artist: "Post Malone & Swae Lee" },
        { title: "Crew", artist: "GoldLink" },
        { title: "Good News", artist: "Mac Miller" },
        { title: "Location", artist: "Dave" }
      ]
    },
    electronic: {
      party: [
        { title: "Titanium", artist: "David Guetta ft. Sia" },
        { title: "Animals", artist: "Martin Garrix" },
        { title: "Clarity", artist: "Zedd ft. Foxes" },
        { title: "Bangarang", artist: "Skrillex" },
        { title: "Levels", artist: "Avicii" },
        { title: "Greyhound", artist: "Swedish House Mafia" },
        { title: "Heads Will Roll (A-Trak Remix)", artist: "Yeah Yeah Yeahs" },
        { title: "Turn Down for What", artist: "DJ Snake & Lil Jon" }
      ],
      chill: [
        { title: "Midnight City", artist: "M83" },
        { title: "Something About Us", artist: "Daft Punk" },
        { title: "Breathe Me", artist: "Sia" },
        { title: "Teardrop", artist: "Massive Attack" },
        { title: "Porcelain", artist: "Moby" },
        { title: "Strobe", artist: "deadmau5" },
        { title: "Open Eye Signal", artist: "Jon Hopkins" }
      ]
    }
  }

  const moodFallbacks: Record<string, Song[]> = {
    chill: [
      { title: "Lost in Japan", artist: "Shawn Mendes" },
      { title: "Budapest", artist: "George Ezra" },
      { title: "Cherry Wine", artist: "Hozier" }
    ],
    workout: [
      { title: "Can't Hold Us", artist: "Macklemore & Ryan Lewis" },
      { title: "Party Rock Anthem", artist: "LMFAO" },
      { title: "On Top of the World", artist: "Imagine Dragons" }
    ],
    party: [
      { title: "Fireball", artist: "Pitbull" },
      { title: "Where Them Girls At", artist: "David Guetta" },
      { title: "Starships", artist: "Nicki Minaj" }
    ],
    happy: [
      { title: "Shut Up and Dance", artist: "WALK THE MOON" },
      { title: "Best Day Of My Life", artist: "American Authors" },
      { title: "I Gotta Feeling", artist: "Black Eyed Peas" }
    ],
    sad: [
      { title: "Fix You", artist: "Coldplay" },
      { title: "The A Team", artist: "Ed Sheeran" },
      { title: "Jealous", artist: "Labrinth" }
    ],
    romantic: [
      { title: "Can't Help Falling in Love", artist: "Elvis Presley" },
      { title: "Lucky", artist: "Jason Mraz & Colbie Caillat" },
      { title: "Gravity", artist: "Sara Bareilles" }
    ]
  }

  const genreSongs = songDatabase[genre] || songDatabase.pop
  const moodSongs = genreSongs[mood] || []
  const genreWidePool = Object.values(genreSongs).flat()
  const fallbackMoodPool = moodFallbacks[mood] || []
  const globalFallback = Object.values(moodFallbacks).flat()

  // Build a large pool, then shuffle to return a fresh mix per request
  const pool = dedupeSongs([
    ...moodSongs,
    ...genreWidePool,
    ...fallbackMoodPool,
    ...globalFallback
  ])

  return shuffleAndTake(pool, playlistSize)
}

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get user ID from Authorization header or auth cookie
    let userId = null
    try {
      const token = getAuthToken(request)
      if (token) {
        const { verifyToken } = await import('@/lib/auth')
        const decoded = verifyToken(token)
        if (decoded && decoded.userId) {
          userId = decoded.userId
        }
      }
    } catch (error) {
      console.error('Auth token verification failed:', error)
      // Continue without userId
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
    const previousUserMessage =
      Array.isArray(history) && history.length
        ? [...history]
            .reverse()
            .find((m: any) => m?.role === 'user' && m?.content && m.content !== message)?.content
        : null

    // Help/guide intent
    if (
      messageLower.includes('help') ||
      messageLower.includes('commands') ||
      messageLower.includes('how do')
    ) {
      return NextResponse.json({
        response:
          "I can create playlists (\"make a workout playlist\"), search YouTube for songs (\"find songs by Dua Lipa\"), recommend tracks from your taste, sync listening rooms, or start a humming search. Tell me a mood, artist, or vibe and I'll handle it.",
      })
    }

    if (
      messageLower.includes('hello') ||
      messageLower.includes('hi') ||
      messageLower.includes('salut') ||
      messageLower.includes('bonjour')
    ) {
      const follow = previousUserMessage
        ? `How can I help with what you asked earlier: "${previousUserMessage}"?`
        : 'What should we listen to next?'
      return NextResponse.json({ response: `Hey! ${follow}` })
    }

    if (
      messageLower.includes('thank') ||
      messageLower.includes('merci') ||
      messageLower.includes('thx')
    ) {
      return NextResponse.json({ response: "You're welcome! Need another playlist or search?" })
    }

    // Check if user wants to create a playlist
    if (
      messageLower.includes('playlist') ||
      messageLower.includes('create') ||
      messageLower.includes('make')
    ) {
      console.log(`Playlist creation request. UserId: ${userId ? 'Found' : 'Not found'}`)
      const requestedArtist = extractRequestedArtist(message)
      const artistSeed = requestedArtist ? buildArtistRequestSeed(requestedArtist) : null
      const favoriteSeed = userId ? await buildFavoriteArtistSeed(userId) : null
      const seed = artistSeed || favoriteSeed

      const playlistResponse = await handlePlaylistCreation(
        message,
        userId || undefined,
        seed || undefined,
      )
      return NextResponse.json({
        response: playlistResponse,
        action: 'playlist',
        requiresAuth: !userId,
        debug: {
          userId: userId ? 'authenticated' : 'not authenticated',
          authHeader: request.headers.get('Authorization') ? 'present' : 'missing',
          usedFavoriteSeed: Boolean(favoriteSeed),
        },
      })
    }

    // Check if user wants to search for music
    if (
      messageLower.includes('trending') ||
      messageLower.includes('popular hits') ||
      messageLower.includes('popular songs')
    ) {
      const trendQuery = 'trending music'
      return NextResponse.json({
        response: `I'll pull up what's trending right now. Want to start with today's top hits?`,
        action: 'search',
        query: trendQuery,
      })
    }

    if (
      messageLower.includes('search') ||
      messageLower.includes('find') ||
      messageLower.includes('play') ||
      messageLower.includes('listen')
    ) {
      // Extract search query, stripping helper words but keeping the artist/genre
      const cleanedQuery =
        normalizeTasteQuery(message) ||
        message
          .replace(/search|find|play|listen|for|music|song|to/gi, '')
          .trim()

      const searchQuery = cleanedQuery || message.trim()

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

    if (
      messageLower.includes('room') ||
      messageLower.includes('rooms') ||
      messageLower.includes('sync') ||
      messageLower.includes('listening party')
    ) {
      return NextResponse.json({
        response:
          "Want to sync with friends? Go to the Rooms page, create a room to get a code, and share it. I can also search a vibe for your room—just tell me what to play.",
        action: 'rooms',
      })
    }

    if (
      messageLower.includes('hum') ||
      messageLower.includes('humming') ||
      messageLower.includes('fredonne') ||
      messageLower.includes('chant')
    ) {
      return NextResponse.json({
        response:
          'Hold the humming button for up to 10s and I will try to identify the song. You can also tell me the mood so I can queue similar tracks.',
      })
    }

    if (
      messageLower.includes('premium') ||
      messageLower.includes('ads') ||
      messageLower.includes('adfree') ||
      messageLower.includes('prix') ||
      messageLower.includes('price')
    ) {
      return NextResponse.json({
        response:
          'Premium removes ads and unlocks priority AI. You can upgrade from the Subscriptions page, and I will make sure your sessions stay ad-free.',
        action: 'upgrade',
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
      `I understand you're interested in "${message}". I can search YouTube, create playlists, or find recommendations. What would you like to do?`,
      `Great! I can help you discover music. Should I search for "${message}" or find similar tracks?`,
      `I'd love to help! I can search YouTube, recommend tracks based on your taste, or help you create playlists. What interests you?`,
      previousUserMessage
        ? `Earlier you mentioned "${previousUserMessage}". Should I keep going with that or switch to "${message}"?`
        : `Tell me a mood or artist and I'll find the right tracks. Want to start with "${message}"?`,
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




