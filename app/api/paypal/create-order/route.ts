import { NextRequest, NextResponse } from 'next/server'
import paypal from '@paypal/checkout-server-sdk'
import { verifyToken } from '@/lib/auth'
import { getPayPalClient, getCredentialStatus } from '@/lib/paypal'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    const payload = token ? verifyToken(token) : null

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const origin = req.headers.get('origin') || new URL(req.url).origin
    const client = getPayPalClient()
    const request = new paypal.orders.OrdersCreateRequest()

    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'EUR',
            value: '7.00',
          },
          description: 'Viewly Premium - Monthly',
        },
      ],
      application_context: {
        brand_name: 'Viewly',
        user_action: 'PAY_NOW',
        return_url: `${origin}/subscriptions?paypalStatus=success`,
        cancel_url: `${origin}/subscriptions?paypalStatus=cancel`,
      },
    })

    const order = await client.execute(request)
    const approvalLink = order.result.links?.find((link: any) => link.rel === 'approve')

    if (!approvalLink?.href) {
      return NextResponse.json({ error: 'Unable to create PayPal order' }, { status: 400 })
    }

    return NextResponse.json({
      approvalUrl: approvalLink.href,
      orderId: order.result.id,
    })
  } catch (error: any) {
    const message = error?.message || 'Unknown PayPal error'
    console.error('PayPal create order error:', message)

    if (message === 'PAYPAL_CREDENTIALS_MISSING') {
      const status = error?.status || getCredentialStatus()
      return NextResponse.json(
        {
          error: 'PayPal is not configured on the server. Please try again later.',
          missingCredentials: status,
        },
        { status: 503 },
      )
    }

    return NextResponse.json({ error: 'Failed to create PayPal order', details: message }, { status: 500 })
  }
}
