'use client'

import {
  useEffect,
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
  Package,
  Send,
  ShoppingBag,
  X,
} from 'lucide-react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { firestore } from '@/lib/firebase'

const WEB3FORMS_ENDPOINT =
  'https://api.web3forms.com/submit'

const WEB3FORMS_ACCESS_KEY =
  process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY

type Web3FormsResponse = {
  success?: boolean
  message?: string
}

export default function CheckoutPage() {
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

  useEffect(() => {
    if (!user) return
    setFormData((current) => ({
      ...current,
      name: current.name || user.displayName || '',
      email: current.email || user.email || '',
    }))
  }, [user])

  const [
    isSending,
    setIsSending,
  ] = useState(false)

  const [
    sendError,
    setSendError,
  ] = useState('')

  const [
    orderSuccess,
    setOrderSuccess,
  ] = useState(false)

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
            Enter your delivery information, review your cart, and send your pre-order.
          </p>

          <div className="grid gap-8 lg:grid-cols-2">

            {/* DELIVERY INFORMATION */}

            <div className="order-2 rounded-lg bg-white p-6 shadow-md sm:p-8">

              <h2 className="mb-6 font-serif text-2xl text-forest-700">
                Delivery Information
              </h2>

              <form
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

                {/* SEND PRE-ORDER */}

                <button
                  type="submit"
                  disabled={
                    isSending
                  }
                  className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 font-semibold text-white shadow-md transition-all ${
                    isSending
                      ? 'cursor-wait bg-forest-500'
                      : 'bg-forest-600 hover:bg-forest-700'
                  }`}
                >
                  <Send
                    size={18}
                  />

                  {isSending
                    ? 'Sending...'
                    : 'Send Pre-order'}
                </button>

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

              {/* TOTALS */}

              <div className="space-y-3 border-t border-gray-200 pt-4">

                <div className="flex justify-between text-sm text-gray-600">
                  <span>
                    Total Items:
                  </span>

                  <span className="font-semibold">
                    {getCartCount()}
                  </span>
                </div>

                <div className="flex justify-between text-lg font-bold text-forest-700">
                  <span>
                    Total Amount:
                  </span>

                  <span>
                    ₱
                    {getCartTotal().toLocaleString(
                      'en-PH'
                    )}
                  </span>
                </div>

              </div>

              <div className="mt-6 rounded-lg border border-gold-200 bg-gold-50 p-4">

                <p className="text-sm text-gray-700">
                  This is a pre-order. After submission, we&apos;ll contact you with confirmation and payment instructions.
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
    </>
  )
}
