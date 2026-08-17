'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import {
  getProductById,
} from '@/lib/productUtils'

export interface WishlistItem {
  id: number
  colors: string[]
}

/*
 * Backward compatible with your
 * existing Shop component.
 *
 * Your current Shop may still send:
 *
 * {
 *   id,
 *   name,
 *   price,
 *   category,
 *   colors,
 *   description
 * }
 *
 * Extra metadata is accepted but
 * isn't stored.
 */
export interface AddToWishlistItem {
  id: number
  colors: string[]

  name?: string
  price?: number
  category?: string
  description?: string
}

interface WishlistContextType {
  wishlist: WishlistItem[]

  addToWishlist: (
    item: AddToWishlistItem
  ) => void

  removeFromWishlist: (
    id: number,
    color?: string
  ) => void

  isInWishlist: (
    id: number,
    color?: string
  ) => boolean

  clearWishlist: () => void

  getWishlistCount:
    () => number
}

const WishlistContext =
  createContext<
    WishlistContextType | undefined
  >(undefined)

export function WishlistProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [
    wishlist,
    setWishlist,
  ] = useState<
    WishlistItem[]
  >([])

  const [
    hasLoaded,
    setHasLoaded,
  ] = useState(false)

  /*
   * ============================
   * LOAD / MIGRATE WISHLIST
   * ============================
   */
  useEffect(() => {
    const savedWishlist =
      localStorage.getItem(
        'verde-wishlist'
      )

    if (
      savedWishlist
    ) {
      try {
        const parsed =
          JSON.parse(
            savedWishlist
          ) as Array<{
            id?: number
            colors?: string[]

            /*
             * Old metadata is ignored.
             */
            name?: string
            price?: number
            category?: string
            description?: string
          }>

        const migrated =
          parsed
            .filter(
              (item) =>
                typeof item.id ===
                  'number' &&
                Array.isArray(
                  item.colors
                ) &&
                Boolean(
                  getProductById(
                    item.id
                  )
                )
            )
            .map(
              (item) => {
                const product =
                  getProductById(
                    item.id as number
                  )

                const validColors =
                  (
                    item.colors ||
                    []
                  ).filter(
                    (color) =>
                      product?.colors.includes(
                        color
                      )
                  )

                return {
                  id:
                    item.id as number,

                  colors:
                    Array.from(
                      new Set(
                        validColors
                      )
                    ),
                }
              }
            )
            .filter(
              (item) =>
                item.colors
                  .length > 0
            )

        setWishlist(
          migrated
        )
      } catch (
        error
      ) {
        console.error(
          'Error loading wishlist:',
          error
        )

        localStorage.removeItem(
          'verde-wishlist'
        )
      }
    }

    setHasLoaded(true)
  }, [])

  /*
   * ============================
   * SAVE WISHLIST
   * ============================
   */
  useEffect(() => {
    if (!hasLoaded) {
      return
    }

    if (
      wishlist.length >
      0
    ) {
      localStorage.setItem(
        'verde-wishlist',
        JSON.stringify(
          wishlist
        )
      )
    } else {
      localStorage.removeItem(
        'verde-wishlist'
      )
    }
  }, [
    wishlist,
    hasLoaded,
  ])

  /*
   * ============================
   * ADD TO WISHLIST
   * ============================
   */
  const addToWishlist = (
    item: AddToWishlistItem
  ) => {
    const product =
      getProductById(
        item.id
      )

    if (!product) {
      return
    }

    const validColors =
      item.colors.filter(
        (color) =>
          product.colors.includes(
            color
          )
      )

    if (
      validColors.length ===
      0
    ) {
      return
    }

    setWishlist(
      (prev) => {
        const existing =
          prev.find(
            (wishlistItem) =>
              wishlistItem.id ===
              item.id
          )

        if (existing) {
          return prev.map(
            (
              wishlistItem
            ) =>
              wishlistItem.id ===
              item.id
                ? {
                    ...wishlistItem,

                    colors:
                      Array.from(
                        new Set([
                          ...wishlistItem.colors,
                          ...validColors,
                        ])
                      ),
                  }
                : wishlistItem
          )
        }

        return [
          ...prev,

          {
            id: item.id,

            colors:
              Array.from(
                new Set(
                  validColors
                )
              ),
          },
        ]
      }
    )
  }

  /*
   * ============================
   * REMOVE FROM WISHLIST
   * ============================
   */
  const removeFromWishlist =
    (
      id: number,
      color?: string
    ) => {
      setWishlist(
        (prev) => {
          /*
           * Remove entire product.
           */
          if (!color) {
            return prev.filter(
              (item) =>
                item.id !== id
            )
          }

          /*
           * Remove only selected
           * color variant.
           */
          return prev
            .map(
              (item) => {
                if (
                  item.id !==
                  id
                ) {
                  return item
                }

                return {
                  ...item,

                  colors:
                    item.colors.filter(
                      (
                        savedColor
                      ) =>
                        savedColor !==
                        color
                    ),
                }
              }
            )
            .filter(
              (item) =>
                item.colors
                  .length > 0
            )
        }
      )
    }

  /*
   * ============================
   * CHECK WISHLIST
   * ============================
   */
  const isInWishlist = (
    id: number,
    color?: string
  ) => {
    const item =
      wishlist.find(
        (
          wishlistItem
        ) =>
          wishlistItem.id ===
          id
      )

    if (!item) {
      return false
    }

    if (!color) {
      return true
    }

    return (
      item.colors.includes(
        color
      )
    )
  }

  /*
   * ============================
   * CLEAR
   * ============================
   */
  const clearWishlist =
    () => {
      setWishlist([])
    }

  const getWishlistCount =
    () => {
      return wishlist.reduce(
        (
          total,
          item
        ) =>
          total +
          item.colors.length,
        0
      )
    }

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
        getWishlistCount,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context =
    useContext(
      WishlistContext
    )

  if (
    context ===
    undefined
  ) {
    throw new Error(
      'useWishlist must be used within a WishlistProvider'
    )
  }

  return context
}