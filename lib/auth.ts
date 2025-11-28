import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export interface TokenPayload {
  userId: string
  email: string
  username: string
  role: 'USER' | 'ADMIN'
  subscriptionPlan: 'FREE' | 'PREMIUM'
}

export function generateToken(payload: TokenPayload): string {
  const normalizedPayload: TokenPayload = {
    userId: payload.userId,
    email: payload.email,
    username: payload.username,
    role: payload.role || 'USER',
    subscriptionPlan: payload.subscriptionPlan || 'FREE',
  }

  return jwt.sign(normalizedPayload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
  } catch {
    return null
  }
}

// Simple in-memory user store (replace with database in production)
export const users: Array<{
  id: string
  email: string
  username: string
  password: string
  avatar?: string
  role?: 'USER' | 'ADMIN'
  subscriptionPlan?: 'FREE' | 'PREMIUM'
  createdAt: string
}> = []

export function findUserByEmail(email: string) {
  return users.find((u) => u.email === email)
}

export function findUserById(id: string) {
  return users.find((u) => u.id === id)
}

export function createUser(email: string, username: string, hashedPassword: string) {
  const user = {
    id: Date.now().toString(),
    email,
    username,
    password: hashedPassword,
    role: 'USER' as const,
    subscriptionPlan: 'FREE' as const,
    createdAt: new Date().toISOString(),
  }
  users.push(user)
  return user
}

