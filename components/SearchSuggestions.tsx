'use client'

import { Clock4, Sparkles } from 'lucide-react'

export type SuggestionItem = {
  label: string
  source: 'recent' | 'ai'
  hint?: string
}

interface SearchSuggestionsProps {
  visible: boolean
  items: SuggestionItem[]
  onSelect: (value: string) => void
}

export default function SearchSuggestions({ visible, items, onSelect }: SearchSuggestionsProps) {
  if (!visible || !items.length) return null

  return (
    <div className="absolute inset-x-0 top-full mt-2 bg-spotify-light border border-spotify-gray rounded-2xl shadow-xl z-20 overflow-hidden max-h-80 overflow-y-auto">
      <div className="px-4 py-2 text-[11px] uppercase tracking-wide text-gray-400 font-semibold flex items-center gap-2 border-b border-gray-800">
        <Sparkles size={14} />
        Suggestions
      </div>
      <div className="divide-y divide-gray-800">
        {items.map((item, index) => (
          <button
            key={`${item.source}-${item.label}-${index}`}
            onMouseDown={(e) => {
              e.preventDefault()
              onSelect(item.label)
            }}
            className="w-full text-left px-4 py-3 hover:bg-spotify-gray/70 transition-colors flex items-center gap-3"
          >
            {item.source === 'recent' ? (
              <Clock4 size={16} className="text-gray-400 flex-shrink-0" />
            ) : (
              <Sparkles size={16} className="text-spotify-green flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm truncate">{item.label}</p>
              {item.hint && <p className="text-xs text-gray-400 truncate">{item.hint}</p>}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
