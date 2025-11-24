import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export interface TokenPayload {
  userId: string
  email: string
  username: string
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
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
    createdAt: new Date().toISOString(),
  }
  users.push(user)
  return user
}

