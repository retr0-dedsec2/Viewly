import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { generateToken } from './auth'

export async function findUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email },
  })
}

export async function findUserById(id: string) {
  return await prisma.user.findUnique({
    where: { id },
  })
}

export async function createUser(email: string, username: string, hashedPassword: string) {
  return await prisma.user.create({
    data: {
      email,
      username,
      password: hashedPassword,
    },
  })
}

export async function authenticateUser(email: string, password: string) {
  const user = await findUserByEmail(email)
  if (!user) return null

  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) return null

  return user
}

