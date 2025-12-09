'use client'

import { useEffect, useState } from 'react'
import { Headphones, Users, ShieldCheck, Music2 } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import MobileMenu from '@/components/MobileMenu'
import MobileHeader from '@/components/MobileHeader'
import ListeningRoom from '@/components/ListeningRoom'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function RoomsPage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-b from-spotify-dark via-spotify-gray to-black">
      <MobileHeader onMenuClick={() => setMobileMenuOpen(true)} />
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <div className="flex-1 flex flex-col lg:ml-64 pt-16 lg:pt-0 pb-20 lg:pb-24">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="bg-spotify-light rounded-2xl border border-white/5 p-5 sm:p-6 lg:p-7">
            <div className="flex items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-spotify-green/20 flex items-center justify-center">
                  <Headphones className="text-spotify-green" size={22} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">Listening Rooms</p>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">Sync up with friends</h1>
                  <p className="text-gray-300 text-sm sm:text-base">
                    Create a room, share the code, and keep everyone on the same song in real time.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mt-6">
              <div className="bg-black/30 border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-white mb-2">
                  <Users size={16} />
                  <span className="font-semibold">Host or join</span>
                </div>
                <p className="text-gray-300 text-sm">
                  Start a room in one tap or enter a code to join. Everyone sees the same queue instantly.
                </p>
              </div>
              <div className="bg-black/30 border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-white mb-2">
                  <Music2 size={16} />
                  <span className="font-semibold">Share what&apos;s playing</span>
                </div>
                <p className="text-gray-300 text-sm">
                  Share the current track to all listeners so the room stays in sync as you explore music.
                </p>
              </div>
              <div className="bg-black/30 border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-white mb-2">
                  <ShieldCheck size={16} />
                  <span className="font-semibold">No ads here</span>
                </div>
                <p className="text-gray-300 text-sm">
                  Rooms focus on the experience. We keep this page ad-free and content-rich for compliance.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-spotify-light rounded-2xl border border-white/5 p-4 sm:p-6 lg:p-7 shadow-xl">
            <ListeningRoom />
          </div>
        </div>
      </div>
    </div>
  )
}
