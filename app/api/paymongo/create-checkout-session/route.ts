import { randomUUID } from 'node:crypto'

import { FieldValue } from 'firebase-admin/firestore'
import { NextResponse } from 'next/server'

import { getGloveHandDisplay } from '@/data/productOptions'
import {
  getColorDisplay,
  getProductById,
} from '@/lib/productUtils'
import {
  adminAuth,
  adminFirestore,
} from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

type CheckoutCartItem = {
  id: number
  color: string
  size?: string | null
  hand?: string | null
  quantity: number
}

type CheckoutCustomer = {
  name?: string
  email?: string
  phone?: string
  address?: string
}

type CheckoutRequestBody = {
  cart?: CheckoutCartItem[]
  customer?: CheckoutCustomer
}

type PayMongoCheckoutResponse = {
  data?: {
    id?: string
    attributes?: {
      checkout_url?: string
    }
  }
  errors?: Array<{
    code?: string
    detail?: string
    source?: {
      pointer?: string
    }
  }>
}

const PAYMONGO_API =
  'https://api.paymongo.com'

const SUPPORTED_METHODS = new Set([
  'card',
  'gcash',
  'paymaya',
  'grab_pay',
  'shopee_pay',
  'qrph',
])

const cleanMetadataValue = (
  value: string | undefined,
  maxLength = 450
) => value?.trim().slice(0, maxLength) || ''

const getAuthorization = (
  secretKey: string
) =>
  `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`

const getAuthenticatedUserId =
  async (request: Request) => {
    const authorization =
      request.headers.get('authorization')

    if (!authorization?.startsWith('Bearer ')) {
      return null
    }

    const idToken =
      authorization.slice('Bearer '.length)

    const decodedToken =
      await adminAuth.verifyIdToken(idToken)

    return decodedToken.uid
  }

const getRequestedPaymentMethods = () => {
  const configured =
    process.env.PAYMONGO_PAYMENT_METHODS
      ?.split(',')
      .map((method) => method.trim())
      .filter((method) => SUPPORTED_METHODS.has(method))

  if (configured?.length) {
    return configured
  }

  return [
    'qrph',
    'gcash',
    'paymaya',
    'grab_pay',
    'shopee_pay',
    'card',
  ]
}

const getActivePaymentMethods = async (
  secretKey: string
) => {
  const requested =
    getRequestedPaymentMethods()

  try {
    const response = await fetch(
      `${PAYMONGO_API}/v1/merchants/capabilities/payment_methods`,
      {
        method: 'GET',
        headers: {
          Authorization:
            getAuthorization(secretKey),
          Accept: 'application/json',
        },
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      console.warn(
        'Unable to read PayMongo payment method capabilities. Falling back to QR Ph.',
        response.status
      )
      return ['qrph']
    }

    const payload =
      (await response.json()) as unknown

    const capabilities =
      Array.isArray(payload)
        ? payload
        : typeof payload === 'object' &&
            payload !== null &&
            'data' in payload &&
            Array.isArray(
              (payload as { data?: unknown }).data
            )
          ? (
              payload as {
                data: unknown[]
              }
            ).data
          : []

    const active = capabilities
      .map((value) => {
        if (typeof value === 'string') {
          return value
        }

        if (
          typeof value === 'object' &&
          value !== null &&
          'id' in value &&
          typeof (
            value as { id?: unknown }
          ).id === 'string'
        ) {
          return (
            value as { id: string }
          ).id
        }

        return null
      })
      .filter(
        (value): value is string =>
          Boolean(value)
      )

    const available = requested.filter(
      (method) => active.includes(method)
    )

    return available.length > 0
      ? available
      : ['qrph']
  } catch (error) {
    console.warn(
      'PayMongo capabilities request failed. Falling back to QR Ph:',
      error
    )
    return ['qrph']
  }
}

export async function POST(request: Request) {
  const secretKey =
    process.env.PAYMONGO_SECRET_KEY

  if (!secretKey) {
    return NextResponse.json(
      {
        error:
          'PayMongo is not configured on the server.',
      },
      {
        status: 500,
      }
    )
  }

  try {
    const userId =
      await getAuthenticatedUserId(request)

    const body =
      (await request.json()) as CheckoutRequestBody

    const cart =
      Array.isArray(body.cart)
        ? body.cart
        : []

    const customer =
      body.customer || {}

    if (cart.length === 0) {
      return NextResponse.json(
        {
          error: 'Your cart is empty.',
        },
        {
          status: 400,
        }
      )
    }

    if (
      !customer.name?.trim() ||
      !customer.email?.trim() ||
      !customer.phone?.trim() ||
      !customer.address?.trim()
    ) {
      return NextResponse.json(
        {
          error:
            'Complete your delivery information before checkout.',
        },
        {
          status: 400,
        }
      )
    }

    const lineItems: Array<{
      name: string
      amount: number
      currency: 'PHP'
      quantity: number
      description?: string
    }> = []

    let totalItems = 0
    let totalAmount = 0

    for (const item of cart) {
      const quantity =
        Number(item.quantity)

      if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 99
      ) {
        return NextResponse.json(
          {
            error:
              'One or more cart quantities are invalid.',
          },
          {
            status: 400,
          }
        )
      }

      const product =
        getProductById(item.id)

      if (!product) {
        return NextResponse.json(
          {
            error:
              'One or more products are no longer available.',
          },
          {
            status: 400,
          }
        )
      }

      const variantParts = [
        getColorDisplay(item.color),
        item.size
          ? `Size ${item.size}`
          : null,
        item.hand
          ? getGloveHandDisplay(item.hand)
          : null,
      ].filter(Boolean)

      lineItems.push({
        name: product.name,
        description:
          variantParts.length > 0
            ? variantParts.join(' • ')
            : undefined,
        amount:
          Math.round(product.price * 100),
        currency: 'PHP',
        quantity,
      })

      totalItems += quantity
      totalAmount +=
        product.price * quantity
    }

    const orderReference =
      `VBR-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      new URL(request.url).origin

    const paymentMethodTypes =
      await getActivePaymentMethods(secretKey)

    const checkoutResponse =
      await fetch(
        `${PAYMONGO_API}/v2/checkout_sessions`,
        {
          method: 'POST',
          headers: {
            Authorization:
              getAuthorization(secretKey),
            'Content-Type':
              'application/json',
            Accept: 'application/json',
            'Idempotency-Key':
              orderReference,
          },
          body: JSON.stringify({
            data: {
              attributes: {
                billing: {
                  name:
                    customer.name.trim(),
                  email:
                    customer.email.trim(),
                  phone:
                    customer.phone.trim(),
                },
                line_items:
                  lineItems,
                payment_method_types:
                  paymentMethodTypes,
                success_url:
                  `${siteUrl}/checkout/success?reference=${encodeURIComponent(orderReference)}`,
                cancel_url:
                  `${siteUrl}/checkout`,
                reference_number:
                  orderReference,
                send_email_receipt: true,
                pass_on_fees:
                  process.env.PAYMONGO_PASS_ON_FEES ===
                  'true',
                metadata: {
                  order_reference:
                    orderReference,
                  user_id:
                    userId || 'guest',
                  customer_name:
                    cleanMetadataValue(
                      customer.name
                    ),
                  customer_phone:
                    cleanMetadataValue(
                      customer.phone
                    ),
                  delivery_address:
                    cleanMetadataValue(
                      customer.address
                    ),
                },
              },
            },
          }),
          cache: 'no-store',
        }
      )

    const result =
      (await checkoutResponse
        .json()
        .catch(() => null)) as
        | PayMongoCheckoutResponse
        | null

    if (!checkoutResponse.ok) {
      console.error(
        'PayMongo checkout session creation failed:',
        checkoutResponse.status,
        result?.errors
      )

      return NextResponse.json(
        {
          error:
            'Unable to start PayMongo checkout. Please try again.',
        },
        {
          status:
            checkoutResponse.status >= 400 &&
            checkoutResponse.status < 500
              ? 400
              : 502,
        }
      )
    }

    const checkoutUrl =
      result?.data?.attributes
        ?.checkout_url

    const checkoutSessionId =
      result?.data?.id

    if (
      !checkoutUrl ||
      !checkoutSessionId
    ) {
      throw new Error(
        'PayMongo did not return a valid checkout session.'
      )
    }

    const orderData = {
      reference:
        orderReference,
      customer: {
        name:
          customer.name.trim(),
        email:
          customer.email.trim(),
        phone:
          customer.phone.trim(),
        address:
          customer.address.trim(),
      },
      items: cart,
      totalItems,
      totalAmount,
      status: 'payment-pending',
      paymentStatus: 'unpaid',
      paymentMethod: 'paymongo',
      paymongoCheckoutSessionId:
        checkoutSessionId,
      paymongoPaymentMethods:
        paymentMethodTypes,
      createdAt:
        FieldValue.serverTimestamp(),
      updatedAt:
        FieldValue.serverTimestamp(),
    }

    if (userId) {
      await adminFirestore
        .doc(
          `users/${userId}/orders/${orderReference}`
        )
        .set(orderData)
    } else {
      await adminFirestore
        .doc(
          `guestOrders/${orderReference}`
        )
        .set(orderData)
    }

    return NextResponse.json({
      url: checkoutUrl,
      reference:
        orderReference,
      sessionId:
        checkoutSessionId,
    })
  } catch (error) {
    console.error(
      'PayMongo checkout route failed:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to start checkout.',
      },
      {
        status: 500,
      }
    )
  }
}
