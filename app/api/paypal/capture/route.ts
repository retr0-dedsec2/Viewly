import { NextRequest, NextResponse } from 'next/server'
import paypal from '@paypal/checkout-server-sdk'
import { verifyToken, generateToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPayPalClient, getCredentialStatus } from '@/lib/paypal'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    const payload = token ? verifyToken(token) : null

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orderToken = req.nextUrl.searchParams.get('token') || req.nextUrl.searchParams.get('orderId')
    if (!orderToken) {
      return NextResponse.json({ error: 'Missing PayPal order token' }, { status: 400 })
    }

    const client = getPayPalClient()
    const request = new paypal.orders.OrdersCaptureRequest(orderToken)
    request.requestBody({})

    const capture = await client.execute(request)

    if (capture.result.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    const subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        subscriptionPlan: 'PREMIUM',
        subscriptionExpiresAt,
        hasAds: false,
      },
    })

    const refreshedToken = generateToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      role: updatedUser.role,
      subscriptionPlan: updatedUser.subscriptionPlan,
    })

    return NextResponse.json({
      token: refreshedToken,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        avatar: updatedUser.avatar,
        role: updatedUser.role,
        subscriptionPlan: updatedUser.subscriptionPlan,
        subscriptionExpiresAt: updatedUser.subscriptionExpiresAt,
        hasAds: updatedUser.hasAds,
        createdAt: updatedUser.createdAt,
      },
      message: 'Payment confirmed. Premium activated for 30 days.',
    })
  } catch (error: any) {
    const message = error?.message || 'Unknown PayPal error'
    const issue = error?.result?.details?.[0]?.issue
    const description = error?.result?.details?.[0]?.description
    const statusCode = error?.statusCode
    console.error('PayPal capture error:', message, issue, description)

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
      { error: 'Failed to capture PayPal payment', details: description || message, statusCode },
      { status: 500 },
    )
  }
}
