'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AccountSettingsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/profile?section=account')
  }, [router])

  return null
}
