'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'

import {
  ShoppingCart,
  Check,
  Heart,
  Eye,
} from 'lucide-react'

import {
  products,
  Product,
} from '@/data/products'

const categories = [
  {
    id: 'all',
    label: 'ALL',
  },
  {
    id: 'apparel',
    label: 'APPAREL',
  },
  {
    id: 'bags',
    label: 'BAGS',
  },
  {
    id: 'accessories',
    label: 'ACCESSORIES',
  },
]

export default function ShopPage() {
  const [
    activeCategory,
    setActiveCategory,
  ] = useState('ALL')

  const [
    selectedColors,
    setSelectedColors,
  ] = useState<
    Record<number, string>
  >({})

  const [
    addedToCart,
    setAddedToCart,
  ] = useState<
    string | null
  >(null)

  const {
    addToCart,
  } = useCart()

  const {
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
  } = useWishlist()

  const filteredProducts =
    activeCategory ===
    'ALL'
      ? products
      : products.filter(
          (product) =>
            product.category ===
            activeCategory
        )

  /*
   * ADD TO CART
   */
  const handleAddToCart = (
    product: Product
  ) => {
    const selectedColor =
      selectedColors[
        product.id
      ] ||
      product.colors[0]

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      category:
        product.category,
      color:
        selectedColor,
    })

    setAddedToCart(
      `${product.id}-${selectedColor}`
    )

    setTimeout(() => {
      setAddedToCart(null)
    }, 2000)
  }

  /*
   * WISHLIST SPECIFIC COLOR
   */
  const handleToggleWishlist = (
    product: Product
  ) => {
    const selectedColor =
      selectedColors[
        product.id
      ] ||
      product.colors[0]

    /*
     * IMPORTANT:
     * Check product ID AND color.
     */
    const isSelectedColorWishlisted =
      isInWishlist(
        product.id,
        selectedColor
      )

    /*
     * Remove only this color.
     */
    if (
      isSelectedColorWishlisted
    ) {
      removeFromWishlist(
        product.id,
        selectedColor
      )

      return
    }

    /*
     * Add only this color.
     */
    addToWishlist({
      id: product.id,
      name: product.name,
      price:
        product.price,
      category:
        product.category,

      colors: [
        selectedColor,
      ],

      description:
        product.description,
    })
  }

  const getColorDisplay = (
    color: string
  ) => {
    const colorMap: Record<
      string,
      string
    > = {
      forest:
        'Forest Green',

      black:
        'Black',

      gold:
        'Gold',

      ivory:
        'Ivory',

      navy:
        'Navy Blue',

      cream:
        'Cream',

      khaki:
        'Khaki',

      white:
        'White',

      burgundy:
        'Burgundy',

      'green-gold':
        'Green / Gold',
    }

    return (
      colorMap[color] ||
      color
    )
  }

  const getColorClass = (
    color: string
  ) => {
    const colorClasses: Record<
      string,
      string
    > = {
      forest:
        'bg-[#123C2D]',

      black:
        'bg-black',

      gold:
        'bg-[#C9A15B]',

      ivory:
        'bg-[#F5F1E8]',

      navy:
        'bg-[#1F2A44]',

      cream:
        'bg-[#FFF4D6]',

      khaki:
        'bg-[#C3B091]',

      white:
        'bg-white',

      burgundy:
        'bg-[#800020]',

      'green-gold':
        'bg-[repeating-linear-gradient(45deg,#123C2D_0px,#123C2D_6px,#C9A15B_6px,#C9A15B_12px)]',
    }

    return (
      colorClasses[color] ||
      'bg-gray-400'
    )
  }

  return (
    <main className="min-h-screen bg-white pt-24 pb-12 sm:pt-28 sm:pb-16 lg:pt-32 lg:pb-20">

      <div className="container">

        {/* ======================= */}
        {/* PAGE HEADER */}
        {/* ======================= */}

        <div className="mb-8 text-center sm:mb-12">

          <h1 className="mb-4 font-serif text-3xl text-forest-700 sm:text-4xl lg:text-5xl">
            Shop Collection
          </h1>

          <p className="mx-auto max-w-2xl text-gray-600">
            Discover our premium
            collection of golf
            apparel and accessories.
            Pre-order now!
          </p>

        </div>

        {/* ======================= */}
        {/* CATEGORY FILTERS */}
        {/* ======================= */}

        <div className="mb-8 flex flex-wrap justify-center gap-3 sm:mb-12 sm:gap-4">

          {categories.map(
            (category) => (
              <button
                key={
                  category.id
                }
                type="button"
                onClick={() =>
                  setActiveCategory(
                    category.label
                  )
                }
                className={`rounded-full px-4 py-2 text-xs uppercase tracking-wider transition-all sm:text-sm ${
                  activeCategory ===
                  category.label
                    ? 'bg-forest-600 font-semibold text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {
                  category.label
                }
              </button>
            )
          )}

        </div>

        {/* ======================= */}
        {/* PRODUCT GRID */}
        {/* ======================= */}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8 xl:grid-cols-4">

          {filteredProducts.map(
            (product) => {
              /*
               * Current selected color.
               */
              const selectedColor =
                selectedColors[
                  product.id
                ] ||
                product.colors[0]

              /*
               * Current image.
               */
              const selectedImage =
                product.images[
                  selectedColor
                ] ||
                product.images[
                  product.colors[0]
                ]

              /*
               * Cart state includes color.
               */
              const isAdded =
                addedToCart ===
                `${product.id}-${selectedColor}`

              /*
               * IMPORTANT:
               * Wishlist state also
               * includes selected color.
               */
              const isSelectedColorWishlisted =
                isInWishlist(
                  product.id,
                  selectedColor
                )

              /*
               * Keep Golf Cap colors
               * on one line.
               */
              const hasManyColors =
                product.colors
                  .length > 6

              return (
                <div
                  key={
                    product.id
                  }
                  className="group flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:-translate-y-1 hover:shadow-lg"
                >

                  {/* ======================= */}
                  {/* PRODUCT IMAGE */}
                  {/* ======================= */}

                  <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">

                    <Link
                      href={`/shop/${product.id}?color=${selectedColor}`}
                      className="absolute inset-0"
                    >

                      <Image
                        key={
                          selectedImage
                        }
                        src={
                          selectedImage
                        }
                        alt={`${product.name} - ${getColorDisplay(
                          selectedColor
                        )}`}
                        fill
                        className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                      />

                    </Link>

                    {/* CATEGORY */}
                    <div className="absolute top-3 left-3 z-10 rounded bg-forest-600 px-2 py-1 text-xs uppercase tracking-wide text-white">
                      {
                        product.category
                      }
                    </div>

                    {/* ======================= */}
                    {/* WISHLIST */}
                    {/* ======================= */}

                    <button
                      type="button"
                      onClick={() =>
                        handleToggleWishlist(
                          product
                        )
                      }
                      className="absolute top-3 right-3 z-20 rounded-full bg-white p-2 shadow-md transition-all hover:scale-105 hover:bg-gray-50"
                      aria-label={
                        isSelectedColorWishlisted
                          ? `Remove ${getColorDisplay(
                              selectedColor
                            )} from wishlist`
                          : `Add ${getColorDisplay(
                              selectedColor
                            )} to wishlist`
                      }
                    >

                      <Heart
                        size={18}
                        className={
                          isSelectedColorWishlisted
                            ? 'fill-red-500 text-red-500'
                            : 'text-gray-400'
                        }
                      />

                    </button>

                  </div>

                  {/* ======================= */}
                  {/* PRODUCT INFO */}
                  {/* ======================= */}

                  <div className="flex flex-1 flex-col p-4 sm:p-5">

                    {/* PRODUCT NAME */}
                    <Link
                      href={`/shop/${product.id}?color=${selectedColor}`}
                    >
                      <h3 className="mb-2 text-base font-semibold text-gray-900 transition-colors hover:text-forest-600 sm:text-lg">
                        {
                          product.name
                        }
                      </h3>
                    </Link>

                    {/* DESCRIPTION */}
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

                    {/* ======================= */}
                    {/* COLOR SELECTION */}
                    {/* ======================= */}

                    <div className="mb-4">

                      <p className="mb-2 text-xs text-gray-500">

                        Color:{' '}

                        <span className="font-medium text-gray-700">
                          {getColorDisplay(
                            selectedColor
                          )}
                        </span>

                      </p>

                      <div className="flex min-h-8 flex-nowrap items-center gap-2">

                        {product.colors.map(
                          (color) => {
                            /*
                             * Each swatch can
                             * independently be
                             * wishlisted.
                             */
                            const colorIsWishlisted =
                              isInWishlist(
                                product.id,
                                color
                              )

                            return (
                              <button
                                key={
                                  color
                                }
                                type="button"
                                onClick={() =>
                                  setSelectedColors(
                                    (
                                      prev
                                    ) => ({
                                      ...prev,

                                      [product.id]:
                                        color,
                                    })
                                  )
                                }
                                className={`relative flex-shrink-0 rounded-full border-2 transition-all ${getColorClass(
                                  color
                                )} ${
                                  hasManyColors
                                    ? 'h-6 w-6'
                                    : 'h-8 w-8'
                                } ${
                                  selectedColor ===
                                  color
                                    ? 'scale-110 border-forest-600 ring-2 ring-forest-600/20'
                                    : 'border-gray-300 hover:border-gray-500'
                                }`}
                                title={`${getColorDisplay(
                                  color
                                )}${
                                  colorIsWishlisted
                                    ? ' • Wishlisted'
                                    : ''
                                }`}
                                aria-label={`Select ${getColorDisplay(
                                  color
                                )}`}
                              >

                                {/*
                                 * Small red marker means
                                 * this exact color is in
                                 * the wishlist.
                                 */}
                                {colorIsWishlisted && (
                                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border border-white bg-red-500" />
                                )}

                              </button>
                            )
                          }
                        )}

                      </div>

                    </div>

                    {/* ======================= */}
                    {/* ACTION BUTTONS */}
                    {/* ======================= */}

                    <div className="mt-auto">

                      {/* VIEW DETAILS */}
                      <Link
                        href={`/shop/${product.id}?color=${selectedColor}`}
                        className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg border border-forest-600 py-2.5 text-sm font-semibold text-forest-600 transition-all hover:bg-forest-50"
                      >

                        <Eye
                          size={17}
                        />

                        View Details

                      </Link>

                      {/* ADD TO CART */}
                      <button
                        type="button"
                        onClick={() =>
                          handleAddToCart(
                            product
                          )
                        }
                        disabled={
                          isAdded
                        }
                        className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 font-semibold transition-all ${
                          isAdded
                            ? 'bg-green-600 text-white'
                            : 'bg-forest-600 text-white hover:bg-forest-700'
                        }`}
                      >

                        {isAdded ? (
                          <>
                            <Check
                              size={
                                18
                              }
                            />

                            Added to Cart
                          </>
                        ) : (
                          <>
                            <ShoppingCart
                              size={
                                18
                              }
                            />

                            Add to Cart
                          </>
                        )}

                      </button>

                    </div>

                  </div>

                </div>
              )
            }
          )}

        </div>

      </div>

    </main>
  )
}