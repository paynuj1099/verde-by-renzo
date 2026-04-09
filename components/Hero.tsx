'use client'

import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative text-white overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 min-h-screen">
        <Image
          src="/images/hero-background.png"
          alt="Verde by Renzo Premium Performance Polo"
          fill
          className="object-cover object-top"
          priority
          quality={95}
        />
        {/* Optional overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent" />
      </div>

      <div className="container relative">
        <div className="relative flex items-center min-h-[600px] sm:min-h-[700px] lg:min-h-screen py-20 sm:py-24 lg:py-32">
          {/* Previous Button */}
          <button
            className="absolute left-2 sm:-left-2 lg:-left-6 z-10 w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all shadow-lg backdrop-blur-sm"
            aria-label="Previous slide"
          >
            <ChevronLeft className="text-gray-800" size={18} />
          </button>

          {/* Content */}
          <div className="flex-1 max-w-xl lg:max-w-2xl px-12 sm:pl-12 lg:pl-16">
            <p className="text-[10px] sm:text-xs lg:text-sm uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-3 sm:mb-4 lg:mb-6 text-gold-300 font-medium">
              Premium Performance Polo
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-serif mb-4 sm:mb-6 lg:mb-8 leading-tight text-gold-200">
              Elevate Every Moment
            </h1>
            <p className="text-sm sm:text-base lg:text-lg mb-1 sm:mb-2 text-white/95">
              Designed for the modern golfer.
            </p>
            <p className="text-sm sm:text-base lg:text-lg mb-8 sm:mb-10 lg:mb-12 text-white/95">
              Built for comfort. Made to stand out.
            </p>
            <button className="px-6 sm:px-8 lg:px-10 py-2.5 sm:py-3 lg:py-3.5 border-2 border-gold-300 hover:bg-gold-300 hover:text-forest-700 transition-all duration-300 text-[10px] sm:text-xs lg:text-sm uppercase tracking-[0.15em] font-semibold text-gold-200">
              Pre Order
            </button>
          </div>

          {/* Next Button */}
          <button
            className="absolute right-2 sm:-right-2 lg:-right-6 z-10 w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all shadow-lg backdrop-blur-sm"
            aria-label="Next slide"
          >
            <ChevronRight className="text-gray-800" size={18} />
          </button>
        </div>
      </div>
    </section>
  )
}
