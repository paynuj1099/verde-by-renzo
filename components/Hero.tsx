'use client'


import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

const slides = [
  {
    image: '/images/hero-background.png',
    caption: {
      subtitle: 'Premium Performance Polo',
      title: 'Elevate Every Moment',
      desc1: 'Designed for the modern golfer.',
      desc2: 'Built for comfort. Made to stand out.',
      button: 'Pre Order',
    },
  },
  {
    image: '/images/hero-background-2.png',
    caption: {
      subtitle: 'Limited Edition Drop',
      title: 'Unleash Your Style',
      desc1: 'Exclusive colors. Limited stock.',
      desc2: 'Don’t miss out on our latest release.',
      button: 'Pre Order',
    },
  },
]
export default function Hero() {
  const [slideIndex, setSlideIndex] = useState(0)


  const handlePrev = () => {
    setSlideIndex((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const handleNext = () => {
    setSlideIndex((prev) => (prev + 1) % slides.length)
  }



  const { image, caption } = slides[slideIndex]

  return (
    <section className="relative text-white overflow-hidden">
      {/* Background Image */}
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
        {/* Optional overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent" />
      </div>

      {/* Slide Dots */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-8 flex gap-2 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            className={`w-3 h-3 rounded-full border border-gold-300 transition-all duration-300 ${slideIndex === idx ? 'bg-gold-300 scale-110' : 'bg-white/60'}`}
            aria-label={`Go to slide ${idx + 1}`}
            onClick={() => setSlideIndex(idx)}
            style={{ outline: 'none' }}
          >
            <span className="sr-only">Go to slide {idx + 1}</span>
          </button>
        ))}
      </div>

      <div className="container relative">
        <div className="relative flex items-center min-h-[600px] sm:min-h-[700px] lg:min-h-screen py-20 sm:py-24 lg:py-32">
          {/* Previous Button */}
          <button
            className="absolute left-2 sm:-left-2 lg:-left-6 z-10 w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all shadow-lg backdrop-blur-sm"
            aria-label="Previous slide"
            onClick={handlePrev}
          >
            <ChevronLeft className="text-gray-800" size={18} />
          </button>

          {/* Content */}
          <div className="flex-1 max-w-xl lg:max-w-2xl px-12 sm:pl-12 lg:pl-16">
            <p className="text-[10px] sm:text-xs lg:text-sm uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-3 sm:mb-4 lg:mb-6 text-gold-300 font-medium">
              {caption.subtitle}
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-serif mb-4 sm:mb-6 lg:mb-8 leading-tight text-gold-200">
              {caption.title}
            </h1>
            <p className="text-sm sm:text-base lg:text-lg mb-1 sm:mb-2 text-white/95">
              {caption.desc1}
            </p>
            <p className="text-sm sm:text-base lg:text-lg mb-8 sm:mb-10 lg:mb-12 text-white/95">
              {caption.desc2}
            </p>
            <Link
              href="/shop"
              className="inline-block px-6 sm:px-8 lg:px-10 py-2.5 sm:py-3 lg:py-3.5 border-2 border-gold-300 hover:bg-gold-300 hover:text-forest-700 transition-all duration-300 text-[10px] sm:text-xs lg:text-sm uppercase tracking-[0.15em] font-semibold text-gold-200"
            >
              {caption.button}
            </Link>
          </div>

          {/* Next Button */}
          <button
            className="absolute right-2 sm:-right-2 lg:-right-6 z-10 w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all shadow-lg backdrop-blur-sm"
            aria-label="Next slide"
            onClick={handleNext}
          >
            <ChevronRight className="text-gray-800" size={18} />
          </button>
        </div>
      </div>
    </section>
  )
}
