import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { PlayerProvider } from '@/contexts/PlayerContext'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Viewly - AI Music Assistant',
  description: 'Listen to music with your AI assistant',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Script
          id="google-adsense"
          strategy="afterInteractive"
          data-adsbygoogle="yes"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1115899067011876"
          crossOrigin="anonymous"
        />
        <AuthProvider>
          <PlayerProvider>{children}</PlayerProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

