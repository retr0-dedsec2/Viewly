'use client'

import { useMemo } from 'react'
import { Crown, Megaphone } from 'lucide-react'
import Link from 'next/link'

type AdBannerProps = {
  onUpgradeClick?: () => void
}

const ads = [
  {
    headline: 'Discover Viewly Premium',
    body: 'Unlimited music, zero ads, and unlimited skips.',
    badge: 'Limited offer',
  },
  {
    headline: 'Go Premium',
    body: 'Background listening with better audio quality.',
    badge: 'Popular',
  },
  {
    headline: 'Light ads for free users',
    body: 'Stay on the free tier with short and focused ads.',
    badge: 'Sponsored',
  },
]

export default function AdBanner({ onUpgradeClick }: AdBannerProps) {
  const ad = useMemo(() => ads[Math.floor(Math.random() * ads.length)], [])

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/5 bg-gradient-to-r from-spotify-light/80 via-spotify-gray/80 to-black/60 p-5 sm:p-6 mb-6">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-spotify-green/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs text-white uppercase tracking-wide">
          <Megaphone size={14} />
          <span>{ad.badge}</span>
        </div>
        <div className="flex-1">
          <h3 className="text-white text-lg sm:text-xl font-bold">{ad.headline}</h3>
          <p className="text-gray-300 text-sm sm:text-base mt-1">{ad.body}</p>
          <p className="text-gray-400 text-xs mt-2">
            Short sponsored messages appear occasionally on the free tier.
          </p>
        </div>
        <div className="flex items-center gap-3 self-stretch sm:self-auto">
          <button
            onClick={onUpgradeClick}
            className="inline-flex items-center gap-2 bg-spotify-green hover:bg-green-600 text-black font-semibold px-4 py-2 rounded-full transition-colors"
          >
            <Crown size={18} className="text-black" />
            Passer Premium
          </button>
          <Link
            href="/subscriptions"
            className="text-gray-200 hover:text-white text-sm underline-offset-4 hover:underline"
          >
            Voir les offres
          </Link>
        </div>
      </div>
    </div>
  )
}
