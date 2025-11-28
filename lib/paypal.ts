import paypal from '@paypal/checkout-server-sdk'

function getEnvironment() {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_SECRET_KEY
  const mode = (process.env.PAYPAL_MODE || process.env.PAYPAL_ENV || 'sandbox').toLowerCase()

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials are not configured')
  }

  const isLive = mode === 'live' || mode === 'production'
  return isLive
    ? new paypal.core.LiveEnvironment(clientId, clientSecret)
    : new paypal.core.SandboxEnvironment(clientId, clientSecret)
}

export function getPayPalClient() {
  return new paypal.core.PayPalHttpClient(getEnvironment())
}
