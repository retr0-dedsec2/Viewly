export interface User {
  id: string
  email: string
  username: string
  avatar?: string
  role: 'USER' | 'ADMIN'
  subscriptionPlan: 'FREE' | 'PREMIUM'
  subscriptionExpiresAt?: string | null
  hasAds?: boolean
  createdAt: string
}

export interface Playlist {
  id: string
  name: string
  description?: string
  tracks: string[] // Music IDs
  createdAt: string
  userId: string
}

