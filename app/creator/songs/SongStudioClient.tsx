'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Music2, PlusCircle, Sparkles, Loader2, CheckCircle2, Link2, BadgeInfo, Shield } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import MobileMenu from '@/components/MobileMenu'
import MobileHeader from '@/components/MobileHeader'
import { useAuth } from '@/contexts/AuthContext'
import { getToken } from '@/lib/auth-client'
import { withCsrfHeader } from '@/lib/csrf'

type SongItem = {
  id: string
  slug?: string
  title: string
  artist: string
  album?: string
  cover?: string
  duration?: number
  videoId?: string
  audioUrl?: string
}

const templates: Array<{ label: string; description: string; values: Partial<SongItem> & { duration?: number } }> = [
  {
    label: 'YouTube rapide',
    description: 'Coller un videoId YouTube + titre/artiste',
    values: { videoId: 'dQw4w9WgXcQ', title: 'Titre rapide', artist: 'Artiste' },
  },
  {
    label: 'Audio heberge',
    description: 'URL mp3 + cover optionnelle',
    values: {
      audioUrl: 'https://example.com/demo.mp3',
      cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=600&fit=crop&auto=format',
      duration: 180,
      title: 'Demo track',
      artist: 'Votre nom',
    },
  },
  {
    label: 'Single',
    description: 'Preremplir album en "Single"',
    values: { album: 'Single' },
  },
]

export default function SongStudioClient() {
  const { user, isAuthenticated } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [songs, setSongs] = useState<SongItem[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    artist: '',
    album: '',
    cover: '',
    videoId: '',
    audioUrl: '',
    duration: '',
  })

  const allowed = useMemo(
    () => isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'ARTIST'),
    [isAuthenticated, user?.role]
  )

  useEffect(() => {
    if (allowed) {
      loadSongs()
    }
  }, [allowed])

  const loadSongs = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = getToken()
      const res = await fetch('/api/songs?limit=30', {
        headers: withCsrfHeader(
          token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}
        ),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Impossible de charger les chansons')
      setSongs(data.songs || [])
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const token = getToken()
      const payload = {
        ...form,
        duration: form.duration ? Number(form.duration) : undefined,
      }
      const res = await fetch('/api/songs', {
        method: 'POST',
        headers: withCsrfHeader({
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }),
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Creation impossible')

      setSongs((prev) => [data.song, ...prev].slice(0, 30))
      setForm({
        title: '',
        artist: '',
        album: '',
        cover: '',
        videoId: '',
        audioUrl: '',
        duration: '',
      })
    } catch (err: any) {
      setError(err.message || 'Erreur de sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const applyTemplate = (values: Partial<SongItem> & { duration?: number }) => {
    setForm((prev) => ({
      ...prev,
      ...values,
      duration: values.duration ? String(values.duration) : prev.duration,
    }))
  }

  if (!allowed) return null

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-b from-spotify-dark via-spotify-gray to-black">
      <MobileHeader onMenuClick={() => setMobileMenuOpen(true)} />
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <div className="flex-1 flex flex-col lg:ml-64 pt-16 lg:pt-0 pb-20 lg:pb-24">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-spotify-green/20 flex items-center justify-center">
              <Music2 className="text-spotify-green" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-300 uppercase tracking-wide">Studio</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Ajout rapide de chansons</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Shield size={16} className="text-spotify-green" />
            <span>{user?.role}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 bg-spotify-light rounded-lg border border-white/5 p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <PlusCircle size={18} className="text-spotify-green" />
                <span className="text-white font-semibold">Formulaire express</span>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {templates.map((tpl) => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() => applyTemplate(tpl.values)}
                    className="px-3 py-2 rounded-full bg-white/5 text-sm text-white border border-white/10 hover:border-white/30"
                    title={tpl.description}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>

              <form className="space-y-3" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1 text-sm text-gray-200">
                    Titre *
                    <input
                      required
                      value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
                      placeholder="Nom du morceau"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-gray-200">
                    Artiste *
                    <input
                      required
                      value={form.artist}
                      onChange={(e) => setForm((p) => ({ ...p, artist: e.target.value }))}
                      className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
                      placeholder="Votre nom d'artiste"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex flex-col gap-1 text-sm text-gray-200">
                    Album
                    <input
                      value={form.album}
                      onChange={(e) => setForm((p) => ({ ...p, album: e.target.value }))}
                      className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
                      placeholder="Single / EP"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-gray-200">
                    Duree (sec)
                    <input
                      type="number"
                      min={0}
                      value={form.duration}
                      onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))}
                      className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
                      placeholder="180"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-gray-200">
                    Cover (URL)
                    <input
                      value={form.cover}
                      onChange={(e) => setForm((p) => ({ ...p, cover: e.target.value }))}
                      className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
                      placeholder="https://..."
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1 text-sm text-gray-200">
                    YouTube videoId
                    <input
                      value={form.videoId}
                      onChange={(e) => setForm((p) => ({ ...p, videoId: e.target.value }))}
                      className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
                      placeholder="dQw4w9WgXcQ"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-gray-200">
                    Audio URL (mp3/flac)
                    <input
                      value={form.audioUrl}
                      onChange={(e) => setForm((p) => ({ ...p, audioUrl: e.target.value }))}
                      className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
                      placeholder="https://cdn.votre-domaine/song.mp3"
                    />
                  </label>
                </div>

                <p className="text-xs text-gray-400">
                  Minimum : titre + artiste + (videoId ou audioUrl). Le slug et la page publique sont generes automatiquement.
                </p>

                {error && (
                  <div className="text-sm text-red-200 bg-red-900/40 border border-red-700/40 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-spotify-green text-black font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                  {saving ? 'Sauvegarde...' : 'Creer la chanson'}
                </button>
              </form>
            </div>

            <div className="bg-spotify-light rounded-lg border border-white/5 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-white">
                  <BadgeInfo size={18} className="text-spotify-green" />
                  <span className="font-semibold">Derniers ajouts</span>
                </div>
                <button
                  onClick={loadSongs}
                  className="text-xs text-gray-300 hover:text-white underline"
                  disabled={loading}
                >
                  Rafraichir
                </button>
              </div>

              {loading ? (
                <div className="flex items-center gap-2 text-gray-300">
                  <Loader2 className="animate-spin" size={16} />
                  Chargement...
                </div>
              ) : songs.length === 0 ? (
                <p className="text-gray-400 text-sm">Aucune chanson ajoutee pour le moment.</p>
              ) : (
                <div className="space-y-3">
                  {songs.map((song) => {
                    const href = `/song/${song.slug || song.id}`
                    return (
                      <div
                        key={song.id}
                        className="p-3 rounded-lg bg-black/20 border border-white/5 flex items-center gap-3"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/40 border border-white/5 shrink-0">
                          {song.cover ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={song.cover} alt={song.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                              No cover
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold truncate">{song.title}</p>
                          <p className="text-gray-400 text-xs truncate">
                            {song.artist} - {song.album || 'Single'}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                            {song.videoId && <span>YT: {song.videoId}</span>}
                            {song.audioUrl && <span>Audio: OK</span>}
                          </div>
                        </div>
                        <Link
                          href={href}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-spotify-green/20 text-spotify-green text-xs font-semibold hover:bg-spotify-green/30"
                        >
                          <Link2 size={14} />
                          Ouvrir
                        </Link>
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="mt-4 text-xs text-gray-400 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-spotify-green" />
                Chaque entree genere une page publique (`/song/<slug>`). Les admins/artistes peuvent iterer rapidement.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
