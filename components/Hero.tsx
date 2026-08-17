'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'

const slides = [
  {
    image: '/images/hero-background.png',

    // Product destination
    productId: 1,
    color: 'forest',

    caption: {
      subtitle: 'Premium Performance Polo',
      title: 'Elevate Every Moment',
      desc1: 'Designed for the modern golfer.',
      desc2:
        'Built for comfort. Made to stand out.',
      button: 'Pre Order',
    },
  },

  {
    image: '/images/hero-background-2.png',

    // Product destination
    productId: 1,
    color: 'ivory',

    caption: {
      subtitle: 'Limited Edition Drop',
      title: 'Unleash Your Style',
      desc1:
        'Exclusive colors. Limited stock.',
      desc2:
        'Don’t miss out on our latest release.',
      button: 'Pre Order',
    },
  },
]

export default function Hero() {
  const [
    slideIndex,
    setSlideIndex,
  ] = useState(0)

  const handlePrev = () => {
    setSlideIndex(
      (prev) =>
        (prev - 1 + slides.length) %
        slides.length
    )
  }

  const handleNext = () => {
    setSlideIndex(
      (prev) =>
        (prev + 1) %
        slides.length
    )
  }

  const {
    image,
    caption,
    productId,
    color,
  } = slides[slideIndex]

  return (
    <section className="relative overflow-hidden text-white">

      {/* Background */}
      <div className="absolute inset-0 min-h-screen">

        <Image
          src={image}
          alt={caption.title}
          fill
          sizes="100vw"
          className="object-cover object-top"
          priority
          quality={95}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent" />

      </div>

      {/* Slide Dots */}
      <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-2">

        {slides.map(
          (_, idx) => (
            <button
              key={idx}
              type="button"
              className={`h-3 w-3 rounded-full border border-gold-300 transition-all duration-300 ${
                slideIndex === idx
                  ? 'scale-110 bg-gold-300'
                  : 'bg-white/60'
              }`}
              aria-label={`Go to slide ${
                idx + 1
              }`}
              onClick={() =>
                setSlideIndex(idx)
              }
              style={{
                outline: 'none',
              }}
            >
              <span className="sr-only">
                Go to slide{' '}
                {idx + 1}
              </span>
            </button>
          )
        )}

      </div>

      <div className="container relative">

        <div className="relative flex min-h-[600px] items-center py-20 sm:min-h-[700px] sm:py-24 lg:min-h-screen lg:py-32">

          {/* Previous */}
          <button
            type="button"
            className="absolute left-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-all hover:bg-white sm:-left-2 sm:h-10 sm:w-10 lg:-left-6 lg:h-12 lg:w-12"
            aria-label="Previous slide"
            onClick={
              handlePrev
            }
          >
            <ChevronLeft
              className="text-gray-800"
              size={18}
            />
          </button>

          {/* Content */}
          <div className="max-w-xl flex-1 px-12 sm:pl-12 lg:max-w-2xl lg:pl-16">

            <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.15em] text-gold-300 sm:mb-4 sm:text-xs sm:tracking-[0.2em] lg:mb-6 lg:text-sm">
              {
                caption.subtitle
              }
            </p>

            <h1 className="mb-4 font-serif text-3xl leading-tight text-gold-200 sm:mb-6 sm:text-4xl md:text-5xl lg:mb-8 lg:text-7xl">
              {
                caption.title
              }
            </h1>

            <p className="mb-1 text-sm text-white/95 sm:mb-2 sm:text-base lg:text-lg">
              {
                caption.desc1
              }
            </p>

            <p className="mb-8 text-sm text-white/95 sm:mb-10 sm:text-base lg:mb-12 lg:text-lg">
              {
                caption.desc2
              }
            </p>

            {/* CTA */}
            <Link
              href={`/shop/${productId}?color=${color}`}
              className="inline-block border-2 border-gold-300 px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-gold-200 transition-all duration-300 hover:bg-gold-300 hover:text-forest-700 sm:px-8 sm:py-3 sm:text-xs lg:px-10 lg:py-3.5 lg:text-sm"
            >
              {
                caption.button
              }
            </Link>

          </div>

          {/* Next */}
          <button
            type="button"
            className="absolute right-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-all hover:bg-white sm:-right-2 sm:h-10 sm:w-10 lg:-right-6 lg:h-12 lg:w-12"
            aria-label="Next slide"
            onClick={
              handleNext
            }
          >
            <ChevronRight
              className="text-gray-800"
              size={18}
            />
          </button>

        </div>
      </div>
    </section>
  )
}