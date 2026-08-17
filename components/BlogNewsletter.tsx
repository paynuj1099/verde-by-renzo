'use client'

import {
  CheckCircle2,
  Mail,
  X,
} from 'lucide-react'

import {
  FormEvent,
  useEffect,
  useState,
} from 'react'

export default function BlogNewsletter() {
  const [
    email,
    setEmail,
  ] = useState('')

  const [
    showSuccessModal,
    setShowSuccessModal,
  ] = useState(false)

  const handleSubscribe = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    const trimmedEmail =
      email.trim()

    if (!trimmedEmail) {
      return
    }

    /*
     * Fake subscription only.
     * No backend/newsletter provider
     * is called.
     */
    setShowSuccessModal(true)
    setEmail('')
  }

  const closeSuccessModal =
    () => {
      setShowSuccessModal(false)
    }

  useEffect(() => {
    if (!showSuccessModal) {
      return
    }

    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow =
      'hidden'

    const handleEscape = (
      event: KeyboardEvent
    ) => {
      if (event.key === 'Escape') {
        closeSuccessModal()
      }
    }

    window.addEventListener(
      'keydown',
      handleEscape
    )

    return () => {
      window.removeEventListener(
        'keydown',
        handleEscape
      )

      document.body.style.overflow =
        previousOverflow
    }
  }, [showSuccessModal])

  return (
    <>
      {/* ======================= */}
      {/* BLOG NEWSLETTER */}
      {/* ======================= */}

      <section className="mt-16 rounded-2xl bg-gradient-to-r from-forest-600 to-forest-800 p-8 text-center text-white lg:p-12">

        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">
          The Verde Journal
        </p>

        <h2 className="mb-4 font-serif text-3xl font-bold lg:text-4xl">
          Stay Updated
        </h2>

        <p className="mx-auto mb-8 max-w-2xl leading-7 text-forest-100">
          Subscribe to our newsletter and be the first to know about
          new journal stories, collections, product releases, and
          exclusive offers.
        </p>

        <form
          onSubmit={
            handleSubscribe
          }
          className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row"
        >

          <div className="relative flex-1">

            <Mail
              size={17}
              className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="email"
              value={
                email
              }
              onChange={(
                event
              ) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="Enter your email"
              aria-label="Email address"
              autoComplete="email"
              required
              className="w-full rounded-full bg-white py-3 pl-12 pr-6 text-gray-900 outline-none transition focus:ring-2 focus:ring-gold-500"
            />

          </div>

          <button
            type="submit"
            className="rounded-full bg-gold-500 px-8 py-3 font-semibold text-white transition-all hover:bg-gold-600 active:scale-[0.98]"
          >
            Subscribe
          </button>

        </form>

        <p className="mt-4 text-xs text-white/60">
          Be the first to hear what&apos;s new at VERDE.
        </p>

      </section>

      {/* ============================ */}
      {/* SUCCESS MODAL */}
      {/* ============================ */}

      {showSuccessModal && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          onClick={
            closeSuccessModal
          }
        >

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="blog-newsletter-success-title"
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white text-gray-900 shadow-2xl"
          >

            <button
              type="button"
              onClick={
                closeSuccessModal
              }
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close subscription confirmation"
            >
              <X
                size={20}
              />
            </button>

            <div className="h-1.5 w-full bg-gold-500" />

            <div className="px-7 pb-7 pt-9 text-center sm:px-9 sm:pb-9">

              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-forest-50">
                <CheckCircle2
                  size={34}
                  className="text-forest-600"
                  strokeWidth={1.8}
                />
              </div>

              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-gold-600">
                The Verde Journal
              </p>

              <h2
                id="blog-newsletter-success-title"
                className="mb-3 font-serif text-2xl font-semibold text-forest-900 sm:text-3xl"
              >
                You&apos;re subscribed!
              </h2>

              <p className="mx-auto mb-7 max-w-sm text-sm leading-6 text-gray-600">
                Thanks for joining the Verde Journal. You&apos;ll be among
                the first to hear about new stories, collections, product
                releases, and special offers.
              </p>

              <button
                type="button"
                onClick={
                  closeSuccessModal
                }
                className="w-full rounded-lg bg-forest-600 px-6 py-3 font-semibold text-white transition-all hover:bg-forest-700 active:scale-[0.99]"
              >
                Continue Reading
              </button>

              <p className="mt-4 text-xs text-gray-400">
                Welcome to the Verde community.
              </p>

            </div>

          </div>

        </div>
      )}
    </>
  )
}
