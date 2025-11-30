'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Music } from 'lucide-react'
import { withCsrfHeader } from '@/lib/csrf'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [requires2FA, setRequires2FA] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [pendingUserId, setPendingUserId] = useState('')
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login'
      const body = isRegister
        ? { email, username, password }
        : { email, password }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: withCsrfHeader({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed')
      }

      if (data.requiresTwoFactor) {
        setRequires2FA(true)
        setPendingUserId(data.userId)
      } else {
        login(data.token, data.user)
        router.push('/')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: withCsrfHeader({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ userId: pendingUserId, code: verificationCode }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Invalid code')
      }

      login(data.token, data.user)
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: withCsrfHeader({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()
      if (!response.ok || !data.requiresTwoFactor) {
        throw new Error(data.error || 'Unable to resend code')
      }
    } catch (err: any) {
      setError(err.message || 'Unable to resend code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-spotify-dark via-spotify-gray to-black flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-spotify-green rounded-full mb-4">
            <Music className="text-white" size={28} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Viewly</h1>
          <p className="text-gray-400 text-sm sm:text-base">
            {requires2FA
              ? 'Enter the code sent to your email'
              : isRegister
              ? 'Create your account'
              : 'Welcome back'}
          </p>
        </div>

        <div className="bg-spotify-light rounded-lg p-6 sm:p-8 shadow-xl">
          {requires2FA ? (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Verification code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  className="w-full bg-spotify-gray text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-spotify-green tracking-[0.3em] text-center text-lg"
                  placeholder="123456"
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-spotify-green hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify code'}
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="w-full bg-spotify-gray hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Resend code
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRequires2FA(false)
                    setVerificationCode('')
                    setPendingUserId('')
                  }}
                  className="text-sm text-gray-300 hover:text-white underline"
                >
                  Use different account
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {isRegister && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full bg-spotify-gray text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-spotify-green"
                    placeholder="Enter your username"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-spotify-gray text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-spotify-green"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-spotify-gray text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-spotify-green"
                  placeholder="Enter your password"
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-spotify-green hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? 'Loading...'
                  : isRegister
                  ? 'Sign Up'
                  : 'Sign In'}
              </button>
            </form>
          )}
        </div>

        {!requires2FA && (
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister)
                setError('')
              }}
              className="text-spotify-green hover:text-green-400 text-sm"
            >
              {isRegister
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
