'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function PullToRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [startY, setStartY] = useState(0)
  const router = useRouter()
  const maxPullDistance = 100
  const refreshThreshold = 80

  const handleTouchStart = (e: TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY)
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (startY === 0) return

    const currentY = e.touches[0].clientY
    const distance = currentY - startY

    if (distance > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(distance, maxPullDistance))
      
      // Prevent default scrolling when pulling down
      if (distance > 10) {
        e.preventDefault()
      }
    }
  }

  const handleTouchEnd = () => {
    if (pullDistance > refreshThreshold) {
      setIsRefreshing(true)
      
      // Trigger refresh
      setTimeout(() => {
        router.refresh()
        setIsRefreshing(false)
        setPullDistance(0)
      }, 1000)
    } else {
      setPullDistance(0)
    }
    setStartY(0)
  }

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [startY, pullDistance])

  const rotation = (pullDistance / maxPullDistance) * 360
  const opacity = Math.min(pullDistance / maxPullDistance, 1)
  const scale = Math.min(pullDistance / maxPullDistance, 1)

  if (pullDistance === 0 && !isRefreshing) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex justify-center"
      style={{
        transform: `translateY(${isRefreshing ? '60px' : `${pullDistance - 40}px`})`,
        transition: isRefreshing || pullDistance === 0 ? 'transform 0.3s ease-out' : 'none',
      }}
    >
      <div
        className="flex flex-col items-center"
        style={{
          opacity,
          transform: `scale(${scale})`,
        }}
      >
        {/* Custom Loader */}
        <div className="relative">
          {/* Outer ring */}
          <div
            className="w-12 h-12 border-3 border-gray-200 rounded-full"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: 'transform 0.1s linear',
            }}
          />
          {/* Inner animated ring */}
          <div
            className={`absolute inset-0 w-12 h-12 border-3 border-transparent rounded-full ${
              isRefreshing ? 'border-t-forest-600 border-r-gold-500 animate-spin' : 'border-t-forest-600'
            }`}
            style={{
              transform: isRefreshing ? 'none' : `rotate(${rotation}deg)`,
              transition: isRefreshing ? 'none' : 'transform 0.1s linear',
            }}
          />
          {/* Center logo indicator */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="w-5 h-5 text-forest-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v18m0-18 8.5 4.5M12 3 3.5 7.5"
                  className="text-gold-500"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Pull indicator text */}
        {!isRefreshing && (
          <p className="mt-2 text-xs text-gray-600 font-medium">
            {pullDistance > refreshThreshold ? 'Release to refresh' : 'Pull to refresh'}
          </p>
        )}
      </div>
    </div>
  )
}
