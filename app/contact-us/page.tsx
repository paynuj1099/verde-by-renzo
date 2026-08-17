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
  Check,
  Copy,
  FileText,
  Mail,
  MessageSquare,
  Package,
  Send,
  Trash2,
  User,
} from 'lucide-react'

const WEB3FORMS_ENDPOINT =
  'https://api.web3forms.com/submit'

const WEB3FORMS_ACCESS_KEY =
  process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY

type Web3FormsResponse = {
  success?: boolean
  message?: string
}

export default function ContactPage() {
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
    message: '',
  })

  const [
    copied,
    setCopied,
  ] = useState(false)

  const [
    orderGenerated,
    setOrderGenerated,
  ] = useState(false)

  const [
    messageSent,
    setMessageSent,
  ] = useState(false)

  const [
    orderSent,
    setOrderSent,
  ] = useState(false)

  const [
    isSending,
    setIsSending,
  ] = useState(false)

  const [
    sendError,
    setSendError,
  ] = useState('')

  /*
   * ============================
   * RESET GENERATED ORDER
   * ============================
   */
  useEffect(() => {
    if (
      cart.length === 0 &&
      orderGenerated
    ) {
      setOrderGenerated(false)
      setOrderSent(false)
      setSendError('')

      setFormData(
        (prev) => ({
          ...prev,
          message: '',
        })
      )
    }
  }, [
    cart.length,
    orderGenerated,
  ])

  /*
   * ============================
   * GENERATE ORDER MESSAGE
   * ============================
   *
   * Product name and price now
   * come directly from products.ts.
   */
  const generateOrderMessage =
    () => {
      if (
        cart.length === 0
      ) {
        return ''
      }

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
        `Customer Information:\n`

      message += `Name: ${
        formData.name ||
        '[Not provided]'
      }\n`

      message += `Email: ${
        formData.email ||
        '[Not provided]'
      }\n`

      message += `Phone: ${
        formData.phone ||
        '[Not provided]'
      }\n`

      message += `Address: ${
        formData.address ||
        '[Not provided]'
      }\n\n`

      message +=
        `ORDER DETAILS:\n`

      message +=
        `${'='.repeat(
          40
        )}\n\n`

      /*
       * Keep a separate visible
       * number so invalid/deleted
       * products don't break
       * numbering.
       */
      let orderItemNumber = 1

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
            `${orderItemNumber}. ${product.name}\n`

          message +=
            `   Color: ${getColorDisplay(
              item.color
            )}\n`

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

          orderItemNumber += 1
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
   * COPY ORDER
   * ============================
   */
  const handleCopyOrder =
    async () => {
      if (
        cart.length === 0
      ) {
        return
      }

      const orderMessage =
        formData.message ||
        generateOrderMessage()

      try {
        await navigator.clipboard.writeText(
          orderMessage
        )

        setCopied(true)

        setTimeout(
          () => {
            setCopied(false)
          },
          2000
        )
      } catch (
        error
      ) {
        console.error(
          'Unable to copy order:',
          error
        )
      }
    }

  /*
   * ============================
   * SEND DIRECTLY TO WEB3FORMS
   * ============================
   *
   * This follows the same approach
   * as the working project:
   *
   * Browser -> Web3Forms
   *
   * IMPORTANT:
   * NEXT_PUBLIC_ environment
   * variables are available in the
   * browser bundle.
   */
  const sendToWeb3Forms =
    async ({
      subject,
      message,
      submissionType,
    }: {
      subject: string
      message: string
      submissionType:
        | 'Contact Inquiry'
        | 'Pre-Order Receipt'
    }) => {
      setIsSending(true)
      setSendError('')

      if (!WEB3FORMS_ACCESS_KEY) {
        setSendError(
          'Web3Forms is not configured. Please add NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY to your environment variables.'
        )
        setIsSending(false)
        return false
      }

      try {
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

                subject,

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
                  submissionType,

                total_items:
                  cart.length > 0
                    ? getCartCount()
                    : undefined,

                total_amount:
                  cart.length > 0
                    ? `₱${getCartTotal().toLocaleString(
                        'en-PH'
                      )}`
                    : undefined,

                message,

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
              'Unable to send your message.'
          )
        }

        return true
      } catch (error) {
        console.error(
          'Web3Forms submission failed:',
          error
        )

        setSendError(
          error instanceof Error
            ? error.message
            : 'Unable to send right now. Please try again.'
        )

        return false
      } finally {
        setIsSending(false)
      }
    }

  /*
   * ============================
   * GENERATE ORDER / MESSAGE
   * ============================
   */
  const handleGenerateOrder =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault()

      /*
       * Checkout mode
       */
      if (
        cart.length > 0
      ) {
        if (!orderGenerated) {
          const orderMessage =
            generateOrderMessage()

          setFormData(
            (prev) => ({
              ...prev,
              message:
                orderMessage,
            })
          )

          setOrderGenerated(
            true
          )
          setOrderSent(false)
          setSendError('')

          return
        }

        const orderMessage =
          formData.message ||
          generateOrderMessage()

        const sent =
          await sendToWeb3Forms({
            subject:
              `New Verde by Renzo Pre-Order - ${formData.name}`,
            message:
              orderMessage,
            submissionType:
              'Pre-Order Receipt',
          })

        if (sent) {
          setOrderSent(true)
        }

        return
      }

      /*
       * Normal contact mode
       */
      const sent =
        await sendToWeb3Forms({
          subject:
            `New Verde by Renzo Inquiry - ${formData.name}`,
          message:
            formData.message,
          submissionType:
            'Contact Inquiry',
        })

      if (!sent) {
        return
      }

      setMessageSent(
        true
      )

      setTimeout(
        () => {
          setMessageSent(
            false
          )

          setFormData({
            name: '',
            email: '',
            phone: '',
            address: '',
            message: '',
          })
        },
        3000
      )
    }

  /*
   * ============================
   * CLEAR CART + RESET
   * ============================
   */
  const handleClearAndReset =
    () => {
      clearCart()

      setOrderGenerated(
        false
      )

      setOrderSent(
        false
      )

      setSendError('')

      setCopied(
        false
      )

      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        message: '',
      })
    }

  return (
    <section className="min-h-screen bg-gray-50 pt-24 pb-12 sm:pt-28 sm:pb-16 lg:pt-32 lg:pb-20">

      <div className="container mx-auto max-w-6xl">

        {/* ======================= */}
        {/* HEADER */}
        {/* ======================= */}

        <h1 className="mb-4 text-center font-serif text-3xl text-forest-700 sm:text-4xl lg:text-5xl">

          {cart.length > 0
            ? 'Checkout & Contact'
            : 'Contact Us'}

        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-center text-gray-600">

          {cart.length > 0
            ? 'Complete your pre-order by filling out the form below. Your order details will be generated in the message field.'
            : "Have questions or need assistance? Send us a message and we'll get back to you as soon as possible."}

        </p>

        <div className="grid gap-8 lg:grid-cols-2">

          {/* ======================= */}
          {/* LEFT COLUMN */}
          {/* ======================= */}

          <div className="rounded-lg bg-white p-6 shadow-md sm:p-8">

            <h2 className="mb-6 font-serif text-2xl text-forest-700">
              Your Information
            </h2>

            <form
              onSubmit={
                handleGenerateOrder
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
                  rows={3}
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-forest-600"
                  placeholder="Complete address with city and postal code"
                />

              </div>

              {/* ======================= */}
              {/* MESSAGE */}
              {/* ======================= */}

              <div>

                <label
                  htmlFor="message"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >

                  {cart.length > 0
                    ? 'Order Details / Message'
                    : 'Message'}

                  {orderGenerated &&
                    cart.length >
                      0 && (

                    <span className="ml-1 text-forest-600">
                      {orderSent
                        ? '(Order Sent)'
                        : '(Order Generated)'}
                    </span>

                  )}

                </label>

                <textarea
                  id="message"
                  value={
                    formData.message
                  }
                  onChange={(
                    e
                  ) =>
                    setFormData({
                      ...formData,

                      message:
                        e.target.value,
                    })
                  }
                  rows={12}
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 font-mono text-xs focus:border-transparent focus:outline-none focus:ring-2 focus:ring-forest-600"
                  placeholder={
                    cart.length > 0
                      ? "Click 'Generate Order Summary' to populate this field with your complete order details..."
                      : 'Type your message or inquiry here...'
                  }
                  readOnly={
                    orderGenerated &&
                    cart.length >
                      0
                  }
                />

                {orderGenerated &&
                  cart.length >
                    0 && (

                  <p className="mt-2 flex items-center gap-1 text-xs text-gray-600">

                    <Check
                      size={14}
                      className="text-green-600"
                    />

                    {orderSent
                      ? 'Order receipt sent successfully. We will review your pre-order shortly.'
                      : 'Order summary generated. Click Send Order Receipt below to submit your pre-order.'}

                  </p>

                )}

              </div>

              {/* ======================= */}
              {/* SUBMIT */}
              {/* ======================= */}

              {cart.length > 0 ? (

                <button
                  type="submit"
                  disabled={
                    isSending ||
                    orderSent
                  }
                  className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 font-semibold text-white shadow-md transition-all ${
                    orderSent
                      ? 'cursor-not-allowed bg-green-600'
                      : isSending
                        ? 'cursor-wait bg-forest-500'
                        : 'bg-forest-600 hover:bg-forest-700'
                  }`}
                >
                  {orderSent ? (

                    <>

                      <Check
                        size={18}
                      />

                      Order Receipt Sent!

                    </>

                  ) : orderGenerated ? (

                    <>

                      <Send
                        size={18}
                      />

                      {isSending
                        ? 'Sending Receipt...'
                        : 'Send Order Receipt'}

                    </>

                  ) : (

                    <>

                      <FileText
                        size={18}
                      />

                      Generate Order Summary

                    </>

                  )}
                </button>

              ) : (

                <button
                  type="submit"
                  disabled={
                    messageSent ||
                    isSending
                  }
                  className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 font-semibold shadow-md transition-all ${
                    messageSent
                      ? 'cursor-not-allowed bg-green-600 text-white'
                      : isSending
                        ? 'cursor-wait bg-forest-500 text-white'
                        : 'bg-forest-600 text-white hover:bg-forest-700'
                  }`}
                >

                  {messageSent ? (

                    <>

                      <Check
                        size={18}
                      />

                      Message Sent!

                    </>

                  ) : (

                    <>

                      <MessageSquare
                        size={18}
                      />

                      {isSending
                        ? 'Sending...'
                        : 'Send Message'}

                    </>

                  )}

                </button>

              )}

              {sendError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {sendError}
                </div>
              )}

            </form>

          </div>

          {/* ======================= */}
          {/* RIGHT COLUMN */}
          {/* ======================= */}

          <div className="rounded-lg bg-white p-6 shadow-md sm:p-8">

            <h2 className="mb-6 font-serif text-2xl text-forest-700">

              {cart.length > 0
                ? 'Order Summary'
                : 'Get in Touch'}

            </h2>

            {cart.length ===
            0 ? (

              /* ======================= */
              /* NORMAL CONTACT MODE */
              /* ======================= */

              <div className="space-y-6">

                {messageSent ? (

                  <div className="flex flex-col items-center justify-center py-12 text-center">

                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">

                      <Check
                        size={32}
                        className="text-green-600"
                      />

                    </div>

                    <h3 className="mb-2 text-xl font-semibold text-gray-900">
                      Message Sent!
                    </h3>

                    <p className="text-gray-600">
                      Thank you for contacting us. We'll get back to you soon.
                    </p>

                  </div>

                ) : (

                  <>

                    <div className="space-y-4">

                      {/* EMAIL */}

                      <div className="flex items-start gap-3 rounded-lg bg-forest-50 p-4">

                        <Mail
                          size={24}
                          className="mt-0.5 flex-shrink-0 text-forest-600"
                        />

                        <div>

                          <h3 className="mb-1 font-semibold text-gray-900">
                            Email Us
                          </h3>

                          <p className="text-sm text-gray-600">
                            contact@verdebyrenzo.com
                          </p>

                        </div>

                      </div>

                      {/* CHAT */}

                      <div className="flex items-start gap-3 rounded-lg bg-forest-50 p-4">

                        <MessageSquare
                          size={24}
                          className="mt-0.5 flex-shrink-0 text-forest-600"
                        />

                        <div>

                          <h3 className="mb-1 font-semibold text-gray-900">
                            Live Chat
                          </h3>

                          <p className="text-sm text-gray-600">
                            Available Mon-Sat, 9AM-6PM
                          </p>

                        </div>

                      </div>

                      {/* SHOP */}

                      <div className="flex items-start gap-3 rounded-lg bg-forest-50 p-4">

                        <Package
                          size={24}
                          className="mt-0.5 flex-shrink-0 text-forest-600"
                        />

                        <div>

                          <h3 className="mb-1 font-semibold text-gray-900">
                            Visit Our Shop
                          </h3>

                          <p className="text-sm text-gray-600">
                            Browse our collection of premium golf apparel and accessories
                          </p>

                          <Link
                            href="/shop"
                            className="mt-1 inline-block text-sm font-medium text-forest-600 hover:text-forest-700"
                          >
                            Shop Now →
                          </Link>

                        </div>

                      </div>

                    </div>

                    {/* QUICK RESPONSE */}

                    <div className="rounded-lg border border-gold-200 bg-gold-50 p-4">

                      <h3 className="mb-2 flex items-center gap-2 font-semibold text-gray-900">

                        <Send
                          size={18}
                          className="text-gold-600"
                        />

                        Quick Response

                      </h3>

                      <p className="text-sm text-gray-700">

                        Fill out the form and click{' '}

                        <strong>
                          "Send Message"
                        </strong>{' '}

                        to reach us directly. We typically respond within 24 hours.

                      </p>

                    </div>

                  </>

                )}

              </div>

            ) : (

              /* ======================= */
              /* CHECKOUT MODE */
              /* ======================= */

              <>

                {/* ======================= */}
                {/* CART ITEMS */}
                {/* ======================= */}

                <div className="mb-6 max-h-[400px] space-y-4 overflow-y-auto">

                  {cart.map(
                    (item) => {
                      /*
                       * Product comes directly
                       * from products.ts.
                       */
                      const product =
                        getProductById(
                          item.id
                        )

                      /*
                       * Product may have been
                       * removed from products.ts
                       * while an old cart remains.
                       */
                      if (!product) {
                        return null
                      }

                      /*
                       * Exact color image comes
                       * from:
                       *
                       * product.images[item.color]
                       *
                       * with automatic fallback.
                       */
                      const productImage =
                        getProductImage(
                          product,
                          item.color
                        )

                      /*
                       * Price comes directly
                       * from products.ts.
                       */
                      const subtotal =
                        product.price *
                        item.quantity

                      return (
                        <div
                          key={`${item.id}-${item.color}`}
                          className="flex gap-4 rounded-lg bg-gray-50 p-4"
                        >

                          {/* ======================= */}
                          {/* PRODUCT IMAGE */}
                          {/* ======================= */}

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

                          {/* ======================= */}
                          {/* PRODUCT INFO */}
                          {/* ======================= */}

                          <div className="min-w-0 flex-1">

                            <Link
                              href={`/shop/${product.id}?color=${item.color}`}
                            >

                              <h3 className="mb-1 text-sm font-semibold text-gray-900 transition-colors hover:text-forest-600">

                                {
                                  product.name
                                }

                              </h3>

                            </Link>

                            {/* COLOR + QUANTITY */}

                            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">

                              <span
                                className={`h-3.5 w-3.5 rounded-full border border-gray-300 ${getColorClass(
                                  item.color
                                )}`}
                              />

                              <span>

                                {
                                  getColorDisplay(
                                    item.color
                                  )
                                }

                              </span>

                              <span>
                                •
                              </span>

                              <span>

                                Qty:{' '}

                                {
                                  item.quantity
                                }

                              </span>

                            </div>

                            {/* SUBTOTAL */}

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

                {/* ======================= */}
                {/* TOTALS */}
                {/* ======================= */}

                <div className="mb-6 space-y-3 border-t border-gray-200 pt-4">

                  <div className="flex justify-between text-sm text-gray-600">

                    <span>
                      Total Items:
                    </span>

                    <span className="font-semibold">

                      {
                        getCartCount()
                      }

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

                {/* ======================= */}
                {/* ACTIONS */}
                {/* ======================= */}

                {orderGenerated ? (

                  <div className="space-y-3">

                    <button
                      type="button"
                      onClick={
                        handleCopyOrder
                      }
                      className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 font-semibold shadow-md transition-all ${
                        copied
                          ? 'bg-green-600 text-white'
                          : 'bg-forest-600 text-white hover:bg-forest-700'
                      }`}
                    >

                      {copied ? (

                        <>

                          <Check
                            size={18}
                          />

                          Copied to Clipboard!

                        </>

                      ) : (

                        <>

                          <Copy
                            size={18}
                          />

                          Copy Order Details

                        </>

                      )}

                    </button>

                    <p className="flex items-center justify-center gap-2 px-4 text-center text-xs text-gray-600">

                      <MessageSquare
                        size={14}
                      />

                      {orderSent
                        ? 'Receipt sent successfully. You can still copy the order details for your records.'
                        : 'Use the Send Order Receipt button on the form to submit this order directly to us.'}

                    </p>

                    <button
                      type="button"
                      onClick={
                        handleClearAndReset
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-red-500 py-2.5 font-semibold text-red-500 transition-all hover:bg-red-50"
                    >

                      <Trash2
                        size={18}
                      />

                      Clear Cart & Reset

                    </button>

                  </div>

                ) : (

                  <div className="flex items-start gap-3 rounded-lg border border-gold-200 bg-gold-50 p-4">

                    <FileText
                      size={20}
                      className="mt-0.5 flex-shrink-0 text-gold-600"
                    />

                    <p className="text-sm text-gray-700">

                      Fill out the form and click{' '}

                      <strong>
                        "Generate Order Summary"
                      </strong>{' '}

                      to create your pre-order message in the Message field.

                    </p>

                  </div>

                )}

              </>

            )}

          </div>

        </div>

        {/* ======================= */}
        {/* ADDITIONAL INFORMATION */}
        {/* ======================= */}

        <div className="mt-12 rounded-lg bg-white p-6 shadow-md sm:p-8">

          <h3 className="mb-4 text-center font-serif text-xl text-forest-700">
            How to Complete Your Pre-Order
          </h3>

          <div className="grid gap-6 text-center sm:grid-cols-3">

            {/* STEP 1 */}

            <div>

              <div className="mb-3 flex justify-center">

                <User
                  size={40}
                  className="text-forest-600"
                  strokeWidth={
                    1.5
                  }
                />

              </div>

              <h4 className="mb-2 font-semibold text-forest-600">
                1. Fill Form
              </h4>

              <p className="text-sm text-gray-600">
                Enter your details and generate order summary
              </p>

            </div>

            {/* STEP 2 */}

            <div>

              <div className="mb-3 flex justify-center">

                <Package
                  size={40}
                  className="text-forest-600"
                  strokeWidth={
                    1.5
                  }
                />

              </div>

              <h4 className="mb-2 font-semibold text-forest-600">
                2. Review Order
              </h4>

              <p className="text-sm text-gray-600">
                Check your complete order information in the message field
              </p>

            </div>

            {/* STEP 3 */}

            <div>

              <div className="mb-3 flex justify-center">

                <MessageSquare
                  size={40}
                  className="text-forest-600"
                  strokeWidth={
                    1.5
                  }
                />

              </div>

              <h4 className="mb-2 font-semibold text-forest-600">
                3. Send Receipt
              </h4>

              <p className="text-sm text-gray-600">
                Send the completed pre-order directly to our team
              </p>

            </div>

          </div>

        </div>

      </div>

    </section>
  )
}