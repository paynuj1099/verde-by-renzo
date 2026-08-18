'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useProducts } from '@/context/ProductContext'

import {
  getColorClass,
  getColorDisplay,
  getColorStyle,
  getProductImage,
} from '@/lib/productUtils'

/*
 * ==============================
 * NEW ARRIVALS
 * ==============================
 *
 * Only products with:
 *
 * isNew: true
 *
 * appear here.
 */
export default function NewArrivals() {
  const { products } = useProducts()
  const newArrivals = products
    .filter((product) => product.isNew)
    .sort((a, b) => {
      const aOrder = (a as typeof a & { newArrivalOrder?: number }).newArrivalOrder ?? a.id
      const bOrder = (b as typeof b & { newArrivalOrder?: number }).newArrivalOrder ?? b.id
      return aOrder - bOrder
    })
    .slice(0, 8)

  return (
    <section className="bg-white py-12 sm:py-16 lg:py-20">

      <div className="container">

        {/* ======================= */}
        {/* SECTION TITLE */}
        {/* ======================= */}

        <h2 className="mb-8 text-center font-serif text-2xl text-gray-900 sm:mb-12 sm:text-3xl lg:text-4xl">
          New Arrivals
        </h2>

        {/* ======================= */}
        {/* PRODUCT GRID */}
        {/* ======================= */}

        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-8">

          {newArrivals.map(
            (product) => {
              /*
               * ============================
               * NEW ARRIVAL IMAGE
               * ============================
               *
               * Priority:
               *
               * 1. newArrivalImage
               * 2. normal/default image
               */
              const image =
                product.newArrivalImage ||
                getProductImage(
                  product
                )

              /*
               * Default color used when
               * linking to the product.
               */
              const defaultColor =
                product.colors[0]

              return (
                <Link
                  key={
                    product.id
                  }
                  href={`/shop/${product.id}?color=${defaultColor}`}
                  className="group block"
                >

                  {/* ======================= */}
                  {/* PRODUCT IMAGE */}
                  {/* ======================= */}

                  <div className="relative mb-3 aspect-[4/5] overflow-hidden rounded-lg bg-gray-100 sm:mb-4">

                    {image ? (

                      <Image
                        src={
                          image
                        }
                        alt={
                          product.name
                        }
                        fill
                        className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />

                    ) : (

                      <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-gray-400">
                        Image unavailable
                      </div>

                    )}

                  </div>

                  {/* ======================= */}
                  {/* PRODUCT INFORMATION */}
                  {/* ======================= */}

                  <div className="text-center">

                    {/* PRODUCT NAME */}

                    <h3 className="mb-1 line-clamp-2 text-xs text-gray-900 transition-colors group-hover:text-forest-600 sm:mb-2 sm:text-sm lg:text-base">

                      {
                        product.name
                      }

                    </h3>

                    {/* PRICE */}

                    <p className="text-sm font-semibold text-forest-600 sm:text-base lg:text-lg">

                      ₱
                      {product.price.toLocaleString(
                        'en-PH'
                      )}

                    </p>

                    {/* ======================= */}
                    {/* COLOR DOTS */}
                    {/* ======================= */}

                    {product.colors.length >
                      0 && (

                      <div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:mt-3">

                        {product.colors.map(
                          (
                            color
                          ) => (

                            <span
                              key={
                                color
                              }
                              title={
                                getColorDisplay(
                                  color
                                )
                              }
                              aria-label={
                                getColorDisplay(
                                  color
                                )
                              }
                              className={`h-2.5 w-2.5 rounded-full border border-gray-300 sm:h-3 sm:w-3 ${getColorClass(
                                color
                              )}`}
                              style={getColorStyle(color, product.colorHexes)}
                            />

                          )
                        )}

                      </div>

                    )}

                  </div>

                </Link>
              )
            }
          )}

        </div>

      </div>

    </section>
  )
}
