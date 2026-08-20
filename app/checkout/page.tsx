'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import Image from 'next/image'
import Link from 'next/link'

import {
  useCart,
} from '@/context/CartContext'

import {
  getColorClass,
  getColorDisplay,
  getProductById,
  getProductImage,
} from '@/lib/productUtils'

import {
  getGloveHandDisplay,
} from '@/data/productOptions'

import {
  Check,
  CreditCard,
  Package,
  Send,
  ShoppingBag,
  X,
} from 'lucide-react'
import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { firestore } from '@/lib/firebase'
import VerdePaymentModal from '@/components/VerdePaymentModal'

const WEB3FORMS_ENDPOINT =
  'https://api.web3forms.com/submit'

const WEB3FORMS_ACCESS_KEY =
  process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY

/*
 * QR Ph expiry is explicitly set to 30 minutes so
 * the on-screen countdown matches PayMongo exactly.
 */
const QR_PH_EXPIRY_SECONDS =
  30 * 60

type Web3FormsResponse = {
  success?: boolean
  message?: string
}

type PayMongoPaymentIntentResponse = {
  paymentIntentId?: string
  clientKey?: string
  reference?: string
  amount?: number
  subtotalAmount?: number
  discountAmount?: number
  couponCode?: string | null
  couponType?: 'percentage' | 'fixed' | null
  couponValue?: number | null
  totalAmount?: number
  paymentMethods?: string[]
  code?: string
  displayedTotal?: number
  serverTotal?: number
  error?: string
}

type PayMongoPaymentMethodResponse = {
  data?: {
    id?: string
  }
  errors?: Array<{
    detail?: string
  }>
}

type PayMongoAttachResponse = {
  data?: {
    id?: string
    attributes?: {
      status?: string
      next_action?: {
        code?: {
          image_url?: string
        }
      }
    }
  }
  errors?: Array<{
    detail?: string
  }>
}

type PayMongoPaymentStatusResponse = {
  paid?: boolean
  failed?: boolean
  status?: string
  reference?: string
  totalAmount?: number
  paymentId?: string | null
  failureCode?: string | null
  failureMessage?: string | null
  error?: string
}

type CouponValidationResponse = {
  valid?: boolean
  code?: string
  couponDocPath?: string
  type?: 'percentage' | 'fixed'
  value?: number
  minimumSpend?: number
  maximumDiscount?: number | null
  eligibleSubtotal?: number
  subtotal?: number
  discountAmount?: number
  totalAmount?: number
  error?: string
}

type AppliedCoupon = {
  code: string
  type: 'percentage' | 'fixed'
  value: number
  discountAmount: number
  totalAmount: number
}

type PaymentUiStatus =
  | 'idle'
  | 'waiting'
  | 'processing'
  | 'failed'
  | 'paid'

/*
 * PayMongo documents a test_url for QR Ph test-mode
 * simulation, but its exact nesting can vary by response.
 * Find it safely without depending on one fixed path.
 */
function findStringProperty(
  value: unknown,
  propertyName: string
): string | null {
  if (
    !value ||
    typeof value !== 'object'
  ) {
    return null
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found =
        findStringProperty(
          item,
          propertyName
        )

      if (found) {
        return found
      }
    }

    return null
  }

  const record =
    value as Record<
      string,
      unknown
    >

  const direct =
    record[propertyName]

  if (
    typeof direct === 'string' &&
    direct.trim()
  ) {
    return direct
  }

  for (
    const child
    of Object.values(record)
  ) {
    const found =
      findStringProperty(
        child,
        propertyName
      )

    if (found) {
      return found
    }
  }

  return null
}

export default function CheckoutPage() {
  const checkoutFormRef = useRef<HTMLFormElement>(null)
  const { user } = useAuth()
  const {
    cart,
    getCartTotal,
    getCartCount,
    clearCart,
  } = useCart()

  const [
    formData,
    setFormData,
  ] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  })

  const [
    isConfirmOpen,
    setIsConfirmOpen,
  ] = useState(false)

  const [
    isPaymentModalOpen,
    setIsPaymentModalOpen,
  ] = useState(false)

  const [
    qrCodeImage,
    setQrCodeImage,
  ] = useState<string | null>(null)

  const [
    qrExpiresAt,
    setQrExpiresAt,
  ] = useState<number | null>(null)

  const [
    paymentReference,
    setPaymentReference,
  ] = useState('')

  const [
    paymentTotal,
    setPaymentTotal,
  ] = useState<number | null>(null)

  const [
    paymentIntentId,
    setPaymentIntentId,
  ] = useState('')

  const [
    testPaymentUrl,
    setTestPaymentUrl,
  ] = useState('')

  const [
    paymentStatus,
    setPaymentStatus,
  ] = useState<PaymentUiStatus>(
    'idle'
  )

  const [
    isLocalhost,
    setIsLocalhost,
  ] = useState(false)

  const [
    paymentError,
    setPaymentError,
  ] = useState('')

  const [couponInput, setCouponInput] =
    useState('')

  const [appliedCoupon, setAppliedCoupon] =
    useState<AppliedCoupon | null>(null)

  const [couponError, setCouponError] =
    useState('')

  const [isApplyingCoupon, setIsApplyingCoupon] =
    useState(false)

  const [appliedCouponCartSignature, setAppliedCouponCartSignature] =
    useState('')

  const [
    mayaEnabled,
    setMayaEnabled,
  ] = useState(false)

  useEffect(() => {
    if (!user) return
    setFormData((current) => ({
      ...current,
      name: current.name || user.displayName || '',
      email: current.email || user.email || '',
    }))
  }, [user])

  useEffect(() => {
    const hostname =
      window.location.hostname

    setIsLocalhost(
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1'
    )
  }, [])

  const [
    isSending,
    setIsSending,
  ] = useState(false)

  const [
    isCheckingOut,
    setIsCheckingOut,
  ] = useState(false)

  const [
    sendError,
    setSendError,
  ] = useState('')

  const [
    orderSuccess,
    setOrderSuccess,
  ] = useState(false)
  const [guestReference, setGuestReference] = useState('')

  const isPayMongoTestMode =
    Boolean(
      process.env
        .NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY
        ?.startsWith(
          'pk_test_'
        )
    )

  const cartSignature = useMemo(
    () =>
      cart
        .map((item) =>
          [
            item.id,
            item.color,
            item.size || '',
            item.hand || '',
            item.quantity,
          ].join(':')
        )
        .join('|'),
    [cart]
  )

  const checkoutSubtotal =
    getCartTotal()

  const payableTotal =
    appliedCoupon?.totalAmount ??
    checkoutSubtotal

  useEffect(() => {
    if (
      appliedCoupon &&
      appliedCouponCartSignature &&
      appliedCouponCartSignature !== cartSignature
    ) {
      setAppliedCoupon(null)
      setAppliedCouponCartSignature('')
      setCouponError(
        'Your cart changed. Re-apply the coupon to recalculate the discount.'
      )
    }
  }, [
    appliedCoupon,
    appliedCouponCartSignature,
    cartSignature,
  ])

  /*
   * ============================
   * PAYMENT STATUS POLLING
   * ============================
   *
   * This makes localhost testing work without a public
   * webhook endpoint. It also gives the modal fast
   * feedback while the customer is paying.
   *
   * Production should still use a PayMongo webhook as
   * the final source of truth; we will add that next.
   */
  useEffect(() => {
    if (
      !isPaymentModalOpen ||
      !paymentIntentId ||
      !paymentReference ||
      paymentStatus === 'paid' ||
      paymentStatus === 'failed'
    ) {
      return
    }

    let cancelled = false

    const checkPaymentStatus =
      async () => {
        try {
          const idToken =
            user
              ? await user.getIdToken()
              : null

          const response =
            await fetch(
              '/api/paymongo/payment-status',
              {
                method: 'POST',
                headers: {
                  'Content-Type':
                    'application/json',
                  ...(idToken
                    ? {
                        Authorization:
                          `Bearer ${idToken}`,
                      }
                    : {}),
                },
                body:
                  JSON.stringify({
                    paymentIntentId,
                    reference:
                      paymentReference,
                  }),
              }
            )

          const result =
            (await response
              .json()
              .catch(
                () => null
              )) as
              | PayMongoPaymentStatusResponse
              | null

          if (
            cancelled
          ) {
            return
          }

          if (
            !response.ok
          ) {
            /*
             * Avoid replacing the QR with a transient polling
             * error. Keep the payment screen usable and log it.
             */
            console.warn(
              'Unable to refresh PayMongo status:',
              result?.error ||
                response.status
            )
            return
          }

          if (
            result?.paid === true ||
            result?.status ===
              'succeeded'
          ) {
            setPaymentStatus(
              'paid'
            )
            setPaymentError(
              ''
            )

            if (
              typeof result.totalAmount ===
              'number'
            ) {
              setPaymentTotal(
                result.totalAmount
              )
            }

            return
          }

          /*
           * PayMongo does not expose a terminal "failed"
           * Payment Intent status. A failed attempt normally
           * returns to awaiting_payment_method together with
           * last_payment_error. Our API converts that into
           * failed: true so the modal can show a proper
           * payment-failed screen.
           */
          if (
            result?.failed === true
          ) {
            setPaymentStatus(
              'failed'
            )
            setPaymentError(
              result.failureMessage ||
                'Your payment was not completed. Please try again.'
            )
            return
          }

          if (
            result?.status ===
              'processing'
          ) {
            setPaymentStatus(
              'processing'
            )
          } else {
            setPaymentStatus(
              'waiting'
            )
          }
        } catch (error) {
          if (!cancelled) {
            console.warn(
              'Payment polling failed:',
              error
            )
          }
        }
      }

    void checkPaymentStatus()

    const interval =
      window.setInterval(
        () => {
          void checkPaymentStatus()
        },
        2500
      )

    return () => {
      cancelled = true
      window.clearInterval(
        interval
      )
    }
  }, [
    isPaymentModalOpen,
    paymentIntentId,
    paymentReference,
    paymentStatus,
    user,
  ])

  /*
   * ============================
   * BUILD RECEIPT
   * ============================
   *
   * The receipt is generated only
   * when the customer confirms the
   * pre-order. It is not rendered
   * anywhere in the frontend UI.
   */
  const generateOrderReceipt =
    () => {
      const orderDate =
        new Date().toLocaleDateString(
          'en-PH',
          {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }
        )

      let message =
        `VERDE BY RENZO - PRE-ORDER\n\n`

      message +=
        `Order Date: ${orderDate}\n\n`

      message +=
        `CUSTOMER INFORMATION\n`

      message +=
        `${'='.repeat(
          40
        )}\n`

      message +=
        `Name: ${formData.name}\n`

      message +=
        `Email: ${formData.email}\n`

      message +=
        `Phone: ${formData.phone}\n`

      message +=
        `Address: ${formData.address}\n\n`

      message +=
        `ORDER DETAILS\n`

      message +=
        `${'='.repeat(
          40
        )}\n\n`

      let itemNumber =
        1

      cart.forEach(
        (item) => {
          const product =
            getProductById(
              item.id
            )

          if (!product) {
            return
          }

          const subtotal =
            product.price *
            item.quantity

          message +=
            `${itemNumber}. ${product.name}\n`

          message +=
            `   Color: ${getColorDisplay(
              item.color
            )}\n`

          if (item.size) {
            message +=
              `   Size: ${item.size}\n`
          }

          if (item.hand) {
            message +=
              `   Glove Hand: ${getGloveHandDisplay(
                item.hand
              )}\n`
          }

          message +=
            `   Quantity: ${item.quantity}\n`

          message +=
            `   Price: ₱${product.price.toLocaleString(
              'en-PH'
            )} each\n`

          message +=
            `   Subtotal: ₱${subtotal.toLocaleString(
              'en-PH'
            )}\n\n`

          itemNumber +=
            1
        }
      )

      message +=
        `${'='.repeat(
          40
        )}\n`

      message +=
        `Total Items: ${getCartCount()}\n`

      message +=
        `TOTAL AMOUNT: ₱${getCartTotal().toLocaleString(
          'en-PH'
        )}\n\n`

      message +=
        `This is a pre-order request. ` +
        `Payment details will be provided upon confirmation.`

      return message
    }

  /*
   * ============================
   * OPEN CONFIRMATION MODAL
   * ============================
   */
  const handleSubmit =
    (
      e: React.FormEvent
    ) => {
      e.preventDefault()

      if (
        cart.length === 0
      ) {
        return
      }

      setSendError('')
      setIsConfirmOpen(true)
    }

  /*
   * ============================
   * CONFIRM PRE-ORDER
   * ============================
   */
  const handleConfirmPreOrder =
    async () => {
      if (
        cart.length === 0 ||
        isSending
      ) {
        return
      }

      if (!WEB3FORMS_ACCESS_KEY) {
        setSendError(
          'Checkout is not configured.'
        )
        setIsConfirmOpen(false)
        return
      }

      setIsSending(true)
      setSendError('')

      try {
        const orderReceipt =
          generateOrderReceipt()

        const response =
          await fetch(
            WEB3FORMS_ENDPOINT,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',

                Accept:
                  'application/json',
              },

              body: JSON.stringify({
                access_key:
                  WEB3FORMS_ACCESS_KEY,

                subject:
                  `New Verde by Renzo Pre-Order - ${formData.name}`,

                from_name:
                  'Verde by Renzo Website',

                name:
                  formData.name,

                email:
                  formData.email,

                phone:
                  formData.phone,

                address:
                  formData.address,

                submission_type:
                  'Pre-Order Receipt',

                total_items:
                  getCartCount(),

                total_amount:
                  `₱${getCartTotal().toLocaleString(
                    'en-PH'
                  )}`,

                message:
                  orderReceipt,

                submitted_at:
                  new Date().toLocaleString(
                    'en-PH',
                    {
                      timeZone:
                        'Asia/Manila',
                    }
                  ),
              }),
            }
          )

        const result =
          (await response
            .json()
            .catch(() => null)) as
            | Web3FormsResponse
            | null

        if (
          !response.ok ||
          !result?.success
        ) {
          throw new Error(
            result?.message ||
              'Unable to send your pre-order.'
          )
        }

        if (user) {
          await addDoc(collection(firestore, 'users', user.uid, 'orders'), {
            customer: formData,
            items: cart,
            totalItems: getCartCount(),
            totalAmount: getCartTotal(),
            status: 'pre-order',
            createdAt: serverTimestamp(),
          })
        } else {
          const reference = `VBR-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
          await setDoc(doc(firestore, 'guestOrders', reference), {
            reference,
            customer: formData,
            items: cart,
            totalItems: getCartCount(),
            totalAmount: getCartTotal(),
            status: 'pre-order',
            createdAt: serverTimestamp(),
          })
          setGuestReference(reference)
        }

        /*
         * Close confirmation first,
         * then clear the cart after
         * successful submission.
         */
        setIsConfirmOpen(false)

        clearCart()

        setFormData({
          name: '',
          email: '',
          phone: '',
          address: '',
        })

        setOrderSuccess(true)
      } catch (error) {
        console.error(
          'Web3Forms checkout submission failed:',
          error
        )

        setSendError(
          error instanceof Error
            ? error.message
            : 'Unable to send right now. Please try again.'
        )

        setIsConfirmOpen(false)
      } finally {
        setIsSending(false)
      }
    }

  /*
   * ============================
   * APPLY COUPON
   * ============================
   * The UI asks the server to calculate the discount from
   * live Firestore prices. The PayMongo route validates the
   * coupon again before creating the actual Payment Intent.
   */
  const handleApplyCoupon = async () => {
    const code = couponInput
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '')

    if (!code) {
      setCouponError('Enter a coupon code.')
      return
    }

    if (cart.length === 0) {
      setCouponError('Your cart is empty.')
      return
    }

    if (!user) {
      setCouponError(
        'Sign in to use coupons. Each coupon can only be used once per account.'
      )
      return
    }

    setIsApplyingCoupon(true)
    setCouponError('')

    try {
      const idToken =
        await user.getIdToken()

      const response = await fetch(
        '/api/coupons/validate',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
            Authorization:
              `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            couponCode: code,
            cart: cart.map((item) => ({
              id: item.id,
              quantity: item.quantity,
            })),
          }),
        }
      )

      const result =
        (await response
          .json()
          .catch(() => null)) as
          | CouponValidationResponse
          | null

      if (
        !response.ok ||
        result?.valid !== true ||
        !result.code ||
        !result.type ||
        typeof result.value !== 'number' ||
        typeof result.discountAmount !== 'number' ||
        typeof result.totalAmount !== 'number'
      ) {
        throw new Error(
          result?.error ||
            'Unable to apply this coupon.'
        )
      }

      setAppliedCoupon({
        code: result.code,
        type: result.type,
        value: result.value,
        discountAmount:
          result.discountAmount,
        totalAmount:
          result.totalAmount,
      })
      setAppliedCouponCartSignature(
        cartSignature
      )
      setCouponInput(result.code)
      setCouponError('')
    } catch (error) {
      setAppliedCoupon(null)
      setAppliedCouponCartSignature('')
      setCouponError(
        error instanceof Error
          ? error.message
          : 'Unable to apply this coupon.'
      )
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setAppliedCouponCartSignature('')
    setCouponInput('')
    setCouponError('')
  }

  /*
   * ============================
   * OPEN PAYMENT MODAL
   * ============================
   */
  const handlePayMongoCheckout = () => {
    if (
      cart.length === 0 ||
      isCheckingOut ||
      isSending
    ) {
      return
    }

    if (
      checkoutFormRef.current &&
      !checkoutFormRef.current.reportValidity()
    ) {
      return
    }

    setSendError('')
    setPaymentError('')
    setQrCodeImage(null)
    setQrExpiresAt(null)
    setPaymentReference('')
    setPaymentTotal(null)
    setPaymentIntentId('')
    setTestPaymentUrl('')
    setPaymentStatus('idle')
    setIsPaymentModalOpen(true)
  }

  /*
   * ============================
   * PAY WITH QR PH
   * ============================
   */
  const handlePayWithQrPh = async () => {
    if (
      isCheckingOut ||
      cart.length === 0
    ) {
      return
    }

    const publicKey =
      process.env.NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY

    if (!publicKey) {
      setPaymentError(
        'PayMongo public key is not configured.'
      )
      return
    }

    setIsCheckingOut(true)
    setPaymentError('')
    setQrCodeImage(null)

    try {
      const idToken =
        user
          ? await user.getIdToken()
          : null

      const checkoutSubtotal =
        getCartTotal()

      const checkoutTotal =
        appliedCoupon?.totalAmount ??
        checkoutSubtotal

      /*
       * 1. Create the Payment Intent on our server.
       * The server recalculates the total using
       * Verde's product data.
       */
      const intentResponse =
        await fetch(
          '/api/paymongo/create-payment-intent',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
              ...(idToken
                ? {
                    Authorization:
                      `Bearer ${idToken}`,
                  }
                : {}),
            },
            body: JSON.stringify({
              customer: formData,
              cart: cart.map((item) => ({
                id: item.id,
                color: item.color,
                size: item.size || null,
                hand: item.hand || null,
                quantity: item.quantity,
              })),
              couponCode:
                appliedCoupon?.code ||
                null,
              expectedSubtotal:
                checkoutSubtotal,
              expectedTotal:
                checkoutTotal,
            }),
          }
        )

      const intent =
        (await intentResponse
          .json()
          .catch(() => null)) as
          | PayMongoPaymentIntentResponse
          | null

      if (
        !intentResponse.ok ||
        !intent?.paymentIntentId ||
        !intent?.clientKey
      ) {
        if (
          intent?.code?.startsWith('COUPON_') ||
          intent?.code === 'TOTAL_MISMATCH'
        ) {
          setAppliedCoupon(null)
          setAppliedCouponCartSignature('')
          setCouponError(
            intent?.error ||
              'Re-apply your coupon before paying.'
          )
        }

        throw new Error(
          intent?.error ||
            'Unable to initialize payment.'
        )
      }

      setPaymentIntentId(
        intent.paymentIntentId
      )

      if (
        typeof intent.totalAmount === 'number' &&
        Math.abs(
          intent.totalAmount - checkoutTotal
        ) > 0.009
      ) {
        throw new Error(
          'The payment total no longer matches your cart. Refresh the page and review the updated prices before generating a QR code.'
        )
      }

      setPaymentTotal(
        typeof intent.totalAmount === 'number'
          ? intent.totalAmount
          : checkoutTotal
      )

      setPaymentReference(
        intent.reference || ''
      )

      setMayaEnabled(
        Boolean(
          intent.paymentMethods?.includes(
            'paymaya'
          )
        )
      )

      const publicAuthorization =
        `Basic ${btoa(`${publicKey}:`)}`

      /*
       * 2. Create a QR Ph Payment Method
       * using the browser-safe PayMongo
       * public key.
       */
      const paymentMethodResponse =
        await fetch(
          'https://api.paymongo.com/v1/payment_methods',
          {
            method: 'POST',
            headers: {
              Authorization:
                publicAuthorization,
              'Content-Type':
                'application/json',
              Accept:
                'application/json',
            },
            body: JSON.stringify({
              data: {
                attributes: {
                  type: 'qrph',
                  expiry_seconds:
                    QR_PH_EXPIRY_SECONDS,

                  /*
                   * Pass the checkout customer to PayMongo as
                   * Payment Method billing information.
                   *
                   * This billing object is copied to the Payment
                   * resource created after the Payment Method is
                   * attached to the Payment Intent.
                   */
                  billing: {
                    name:
                      formData.name.trim(),
                    email:
                      formData.email.trim(),
                    phone:
                      formData.phone.trim(),
                    address: {
                      line1:
                        formData.address.trim(),
                      country:
                        'PH',
                    },
                  },
                },
              },
            }),
          }
        )

      const paymentMethod =
        (await paymentMethodResponse
          .json()
          .catch(() => null)) as
          | PayMongoPaymentMethodResponse
          | null

      const paymentMethodId =
        paymentMethod?.data?.id

      if (
        !paymentMethodResponse.ok ||
        !paymentMethodId
      ) {
        throw new Error(
          paymentMethod
            ?.errors?.[0]
            ?.detail ||
            'Unable to create QR Ph payment method.'
        )
      }

      /*
       * 3. Attach the QR Ph Payment Method
       * to the Payment Intent.
       */
      const attachResponse =
        await fetch(
          `https://api.paymongo.com/v1/payment_intents/${intent.paymentIntentId}/attach`,
          {
            method: 'POST',
            headers: {
              Authorization:
                publicAuthorization,
              'Content-Type':
                'application/json',
              Accept:
                'application/json',
            },
            body: JSON.stringify({
              data: {
                attributes: {
                  payment_method:
                    paymentMethodId,
                  client_key:
                    intent.clientKey,
                },
              },
            }),
          }
        )

      const attachedIntent =
        (await attachResponse
          .json()
          .catch(() => null)) as
          | PayMongoAttachResponse
          | null

      if (!attachResponse.ok) {
        throw new Error(
          attachedIntent
            ?.errors?.[0]
            ?.detail ||
            'Unable to generate QR Ph code.'
        )
      }

      const imageUrl =
        attachedIntent
          ?.data
          ?.attributes
          ?.next_action
          ?.code
          ?.image_url

      if (!imageUrl) {
        console.error(
          'PayMongo attach response:',
          attachedIntent
        )

        throw new Error(
          'PayMongo did not return a QR Ph image.'
        )
      }

      /*
       * PayMongo starts QR Ph expiry when the Payment Method
       * is attached. We set the same 30-minute window locally
       * immediately after a successful attach response.
       */
      setQrExpiresAt(
        Date.now() +
          QR_PH_EXPIRY_SECONDS * 1000
      )

      const discoveredTestUrl =
        findStringProperty(
          attachedIntent,
          'test_url'
        ) || ''

      setTestPaymentUrl(
        discoveredTestUrl
      )
      setPaymentStatus(
        'waiting'
      )
      setQrCodeImage(imageUrl)
    } catch (error) {
      console.error(
        'QR Ph checkout failed:',
        error
      )

      setPaymentError(
        error instanceof Error
          ? error.message
          : 'Unable to generate QR Ph payment.'
      )
    } finally {
      setIsCheckingOut(false)
    }
  }

  /*
   * ============================
   * SUCCESS SCREEN
   * ============================
   */
  if (orderSuccess) {
    return (
      <section className="min-h-screen bg-gray-50 pt-24 pb-12 sm:pt-28 sm:pb-16 lg:pt-32 lg:pb-20">
        <div className="container mx-auto max-w-3xl">
          <div className="rounded-lg bg-white p-8 text-center shadow-md sm:p-12">

            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check
                size={32}
                className="text-green-600"
              />
            </div>

            <h1 className="mb-3 font-serif text-3xl text-forest-700 sm:text-4xl">
              Pre-order Sent!
            </h1>

            <p className="mx-auto mb-6 max-w-lg text-gray-600">
              Thank you for your pre-order. We&apos;ve received your order details and will contact you with payment and confirmation information.
            </p>

            {guestReference && <div className="mx-auto mb-6 max-w-md rounded-xl border border-gold-200 bg-gold-50 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-gold-700">Guest order reference</p><p className="mt-1 break-all font-mono text-lg font-bold text-forest-800">{guestReference}</p><p className="mt-2 text-xs text-gray-600">Save this reference. You will need it to check your order status.</p><Link href={`/track-order?reference=${encodeURIComponent(guestReference)}`} className="mt-3 inline-block text-sm font-semibold text-forest-700 underline">Track this order</Link></div>}

            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-forest-600 px-6 py-3 font-semibold text-white shadow-md transition-all hover:bg-forest-700"
            >
              <ShoppingBag
                size={18}
              />
              Continue Shopping
            </Link>

          </div>
        </div>
      </section>
    )
  }

  /*
   * ============================
   * EMPTY CART SCREEN
   * ============================
   */
  if (
    cart.length === 0
  ) {
    return (
      <section className="min-h-screen bg-gray-50 pt-24 pb-12 sm:pt-28 sm:pb-16 lg:pt-32 lg:pb-20">
        <div className="container mx-auto max-w-3xl">
          <div className="rounded-lg bg-white p-8 text-center shadow-md sm:p-12">

            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-forest-50">
              <ShoppingBag
                size={32}
                className="text-forest-600"
              />
            </div>

            <h1 className="mb-3 font-serif text-3xl text-forest-700 sm:text-4xl">
              Your Cart Is Empty
            </h1>

            <p className="mx-auto mb-6 max-w-lg text-gray-600">
              Add your favorite Verde by Renzo pieces to your cart before proceeding to checkout.
            </p>

            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-forest-600 px-6 py-3 font-semibold text-white shadow-md transition-all hover:bg-forest-700"
            >
              <Package
                size={18}
              />
              Browse the Shop
            </Link>

          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="min-h-screen bg-gray-50 pt-24 pb-12 sm:pt-28 sm:pb-16 lg:pt-32 lg:pb-20">
        <div className="container mx-auto max-w-6xl">

          {/* HEADER */}

          <h1 className="mb-4 text-center font-serif text-3xl text-forest-700 sm:text-4xl lg:text-5xl">
            Checkout
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-center text-gray-600">
            Enter your delivery information, review your cart, then send a pre-order or pay securely with PayMongo.
          </p>

          <div className="grid gap-8 lg:grid-cols-2">

            {/* DELIVERY INFORMATION */}

            <div className="order-2 rounded-lg bg-white p-6 shadow-md sm:p-8">

              <h2 className="mb-6 font-serif text-2xl text-forest-700">
                Delivery Information
              </h2>

              <form
                ref={checkoutFormRef}
                onSubmit={
                  handleSubmit
                }
                className="space-y-5"
              >

                {/* NAME */}

                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Full Name *
                  </label>

                  <input
                    type="text"
                    id="name"
                    value={
                      formData.name
                    }
                    onChange={(
                      e
                    ) =>
                      setFormData({
                        ...formData,

                        name:
                          e.target.value,
                      })
                    }
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-forest-600"
                    placeholder="Juan Dela Cruz"
                  />
                </div>

                {/* EMAIL */}

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Email Address *
                  </label>

                  <input
                    type="email"
                    id="email"
                    value={
                      formData.email
                    }
                    onChange={(
                      e
                    ) =>
                      setFormData({
                        ...formData,

                        email:
                          e.target.value,
                      })
                    }
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-forest-600"
                    placeholder="juan@example.com"
                  />
                </div>

                {/* PHONE */}

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Phone Number *
                  </label>

                  <input
                    type="tel"
                    id="phone"
                    value={
                      formData.phone
                    }
                    onChange={(
                      e
                    ) =>
                      setFormData({
                        ...formData,

                        phone:
                          e.target.value,
                      })
                    }
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-forest-600"
                    placeholder="+63 912 345 6789"
                  />
                </div>

                {/* ADDRESS */}

                <div>
                  <label
                    htmlFor="address"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Delivery Address *
                  </label>

                  <textarea
                    id="address"
                    value={
                      formData.address
                    }
                    onChange={(
                      e
                    ) =>
                      setFormData({
                        ...formData,

                        address:
                          e.target.value,
                      })
                    }
                    required
                    rows={4}
                    className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-forest-600"
                    placeholder="Complete address with city and postal code"
                  />
                </div>

                {/* CHECKOUT ACTIONS */}

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="submit"
                    disabled={
                      isSending ||
                      isCheckingOut
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-forest-600 bg-white py-3 font-semibold text-forest-700 shadow-sm transition-all hover:bg-forest-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send
                      size={18}
                    />

                    Send Pre-order
                  </button>

                  <button
                    type="button"
                    onClick={
                      handlePayMongoCheckout
                    }
                    disabled={
                      isCheckingOut ||
                      isSending
                    }
                    className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 font-semibold text-white shadow-md transition-all ${
                      isCheckingOut
                        ? 'cursor-wait bg-forest-500'
                        : 'bg-forest-600 hover:bg-forest-700'
                    }`}
                  >
                    <CreditCard
                      size={18}
                    />

                    {isCheckingOut
                      ? 'Preparing...'
                      : 'Checkout Now'}
                  </button>
                </div>

                {sendError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {sendError}
                  </div>
                )}

              </form>
            </div>

            {/* ORDER SUMMARY */}

            <div className="order-1 rounded-lg bg-white p-6 shadow-md sm:p-8">

              <h2 className="mb-6 font-serif text-2xl text-forest-700">
                Order Summary
              </h2>

              <div className="mb-6 max-h-[500px] space-y-4 overflow-y-auto">

                {cart.map(
                  (item) => {
                    const product =
                      getProductById(
                        item.id
                      )

                    if (!product) {
                      return null
                    }

                    const productImage =
                      getProductImage(
                        product,
                        item.color
                      )

                    const subtotal =
                      product.price *
                      item.quantity

                    return (
                      <div
                        key={`${item.id}-${item.color}-${item.size || 'no-size'}-${item.hand || 'no-hand'}`}
                        className="flex gap-4 rounded-lg bg-gray-50 p-4"
                      >

                        <Link
                          href={`/shop/${product.id}?color=${item.color}`}
                          className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-gray-200"
                        >

                          {productImage ? (
                            <Image
                              key={
                                productImage
                              }
                              src={
                                productImage
                              }
                              alt={`${product.name} - ${getColorDisplay(
                                item.color
                              )}`}
                              fill
                              className="object-cover object-center"
                              sizes="64px"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center px-1 text-center text-xs text-gray-400">
                              No Image
                            </div>
                          )}

                        </Link>

                        <div className="min-w-0 flex-1">

                          <Link
                            href={`/shop/${product.id}?color=${item.color}`}
                          >
                            <h3 className="mb-1 text-sm font-semibold text-gray-900 transition-colors hover:text-forest-600">
                              {product.name}
                            </h3>
                          </Link>

                          <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">

                            <span
                              className={`h-3.5 w-3.5 rounded-full border border-gray-300 ${getColorClass(
                                item.color
                              )}`}
                            />

                            <span>
                              {getColorDisplay(
                                item.color
                              )}
                            </span>

                            {item.size && (
                              <>
                                <span>
                                  •
                                </span>

                                <span>
                                  Size:{' '}
                                  {item.size}
                                </span>
                              </>
                            )}

                            {item.hand && (
                              <>
                                <span>
                                  •
                                </span>

                                <span>
                                  {getGloveHandDisplay(
                                    item.hand
                                  )}
                                </span>
                              </>
                            )}

                            <span>
                              •
                            </span>

                            <span>
                              Qty:{' '}
                              {item.quantity}
                            </span>

                          </div>

                          <p className="text-sm font-semibold text-forest-600">
                            ₱
                            {subtotal.toLocaleString(
                              'en-PH'
                            )}
                          </p>

                        </div>

                      </div>
                    )
                  }
                )}

              </div>

              {/* COUPON */}

              <div className="border-t border-gray-200 pt-4">
                <div className="rounded-xl border border-[#e8ddc8] bg-[#fffdf8] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-forest-900">
                        Coupon code
                      </p>
                      <p className="text-xs text-gray-500">
                        Applied securely before PayMongo payment.
                      </p>
                    </div>

                    {appliedCoupon && (
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-xs font-semibold text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      value={couponInput}
                      onChange={(event) => {
                        setCouponInput(
                          event.target.value.toUpperCase()
                        )
                        if (couponError) {
                          setCouponError('')
                        }
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          if (!appliedCoupon) {
                            void handleApplyCoupon()
                          }
                        }
                      }}
                      disabled={
                        isApplyingCoupon ||
                        Boolean(appliedCoupon)
                      }
                      placeholder="VERDE10"
                      autoCapitalize="characters"
                      className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold uppercase tracking-[.08em] outline-none transition focus:border-forest-500 focus:ring-2 focus:ring-forest-100 disabled:bg-gray-50"
                    />

                    <button
                      type="button"
                      onClick={() => void handleApplyCoupon()}
                      disabled={
                        isApplyingCoupon ||
                        Boolean(appliedCoupon) ||
                        !couponInput.trim()
                      }
                      className="rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isApplyingCoupon
                        ? 'Checking...'
                        : appliedCoupon
                          ? 'Applied'
                          : 'Apply'}
                    </button>
                  </div>

                  {appliedCoupon && (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-forest-100 bg-forest-50 px-3 py-2.5">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[.12em] text-forest-700">
                          {appliedCoupon.code} applied
                        </p>
                        <p className="mt-0.5 text-xs text-gray-600">
                          {appliedCoupon.type === 'percentage'
                            ? `${appliedCoupon.value}% discount`
                            : `₱${appliedCoupon.value.toLocaleString('en-PH')} discount`}
                        </p>
                      </div>
                      <span className="whitespace-nowrap text-sm font-bold text-forest-800">
                        -₱
                        {appliedCoupon.discountAmount.toLocaleString(
                          'en-PH',
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </span>
                    </div>
                  )}

                  {couponError && (
                    <p className="mt-2 text-xs font-medium text-red-600">
                      {couponError}
                    </p>
                  )}
                </div>
              </div>

              {/* TOTALS */}

              <div className="space-y-3 border-t border-gray-200 pt-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Total Items:</span>
                  <span className="font-semibold">
                    {getCartCount()}
                  </span>
                </div>

                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold">
                    ₱
                    {checkoutSubtotal.toLocaleString(
                      'en-PH',
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-forest-700">
                    <span>
                      Coupon {appliedCoupon.code}:
                    </span>
                    <span className="font-semibold">
                      -₱
                      {appliedCoupon.discountAmount.toLocaleString(
                        'en-PH',
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </span>
                  </div>
                )}

                <div className="flex justify-between border-t border-gray-100 pt-3 text-lg font-bold text-forest-700">
                  <span>
                    Total Amount:
                  </span>
                  <span>
                    ₱
                    {payableTotal.toLocaleString(
                      'en-PH',
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </span>
                </div>
              </div>

              <div className="mt-6 rounded-lg border border-gold-200 bg-gold-50 p-4">

                <p className="text-sm text-gray-700">
                  Choose Send Pre-order to reserve your items without paying now, or Checkout Now to pay securely through PayMongo.
                </p>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ============================ */}
      {/* CONFIRMATION MODAL */}
      {/* ============================ */}

      {isConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-preorder-title"
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl sm:p-7"
          >

            <div className="mb-5 flex items-start justify-between gap-4">

              <div>
                <h2
                  id="confirm-preorder-title"
                  className="font-serif text-2xl text-forest-700"
                >
                  Confirm Pre-order
                </h2>

                <p className="mt-2 text-sm text-gray-600">
                  Please confirm that you want to submit this pre-order.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  () =>
                    setIsConfirmOpen(
                      false
                    )
                }
                disabled={
                  isSending
                }
                aria-label="Close confirmation"
                className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed"
              >
                <X
                  size={22}
                />
              </button>

            </div>

            <div className="mb-6 space-y-3 rounded-lg bg-gray-50 p-4">

              <div className="flex justify-between text-sm text-gray-600">
                <span>
                  Total Items
                </span>

                <span className="font-semibold text-gray-900">
                  {getCartCount()}
                </span>
              </div>

              <div className="flex justify-between text-base font-bold text-forest-700">
                <span>
                  Total Amount
                </span>

                <span>
                  ₱
                  {getCartTotal().toLocaleString(
                    'en-PH'
                  )}
                </span>
              </div>

            </div>

            <p className="mb-6 text-sm leading-relaxed text-gray-600">
              By confirming, your pre-order and delivery details will be sent to Verde by Renzo. Your cart will be cleared after a successful submission.
            </p>

            <div className="grid grid-cols-2 gap-3">

              <button
                type="button"
                onClick={
                  () =>
                    setIsConfirmOpen(
                      false
                    )
                }
                disabled={
                  isSending
                }
                className="rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleConfirmPreOrder
                }
                disabled={
                  isSending
                }
                className="flex items-center justify-center gap-2 rounded-lg bg-forest-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-forest-700 disabled:cursor-wait disabled:bg-forest-500"
              >
                {isSending ? (
                  'Sending...'
                ) : (
                  <>
                    <Check
                      size={18}
                    />
                    Confirm
                  </>
                )}
              </button>

            </div>

          </div>

        </div>
      )}

      <VerdePaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          if (
            isCheckingOut ||
            paymentStatus === 'paid'
          ) {
            return
          }

          setIsPaymentModalOpen(false)
          setQrCodeImage(null)
          setQrExpiresAt(null)
          setPaymentReference('')
          setPaymentTotal(null)
          setPaymentIntentId('')
          setTestPaymentUrl('')
          setPaymentStatus('idle')
          setPaymentError('')
        }}
        cart={cart}
        totalAmount={
          paymentTotal ?? payableTotal
        }
        isProcessing={isCheckingOut}
        mayaEnabled={mayaEnabled}
        qrCodeImage={qrCodeImage}
        qrExpiresAt={qrExpiresAt}
        orderReference={paymentReference}
        paymentError={paymentError}
        paymentStatus={paymentStatus}
        isLocalTest={
          isLocalhost &&
          isPayMongoTestMode
        }
        testPaymentUrl={
          isLocalhost &&
          isPayMongoTestMode
            ? testPaymentUrl
            : ''
        }
        onPayWithQrPh={handlePayWithQrPh}
        onPayWithMaya={() => {
          console.log('Maya payment coming next')
        }}
        onBackToPaymentMethods={() => {
          setQrCodeImage(null)
          setQrExpiresAt(null)
          setPaymentReference('')
          setPaymentTotal(null)
          setPaymentIntentId('')
          setTestPaymentUrl('')
          setPaymentStatus('idle')
          setPaymentError('')
        }}
        onPaymentDone={() => {
          clearCart()
          setIsPaymentModalOpen(false)
          setQrCodeImage(null)
          setQrExpiresAt(null)
          setPaymentReference('')
          setPaymentTotal(null)
          setPaymentIntentId('')
          setTestPaymentUrl('')
          setPaymentStatus('idle')
          setPaymentError('')
          setAppliedCoupon(null)
          setAppliedCouponCartSignature('')
          setCouponInput('')
          setCouponError('')

          setFormData({
            name: '',
            email: '',
            phone: '',
            address: '',
          })
        }}
      />
    </>
  )
}
