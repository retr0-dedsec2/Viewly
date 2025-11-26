import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Get user playlists
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const playlists = await prisma.playlist.findMany({
      where: { userId: decoded.userId },
      include: {
        tracks: {
          orderBy: { position: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ playlists })
  } catch (error) {
    console.error('Get playlists error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create new playlist
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { name, description, tracks } = await req.json()

    if (!name) {
      return NextResponse.json({ error: 'Playlist name is required' }, { status: 400 })
    }

    // Create playlist
    const playlist = await prisma.playlist.create({
      data: {
        name,
        description: description || null,
        userId: decoded.userId,
      }
    })

    // Add tracks if provided
    if (tracks && tracks.length > 0) {
      const trackData = tracks.map((track: any, index: number) => ({
        playlistId: playlist.id,
        trackId: track.id || `${track.videoId || track.title}-${Date.now()}`,
        trackTitle: track.title,
        trackArtist: track.artist,
        trackCover: track.cover || track.thumbnail || '',
        trackVideoId: track.videoId || null,
        trackDuration: track.duration || 0,
        position: index,
      }))

      await prisma.playlistTrack.createMany({
        data: trackData
      })
    }

    // Fetch the created playlist with tracks
    const createdPlaylist = await prisma.playlist.findUnique({
      where: { id: playlist.id },
      include: {
        tracks: {
          orderBy: { position: 'asc' }
        }
      }
    })

    return NextResponse.json({ 
      playlist: createdPlaylist,
      message: 'Playlist created successfully!'
    }, { status: 201 })
  } catch (error) {
    console.error('Create playlist error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete playlist
export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const playlistId = searchParams.get('id')

    if (!playlistId) {
      return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 })
    }

    // Check if playlist belongs to user
    const playlist = await prisma.playlist.findFirst({
      where: {
        id: playlistId,
        userId: decoded.userId
      }
    })

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
    }

    // Delete playlist (tracks will be deleted automatically due to CASCADE)
    await prisma.playlist.delete({
      where: { id: playlistId }
    })

    return NextResponse.json({ message: 'Playlist deleted successfully!' })
  } catch (error) {
    console.error('Delete playlist error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}