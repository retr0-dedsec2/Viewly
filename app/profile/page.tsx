'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  LogOut,
  Settings,
  Music,
  Crown,
  ShieldCheck,
  Save,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Mail,
  User as UserIcon,
  Lock,
} from 'lucide-react'
import { Toggle } from '@base-ui/react/toggle'
import { Avatar } from '@base-ui/react/avatar'
import Sidebar from '@/components/Sidebar'
import MobileMenu from '@/components/MobileMenu'
import MobileHeader from '@/components/MobileHeader'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { withCsrfHeader } from '@/lib/csrf'
import { getToken } from '@/lib/auth-client'

export default function ProfilePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [twoFactorUpdating, setTwoFactorUpdating] = useState(false)
  const [twoFactorError, setTwoFactorError] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [avatarData, setAvatarData] = useState('')
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savingAccount, setSavingAccount] = useState(false)
  const [accountOpen, setAccountOpen] = useState(true)
  const { user, logout, login, isAuthenticated } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isPremium = user?.subscriptionPlan === 'PREMIUM'
  const initials = useMemo(() => {
    const name = user?.username || ''
    return name ? name.slice(0, 2).toUpperCase() : 'US'
  }, [user?.username])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (user) {
      setUsername(user.username)
      setEmail(user.email)
      setAvatarData(user.avatar || '')
    }
  }, [user])

  useEffect(() => {
    if (searchParams?.get('section') === 'account') {
      const el = document.getElementById('account-settings')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [searchParams])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const toggleTwoFactor = async () => {
    if (!user) return
    setTwoFactorError('')
    setTwoFactorUpdating(true)
    try {
      const res = await fetch('/api/auth/two-factor', {
        method: 'PATCH',
        headers: withCsrfHeader({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        }),
        body: JSON.stringify({ enabled: !user.twoFactorEnabled }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Unable to update 2FA')
      }
      // Refresh page state
      window.location.reload()
    } catch (err: any) {
      setTwoFactorError(err.message || 'Unable to update 2FA')
    } finally {
      setTwoFactorUpdating(false)
    }
  }

  const handleSaveAccount = async () => {
    if (!user) return
    setSavingAccount(true)
    setError(null)
    setStatus(null)
    try {
      const res = await fetch('/api/account', {
        method: 'PATCH',
        headers: withCsrfHeader({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken() || ''}`,
        }),
        body: JSON.stringify({
          username: username.trim() || undefined,
          email: email.trim() || undefined,
          avatar: avatarData || '',
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Unable to update account')
      }
      setStatus(data.message || 'Account updated')
      setCurrentPassword('')
      setNewPassword('')
      if (data.token && data.user) {
        login(data.token, data.user)
      }
    } catch (err: any) {
      setError(err.message || 'Update failed')
    } finally {
      setSavingAccount(false)
    }
  }

  const handleDelete = async () => {
    // Placeholder until backend delete is available
    setStatus('Account deletion request acknowledged (no backend handler configured yet).')
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError(null)
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1_000_000) {
      setAvatarError('Avatar must be under 1MB')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result?.toString() || ''
      setAvatarData(result)
    }
    reader.readAsDataURL(file)
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-b from-spotify-dark via-spotify-gray to-black">
      <MobileHeader onMenuClick={() => setMobileMenuOpen(true)} />
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 lg:ml-64 pt-16 lg:pt-8 pb-20 lg:pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 lg:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">Profile</h1>
            <p className="text-gray-400 text-sm sm:text-base">Manage your account settings</p>
          </div>

          <div className="bg-spotify-light rounded-lg p-4 sm:p-6 lg:p-8 mb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6 lg:mb-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-spotify-green/20 border border-spotify-green/40 flex items-center justify-center overflow-hidden">
                {avatarData ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarData} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-xl">{initials}</span>
                )}
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">{user.username}</h2>
                <p className="text-gray-400 text-sm sm:text-base">{user.email}</p>
                <p className="text-gray-500 text-xs sm:text-sm mt-1">
                  Member since {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-spotify-gray rounded-lg">
                <div className="flex items-center gap-3">
                  <Crown size={20} className={isPremium ? 'text-yellow-300' : 'text-gray-400'} />
                  <div>
                    <p className="text-white font-medium">Subscription</p>
                    <p className="text-gray-400 text-sm">
                      {isPremium ? 'Premium — ads disabled' : 'Free plan — ads enabled'}
                    </p>
                    {user.subscriptionExpiresAt && (
                      <p className="text-gray-500 text-xs">
                        Valid until {new Date(user.subscriptionExpiresAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => router.push('/subscriptions')}
                  className="text-spotify-green hover:text-green-400"
                >
                  Manage
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-spotify-gray rounded-lg">
                <div className="flex items-center gap-3">
                  <Settings size={20} className="text-gray-400" />
                  <div>
                    <p className="text-white font-medium">Account Settings</p>
                    <p className="text-gray-400 text-sm">Manage your account preferences</p>
                  </div>
                </div>
                <button className="text-spotify-green hover:text-green-400">
                  Edit
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-spotify-gray rounded-lg">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={20} className={user.twoFactorEnabled ? 'text-green-400' : 'text-gray-400'} />
                  <div>
                    <p className="text-white font-medium">Two-factor authentication</p>
                    <p className="text-gray-400 text-sm">
                    {user.twoFactorEnabled ? 'Enabled - email codes required at login' : 'Add a second step with email codes'}
                  </p>
                  {twoFactorError && (
                    <p className="text-red-400 text-xs mt-1">{twoFactorError}</p>
                  )}
                </div>
              </div>
                <Toggle
                  pressed={user.twoFactorEnabled}
                  onPressedChange={() => toggleTwoFactor()}
                  disabled={twoFactorUpdating}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
                    user.twoFactorEnabled
                      ? 'bg-green-500/20 text-green-200 border-green-500/40'
                      : 'bg-white/5 text-white border-white/10'
                  } disabled:opacity-60`}
                >
                  {twoFactorUpdating ? 'Saving...' : user.twoFactorEnabled ? 'Disable' : 'Enable'}
                </Toggle>
              </div>

              <div className="flex items-center justify-between p-4 bg-spotify-gray rounded-lg">
                <div className="flex items-center gap-3">
                  <Music size={20} className="text-gray-400" />
                  <div>
                    <p className="text-white font-medium">My Playlists</p>
                    <p className="text-gray-400 text-sm">View and manage your playlists</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/library')}
                  className="text-spotify-green hover:text-green-400"
                >
                  View
                </button>
              </div>
            </div>
          </div>

          {(status || error) && (
            <div
              className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-lg ${
                status ? 'bg-green-900/40 text-green-200' : 'bg-red-900/40 text-red-200'
              } border border-white/5`}
            >
              {status ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{status || error}</span>
            </div>
          )}

          <div id="account-settings" className="bg-spotify-light rounded-lg border border-white/5 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Settings size={18} />
                <div>
                  <p className="font-semibold">Account parameters</p>
                  <p className="text-xs text-gray-400">Email, display name, password</p>
                </div>
              </div>
              <button
                onClick={() => setAccountOpen((open) => !open)}
                className="text-sm text-spotify-green hover:text-green-400"
              >
                {accountOpen ? 'Masquer' : 'Afficher'}
              </button>
            </div>

            {accountOpen && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-black/20 rounded-lg border border-white/10 p-4 space-y-4">
                    <div className="flex items-center gap-2 text-white">
                      <UserIcon size={16} />
                      <span className="font-semibold">Profile</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Avatar upload (max 1MB)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="w-full text-sm text-gray-200"
                      />
                      {avatarError && <p className="text-xs text-red-300 mt-1">{avatarError}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Display name</label>
                      <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-spotify-gray text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-spotify-green"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-gray-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-spotify-gray text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-spotify-green"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/20 rounded-lg border border-white/10 p-4 space-y-4">
                    <div className="flex items-center gap-2 text-white">
                      <Lock size={16} />
                      <span className="font-semibold">Security</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Current password</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full bg-spotify-gray text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-spotify-green"
                        placeholder="Required to change password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">New password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-spotify-gray text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-spotify-green"
                        placeholder="Leave blank to keep current"
                      />
                    </div>
                    <div className="text-xs text-gray-400 bg-black/20 border border-white/5 rounded-lg p-3 flex items-start gap-2">
                      <ShieldCheck size={14} className="text-gray-300 mt-0.5" />
                      <div>
                        <p className="font-semibold text-white mb-1">Keep your account secure</p>
                        <p>Use at least 8 characters, with a mix of letters, numbers, and symbols.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 justify-end">
                  <button
                    onClick={handleSaveAccount}
                    disabled={savingAccount}
                    className="inline-flex items-center gap-2 bg-spotify-green text-black font-semibold px-4 py-2 rounded-lg hover:bg-green-500 active:scale-95 disabled:opacity-60"
                  >
                    <Save size={16} />
                    {savingAccount ? 'Saving...' : 'Save changes'}
                  </button>

                  <button
                    onClick={() => {
                      const ok = window.confirm('Delete your account? This cannot be undone.')
                      if (ok) handleDelete()
                    }}
                    className="inline-flex items-center gap-2 bg-red-500/20 text-red-300 px-4 py-2 rounded-lg border border-red-500/30 hover:bg-red-500/30"
                  >
                    <Trash2 size={16} />
                    Delete account
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-6 py-3 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
