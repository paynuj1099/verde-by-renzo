'use client'

import {
  CheckCircle2,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  Twitter,
  X,
} from 'lucide-react'

import Image from 'next/image'
import Link from 'next/link'
import {
  FormEvent,
  useEffect,
  useState,
} from 'react'

export default function Footer() {
  const [
    email,
    setEmail,
  ] = useState('')

  const [
    showSuccessModal,
    setShowSuccessModal,
  ] = useState(false)

  /*
   * ============================
   * FAKE NEWSLETTER SUBSCRIPTION
   * ============================
   *
   * This does not send the email
   * to a backend or newsletter
   * provider. It only displays
   * a success confirmation.
   */
  const handleSubscribe = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    const trimmedEmail =
      email.trim()

    if (!trimmedEmail) {
      return
    }

    setShowSuccessModal(true)
    setEmail('')
  }

  const closeSuccessModal =
    () => {
      setShowSuccessModal(false)
    }

  /*
   * Close the modal with Escape
   * and prevent the page behind
   * the modal from scrolling.
   */
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
      <footer className="mt-16 bg-[#0a0f0a] text-white sm:mt-20">
        <div className="container py-10 sm:py-12 lg:py-16">

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">

            {/* ======================= */}
            {/* BRAND */}
            {/* ======================= */}

            <div>
              <div className="mb-4 flex flex-col items-start">
                <div className="relative mb-3 h-24 w-56">
                  <Image
                    src="/images/verde-logo.png"
                    alt="Verde by Renzo Logo"
                    fill
                    sizes="224px"
                    className="object-contain object-left"
                    priority
                  />
                </div>
              </div>

              <p className="mb-6 text-sm leading-relaxed text-gray-400">
                Premium performance polo shirts designed for the modern golfer.
                Every detail, every swing, elevated.
              </p>

              {/* SOCIAL MEDIA */}

              <div className="flex items-center gap-3">

                <a
                  href="#"
                  className="group flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition-all duration-300 hover:bg-gold-500"
                  aria-label="Instagram"
                >
                  <Instagram
                    size={18}
                    className="text-gray-400 group-hover:text-gray-900"
                  />
                </a>

                <a
                  href="#"
                  className="group flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition-all duration-300 hover:bg-gold-500"
                  aria-label="Facebook"
                >
                  <Facebook
                    size={18}
                    className="text-gray-400 group-hover:text-gray-900"
                  />
                </a>

                <a
                  href="#"
                  className="group flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition-all duration-300 hover:bg-gold-500"
                  aria-label="Twitter"
                >
                  <Twitter
                    size={18}
                    className="text-gray-400 group-hover:text-gray-900"
                  />
                </a>

                <a
                  href="#"
                  className="group flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition-all duration-300 hover:bg-gold-500"
                  aria-label="LinkedIn"
                >
                  <Linkedin
                    size={18}
                    className="text-gray-400 group-hover:text-gray-900"
                  />
                </a>

              </div>
            </div>

            {/* ======================= */}
            {/* QUICK LINKS */}
            {/* ======================= */}

            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white sm:text-sm">
                Quick Links
              </h3>

              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    href="/shop"
                    className="text-gray-400 transition-colors hover:text-gold-500"
                  >
                    Shop
                  </Link>
                </li>

                <li>
                  <Link
                    href="/blog"
                    className="text-gray-400 transition-colors hover:text-gold-500"
                  >
                    Blog
                  </Link>
                </li>

                <li>
                  <Link
                    href="/contact-us"
                    className="text-gray-400 transition-colors hover:text-gold-500"
                  >
                    Contact
                  </Link>
                </li>

                <li>
                  <Link
                    href="/wishlist"
                    className="text-gray-400 transition-colors hover:text-gold-500"
                  >
                    Wishlist
                  </Link>
                </li>

                <li>
                  <Link
                    href="/size-guide"
                    className="text-gray-400 transition-colors hover:text-gold-500"
                  >
                    Size Guide
                  </Link>
                </li>
              </ul>
            </div>

            {/* ======================= */}
            {/* LEGAL */}
            {/* ======================= */}

            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white sm:text-sm">
                Legal
              </h3>

              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    href="/terms"
                    className="text-gray-400 transition-colors hover:text-gold-500"
                  >
                    Terms &amp; Conditions
                  </Link>
                </li>

                <li>
                  <Link
                    href="/privacy"
                    className="text-gray-400 transition-colors hover:text-gold-500"
                  >
                    Privacy Policy
                  </Link>
                </li>

                <li>
                  <Link
                    href="/contact-us"
                    className="text-gray-400 transition-colors hover:text-gold-500"
                  >
                    Returns &amp; Refunds
                  </Link>
                </li>

                <li>
                  <Link
                    href="/contact-us"
                    className="text-gray-400 transition-colors hover:text-gold-500"
                  >
                    Shipping Info
                  </Link>
                </li>
              </ul>
            </div>

            {/* ======================= */}
            {/* NEWSLETTER */}
            {/* ======================= */}

            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white sm:text-sm">
                Newsletter
              </h3>

              <p className="mb-4 text-sm leading-relaxed text-gray-400">
                Subscribe to get special offers and updates.
              </p>

              <form
                onSubmit={
                  handleSubscribe
                }
                className="flex flex-col gap-3"
              >
                <div className="relative">

                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                    size={16}
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={(
                      event
                    ) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    placeholder="Your email"
                    required
                    autoComplete="email"
                    aria-label="Newsletter email address"
                    className="w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-gray-200 transition-colors placeholder:text-gray-600 focus:border-gold-500 focus:outline-none"
                  />

                </div>

                <button
                  type="submit"
                  className="rounded-lg bg-gold-500 px-6 py-3 text-sm font-semibold text-gray-900 transition-all hover:bg-gold-600 active:scale-[0.98]"
                >
                  Subscribe
                </button>

              </form>
            </div>

          </div>

          {/* ======================= */}
          {/* BOTTOM */}
          {/* ======================= */}

          <div className="mt-10 border-t border-white/10 pt-6 sm:mt-12 sm:pt-8">

            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">

              <p className="text-xs text-gray-500 sm:text-sm">
                &copy; 2026 Verde by Renzo. All rights reserved.
              </p>

              <div className="flex gap-4 text-xs sm:text-sm">

                <Link
                  href="/terms"
                  className="text-gray-500 transition-colors hover:text-gold-500"
                >
                  Terms
                </Link>

                <span className="text-gray-600">
                  •
                </span>

                <Link
                  href="/privacy"
                  className="text-gray-500 transition-colors hover:text-gold-500"
                >
                  Privacy
                </Link>

              </div>

            </div>

          </div>

        </div>
      </footer>

      {/* ============================ */}
      {/* SUBSCRIPTION SUCCESS MODAL */}
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
            aria-labelledby="newsletter-success-title"
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* CLOSE */}

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

            {/* GOLD ACCENT */}

            <div className="h-1.5 w-full bg-gold-500" />

            <div className="px-7 pb-7 pt-9 text-center sm:px-9 sm:pb-9">

              {/* ICON */}

              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-forest-50">

                <CheckCircle2
                  size={34}
                  className="text-forest-600"
                  strokeWidth={1.8}
                />

              </div>

              {/* TITLE */}

              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-gold-600">
                Verde Newsletter
              </p>

              <h2
                id="newsletter-success-title"
                className="mb-3 font-serif text-2xl font-semibold text-forest-900 sm:text-3xl"
              >
                You&apos;re on the list!
              </h2>

              <p className="mx-auto mb-7 max-w-sm text-sm leading-6 text-gray-600">
                Thanks for subscribing. You&apos;ll be among the first to hear
                about new collections, journal stories, product releases, and
                special offers from Verde by Renzo.
              </p>

              <button
                type="button"
                onClick={
                  closeSuccessModal
                }
                className="w-full rounded-lg bg-forest-600 px-6 py-3 font-semibold text-white transition-all hover:bg-forest-700 active:scale-[0.99]"
              >
                Continue Exploring
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
