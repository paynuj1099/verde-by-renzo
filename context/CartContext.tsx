'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import { products } from '@/data/products'

/*
 * ==============================
 * CART ITEM
 * ==============================
 *
 * We only store information that
 * is unique to the cart selection.
 *
 * Product name, price, category,
 * and images come from products.ts.
 */
export interface CartItem {
  id: number
  color: string
  quantity: number
}

/*
 * ==============================
 * ADD TO CART INPUT
 * ==============================
 *
 * Optional legacy properties are
 * included so your existing Shop
 * code still works even if it sends:
 *
 * name
 * price
 * category
 * image
 *
 * They will NOT be stored.
 */
export interface AddToCartItem {
  id: number
  color: string

  name?: string
  price?: number
  category?: string
  image?: string
}

interface CartContextType {
  cart: CartItem[]

  addToCart: (
    item: AddToCartItem
  ) => void

  removeFromCart: (
    id: number,
    color: string
  ) => void

  updateQuantity: (
    id: number,
    color: string,
    quantity: number
  ) => void

  clearCart: () => void

  getCartTotal: () => number

  getCartCount: () => number
}

const CartContext =
  createContext<
    CartContextType | undefined
  >(undefined)

/*
 * ==============================
 * PRODUCT LOOKUP
 * ==============================
 */
function getProductById(
  id: number
) {
  return products.find(
    (product) =>
      product.id === id
  )
}

export function CartProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [
    cart,
    setCart,
  ] = useState<CartItem[]>([])

  /*
   * Prevent the initial empty
   * state from deleting localStorage
   * before it has been loaded.
   */
  const [
    hasLoaded,
    setHasLoaded,
  ] = useState(false)

  /*
   * ==============================
   * LOAD CART
   * ==============================
   *
   * This also migrates your OLD cart
   * structure automatically.
   *
   * Old:
   *
   * {
   *   id,
   *   name,
   *   price,
   *   category,
   *   color,
   *   quantity,
   *   image
   * }
   *
   * New:
   *
   * {
   *   id,
   *   color,
   *   quantity
   * }
   */
  useEffect(() => {
    const savedCart =
      localStorage.getItem(
        'verde-cart'
      )

    if (savedCart) {
      try {
        const parsed =
          JSON.parse(
            savedCart
          )

        if (
          Array.isArray(parsed)
        ) {
          const migratedCart: CartItem[] =
            parsed
              .filter(
                (item) => {
                  if (
                    typeof item?.id !==
                      'number' ||
                    typeof item?.color !==
                      'string'
                  ) {
                    return false
                  }

                  /*
                   * Only retain products
                   * that still exist.
                   */
                  return Boolean(
                    getProductById(
                      item.id
                    )
                  )
                }
              )
              .map(
                (item) => ({
                  id: item.id,

                  color:
                    item.color,

                  quantity:
                    typeof item.quantity ===
                      'number' &&
                    item.quantity > 0
                      ? item.quantity
                      : 1,
                })
              )

          setCart(
            migratedCart
          )
        }
      } catch (
        error
      ) {
        console.error(
          'Error loading cart:',
          error
        )

        localStorage.removeItem(
          'verde-cart'
        )
      }
    }

    setHasLoaded(true)
  }, [])

  /*
   * ==============================
   * SAVE CART
   * ==============================
   */
  useEffect(() => {
    if (!hasLoaded) {
      return
    }

    if (
      cart.length > 0
    ) {
      localStorage.setItem(
        'verde-cart',
        JSON.stringify(
          cart
        )
      )
    } else {
      localStorage.removeItem(
        'verde-cart'
      )
    }
  }, [
    cart,
    hasLoaded,
  ])

  /*
   * ==============================
   * ADD TO CART
   * ==============================
   */
  const addToCart = (
    item: AddToCartItem
  ) => {
    const product =
      getProductById(
        item.id
      )

    /*
     * Don't add products that
     * aren't in products.ts.
     */
    if (!product) {
      console.warn(
        `Product with ID ${item.id} was not found.`
      )

      return
    }

    /*
     * Validate selected color.
     *
     * If something invalid gets
     * passed, use the product's
     * first available color.
     */
    const selectedColor =
      product.colors.includes(
        item.color
      )
        ? item.color
        : product.colors[0]

    if (!selectedColor) {
      console.warn(
        `Product ${item.id} has no valid color.`
      )

      return
    }

    setCart(
      (prevCart) => {
        const existingItem =
          prevCart.find(
            (cartItem) =>
              cartItem.id ===
                item.id &&
              cartItem.color ===
                selectedColor
          )

        /*
         * Same product + same color:
         * increase quantity.
         */
        if (existingItem) {
          return prevCart.map(
            (
              cartItem
            ) =>
              cartItem.id ===
                item.id &&
              cartItem.color ===
                selectedColor
                ? {
                    ...cartItem,

                    quantity:
                      cartItem.quantity +
                      1,
                  }
                : cartItem
          )
        }

        /*
         * New cart variant.
         */
        return [
          ...prevCart,

          {
            id: item.id,
            color:
              selectedColor,
            quantity: 1,
          },
        ]
      }
    )
  }

  /*
   * ==============================
   * REMOVE FROM CART
   * ==============================
   */
  const removeFromCart = (
    id: number,
    color: string
  ) => {
    setCart(
      (prevCart) =>
        prevCart.filter(
          (item) =>
            !(
              item.id === id &&
              item.color ===
                color
            )
        )
    )
  }

  /*
   * ==============================
   * UPDATE QUANTITY
   * ==============================
   */
  const updateQuantity = (
    id: number,
    color: string,
    quantity: number
  ) => {
    /*
     * Quantity 0 removes the item.
     */
    if (
      quantity <= 0
    ) {
      removeFromCart(
        id,
        color
      )

      return
    }

    setCart(
      (prevCart) =>
        prevCart.map(
          (item) =>
            item.id === id &&
            item.color ===
              color
              ? {
                  ...item,
                  quantity,
                }
              : item
        )
    )
  }

  /*
   * ==============================
   * CLEAR CART
   * ==============================
   */
  const clearCart = () => {
    setCart([])
  }

  /*
   * ==============================
   * CART TOTAL
   * ==============================
   *
   * IMPORTANT:
   *
   * Price comes directly from
   * products.ts.
   *
   * This means changing a price in
   * products.ts automatically updates
   * the cart.
   */
  const getCartTotal =
    () => {
      return cart.reduce(
        (
          total,
          item
        ) => {
          const product =
            getProductById(
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
    }

  /*
   * ==============================
   * CART COUNT
   * ==============================
   */
  const getCartCount =
    () => {
      return cart.reduce(
        (
          count,
          item
        ) =>
          count +
          item.quantity,
        0
      )
    }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
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

  if (
    context ===
    undefined
  ) {
    throw new Error(
      'useCart must be used within a CartProvider'
    )
  }

  return context
}