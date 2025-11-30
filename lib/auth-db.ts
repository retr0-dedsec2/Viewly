import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

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
      role: 'USER',
      subscriptionPlan: 'FREE',
      subscriptionExpiresAt: null,
      hasAds: true,
      twoFactorEnabled: false,
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

export async function listAllUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  })
}

export async function updateUserSubscription(userId: string, plan: 'FREE' | 'PREMIUM') {
  const isPremium = plan === 'PREMIUM'
  const expiry = isPremium ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null

  return prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionPlan: plan,
      subscriptionExpiresAt: expiry,
      hasAds: !isPremium,
    },
  })
}

export async function updateUserRole(userId: string, role: 'USER' | 'ADMIN') {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
  })
}

export async function setTwoFactorCode(userId: string, codeHash: string, expiresAt: Date) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorCode: codeHash,
      twoFactorExpiresAt: expiresAt,
    },
  })
}

export async function clearTwoFactorCode(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorCode: null,
      twoFactorExpiresAt: null,
    },
  })
}

export async function setTwoFactorEnabled(userId: string, enabled: boolean) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: enabled,
    },
  })
}

