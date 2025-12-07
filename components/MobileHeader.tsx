'use client'

import { Menu, Moon, Sun } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

interface MobileHeaderProps {
  onMenuClick: () => void
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-spotify-dark/95 backdrop-blur-sm border-b border-gray-800 z-30 flex items-center justify-between px-4">
      <button
        onClick={onMenuClick}
        className="p-2 text-white hover:bg-spotify-light rounded-lg transition-colors"
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>
      
      <h1 className="text-xl font-bold text-white">Viewly</h1>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-white hover:bg-spotify-light transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        {user && (
          <div className="w-8 h-8 bg-spotify-green rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-semibold">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

