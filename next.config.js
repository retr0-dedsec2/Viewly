/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.youtube.com https://www.youtube-nocookie.com https://www.paypal.com https://www.paypalobjects.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://vercel.live",
      "script-src-attr 'none'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https: https://pagead2.googlesyndication.com https://tpc.googlesyndication.com",
      "media-src 'self' data: blob: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://www.googleapis.com https://*.googleapis.com https://www.paypal.com https://api-m.paypal.com https://www.sandbox.paypal.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://vercel.live wss://vercel.live https://lrclib.net https://api.lyrics.ovh",
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://vercel.live https://www.paypal.com https://www.sandbox.paypal.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      'upgrade-insecure-requests',
    ].join('; '),
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  {
    key: 'Referrer-Policy',
    value: 'same-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'geolocation=(), microphone=(), camera=()',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
]

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

module.exports = nextConfig

