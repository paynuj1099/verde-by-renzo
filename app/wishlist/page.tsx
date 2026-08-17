'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import {
  useWishlist,
} from '@/context/WishlistContext'

import {
  useCart,
} from '@/context/CartContext'

import {
  productRequiresGloveHand,
  productRequiresSize,
} from '@/data/productOptions'

import {
  getColorClass,
  getColorDisplay,
  getProductById,
  getProductImage,
} from '@/lib/productUtils'

import {
  Check,
  Eye,
  Heart,
  ShoppingCart,
  Trash2,
} from 'lucide-react'

export default function WishlistPage() {
  const {
    wishlist,
    removeFromWishlist,
  } = useWishlist()

  const {
    addToCart,
  } = useCart()

  const [
    addedToCart,
    setAddedToCart,
  ] = useState<string | null>(
    null
  )

  /*
   * Turn each saved color into
   * its own visual wishlist card.
   *
   * Example:
   *
   * {
   *   id: 1,
   *   colors: [
   *     'forest',
   *     'black'
   *   ]
   * }
   *
   * becomes two cards.
   */
  const wishlistItems =
    wishlist.flatMap(
      (item) => {
        const product =
          getProductById(
            item.id
          )

        if (!product) {
          return []
        }

        return item.colors.map(
          (color) => ({
            product,
            color,
          })
        )
      }
    )

  /*
   * ============================
   * ADD SAVED VARIANT TO CART
   * ============================
   *
   * Only products that do NOT
   * require extra selections are
   * added directly here.
   *
   * Products requiring size / hand
   * selection are sent to their
   * Product Details page instead.
   */
  const handleAddToCart = (
    productId: number,
    color: string
  ) => {
    addToCart({
      id: productId,
      color,
    })

    const variantKey =
      `${productId}-${color}`

    setAddedToCart(
      variantKey
    )

    window.setTimeout(() => {
      setAddedToCart(
        (current) =>
          current === variantKey
            ? null
            : current
      )
    }, 2000)
  }

  return (
    <main className="min-h-screen bg-white pt-24 pb-12 sm:pt-28 sm:pb-16 lg:pt-32 lg:pb-20">

      <div className="container">

        {/* ======================= */}
        {/* HEADER */}
        {/* ======================= */}

        <div className="mb-8 text-center sm:mb-12">

          <h1 className="mb-4 font-serif text-3xl text-forest-700 sm:text-4xl lg:text-5xl">
            My Wishlist
          </h1>

          <p className="mx-auto max-w-2xl text-gray-600">
            Your favorite items saved for later
          </p>

        </div>

        {/* ======================= */}
        {/* EMPTY */}
        {/* ======================= */}

        {wishlistItems.length ===
        0 ? (

          <div className="flex flex-col items-center justify-center py-16 text-center">

            <Heart
              size={80}
              className="mb-6 text-gray-300"
              strokeWidth={1}
            />

            <h2 className="mb-2 text-xl font-semibold text-gray-700">
              Your wishlist is empty
            </h2>

            <p className="mb-8 text-gray-500">
              Start adding items you love!
            </p>

            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-lg bg-forest-600 px-8 py-3 text-white transition-colors hover:bg-forest-700"
            >

              <ShoppingCart
                size={18}
              />

              Browse Products

            </Link>

          </div>

        ) : (

          <>

            {/* COUNT */}
            <div className="mb-6 text-center">

              <p className="text-gray-600">

                {
                  wishlistItems.length
                }{' '}

                {wishlistItems.length ===
                1
                  ? 'item'
                  : 'items'}{' '}

                in your wishlist

              </p>

            </div>

            {/* GRID */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8 xl:grid-cols-4">

              {wishlistItems.map(
                ({
                  product,
                  color,
                }) => {
                  const image =
                    getProductImage(
                      product,
                      color
                    )

                  const variantKey =
                    `${product.id}-${color}`

                  const isAdded =
                    addedToCart ===
                    variantKey

                  const requiresOptions =
                    productRequiresSize(
                      product.id
                    ) ||
                    productRequiresGloveHand(
                      product.id
                    )

                  const productDetailsHref =
                    `/shop/${product.id}?color=${encodeURIComponent(
                      color
                    )}`

                  return (
                    <div
                      key={variantKey}
                      className="group flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:-translate-y-1 hover:shadow-lg"
                    >

                      {/* IMAGE */}
                      <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">

                        <Link
                          href={
                            productDetailsHref
                          }
                          className="absolute inset-0"
                        >

                          {image ? (
                            <Image
                              src={
                                image
                              }
                              alt={`${product.name} - ${getColorDisplay(
                                color
                              )}`}
                              fill
                              className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
                              Image unavailable
                            </div>
                          )}

                        </Link>

                        {/* CATEGORY */}
                        <div className="absolute top-3 left-3 z-10 rounded bg-forest-600 px-2 py-1 text-xs uppercase tracking-wide text-white">

                          {
                            product.category
                          }

                        </div>

                        {/* HEART */}
                        <button
                          type="button"
                          onClick={() =>
                            removeFromWishlist(
                              product.id,
                              color
                            )
                          }
                          className="absolute top-3 right-3 z-20 rounded-full bg-white p-2 shadow-md transition-all hover:scale-105 hover:bg-red-50"
                          aria-label={`Remove ${getColorDisplay(
                            color
                          )} ${product.name} from wishlist`}
                        >

                          <Heart
                            size={18}
                            className="fill-red-500 text-red-500"
                          />

                        </button>

                      </div>

                      {/* INFO */}
                      <div className="flex flex-1 flex-col p-4 sm:p-5">

                        <Link
                          href={
                            productDetailsHref
                          }
                        >

                          <h3 className="mb-2 text-base font-semibold text-gray-900 transition-colors hover:text-forest-600 sm:text-lg">

                            {
                              product.name
                            }

                          </h3>

                        </Link>

                        <p className="mb-3 line-clamp-2 min-h-[40px] text-sm text-gray-600">

                          {
                            product.description
                          }

                        </p>

                        {/* PRICE */}
                        <div className="mb-4 text-xl font-bold text-forest-600">

                          ₱
                          {product.price.toLocaleString(
                            'en-PH'
                          )}

                        </div>

                        {/* COLOR */}
                        <div className="mb-4">

                          <p className="mb-2 text-xs text-gray-500">

                            Color:{' '}

                            <span className="font-medium text-gray-700">

                              {
                                getColorDisplay(
                                  color
                                )
                              }

                            </span>

                          </p>

                          <div className="flex items-center gap-2">

                            <div
                              className={`h-8 w-8 rounded-full border-2 border-gray-300 ${getColorClass(
                                color
                              )}`}
                              title={
                                getColorDisplay(
                                  color
                                )
                              }
                            />

                            <span className="text-xs text-gray-500">

                              {
                                getColorDisplay(
                                  color
                                )
                              }

                            </span>

                          </div>

                        </div>

                        {/* ACTIONS */}
                        <div className="mt-auto">

                          <Link
                            href={
                              productDetailsHref
                            }
                            className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg border border-forest-600 py-2.5 text-sm font-semibold text-forest-600 transition-all hover:bg-forest-50"
                          >

                            <Eye
                              size={17}
                            />

                            View Details

                          </Link>

                          {/*
                           * Polo / Glove and any
                           * future products with
                           * required options must go
                           * through Product Details.
                           */}
                          {requiresOptions ? (
                            <Link
                              href={
                                productDetailsHref
                              }
                              className="flex w-full items-center justify-center gap-2 rounded-lg bg-forest-600 py-2.5 font-semibold text-white transition-all hover:bg-forest-700"
                            >

                              <ShoppingCart
                                size={18}
                              />

                              Choose Options

                            </Link>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                handleAddToCart(
                                  product.id,
                                  color
                                )
                              }
                              disabled={
                                isAdded
                              }
                              className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 font-semibold transition-all duration-200 ${
                                isAdded
                                  ? 'scale-[1.02] bg-green-600 text-white shadow-md'
                                  : 'bg-forest-600 text-white hover:bg-forest-700 active:scale-[0.98]'
                              }`}
                              aria-live="polite"
                            >

                              {isAdded ? (
                                <>
                                  <Check
                                    size={18}
                                    className="animate-[pulse_700ms_ease-in-out_1]"
                                  />

                                  Added to Cart
                                </>
                              ) : (
                                <>
                                  <ShoppingCart
                                    size={18}
                                  />

                                  Add to Cart
                                </>
                              )}

                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              removeFromWishlist(
                                product.id,
                                color
                              )
                            }
                            className="mt-2 flex w-full items-center justify-center gap-2 text-sm font-medium text-red-500 transition-colors hover:text-red-600"
                          >

                            <Trash2
                              size={16}
                            />

                            Remove

                          </button>

                        </div>

                      </div>

                    </div>
                  )
                }
              )}

            </div>

          </>

        )}

      </div>

    </main>
  )
}
