'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Search,
  Library,
  Heart,
  Plus,
  User,
  LogOut,
  Crown,
  Shield,
  Sun,
  Moon,
  Radio,
  Settings,
  Music2,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageSwitcher from './LanguageSwitcher'

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout, isAuthenticated } = useAuth()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { t } = useLanguage()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const isActive = (path: string) => pathname === path

  return (
    <div className="w-64 h-full bg-black p-4 sm:p-6 flex flex-col overflow-y-auto">
      <div className="mb-8">
        <Link href="/">
          <h1 className="text-2xl font-bold text-white mb-2 cursor-pointer">Viewly</h1>
        </Link>
        <p className="text-gray-400 text-sm">{t('aiAssistant')}</p>
      </div>
      
      <nav className="flex-1">
        <ul className="space-y-2">
          <li>
            <Link
              href="/"
              className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                isActive('/')
                  ? 'text-white bg-spotify-light'
                  : 'text-gray-300 hover:text-white hover:bg-spotify-light'
              }`}
            >
              <Home size={24} />
              <span className="font-medium">{t('home')}</span>
            </Link>
          </li>
          <li>
            <Link
              href="/search"
              className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                isActive('/search')
                  ? 'text-white bg-spotify-light'
                  : 'text-gray-300 hover:text-white hover:bg-spotify-light'
              }`}
            >
              <Search size={24} />
              <span className="font-medium">{t('search')}</span>
            </Link>
          </li>
          {isAuthenticated && (
            <li>
              <Link
                href="/library"
                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                  isActive('/library')
                    ? 'text-white bg-spotify-light'
                    : 'text-gray-300 hover:text-white hover:bg-spotify-light'
                }`}
              >
                <Library size={24} />
                <span className="font-medium">{t('yourLibrary')}</span>
              </Link>
            </li>
          )}
          {isAuthenticated && (
            <li>
              <Link
                href="/rooms"
                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                  isActive('/rooms')
                    ? 'text-white bg-spotify-light'
                    : 'text-gray-300 hover:text-white hover:bg-spotify-light'
                }`}
              >
                <Radio size={22} />
                <span className="font-medium">Rooms</span>
              </Link>
            </li>
          )}
          {isAuthenticated && (
            <li>
              <Link
                href="/subscriptions"
                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                  isActive('/subscriptions')
                    ? 'text-white bg-spotify-light'
                    : 'text-gray-300 hover:text-white hover:bg-spotify-light'
                }`}
              >
                <Crown size={22} />
                <span className="font-medium">{t('subscriptions')}</span>
              </Link>
            </li>
          )}
          {isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'ARTIST') && (
            <li>
              <Link
                href="/creator/songs"
                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                  isActive('/creator/songs')
                    ? 'text-white bg-spotify-light'
                    : 'text-gray-300 hover:text-white hover:bg-spotify-light'
                }`}
              >
                <Music2 size={22} />
                <span className="font-medium">Studio</span>
              </Link>
            </li>
          )}
          {isAuthenticated && (
            <li>
              <Link
                href="/account"
                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                  isActive('/account')
                    ? 'text-white bg-spotify-light'
                    : 'text-gray-300 hover:text-white hover:bg-spotify-light'
                }`}
              >
                <Settings size={22} />
                <span className="font-medium">Account</span>
              </Link>
            </li>
          )}
          {isAuthenticated && user?.role === 'ADMIN' && (
            <li>
              <Link
                href="/admin"
                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                  isActive('/admin')
                    ? 'text-white bg-spotify-light'
                    : 'text-gray-300 hover:text-white hover:bg-spotify-light'
                }`}
              >
                <Shield size={22} />
                <span className="font-medium">{t('admin')}</span>
              </Link>
            </li>
          )}
        </ul>

        {isAuthenticated && (
          <div className="mt-8">
            <Link
              href="/library"
              className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-spotify-light rounded-lg transition-colors w-full"
            >
              <Plus size={20} />
              <span className="font-medium">{t('createPlaylist')}</span>
            </Link>
            <Link
              href="/liked"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors w-full mt-2 ${
                isActive('/liked')
                  ? 'text-white bg-spotify-light'
                  : 'text-gray-300 hover:text-white hover:bg-spotify-light'
              }`}
            >
              <Heart size={20} />
              <span className="font-medium">{t('likedSongs')}</span>
            </Link>
          </div>
        )}
      </nav>

      <div className="mt-auto pt-4 border-t border-gray-800">
        {isAuthenticated && user ? (
          <div>
            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-spotify-light rounded-lg transition-colors mb-2"
            >
              <div className="w-8 h-8 bg-spotify-green rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{user.username}</p>
                <p className="text-gray-400 text-xs truncate">{t('viewProfile')}</p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:text-red-400 hover:bg-spotify-light rounded-lg transition-colors w-full"
            >
              <LogOut size={18} />
              <span className="font-medium">{t('logout')}</span>
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-spotify-green hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <span className="font-medium">{t('signIn')}</span>
          </Link>
        )}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-spotify-light rounded-lg transition-colors w-full mt-3"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          <span className="font-medium">
            {theme === 'light' ? t('darkMode') : t('lightMode')}
          </span>
        </button>
        <div className="mt-3">
          <LanguageSwitcher />
        </div>
        <div className="text-xs text-gray-400 mt-4">
          <p>Viewly</p>
          <p className="mt-1">v1.0.0</p>
        </div>
      </div>
    </div>
  )
}
