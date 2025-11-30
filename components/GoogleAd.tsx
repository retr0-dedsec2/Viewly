'use client'

import { useEffect, useId } from 'react'

type GoogleAdProps = {
  adSlot?: string
  className?: string
  format?: string
}

// Lightweight wrapper for AdSense that only renders when a client/slot is configured.
export default function GoogleAd({ adSlot, className, format = 'auto' }: GoogleAdProps) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
  const slot = adSlot || process.env.NEXT_PUBLIC_ADSENSE_SLOT
  const elementId = useId()

  useEffect(() => {
    if (!client || !slot) return

    // Inject AdSense script once per page load.
    if (!document.querySelector('script[data-adsbygoogle="yes"]')) {
      const script = document.createElement('script')
      script.async = true
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`
      script.crossOrigin = 'anonymous'
      script.setAttribute('data-adsbygoogle', 'yes')
      document.head.appendChild(script)
    }

    // Trigger ad rendering
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).adsbygoogle = (window as any).adsbygoogle || []
      ;(window as any).adsbygoogle.push({})
    } catch (error) {
      console.warn('Adsense push failed', error)
    }
  }, [client, slot])

  if (!client || !slot) return null

  return (
    <ins
      id={elementId}
      className={`adsbygoogle block w-full ${className || ''}`}
      style={{ display: 'block' }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  )
}
