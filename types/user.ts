export interface User {
  id: string
  email: string
  username: string
  avatar?: string
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

