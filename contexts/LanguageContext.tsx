'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type Language = 'en' | 'fr'

type LanguageContextValue = {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, fallback?: string) => string
  supported: { code: Language; label: string }[]
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    greeting: 'Good evening',
    subtitle: 'Discover music with your AI assistant',
    madeForYou: 'Made for You',
    recentlyPlayed: 'Recently Played',
    loadMore: 'Load more',
    searchPlaceholder: 'Search for songs, artists, albums...',
    nowExploring: 'Now exploring',
    album: 'Album',
    duration: 'Duration',
    explore: 'Explore',
    openVideo: 'Open video',
    openSpotify: 'Open in Spotify',
    googleSearch: 'Google search',
    share: 'Share',
    quickShare: 'Quick share',
    home: 'Home',
    search: 'Search',
    yourLibrary: 'Your Library',
    subscriptions: 'Subscriptions',
    admin: 'Admin',
    createPlaylist: 'Create Playlist',
    likedSongs: 'Liked Songs',
    viewProfile: 'View profile',
    logout: 'Logout',
    signIn: 'Sign In',
    darkMode: 'Dark mode',
    lightMode: 'Light mode',
    aiAssistant: 'The One More Thing of Music',
    startHumming: 'Hum to find a song',
    recording: 'Listening...',
    processing: 'Analyzing humming...',
    retryHumming: 'Try again',
    hummingCTA: 'Hold to hum (10s max)',
    hummingHint: 'Hum or sing a tune and we will try to find the song.',
    hummingResult: 'We found a match:',
  },
  fr: {
    greeting: 'Bonsoir',
    subtitle: 'Découvrez la musique avec votre assistant IA',
    madeForYou: 'Fait pour vous',
    recentlyPlayed: 'Écoutés récemment',
    loadMore: 'Charger plus',
    searchPlaceholder: 'Rechercher des titres, artistes, albums...',
    nowExploring: 'En cours',
    album: 'Album',
    duration: 'Durée',
    explore: 'Explorer',
    openVideo: 'Ouvrir la vidéo',
    openSpotify: 'Ouvrir dans Spotify',
    googleSearch: 'Recherche Google',
    share: 'Partager',
    quickShare: 'Partage rapide',
    home: 'Accueil',
    search: 'Recherche',
    yourLibrary: 'Votre bibliothèque',
    subscriptions: 'Abonnements',
    admin: 'Admin',
    createPlaylist: 'Créer une playlist',
    likedSongs: 'Titres aimés',
    viewProfile: 'Voir le profil',
    logout: 'Déconnexion',
    signIn: 'Connexion',
    darkMode: 'Mode sombre',
    lightMode: 'Mode clair',
    aiAssistant: 'Votre assistant IA',
    startHumming: 'Fredonnez pour trouver un titre',
    recording: 'En écoute...',
    processing: 'Analyse du fredonnement...',
    retryHumming: 'Réessayer',
    hummingCTA: 'Maintenir pour fredonner (10s max)',
    hummingHint: 'Fredonnez ou chantez un air pour retrouver le morceau.',
    hummingResult: 'Correspondance trouvée :',
  },
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? (localStorage.getItem('language') as Language | null) : null
    if (stored === 'en' || stored === 'fr') {
      setLanguage(stored)
      return
    }
    if (typeof window !== 'undefined') {
      const browserLang = navigator.language.startsWith('fr') ? 'fr' : 'en'
      setLanguage(browserLang)
    }
  }, [])

  const supported = useMemo(
    () => [
      { code: 'en' as Language, label: 'English' },
      { code: 'fr' as Language, label: 'Français' },
    ],
    []
  )

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: (lang) => {
        setLanguage(lang)
        if (typeof window !== 'undefined') {
          localStorage.setItem('language', lang)
        }
      },
      t: (key: string, fallback?: string) =>
        translations[language]?.[key] || translations.en[key] || fallback || key,
      supported,
    }),
    [language, supported]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
