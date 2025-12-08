'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { Globe2 } from 'lucide-react'

export default function LanguageSwitcher({ compact }: { compact?: boolean }) {
  const { language, setLanguage, supported } = useLanguage()

  return (
    <div className="flex items-center gap-2">
      {!compact && <Globe2 size={18} className="text-gray-400" />}
      <select
        aria-label="Select language"
        value={language}
        onChange={(e) => setLanguage(e.target.value as any)}
        className="bg-spotify-light text-white text-sm rounded-lg px-2 py-1 border border-gray-800 focus:outline-none focus:ring-2 focus:ring-spotify-green"
      >
        {supported.map((opt) => (
          <option key={opt.code} value={opt.code}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
