import paypal from '@paypal/checkout-server-sdk'

function getCredentials() {
  const clientId =
    process.env.PAYPAL_CLIENT_ID ||
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
    process.env.PAYPAL_ID ||
    process.env.NEXT_PUBLIC_PAYPAL_ID

  const clientSecret =
    process.env.PAYPAL_SECRET_KEY ||
    process.env.PAYPAL_CLIENT_SECRET ||
    process.env.PAYPAL_SECRET ||
    process.env.PAYPAL_SECRET_ID ||
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_SECRET ||
    process.env.NEXT_PUBLIC_PAYPAL_SECRET ||
    process.env.NEXT_PUBLIC_PAYPAL_SECRET_KEY

  if (!clientId || !clientSecret) {
    return null
  }

  return { clientId, clientSecret }
}

function getEnvironment() {
  const creds = getCredentials()
  const mode = (process.env.PAYPAL_MODE || process.env.PAYPAL_ENV || 'sandbox').toLowerCase()

  if (!creds) {
    throw new Error('PayPal credentials are not configured')
  }

  const isLive = mode === 'live' || mode === 'production'
  return isLive
    ? new paypal.core.LiveEnvironment(creds.clientId, creds.clientSecret)
    : new paypal.core.SandboxEnvironment(creds.clientId, creds.clientSecret)
}

export function getPayPalClient() {
  return new paypal.core.PayPalHttpClient(getEnvironment())
}
