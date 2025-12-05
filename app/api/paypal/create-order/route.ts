import { NextRequest, NextResponse } from 'next/server'
import paypal from '@paypal/checkout-server-sdk'
import { verifyToken } from '@/lib/auth'
import { getPayPalClient, getCredentialStatus, getMerchantEmail } from '@/lib/paypal'
import { getAuthToken } from '@/lib/auth-tokens'
import { prisma } from '@/lib/prisma'
import { PaymentStatus, SubscriptionPlan } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const token = getAuthToken(req)
    const payload = token ? verifyToken(token) : null

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const origin = req.headers.get('origin') || new URL(req.url).origin
    const client = getPayPalClient()
    const request = new paypal.orders.OrdersCreateRequest()
    const payeeEmail = getMerchantEmail()

    const purchaseUnit: any = {
      reference_id: 'default',
      amount: {
        currency_code: 'EUR',
        value: '7.00',
      },
      description: 'Viewly Premium - Monthly',
    }

    if (payeeEmail) {
      purchaseUnit.payee = { email_address: payeeEmail }
    }

    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [purchaseUnit],
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

    await prisma.payment.upsert({
      where: { orderId: order.result.id },
      create: {
        orderId: order.result.id,
        userId: payload.userId,
        plan: SubscriptionPlan.PREMIUM,
        status: PaymentStatus.CREATED,
        amount: Number(purchaseUnit.amount.value),
        currency: purchaseUnit.amount.currency_code,
        raw: order.result,
      },
      update: {
        userId: payload.userId,
        plan: SubscriptionPlan.PREMIUM,
        status: PaymentStatus.CREATED,
        amount: Number(purchaseUnit.amount.value),
        currency: purchaseUnit.amount.currency_code,
        raw: order.result,
      },
    })

    return NextResponse.json({
      approvalUrl: approvalLink.href,
      orderId: order.result.id,
    })
  } catch (error: any) {
    const message = error?.message || 'Unknown PayPal error'
    const issue = error?.result?.details?.[0]?.issue
    const description = error?.result?.details?.[0]?.description
    const statusCode = error?.statusCode
    console.error('PayPal create order error:', message, issue, description)

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

    if (issue === 'PAYEE_ACCOUNT_RESTRICTED') {
      return NextResponse.json(
        {
          error: 'The PayPal merchant account is restricted and cannot receive payments. Please contact support.',
          details: description || issue,
        },
        { status: 503 },
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to create PayPal order',
        details: description || message,
        statusCode,
      },
      { status: 500 },
    )
  }
}
