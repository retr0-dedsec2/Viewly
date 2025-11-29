import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import { AUTH_COOKIE_NAME } from '@/lib/auth-tokens'
import AdminClient from './AdminClient'

export const dynamic = 'force-dynamic'

export default function AdminPage() {
  const cookieStore = cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  const payload = token ? verifyToken(token) : null

  if (!payload || payload.role !== 'ADMIN') {
    notFound()
  }

  return <AdminClient />
}
