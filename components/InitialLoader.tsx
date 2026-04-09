'use client'

import { useEffect, useState } from 'react'
import Loading from './Loading'

export default function InitialLoader({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate initial load time and wait for page to be ready
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000) // Show loading screen for 2 seconds

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <Loading />
  }

  return (
    <div className="animate-fade-in">
      {children}
    </div>
  )
}
