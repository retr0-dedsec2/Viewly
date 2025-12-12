import { prisma } from './prisma'
import { calculateExpiryDate, enforceSubscriptionExpiry, resolveDurationMs } from './subscriptions'
import bcrypt from 'bcryptjs'

export async function findUserByEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  })
  if (!user) return null
  return enforceSubscriptionExpiry(user)
}

export async function findUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
  })
  if (!user) return null
  return enforceSubscriptionExpiry(user)
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

export async function updateUserSubscription(
  userId: string,
  plan: 'FREE' | 'PREMIUM',
  options?: { durationDays?: number; durationMonths?: number; extendExisting?: boolean },
) {
  const isPremium = plan === 'PREMIUM'
  const durationMs = resolveDurationMs({
    durationDays: options?.durationDays,
    durationMonths: options?.durationMonths,
  })

  const existing = await findUserById(userId)
  const baseDate =
    options?.extendExisting &&
    existing?.subscriptionPlan === 'PREMIUM' &&
    existing.subscriptionExpiresAt &&
    existing.subscriptionExpiresAt.getTime() > Date.now()
      ? existing.subscriptionExpiresAt
      : new Date()

  const expiry = isPremium ? calculateExpiryDate(durationMs, baseDate) : null

  return prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionPlan: plan,
      subscriptionExpiresAt: expiry,
      hasAds: !isPremium,
    },
  })
}

export async function updateUserRole(userId: string, role: 'USER' | 'ADMIN' | 'ARTIST') {
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
