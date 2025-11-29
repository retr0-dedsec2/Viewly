'use client'

import { useEffect, useState } from 'react'
import { Shield, Users, Crown, RefreshCcw, Check, Loader2 } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import MobileMenu from '@/components/MobileMenu'
import MobileHeader from '@/components/MobileHeader'
import { useAuth } from '@/contexts/AuthContext'
import { getToken } from '@/lib/auth-client'
import { withCsrfHeader } from '@/lib/csrf'

type AdminUser = {
  id: string
  email: string
  username: string
  role: 'USER' | 'ADMIN'
  subscriptionPlan: 'FREE' | 'PREMIUM'
  subscriptionExpiresAt?: string | null
  hasAds?: boolean
  createdAt: string
}

export default function AdminClient() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [savingUserId, setSavingUserId] = useState<string | null>(null)
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'ADMIN') {
      setLoading(false)
      return
    }
    fetchUsers()
  }, [user, isAuthenticated])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const token = getToken()
      const res = await fetch('/api/admin/users', {
        headers: withCsrfHeader({ Authorization: `Bearer ${token}` }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unable to load users')
      setUsers(data.users)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUser = async (targetId: string, updates: Partial<AdminUser>) => {
    setSavingUserId(targetId)
    try {
      const token = getToken()
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: withCsrfHeader({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }),
        body: JSON.stringify({
          userId: targetId,
          role: updates.role,
          subscriptionPlan: updates.subscriptionPlan,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')

      setUsers((prev) =>
        prev.map((u) => (u.id === targetId ? { ...u, ...data.user } : u))
      )
    } catch (error) {
      console.error(error)
    } finally {
      setSavingUserId(null)
    }
  }

  if (!isAuthenticated || !user || user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-b from-spotify-dark via-spotify-gray to-black">
      <MobileHeader onMenuClick={() => setMobileMenuOpen(true)} />
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <div className="flex-1 flex flex-col lg:ml-64 pt-16 lg:pt-0 pb-20 lg:pb-24">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-spotify-green/20 flex items-center justify-center">
                <Shield className="text-spotify-green" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-300 uppercase tracking-wide">Admin</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Gestion des utilisateurs</h1>
              </div>
            </div>
            <button
              onClick={fetchUsers}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-spotify-green text-black font-semibold hover:bg-green-600 transition-colors"
            >
              <RefreshCcw size={16} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-300">
              <Loader2 className="animate-spin mr-2" size={20} />
              Chargement des utilisateurs...
            </div>
          ) : (
            <div className="bg-spotify-light rounded-lg border border-white/5 overflow-hidden">
              <div className="grid grid-cols-6 gap-3 px-4 py-3 text-xs uppercase tracking-wide text-gray-400 border-b border-white/5">
                <div className="col-span-2">Utilisateur</div>
                <div>Email</div>
                <div>Plan</div>
                <div>Role</div>
                <div>Actions</div>
              </div>
              {users.map((u) => (
                <div
                  key={u.id}
                  className="grid grid-cols-6 gap-3 px-4 py-4 border-b border-white/5 items-center text-sm text-white"
                >
                  <div className="col-span-2">
                    <div className="font-semibold">{u.username}</div>
                    <div className="text-gray-400 text-xs">
                      Inscrit le {new Date(u.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-gray-200 truncate">{u.email}</div>
                  <div>
                    <select
                      value={u.subscriptionPlan}
                      onChange={(e) =>
                        handleUpdateUser(u.id, {
                          subscriptionPlan: e.target.value as AdminUser['subscriptionPlan'],
                        })
                      }
                      className="bg-spotify-gray text-white px-3 py-1 rounded-lg w-full"
                      disabled={savingUserId === u.id}
                    >
                      <option value="FREE">FREE</option>
                      <option value="PREMIUM">PREMIUM</option>
                    </select>
                    <div className="text-xs text-gray-400 mt-1">
                      {u.subscriptionExpiresAt
                        ? `Expire le ${new Date(u.subscriptionExpiresAt).toLocaleDateString()}`
                        : u.subscriptionPlan === 'FREE'
                        ? 'Ads enabled'
                        : 'Ads disabled'}
                    </div>
                  </div>
                  <div>
                    <select
                      value={u.role}
                      onChange={(e) =>
                        handleUpdateUser(u.id, { role: e.target.value as AdminUser['role'] })
                      }
                      className="bg-spotify-gray text-white px-3 py-1 rounded-lg w-full"
                      disabled={savingUserId === u.id}
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    {savingUserId === u.id ? (
                      <Loader2 className="animate-spin text-gray-300" size={18} />
                    ) : (
                      <Check className="text-spotify-green" size={18} />
                    )}
                    <Crown
                      size={16}
                      className={
                        u.subscriptionPlan === 'PREMIUM' ? 'text-yellow-300' : 'text-gray-500'
                      }
                    />
                    <Users size={16} className={u.role === 'ADMIN' ? 'text-spotify-green' : 'text-gray-500'} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
