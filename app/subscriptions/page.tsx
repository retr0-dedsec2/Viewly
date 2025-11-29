'use client'

import { useEffect, useMemo, useState } from 'react'
import { Crown, CheckCircle2, ShieldAlert } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import MobileMenu from '@/components/MobileMenu'
import MobileHeader from '@/components/MobileHeader'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { getToken } from '@/lib/auth-client'
import { withCsrfHeader } from '@/lib/csrf'

type PlanId = 'FREE' | 'PREMIUM'

const plans: Array<{
  id: PlanId
  title: string
  price: string
  description: string
  features: string[]
  accent: string
  gradient: string
  hasAds: boolean
}> = [
  {
    id: 'FREE',
    title: 'Free',
    price: '0 EUR',
    description: 'Unlimited listening with light ad breaks.',
    features: [
      'Access to the YouTube catalog',
      'Create playlists',
      'Save your favorite tracks',
      'AI assistant included',
      'Light ads between songs',
    ],
    accent: '#22c55e',
    gradient: 'from-black via-spotify-gray to-spotify-dark',
    hasAds: true,
  },
  {
    id: 'PREMIUM',
    title: 'Premium',
    price: '7 EUR / month',
    description: 'No ads, higher quality, and priority AI searches.',
    features: [
      'Zero advertising',
      'Priority AI search',
      'Unlimited skips',
      'Enhanced audio quality',
      'Priority support',
    ],
    accent: '#f59e0b',
    gradient: 'from-yellow-500/20 via-amber-500/10 to-spotify-dark',
    hasAds: false,
  },
]

export default function SubscriptionsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null)
  const [message, setMessage] = useState('')
  const [processingReturn, setProcessingReturn] = useState(false)
  const { user, login, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  const currentPlan = (user?.subscriptionPlan ?? 'FREE') as PlanId

  const handleFreePlan = async () => {
    if (loadingPlan || !user) return
    setLoadingPlan('FREE')
    setMessage('')

    try {
      const token = getToken()
      if (!token) {
        router.push('/login')
        return
      }

      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: withCsrfHeader({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }),
        body: JSON.stringify({ plan: 'FREE' }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Unable to update subscription')
      }

      login(data.token, data.user)
      setMessage(data.message || 'Subscription updated')
    } catch (error: any) {
      setMessage(error.message || 'An error occurred')
    } finally {
      setLoadingPlan(null)
    }
  }

  const handlePremiumPlan = async () => {
    if (loadingPlan || !user) return
    setLoadingPlan('PREMIUM')
    setMessage('')

    try {
      const token = getToken()
      if (!token) {
        router.push('/login')
        return
      }

      const res = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: withCsrfHeader({
          Authorization: `Bearer ${token}`,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Unable to start PayPal checkout')
      }

      if (data.approvalUrl) {
        window.location.href = data.approvalUrl
      } else {
        throw new Error('No approval URL returned from PayPal')
      }
    } catch (error: any) {
      setMessage(error.message || 'An error occurred')
      setLoadingPlan(null)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    if (processingReturn) return

    const searchParams = new URLSearchParams(window.location.search)
    const status = searchParams.get('paypalStatus')
    const paypalToken = searchParams.get('token') || searchParams.get('orderId')

    const clearParams = () => {
      searchParams.delete('paypalStatus')
      searchParams.delete('token')
      searchParams.delete('orderId')
      const newQuery = searchParams.toString()
      const newUrl = newQuery ? `/subscriptions?${newQuery}` : '/subscriptions'
      window.history.replaceState({}, '', newUrl)
    }

    const capturePayment = async () => {
      if (!paypalToken) return
      setProcessingReturn(true)
      setLoadingPlan('PREMIUM')
      setMessage('Confirming PayPal payment...')

      try {
        const token = getToken()
        if (!token) {
          router.push('/login')
          return
        }

        const res = await fetch(`/api/paypal/capture?token=${paypalToken}`, {
          method: 'POST',
          headers: withCsrfHeader({
            Authorization: `Bearer ${token}`,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Unable to confirm payment')
        }

        login(data.token, data.user)
        setMessage(data.message || 'Payment confirmed. Premium activated.')
      } catch (error: any) {
        setMessage(error.message || 'An error occurred while confirming payment')
      } finally {
        setLoadingPlan(null)
        setProcessingReturn(false)
        clearParams()
      }
    }

    if (status === 'cancel') {
      setMessage('Payment cancelled.')
      clearParams()
      return
    }

    if (status === 'success' && paypalToken) {
      capturePayment()
    }
  }, [isAuthenticated, login, processingReturn, router])

  const subscriptionCopy = useMemo(() => {
    if (currentPlan === 'PREMIUM') {
      return 'You are on Premium: no ads and priority performance.'
    }
    return 'Stay on the free plan with occasional ads, or move to Premium for an uninterrupted experience.'
  }, [currentPlan])

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-b from-spotify-dark via-spotify-gray to-black">
      <MobileHeader onMenuClick={() => setMobileMenuOpen(true)} />
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col lg:ml-64 pt-16 lg:pt-0 pb-20 lg:pb-24">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mb-6 lg:mb-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-spotify-green/20 flex items-center justify-center">
                <Crown className="text-spotify-green" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-300 uppercase tracking-wide">Subscriptions</p>
                <h1 className="text-3xl sm:text-4xl font-bold text-white">Choose your experience</h1>
              </div>
            </div>
            <p className="text-gray-300 max-w-3xl">{subscriptionCopy}</p>
            {message && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-spotify-light text-gray-100 text-sm">
                <ShieldAlert size={16} />
                <span>{message}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            {plans.map((plan) => {
              const isCurrent = currentPlan === plan.id
              return (
                <div
                  key={plan.id}
                  className={`relative overflow-hidden rounded-xl border border-white/5 bg-gradient-to-br ${plan.gradient} p-5 sm:p-6`}
                  style={{ boxShadow: isCurrent ? `0 0 0 2px ${plan.accent}` : undefined }}
                >
                  <div className="absolute inset-0 opacity-40 pointer-events-none">
                    <div className="absolute -right-10 -top-10 h-32 w-32 bg-spotify-green/20 blur-3xl" />
                  </div>
                  <div className="relative flex items-center justify-between gap-2 mb-3">
                    <div>
                      <p className="text-xs text-gray-300 uppercase tracking-wide">Plan {plan.title}</p>
                      <h2 className="text-2xl font-bold text-white">{plan.price}</h2>
                    </div>
                    {isCurrent && (
                      <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-white uppercase tracking-wide">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-gray-200 text-sm mb-4">{plan.description}</p>
                  <div className="space-y-2 mb-4">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-gray-100 text-sm">
                        <CheckCircle2 size={16} className="text-spotify-green" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs uppercase tracking-wide text-gray-400">
                      {plan.hasAds ? 'Ads enabled' : 'Ads disabled'}
                    </div>
                    <button
                      disabled={isCurrent || loadingPlan === plan.id}
                      onClick={() => (plan.id === 'PREMIUM' ? handlePremiumPlan() : handleFreePlan())}
                      className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                        isCurrent
                          ? 'bg-spotify-gray text-gray-300 cursor-not-allowed'
                          : 'bg-spotify-green hover:bg-green-600 text-black shadow-lg'
                      }`}
                    >
                      {isCurrent ? 'Current plan' : loadingPlan === plan.id ? 'Updating...' : 'Choose'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
