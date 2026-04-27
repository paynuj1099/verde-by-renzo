'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface WishlistItem {
  id: number
  name: string
  price: number
  category: string
  colors: string[]
  description?: string
}

interface WishlistContextType {
  wishlist: WishlistItem[]
  addToWishlist: (item: WishlistItem) => void
  removeFromWishlist: (id: number) => void
  isInWishlist: (id: number) => boolean
  getWishlistCount: () => number
  clearWishlist: () => void
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const savedWishlist = localStorage.getItem('verde-wishlist')
    if (savedWishlist) {
      try {
        setWishlist(JSON.parse(savedWishlist))
      } catch (error) {
        console.error('Error loading wishlist:', error)
      }
    }
  }, [])

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (wishlist.length > 0) {
      localStorage.setItem('verde-wishlist', JSON.stringify(wishlist))
    } else {
      localStorage.removeItem('verde-wishlist')
    }
  }, [wishlist])

  const addToWishlist = (item: WishlistItem) => {
    setWishlist(prevWishlist => {
      const exists = prevWishlist.find(wishlistItem => wishlistItem.id === item.id)
      if (exists) {
        return prevWishlist // Don't add duplicates
      }
      return [...prevWishlist, item]
    })
  }

  const removeFromWishlist = (id: number) => {
    setWishlist(prevWishlist => prevWishlist.filter(item => item.id !== id))
  }

  const isInWishlist = (id: number) => {
    return wishlist.some(item => item.id === id)
  }

  const getWishlistCount = () => {
    return wishlist.length
  }

  const clearWishlist = () => {
    setWishlist([])
    localStorage.removeItem('verde-wishlist')
  }

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        getWishlistCount,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}
