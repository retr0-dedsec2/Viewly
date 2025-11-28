import paypal from '@paypal/checkout-server-sdk'

function getEnvironment() {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_SECRET_KEY

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials are not configured')
  }

  return new paypal.core.LiveEnvironment(clientId, clientSecret)
}

export function getPayPalClient() {
  return new paypal.core.PayPalHttpClient(getEnvironment())
}
