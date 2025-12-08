'use client'

import { useEffect, useMemo, useState } from 'react'
import { Users, Radio, Share2, Copy, PlayCircle } from 'lucide-react'
import { Music } from '@/types/music'
import { withCsrfHeader } from '@/lib/csrf'
import { usePlayer } from '@/contexts/PlayerContext'

type RoomState = {
  id: string
  host: string
  members: string[]
  currentTrack: Music | null
  updatedAt: number
}

export default function ListeningRoom() {
  const [userName, setUserName] = useState('')
  const [roomCodeInput, setRoomCodeInput] = useState('')
  const [room, setRoom] = useState<RoomState | null>(null)
  const [status, setStatus] = useState<string>('')
  const [polling, setPolling] = useState(false)
  const { currentTrack, playTrack } = usePlayer()

  const roomCode = room?.id || ''
  const canBroadcast = useMemo(() => Boolean(room && currentTrack), [room, currentTrack])

  useEffect(() => {
    if (!room) return
    setPolling(true)
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rooms?roomId=${room.id}`)
        const data = await res.json()
        if (res.ok && data.room) {
          setRoom(data.room)
          if (data.room.currentTrack && data.room.currentTrack.id !== currentTrack?.id) {
            playTrack(data.room.currentTrack, [data.room.currentTrack])
          }
        }
      } catch {
        // ignore polling errors
      }
    }, 3500)
    return () => {
      clearInterval(interval)
      setPolling(false)
    }
  }, [room, playTrack, currentTrack])

  const createRoom = async () => {
    setStatus('')
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: withCsrfHeader({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ action: 'create', userName: userName || 'Host' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unable to create room')
      setRoom(data.room)
      setRoomCodeInput(data.room.id)
      setStatus('Salon créé. Partage le code pour inviter.')
    } catch (err: any) {
      setStatus(err.message || 'Failed to create room')
    }
  }

  const joinRoom = async () => {
    const code = roomCodeInput.trim().toUpperCase()
    if (!code) {
      setStatus('Entre un code de salon.')
      return
    }
    setStatus('')
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: withCsrfHeader({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ action: 'join', roomId: code, userName: userName || 'Guest' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unable to join room')
      setRoom(data.room)
      setStatus('Salon rejoint. Le morceau du host sera synchronisé.')
    } catch (err: any) {
      setStatus(err.message || 'Failed to join room')
    }
  }

  const broadcastCurrentTrack = async () => {
    if (!room || !currentTrack) return
    setStatus('')
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: withCsrfHeader({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ action: 'update', roomId: room.id, track: currentTrack }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unable to broadcast track')
      setRoom(data.room)
      setStatus('Morceau partagé avec le salon.')
    } catch (err: any) {
      setStatus(err.message || 'Failed to broadcast')
    }
  }

  const copyCode = async () => {
    if (!roomCode || typeof navigator === 'undefined') return
    try {
      await navigator.clipboard.writeText(roomCode)
      setStatus('Code copié dans le presse-papiers')
    } catch {
      setStatus('Copie impossible, partage manuellement')
    }
  }

  return (
    <div className="bg-spotify-light/60 border border-gray-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
      <div className="flex items-center gap-2">
        <Radio size={18} className="text-spotify-green" />
        <div>
          <p className="text-white font-semibold text-sm">Listening Room</p>
          <p className="text-gray-400 text-xs">Créer ou rejoindre une session synchronisée</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Ton pseudo"
          className="flex-1 bg-black/30 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-spotify-green"
        />
        <input
          value={roomCodeInput}
          onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
          placeholder="Code salon"
          className="flex-1 bg-black/30 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-spotify-green"
        />
        <div className="flex gap-2 sm:flex-col sm:w-32">
          <button
            onClick={createRoom}
            className="px-3 py-2 rounded-lg bg-spotify-green text-black font-semibold text-sm hover:bg-green-500"
          >
            Créer
          </button>
          <button
            onClick={joinRoom}
            className="px-3 py-2 rounded-lg bg-black/40 border border-gray-800 text-white text-sm hover:bg-black/60"
          >
            Rejoindre
          </button>
        </div>
      </div>

      {room && (
        <div className="bg-black/30 border border-gray-800 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Users size={16} />
              <span>Room {room.id}</span>
            </div>
            <button
              onClick={copyCode}
              className="flex items-center gap-1 text-xs text-gray-200 hover:text-white"
              aria-label="Copy room code"
            >
              <Copy size={14} />
              Copier
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Host: {room.host} • {room.members.length} participant(s)
          </p>
          <p className="text-xs text-gray-500">{polling ? 'Sync en cours' : 'Sync en pause'}</p>
          {room.currentTrack ? (
            <div className="flex items-center gap-3 bg-black/40 border border-gray-800 rounded-lg p-2">
              <img src={room.currentTrack.cover} className="w-12 h-12 rounded object-cover" alt={room.currentTrack.title} />
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{room.currentTrack.title}</p>
                <p className="text-gray-400 text-xs truncate">{room.currentTrack.artist}</p>
              </div>
              <button
                onClick={() => playTrack(room.currentTrack!, [room.currentTrack!])}
                className="p-2 rounded-full bg-spotify-green text-black hover:bg-green-500"
                aria-label="Play current room track"
              >
                <PlayCircle size={18} />
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-400">En attente d'un morceau diffusé...</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={broadcastCurrentTrack}
          disabled={!canBroadcast}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-spotify-green text-black text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed hover:bg-green-500"
        >
          <Share2 size={16} />
          Envoyer le morceau en cours
        </button>
        <span className="text-xs text-gray-400">
          Partage le code avec tes amis, ils recevront le titre quand tu lances la lecture.
        </span>
      </div>

      {status && <p className="text-xs text-amber-200">{status}</p>}
    </div>
  )
}
