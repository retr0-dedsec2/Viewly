import { User } from '@prisma/client'
import { prisma } from './prisma'

const MS_PER_DAY = 24 * 60 * 60 * 1000

type DurationInput = {
  durationDays?: number
  durationMonths?: number
}

export function resolveDurationMs({ durationDays, durationMonths }: DurationInput): number {
  if (durationDays && durationDays > 0) {
    return durationDays * MS_PER_DAY
  }
  if (durationMonths && durationMonths > 0) {
    return durationMonths * 30 * MS_PER_DAY
  }
  return 30 * MS_PER_DAY
}

export function calculateExpiryDate(durationMs: number, baseDate?: Date): Date {
  const base = baseDate && baseDate.getTime() > Date.now() ? baseDate : new Date()
  return new Date(base.getTime() + durationMs)
}

export async function enforceSubscriptionExpiry(user: User) {
  if (
    user.subscriptionPlan === 'PREMIUM' &&
    user.subscriptionExpiresAt &&
    user.subscriptionExpiresAt.getTime() <= Date.now()
  ) {
    return prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionPlan: 'FREE',
        subscriptionExpiresAt: null,
        hasAds: true,
      },
    })
  }
  return user
}

export async function getUserWithActiveSubscription(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })
  if (!user) return null
  return enforceSubscriptionExpiry(user)
}
