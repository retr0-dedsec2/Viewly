import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { PlayerProvider } from '@/contexts/PlayerContext'

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
        <AuthProvider>
          <PlayerProvider>{children}</PlayerProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

