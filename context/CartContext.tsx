'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import { getCatalogProducts } from '@/lib/productCatalog'

import {
  GloveHand,
  isValidGloveHand,
  isValidProductSize,
} from '@/data/productOptions'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { firestore } from '@/lib/firebase'

export type CartItem = {
  id: number
  color: string
  size?: string
  hand?: GloveHand
  quantity: number
}

type AddToCartInput = {
  id: number
  color: string
  size?: string
  hand?: GloveHand

  /*
   * Kept optional for compatibility
   * with older callers. Product name,
   * price, and category still come
   * from products.ts.
   */
  name?: string
  price?: number
  category?: string
}

type CartContextType = {
  cart: CartItem[]

  addToCart: (
    item: AddToCartInput
  ) => void

  removeFromCart: (
    id: number,
    color: string,
    size?: string,
    hand?: GloveHand
  ) => void

  updateQuantity: (
    id: number,
    color: string,
    quantity: number,
    size?: string,
    hand?: GloveHand
  ) => void

  clearCart: () => void

  getCartCount: () => number

  getCartTotal: () => number
}

const CartContext =
  createContext<
    CartContextType | undefined
  >(undefined)

const STORAGE_KEY =
  'verde-cart'

const normalizeOptional =
  (
    value?: string
  ) =>
    value?.trim()
      ? value.trim()
      : undefined

const sameVariant = (
  item: CartItem,
  variant: {
    id: number
    color: string
    size?: string
    hand?: GloveHand
  }
) =>
  item.id === variant.id &&
  item.color ===
    variant.color &&
  (item.size || undefined) ===
    (variant.size ||
      undefined) &&
  (item.hand || undefined) ===
    (variant.hand ||
      undefined)

const sanitizeStoredCart = (
  value: unknown
): CartItem[] => {
  if (!Array.isArray(value)) {
    return []
  }

  const sanitized: CartItem[] =
    []

  value.forEach(
    (raw) => {
      if (
        !raw ||
        typeof raw !==
          'object'
      ) {
        return
      }

      const record =
        raw as Record<
          string,
          unknown
        >

      const id =
        Number(
          record.id
        )

      const color =
        typeof record.color ===
        'string'
          ? record.color
          : ''

      const size =
        typeof record.size ===
        'string'
          ? normalizeOptional(
              record.size
            )
          : undefined

      const hand =
        record.hand ===
          'left' ||
        record.hand ===
          'right'
          ? record.hand
          : undefined

      const quantity =
        Math.max(
          1,
          Math.floor(
            Number(
              record.quantity
            ) || 1
          )
        )

      const product =
        getCatalogProducts().find(
          (item) =>
            item.id === id
        )

      if (
        !product ||
        !product.colors.includes(
          color
        )
      ) {
        return
      }

      /*
       * Old cart entries for the
       * Polo/Glove did not contain
       * size/hand. We drop those
       * invalid variants instead of
       * silently guessing a size.
       */
      if (
        !isValidProductSize(
          id,
          size
        ) ||
        !isValidGloveHand(
          id,
          hand
        )
      ) {
        return
      }

      const nextItem: CartItem =
        {
          id,
          color,
          size,
          hand,
          quantity,
        }

      const existing =
        sanitized.find(
          (item) =>
            sameVariant(
              item,
              nextItem
            )
        )

      if (existing) {
        existing.quantity +=
          quantity

        return
      }

      sanitized.push(
        nextItem
      )
    }
  )

  return sanitized
}

export function CartProvider({
  children,
}: {
  children:
    React.ReactNode
}) {
  const { user } = useAuth()
  const [
    cart,
    setCart,
  ] = useState<CartItem[]>(
    []
  )

  const [
    isLoaded,
    setIsLoaded,
  ] = useState(false)
  const [cloudUserId, setCloudUserId] = useState<string | null>(null)

  /*
   * Load saved cart once.
   */
  useEffect(() => {
    try {
      const stored =
        window.localStorage.getItem(
          STORAGE_KEY
        )

      if (stored) {
        const parsed =
          JSON.parse(
            stored
          )

        setCart(
          sanitizeStoredCart(
            parsed
          )
        )
      }
    } catch (error) {
      console.error(
        'Unable to load cart:',
        error
      )
    } finally {
      setIsLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!isLoaded || !user) {
      setCloudUserId(null)
      return
    }

    getDoc(doc(firestore, 'users', user.uid, 'data', 'cart'))
      .then((snapshot) => {
        if (snapshot.exists()) setCart(sanitizeStoredCart(snapshot.data().items))
        setCloudUserId(user.uid)
      })
      .catch((error) => console.error('Unable to load account cart:', error))
  }, [isLoaded, user])

  /*
   * Persist after the initial
   * localStorage read completes.
   */
  useEffect(() => {
    if (!isLoaded) {
      return
    }

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          cart
        )
      )
    } catch (error) {
      console.error(
        'Unable to save cart:',
        error
      )
    }
  }, [
    cart,
    isLoaded,
  ])

  useEffect(() => {
    if (!user || cloudUserId !== user.uid) return
    setDoc(doc(firestore, 'users', user.uid, 'data', 'cart'), {
      items: cart,
      updatedAt: serverTimestamp(),
    }, { merge: true }).catch((error) => console.error('Unable to save account cart:', error))
  }, [cart, cloudUserId, user])

  const addToCart = (
    input: AddToCartInput
  ) => {
    const product =
      getCatalogProducts().find(
        (item) =>
          item.id ===
          input.id
      )

    if (!product) {
      return
    }

    if (
      !product.colors.includes(
        input.color
      )
    ) {
      return
    }

    const size =
      normalizeOptional(
        input.size
      )

    const hand =
      input.hand

    /*
     * Never allow an invalid Polo or
     * Glove variant into the cart.
     */
    if (
      !isValidProductSize(
        product.id,
        size
      ) ||
      !isValidGloveHand(
        product.id,
        hand
      )
    ) {
      return
    }

    const variant = {
      id:
        product.id,
      color:
        input.color,
      size,
      hand,
    }

    setCart(
      (previous) => {
        const existingIndex =
          previous.findIndex(
            (item) =>
              sameVariant(
                item,
                variant
              )
          )

        if (
          existingIndex === -1
        ) {
          return [
            ...previous,
            {
              ...variant,
              quantity: 1,
            },
          ]
        }

        return previous.map(
          (
            item,
            index
          ) =>
            index ===
            existingIndex
              ? {
                  ...item,
                  quantity:
                    item.quantity +
                    1,
                }
              : item
        )
      }
    )
  }

  const removeFromCart = (
    id: number,
    color: string,
    size?: string,
    hand?: GloveHand
  ) => {
    const variant = {
      id,
      color,
      size:
        normalizeOptional(
          size
        ),
      hand,
    }

    setCart(
      (previous) =>
        previous.filter(
          (item) =>
            !sameVariant(
              item,
              variant
            )
        )
    )
  }

  const updateQuantity = (
    id: number,
    color: string,
    quantity: number,
    size?: string,
    hand?: GloveHand
  ) => {
    const variant = {
      id,
      color,
      size:
        normalizeOptional(
          size
        ),
      hand,
    }

    if (quantity <= 0) {
      removeFromCart(
        id,
        color,
        size,
        hand
      )

      return
    }

    setCart(
      (previous) =>
        previous.map(
          (item) =>
            sameVariant(
              item,
              variant
            )
              ? {
                  ...item,
                  quantity:
                    Math.max(
                      1,
                      Math.floor(
                        quantity
                      )
                    ),
                }
              : item
        )
    )
  }

  const clearCart =
    () => {
      setCart([])
    }

  const getCartCount =
    () =>
      cart.reduce(
        (
          total,
          item
        ) =>
          total +
          item.quantity,
        0
      )

  const getCartTotal =
    () =>
      cart.reduce(
        (
          total,
          item
        ) => {
          const product =
            getCatalogProducts().find(
              (candidate) =>
                candidate.id ===
                item.id
            )

          if (!product) {
            return total
          }

          return (
            total +
            product.price *
              item.quantity
          )
        },
        0
      )

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartCount,
        getCartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context =
    useContext(
      CartContext
    )

  if (!context) {
    throw new Error(
      'useCart must be used inside CartProvider.'
    )
  }

  return context
}
