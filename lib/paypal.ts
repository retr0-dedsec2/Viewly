import paypal from '@paypal/checkout-server-sdk'

const clientIdKeys = [
  'PAYPAL_CLIENT_ID',
  'NEXT_PUBLIC_PAYPAL_CLIENT_ID',
  'PAYPAL_ID',
  'NEXT_PUBLIC_PAYPAL_ID',
]

const clientSecretKeys = [
  'PAYPAL_SECRET_KEY',
  'PAYPAL_CLIENT_SECRET',
  'PAYPAL_SECRET',
  'PAYPAL_SECRET_ID',
  'NEXT_PUBLIC_PAYPAL_CLIENT_SECRET',
  'NEXT_PUBLIC_PAYPAL_SECRET',
  'NEXT_PUBLIC_PAYPAL_SECRET_KEY',
]

const merchantEmailKeys = [
  'PAYPAL_MERCHANT_EMAIL',
  'PAYPAL_RECEIVER_EMAIL',
  'PAYPAL_BUSINESS_EMAIL',
  'NEXT_PUBLIC_PAYPAL_MERCHANT_EMAIL',
  'NEXT_PUBLIC_PAYPAL_RECEIVER_EMAIL',
  'NEXT_PUBLIC_PAYPAL_BUSINESS_EMAIL',
]

export function getCredentialStatus() {
  return {
    clientId: clientIdKeys.map((key) => ({ key, present: Boolean(process.env[key]) })),
    clientSecret: clientSecretKeys.map((key) => ({ key, present: Boolean(process.env[key]) })),
    merchantEmail: merchantEmailKeys.map((key) => ({ key, present: Boolean(process.env[key]) })),
  }
}

function getCredentials() {
  const clientIdKey = clientIdKeys.find((key) => process.env[key])
  const clientSecretKey = clientSecretKeys.find((key) => process.env[key])

  if (!clientIdKey || !clientSecretKey) {
    return null
  }

  return {
    clientId: process.env[clientIdKey] as string,
    clientSecret: process.env[clientSecretKey] as string,
    clientIdKey,
    clientSecretKey,
  }
}

export function getMerchantEmail() {
  const key = merchantEmailKeys.find((k) => process.env[k])
  if (!key) return null
  return process.env[key] as string
}

function getEnvironment() {
  const creds = getCredentials()
  const mode = (process.env.PAYPAL_MODE || process.env.PAYPAL_ENV || 'sandbox').toLowerCase()

  if (!creds) {
    const status = getCredentialStatus()
    const err = new Error('PAYPAL_CREDENTIALS_MISSING')
    // Attach which keys were checked so the caller can include in the response without secrets.
    ;(err as any).status = status
    throw err
  }

  const isLive = mode === 'live' || mode === 'production'
  return isLive
    ? new paypal.core.LiveEnvironment(creds.clientId, creds.clientSecret)
    : new paypal.core.SandboxEnvironment(creds.clientId, creds.clientSecret)
}

export function getPayPalClient() {
  return new paypal.core.PayPalHttpClient(getEnvironment())
}
