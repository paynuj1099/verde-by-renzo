'use client'

import {
  useEffect,
  useRef,
  useState,
} from 'react'

import Image from 'next/image'
import Link from 'next/link'

import type { Product } from '@/data/products'
import { useProducts } from '@/context/ProductContext'

import {
  getProductImage,
} from '@/lib/productUtils'

import {
  Search as SearchIcon,
  SearchX,
  TrendingUp,
  X,
} from 'lucide-react'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SearchModal({
  isOpen,
  onClose,
}: SearchModalProps) {
  const { products } = useProducts()
  const popularProducts = products.filter((product) => product.isPopular).slice(0, 4)
  const trendingSearches = [
    ...popularProducts.map((product) => product.name),
    ...products.filter((product) => product.isNew && !product.isPopular).slice(0, 2).map((product) => product.name),
    'Accessories',
  ].slice(0, 7)
  const [
    searchQuery,
    setSearchQuery,
  ] = useState('')

  const [
    searchResults,
    setSearchResults,
  ] = useState<
    Product[]
  >([])

  const inputRef =
    useRef<HTMLInputElement>(
      null
    )

  /*
   * ============================
   * MODAL
   * ============================
   */
  useEffect(() => {
    if (isOpen) {
      setTimeout(
        () => {
          inputRef.current?.focus()
        },
        100
      )

      document.body.style.overflow =
        'hidden'
    } else {
      document.body.style.overflow =
        'unset'

      setSearchQuery('')
      setSearchResults([])
    }

    const handleEscape = (
      event: KeyboardEvent
    ) => {
      if (
        event.key ===
        'Escape'
      ) {
        onClose()
      }
    }

    window.addEventListener(
      'keydown',
      handleEscape
    )

    return () => {
      window.removeEventListener(
        'keydown',
        handleEscape
      )

      document.body.style.overflow =
        'unset'
    }
  }, [
    isOpen,
    onClose,
  ])

  /*
   * ============================
   * SEARCH
   * ============================
   */
  useEffect(() => {
    const query =
      searchQuery
        .trim()
        .toLowerCase()

    if (!query) {
      setSearchResults([])
      return
    }

    const filtered =
      products.filter(
        (product) => {
          const searchable =
            [
              product.name,
              product.category,
              product.description,

              ...product.colors,

              ...product.materials,

              ...product.features,
            ]
              .join(' ')
              .toLowerCase()

          return searchable.includes(
            query
          )
        }
      )

    setSearchResults(
      filtered
    )
  }, [
    searchQuery,
    products,
  ])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm">

      <div className="w-full bg-white shadow-2xl">

        <div className="container py-6">

          {/* HEADER */}
          <div className="mb-6 flex items-center gap-4">

            <div className="relative flex-1">

              <SearchIcon
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={24}
              />

              <input
                ref={
                  inputRef
                }
                type="text"
                value={
                  searchQuery
                }
                onChange={(
                  event
                ) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
                placeholder="Search products..."
                className="w-full rounded-xl border-2 border-gray-200 py-4 pl-14 pr-4 text-lg transition-colors focus:border-forest-500 focus:outline-none"
              />

            </div>

            <button
              type="button"
              onClick={
                onClose
              }
              className="rounded-full p-3 transition-colors hover:bg-gray-100"
              aria-label="Close search"
            >

              <X
                size={24}
              />

            </button>

          </div>

          {/* CONTENT */}
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto">

            {searchQuery.trim() ? (

              <div>

                {searchResults.length >
                0 ? (

                  <>

                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">

                      Products (
                      {
                        searchResults.length
                      }
                      )

                    </h3>

                    <div className="space-y-2">

                      {searchResults.map(
                        (
                          product
                        ) => {
                          const image =
                            getProductImage(
                              product
                            )

                          return (
                            <Link
                              key={
                                product.id
                              }
                              href={`/shop/${product.id}`}
                              onClick={
                                onClose
                              }
                              className="group flex items-center gap-4 rounded-lg p-4 transition-colors hover:bg-forest-50"
                            >

                              {/* IMAGE */}
                              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">

                                {image ? (
                                  <Image
                                    src={
                                      image
                                    }
                                    alt={
                                      product.name
                                    }
                                    fill
                                    className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
                                    sizes="64px"
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                                    No Image
                                  </div>
                                )}

                              </div>

                              {/* INFO */}
                              <div className="min-w-0 flex-1">

                                <h4 className="font-semibold text-gray-900 transition-colors group-hover:text-forest-600">

                                  {
                                    product.name
                                  }

                                </h4>

                                <p className="text-sm capitalize text-gray-500">

                                  {
                                    product.category.toLowerCase()
                                  }

                                </p>

                              </div>

                              {/* PRICE */}
                              <div className="font-semibold text-forest-600">

                                ₱
                                {product.price.toLocaleString(
                                  'en-PH'
                                )}

                              </div>

                            </Link>
                          )
                        }
                      )}

                    </div>

                  </>

                ) : (

                  <div className="py-12 text-center">

                    <SearchX
                      size={64}
                      className="mx-auto mb-4 text-gray-300"
                      strokeWidth={
                        1.5
                      }
                    />

                    <h3 className="mb-2 text-xl font-semibold text-gray-900">
                      No results found
                    </h3>

                    <p className="text-gray-600">
                      Try searching for another product or category.
                    </p>

                  </div>

                )}

              </div>

            ) : (

              <div className="space-y-8">

                {/* TRENDING */}
                <div>

                  <div className="mb-4 flex items-center gap-2">

                    <TrendingUp
                      size={20}
                      className="text-forest-600"
                    />

                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                      Trending Searches
                    </h3>

                  </div>

                  <div className="flex flex-wrap gap-2">

                    {trendingSearches.map(
                      (
                        term
                      ) => (

                        <button
                          key={
                            term
                          }
                          type="button"
                          onClick={() =>
                            setSearchQuery(
                              term
                            )
                          }
                          className="rounded-full bg-forest-50 px-4 py-2 text-sm font-medium text-forest-700 transition-colors hover:bg-forest-100"
                        >

                          {
                            term
                          }

                        </button>

                      )
                    )}

                  </div>

                </div>

                {/* POPULAR */}
                <div>

                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Popular Products
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2">

                    {popularProducts.map(
                      (
                        product
                      ) => {
                        const image =
                          getProductImage(
                            product
                          )

                        return (
                          <Link
                            key={
                              product.id
                            }
                            href={`/shop/${product.id}`}
                            onClick={
                              onClose
                            }
                            className="group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-forest-50"
                          >

                            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">

                              {image && (
                                <Image
                                  src={
                                    image
                                  }
                                  alt={
                                    product.name
                                  }
                                  fill
                                  className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
                                  sizes="56px"
                                />
                              )}

                            </div>

                            <div className="min-w-0 flex-1">

                              <h4 className="truncate font-medium text-gray-900 transition-colors group-hover:text-forest-600">

                                {
                                  product.name
                                }

                              </h4>

                              <p className="text-sm font-medium text-forest-600">

                                ₱
                                {product.price.toLocaleString(
                                  'en-PH'
                                )}

                              </p>

                            </div>

                          </Link>
                        )
                      }
                    )}

                  </div>

                </div>

                {/* QUICK LINKS */}
                <div>

                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Quick Links
                  </h3>

                  <div className="grid gap-2 sm:grid-cols-2">

                    <Link
                      href="/shop"
                      onClick={
                        onClose
                      }
                      className="rounded-lg p-3 text-gray-700 transition-colors hover:bg-forest-50 hover:text-forest-600"
                    >
                      All Products →
                    </Link>

                    <Link
                      href="/wishlist"
                      onClick={
                        onClose
                      }
                      className="rounded-lg p-3 text-gray-700 transition-colors hover:bg-forest-50 hover:text-forest-600"
                    >
                      Wishlist →
                    </Link>

                    <Link
                      href="/size-guide"
                      onClick={
                        onClose
                      }
                      className="rounded-lg p-3 text-gray-700 transition-colors hover:bg-forest-50 hover:text-forest-600"
                    >
                      Size Guide →
                    </Link>

                    <Link
                      href="/blog"
                      onClick={
                        onClose
                      }
                      className="rounded-lg p-3 text-gray-700 transition-colors hover:bg-forest-50 hover:text-forest-600"
                    >
                      Blog →
                    </Link>

                    <Link
                      href="/contact-us"
                      onClick={
                        onClose
                      }
                      className="rounded-lg p-3 text-gray-700 transition-colors hover:bg-forest-50 hover:text-forest-600"
                    >
                      Contact Us →
                    </Link>

                  </div>

                </div>

              </div>

            )}

          </div>

        </div>

      </div>

    </div>
  )
}
