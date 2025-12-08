import { NextRequest, NextResponse } from 'next/server'
import { Music } from '@/types/music'

type RoomState = {
  id: string
  host: string
  members: Set<string>
  currentTrack?: Music | null
  updatedAt: number
}

const rooms = new Map<string, RoomState>()

function generateRoomId() {
  return Math.random().toString(36).slice(2, 7).toUpperCase()
}

function serializeRoom(room: RoomState) {
  return {
    id: room.id,
    host: room.host,
    members: Array.from(room.members),
    currentTrack: room.currentTrack || null,
    updatedAt: room.updatedAt,
  }
}

export async function GET(req: NextRequest) {
  const roomId = req.nextUrl.searchParams.get('roomId')
  if (!roomId) {
    return NextResponse.json({ error: 'roomId is required' }, { status: 400 })
  }
  const room = rooms.get(roomId)
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }
  return NextResponse.json({ room: serializeRoom(room) })
}

export async function POST(req: NextRequest) {
  try {
    const { action, roomId, userName, track } = await req.json()

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 })
    }

    if (action === 'create') {
      if (!userName) return NextResponse.json({ error: 'userName required' }, { status: 400 })
      const id = generateRoomId()
      const state: RoomState = { id, host: userName, members: new Set([userName]), updatedAt: Date.now() }
      rooms.set(id, state)
      return NextResponse.json({ room: serializeRoom(state) })
    }

    if (!roomId) return NextResponse.json({ error: 'roomId is required' }, { status: 400 })
    const room = rooms.get(roomId)
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

    if (action === 'join') {
      if (!userName) return NextResponse.json({ error: 'userName required' }, { status: 400 })
      room.members.add(userName)
      room.updatedAt = Date.now()
      return NextResponse.json({ room: serializeRoom(room) })
    }

    if (action === 'update') {
      if (!track) return NextResponse.json({ error: 'track required' }, { status: 400 })
      room.currentTrack = track as Music
      room.updatedAt = Date.now()
      return NextResponse.json({ room: serializeRoom(room) })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Rooms API error', error)
    return NextResponse.json({ error: 'Room service error' }, { status: 500 })
  }
}
