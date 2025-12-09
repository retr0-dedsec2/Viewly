'use client'

import { useEffect, useState } from 'react'
import { Settings, Shield, Mail, User as UserIcon, Lock, Save, AlertCircle, CheckCircle2 } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import MobileMenu from '@/components/MobileMenu'
import MobileHeader from '@/components/MobileHeader'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { withCsrfHeader } from '@/lib/csrf'

export default function AccountSettingsPage() {
  const { user, login, isAuthenticated } = useAuth()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [username, setUsername] = useState(user?.username || '')
  const [email, setEmail] = useState(user?.email || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (user) {
      setUsername(user.username)
      setEmail(user.email)
    }
  }, [user])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setError(null)
    setStatus(null)
    try {
      const res = await fetch('/api/account', {
        method: 'PATCH',
        headers: withCsrfHeader({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
        }),
        body: JSON.stringify({
          username: username.trim() || undefined,
          email: email.trim() || undefined,
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
      setSaving(false)
    }
  }

  if (!user) return null

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-b from-spotify-dark via-spotify-gray to-black">
      <MobileHeader onMenuClick={() => setMobileMenuOpen(true)} />
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <div className="flex-1 flex flex-col lg:ml-64 pt-16 lg:pt-0 pb-20 lg:pb-24">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-spotify-green/20 flex items-center justify-center">
                <Settings className="text-spotify-green" size={18} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">Account</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Settings editor</h1>
                <p className="text-gray-400 text-sm">Update your profile, login email, and password.</p>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-spotify-light rounded-lg border border-white/5 p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 text-white">
                  <UserIcon size={16} />
                  <span className="font-semibold">Profile</span>
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

              <div className="bg-spotify-light rounded-lg border border-white/5 p-4 sm:p-5 space-y-4">
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
                  <Shield size={14} className="text-gray-300 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white mb-1">Keep your account secure</p>
                    <p>Use at least 8 characters, with a mix of letters, numbers, and symbols.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-spotify-green text-black font-semibold px-4 py-2 rounded-lg hover:bg-green-500 active:scale-95 disabled:opacity-60"
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
