'use client'

import {
  useState,
} from 'react'

import Link from 'next/link'

import {
  Check,
  Mail,
  MessageSquare,
  Package,
  Send,
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
  const [
    formData,
    setFormData,
  ] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  })

  const [
    messageSent,
    setMessageSent,
  ] = useState(false)

  const [
    isSending,
    setIsSending,
  ] = useState(false)

  const [
    sendError,
    setSendError,
  ] = useState('')

  const handleSubmit =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault()

      setIsSending(true)
      setSendError('')

      if (!WEB3FORMS_ACCESS_KEY) {
        setSendError(
          'Contact form is not configured.'
        )
        setIsSending(false)
        return
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

                subject:
                  `New Verde by Renzo Inquiry - ${formData.name}`,

                from_name:
                  'Verde by Renzo Website',

                name:
                  formData.name,

                email:
                  formData.email,

                phone:
                  formData.phone,

                submission_type:
                  'Contact Inquiry',

                message:
                  formData.message,

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

        setMessageSent(true)

        setFormData({
          name: '',
          email: '',
          phone: '',
          message: '',
        })

        setTimeout(
          () => {
            setMessageSent(false)
          },
          4000
        )
      } catch (error) {
        console.error(
          'Web3Forms contact submission failed:',
          error
        )

        setSendError(
          error instanceof Error
            ? error.message
            : 'Unable to send right now. Please try again.'
        )
      } finally {
        setIsSending(false)
      }
    }

  return (
    <section className="min-h-screen bg-gray-50 pt-24 pb-12 sm:pt-28 sm:pb-16 lg:pt-32 lg:pb-20">
      <div className="container mx-auto max-w-6xl">

        {/* HEADER */}

        <h1 className="mb-4 text-center font-serif text-3xl text-forest-700 sm:text-4xl lg:text-5xl">
          Contact Us
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-center text-gray-600">
          Have questions about our products, orders, or anything Verde by Renzo?
          Send us a message and we&apos;ll get back to you as soon as possible.
        </p>

        <div className="grid gap-8 lg:grid-cols-2">

          {/* CONTACT FORM */}

          <div className="rounded-lg bg-white p-6 shadow-md sm:p-8">
            <h2 className="mb-6 font-serif text-2xl text-forest-700">
              Send Us a Message
            </h2>

            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-5"
            >

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

              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Phone Number
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
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-forest-600"
                  placeholder="+63 912 345 6789"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Message *
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
                  required
                  rows={8}
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-forest-600"
                  placeholder="How can we help?"
                />
              </div>

              <button
                type="submit"
                disabled={
                  isSending ||
                  messageSent
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
                    <Send
                      size={18}
                    />
                    {isSending
                      ? 'Sending...'
                      : 'Send Message'}
                  </>
                )}
              </button>

              {sendError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {sendError}
                </div>
              )}
            </form>
          </div>

          {/* CONTACT INFORMATION */}

          <div className="rounded-lg bg-white p-6 shadow-md sm:p-8">
            <h2 className="mb-6 font-serif text-2xl text-forest-700">
              Get in Touch
            </h2>

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
                  Thank you for contacting us. We&apos;ll get back to you soon.
                </p>
              </div>
            ) : (
              <div className="space-y-6">

                <div className="space-y-4">

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

                  <div className="flex items-start gap-3 rounded-lg bg-forest-50 p-4">
                    <Package
                      size={24}
                      className="mt-0.5 flex-shrink-0 text-forest-600"
                    />

                    <div>
                      <h3 className="mb-1 font-semibold text-gray-900">
                        Looking to Order?
                      </h3>

                      <p className="text-sm text-gray-600">
                        Browse our premium golf apparel and accessories, then proceed to checkout.
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

                <div className="rounded-lg border border-gold-200 bg-gold-50 p-4">
                  <h3 className="mb-2 flex items-center gap-2 font-semibold text-gray-900">
                    <Send
                      size={18}
                      className="text-gold-600"
                    />
                    Quick Response
                  </h3>

                  <p className="text-sm text-gray-700">
                    Send us your inquiry and we&apos;ll typically respond within 24 hours.
                  </p>
                </div>

              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  )
}
