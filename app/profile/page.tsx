'use client'

import { useState, useEffect } from 'react'
import { User, LogOut, Settings, Music } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import MobileMenu from '@/components/MobileMenu'
import MobileHeader from '@/components/MobileHeader'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function ProfilePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-b from-spotify-dark via-spotify-gray to-black">
      <MobileHeader onMenuClick={() => setMobileMenuOpen(true)} />
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 lg:ml-64 pt-16 lg:pt-8 pb-20 lg:pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 lg:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">Profile</h1>
            <p className="text-gray-400 text-sm sm:text-base">Manage your account settings</p>
          </div>

          <div className="bg-spotify-light rounded-lg p-4 sm:p-6 lg:p-8 mb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6 lg:mb-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-spotify-green rounded-full flex items-center justify-center flex-shrink-0">
                <User size={40} className="sm:w-12 sm:h-12 text-white" />
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">{user.username}</h2>
                <p className="text-gray-400 text-sm sm:text-base">{user.email}</p>
                <p className="text-gray-500 text-xs sm:text-sm mt-1">
                  Member since {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-spotify-gray rounded-lg">
                <div className="flex items-center gap-3">
                  <Settings size={20} className="text-gray-400" />
                  <div>
                    <p className="text-white font-medium">Account Settings</p>
                    <p className="text-gray-400 text-sm">Manage your account preferences</p>
                  </div>
                </div>
                <button className="text-spotify-green hover:text-green-400">
                  Edit
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-spotify-gray rounded-lg">
                <div className="flex items-center gap-3">
                  <Music size={20} className="text-gray-400" />
                  <div>
                    <p className="text-white font-medium">My Playlists</p>
                    <p className="text-gray-400 text-sm">View and manage your playlists</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/library')}
                  className="text-spotify-green hover:text-green-400"
                >
                  View
                </button>
              </div>
            </div>
          </div>

          <div className="bg-spotify-light rounded-lg p-8">
            <h3 className="text-xl font-bold text-white mb-4">Account Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={user.username}
                  disabled
                  className="w-full bg-spotify-gray text-white px-4 py-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full bg-spotify-gray text-white px-4 py-2 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-6 py-3 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

