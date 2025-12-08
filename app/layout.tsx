import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { PlayerProvider } from '@/contexts/PlayerContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
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
  const adsClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT

  return (
    <html lang="en">
      <head>
        <meta name="google-site-verification" content="ftF4Bd9DyJkxOCHWxiXMVBN9Hspys8S-FlbSabC2b3Y" />
      </head>
      <body className="pb-24 md:pb-28">
        {adsClient && (
          <Script
            id="google-adsense"
            strategy="afterInteractive"
            data-adsbygoogle="yes"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsClient}`}
            crossOrigin="anonymous"
          />
        )}
        <ThemeProvider>
          <AuthProvider>
            <PlayerProvider>{children}</PlayerProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

