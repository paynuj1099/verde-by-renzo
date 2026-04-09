'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate initial load
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-white via-gray-50 to-white z-[100] flex items-center justify-center transition-opacity duration-500">
      <div className="flex flex-col items-center">
        {/* Logo */}
        <div className="relative w-48 h-20 mb-8 animate-fade-in">
          <Image
            src="/images/verde-logo.png"
            alt="Verde by Renzo"
            fill
            className="object-contain"
            priority
          />
        </div>
        
        {/* Elegant Three-dot Animation */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 bg-forest-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-forest-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        
        {/* Elegant progress bar */}
        <div className="w-64 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-forest-600 to-gold-500 animate-loading-bar"></div>
        </div>
        
        {/* Tagline */}
        <p className="mt-6 text-gray-500 text-sm tracking-wider animate-pulse">
          Every detail. Every swing. Elevated.
        </p>
      </div>
    </div>
  )
}
