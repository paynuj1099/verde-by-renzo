'use client'

import {
  useState,
} from 'react'

import Image from 'next/image'
import Link from 'next/link'

import {
  useCart,
} from '@/context/CartContext'

import {
  getColorClass,
  getColorDisplay,
  getProductById,
} from '@/lib/productUtils'

import {
  AlertTriangle,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react'

interface CartModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CartModal({
  isOpen,
  onClose,
}: CartModalProps) {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
  } = useCart()

  const [
    showClearConfirmation,
    setShowClearConfirmation,
  ] = useState(false)

  if (!isOpen) {
    return null
  }

  /*
   * ============================
   * GET CART PRODUCT IMAGE
   * ============================
   *
   * Images come DIRECTLY from
   * products.ts.
   *
   * Priority:
   *
   * 1. Exact selected color
   * 2. Product default color
   * 3. First available image
   */
  const getCartProductImage = (
    productId: number,
    color: string
  ): string | null => {
    const product =
      getProductById(
        productId
      )

    if (!product) {
      return null
    }

    /*
     * Exact selected-color image.
     */
    if (
      product.images[color]
    ) {
      return product.images[
        color
      ]
    }

    /*
     * Default product color.
     */
    const defaultColor =
      product.colors[0]

    if (
      defaultColor &&
      product.images[
        defaultColor
      ]
    ) {
      return product.images[
        defaultColor
      ]
    }

    /*
     * Final fallback:
     * first image in object.
     */
    const firstImage =
      Object.values(
        product.images
      )[0]

    return (
      firstImage ||
      null
    )
  }

  /*
   * ============================
   * CLEAR CART
   * ============================
   */

  const handleRequestClearCart =
    () => {
      setShowClearConfirmation(
        true
      )
    }

  const handleCancelClearCart =
    () => {
      setShowClearConfirmation(
        false
      )
    }

  const handleConfirmClearCart =
    () => {
      clearCart()

      setShowClearConfirmation(
        false
      )
    }

  /*
   * ============================
   * CLOSE CART
   * ============================
   */

  const handleCloseCart =
    () => {
      setShowClearConfirmation(
        false
      )

      onClose()
    }

  return (
    <>

      {/* ======================= */}
      {/* BACKDROP */}
      {/* ======================= */}

      <div
        className="fixed inset-0 z-50 bg-black/50 transition-opacity"
        onClick={
          handleCloseCart
        }
      />

      {/* ======================= */}
      {/* CART SIDEBAR */}
      {/* ======================= */}

      <div className="fixed top-0 right-0 z-50 flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl sm:w-96">

        {/* ======================= */}
        {/* HEADER */}
        {/* ======================= */}

        <div className="flex items-center justify-between border-b border-gray-200 p-4 sm:p-6">

          <h2 className="font-serif text-xl font-semibold text-forest-700">
            Shopping Cart
          </h2>

          <div className="flex items-center gap-3">

            {/* CLEAR ALL */}

            {cart.length > 0 && (
              <button
                type="button"
                onClick={
                  handleRequestClearCart
                }
                className="flex items-center gap-1.5 text-xs font-medium text-red-500 transition-colors hover:text-red-600"
                aria-label="Clear all cart items"
              >

                <Trash2
                  size={15}
                />

                Clear All

              </button>
            )}

            {/* CLOSE */}

            <button
              type="button"
              onClick={
                handleCloseCart
              }
              className="text-gray-500 transition-colors hover:text-gray-700"
              aria-label="Close cart"
            >

              <X
                size={24}
              />

            </button>

          </div>

        </div>

        {/* ======================= */}
        {/* CART CONTENT */}
        {/* ======================= */}

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">

          {cart.length ===
          0 ? (

            /* ======================= */
            /* EMPTY CART */
            /* ======================= */

            <div className="flex h-full flex-col items-center justify-center text-center">

              <ShoppingCart
                size={64}
                className="mb-4 text-gray-300"
                strokeWidth={1}
              />

              <p className="mb-6 text-gray-500">
                Your cart is empty
              </p>

              <Link
                href="/shop"
                onClick={
                  handleCloseCart
                }
                className="rounded-lg bg-forest-600 px-6 py-2.5 text-white transition-colors hover:bg-forest-700"
              >
                Continue Shopping
              </Link>

            </div>

          ) : (

            /* ======================= */
            /* CART ITEMS */
            /* ======================= */

            <div className="space-y-4">

              {cart.map(
                (item) => {
                  /*
                   * Product comes from
                   * products.ts.
                   */
                  const product =
                    getProductById(
                      item.id
                    )

                  if (!product) {
                    return null
                  }

                  /*
                   * Image also comes from
                   * products.ts.
                   */
                  const productImage =
                    getCartProductImage(
                      item.id,
                      item.color
                    )

                  return (
                    <div
                      key={`${item.id}-${item.color}`}
                      className="flex gap-4 rounded-lg bg-gray-50 p-4"
                    >

                      {/* ======================= */}
                      {/* PRODUCT IMAGE */}
                      {/* ======================= */}

                      <Link
                        href={`/shop/${product.id}?color=${item.color}`}
                        onClick={
                          handleCloseCart
                        }
                        className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-gray-200"
                      >

                        {productImage ? (

                          <Image
                            key={
                              productImage
                            }
                            src={
                              productImage
                            }
                            alt={`${product.name} - ${getColorDisplay(
                              item.color
                            )}`}
                            fill
                            className="object-cover object-center"
                            sizes="80px"
                          />

                        ) : (

                          <div className="absolute inset-0 flex items-center justify-center px-2 text-center text-xs text-gray-400">
                            No Image
                          </div>

                        )}

                      </Link>

                      {/* ======================= */}
                      {/* PRODUCT INFO */}
                      {/* ======================= */}

                      <div className="min-w-0 flex-1">

                        {/* NAME */}

                        <Link
                          href={`/shop/${product.id}?color=${item.color}`}
                          onClick={
                            handleCloseCart
                          }
                        >

                          <h3 className="mb-1 truncate text-sm font-medium text-gray-900 transition-colors hover:text-forest-600">

                            {
                              product.name
                            }

                          </h3>

                        </Link>

                        {/* ======================= */}
                        {/* COLOR */}
                        {/* ======================= */}

                        <div className="mb-2 flex items-center gap-2">

                          <span
                            className={`h-3.5 w-3.5 flex-shrink-0 rounded-full border border-gray-300 ${getColorClass(
                              item.color
                            )}`}
                          />

                          <span className="text-xs text-gray-500">

                            {
                              getColorDisplay(
                                item.color
                              )
                            }

                          </span>

                        </div>

                        {/* ======================= */}
                        {/* PRICE */}
                        {/* ======================= */}

                        <p className="text-sm font-semibold text-forest-600">

                          ₱
                          {product.price.toLocaleString(
                            'en-PH'
                          )}

                        </p>

                        {/* ======================= */}
                        {/* QUANTITY */}
                        {/* ======================= */}

                        <div className="mt-3 flex items-center gap-2">

                          {/* MINUS */}

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.color,
                                item.quantity -
                                  1
                              )
                            }
                            className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 transition-colors hover:bg-gray-100"
                            aria-label="Decrease quantity"
                          >

                            <Minus
                              size={14}
                            />

                          </button>

                          {/* COUNT */}

                          <span className="w-8 text-center text-sm font-medium">

                            {
                              item.quantity
                            }

                          </span>

                          {/* PLUS */}

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.color,
                                item.quantity +
                                  1
                              )
                            }
                            className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 transition-colors hover:bg-gray-100"
                            aria-label="Increase quantity"
                          >

                            <Plus
                              size={14}
                            />

                          </button>

                          {/* REMOVE */}

                          <button
                            type="button"
                            onClick={() =>
                              removeFromCart(
                                item.id,
                                item.color
                              )
                            }
                            className="ml-auto flex h-7 w-7 items-center justify-center text-red-500 transition-colors hover:text-red-600"
                            aria-label={`Remove ${product.name} from cart`}
                          >

                            <Trash2
                              size={18}
                            />

                          </button>

                        </div>

                      </div>

                    </div>
                  )
                }
              )}

            </div>

          )}

        </div>

        {/* ======================= */}
        {/* FOOTER */}
        {/* ======================= */}

        {cart.length > 0 && (

          <div className="space-y-4 border-t border-gray-200 bg-white p-4 sm:p-6">

            {/* SUBTOTAL */}

            <div className="flex items-center justify-between text-lg font-semibold">

              <span className="text-gray-700">
                Subtotal:
              </span>

              <span className="text-forest-600">

                ₱
                {getCartTotal().toLocaleString(
                  'en-PH'
                )}

              </span>

            </div>

            {/* CHECKOUT */}

            <Link
              href="/contact-us"
              onClick={
                handleCloseCart
              }
              className="block w-full rounded-lg bg-forest-600 py-3 text-center font-semibold text-white transition-colors hover:bg-forest-700"
            >
              Proceed to Checkout
            </Link>

            {/* CONTINUE SHOPPING */}

            <Link
              href="/shop"
              onClick={
                handleCloseCart
              }
              className="block w-full text-center text-sm text-forest-600 transition-colors hover:text-forest-700"
            >
              Continue Shopping
            </Link>

          </div>

        )}

        {/* ======================= */}
        {/* CLEAR CONFIRMATION */}
        {/* ======================= */}

        {showClearConfirmation && (

          <div
            className="absolute inset-0 z-[70] flex items-center justify-center bg-black/35 p-5 backdrop-blur-[2px]"
            onClick={
              handleCancelClearCart
            }
          >

            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="clear-cart-title"
              onClick={(
                event
              ) =>
                event.stopPropagation()
              }
              className="w-full max-w-[320px] overflow-hidden rounded-2xl bg-white shadow-2xl"
            >

              {/* CONTENT */}

              <div className="px-6 pt-7 pb-6 text-center">

                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">

                  <AlertTriangle
                    size={26}
                    className="text-red-500"
                  />

                </div>

                <h3
                  id="clear-cart-title"
                  className="mb-2 font-serif text-xl font-semibold text-gray-900"
                >
                  Clear your cart?
                </h3>

                <p className="mx-auto max-w-[250px] text-sm leading-6 text-gray-500">
                  This will remove all items from your shopping cart. This action cannot be undone.
                </p>

              </div>

              {/* ACTIONS */}

              <div className="grid grid-cols-2 border-t border-gray-100">

                <button
                  type="button"
                  onClick={
                    handleCancelClearCart
                  }
                  className="border-r border-gray-100 px-4 py-4 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    handleConfirmClearCart
                  }
                  className="px-4 py-4 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  Clear Cart
                </button>

              </div>

            </div>

          </div>

        )}

      </div>

    </>
  )
}