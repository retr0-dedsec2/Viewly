import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { PlayerProvider } from '@/contexts/PlayerContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { Analytics } from '@vercel/analytics/next'

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
      <head>
        <meta name="google-site-verification" content="ftF4Bd9DyJkxOCHWxiXMVBN9Hspys8S-FlbSabC2b3Y" />
      </head>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <PlayerProvider>{children}</PlayerProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
