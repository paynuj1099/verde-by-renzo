"use client";

import Image from "next/image";
import Link from "next/link";
import { useProducts } from "@/context/ProductContext";

import {
  getColorClass,
  getColorDisplay,
  getColorStyle,
  getProductImage,
} from "@/lib/productUtils";

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
  const { products } = useProducts();
  const newArrivals = products
    .filter((product) => product.isNew)
    .sort((a, b) => {
      const aOrder =
        (a as typeof a & { newArrivalOrder?: number }).newArrivalOrder ?? a.id;
      const bOrder =
        (b as typeof b & { newArrivalOrder?: number }).newArrivalOrder ?? b.id;
      return aOrder - bOrder;
    })
    .slice(0, 8);

  return (
    <section className="bg-[#f4f0e7] py-16 sm:py-20 lg:py-28">
      <div className="container">
        {/* ======================= */}
        {/* SECTION TITLE */}
        {/* ======================= */}

        <div className="mb-10 text-center sm:mb-14">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a47b2b] sm:text-xs">
            The latest collection
          </p>
          <h2 className="font-serif text-3xl tracking-[-0.02em] text-[#142219] sm:text-4xl lg:text-5xl">
            New Arrivals
          </h2>
          <div className="mx-auto mt-5 h-px w-16 bg-[#c69b47]" />
        </div>

        {/* ======================= */}
        {/* PRODUCT GRID */}
        {/* ======================= */}

        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-8">
          {newArrivals.map((product) => {
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
            const image = product.newArrivalImage || getProductImage(product);

            /*
             * Default color used when
             * linking to the product.
             */
            const defaultColor = product.colors[0];

            return (
              <Link
                key={product.id}
                href={`/shop/${product.id}?color=${defaultColor}`}
                className="group block"
              >
                {/* ======================= */}
                {/* PRODUCT IMAGE */}
                {/* ======================= */}

                <div className="relative mb-4 aspect-[4/5] overflow-hidden bg-[#ebe6dc] shadow-[0_10px_28px_rgba(22,34,25,0.06)] sm:mb-5">
                  {image ? (
                    <Image
                      src={image}
                      alt={product.name}
                      fill
                      className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
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

                  <h3 className="mb-1 line-clamp-2 font-medium tracking-wide text-[#18231b] transition-colors group-hover:text-[#9c7428] sm:mb-2 sm:text-sm lg:text-base">
                    {product.name}
                  </h3>

                  {/* PRICE */}

                  <p className="text-sm font-semibold text-[#27422f] sm:text-base lg:text-lg">
                    ₱{product.price.toLocaleString("en-PH")}
                  </p>

                  {/* ======================= */}
                  {/* COLOR DOTS */}
                  {/* ======================= */}

                  {product.colors.length > 0 && (
                    <div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:mt-3">
                      {product.colors.map((color) => (
                        <span
                          key={color}
                          title={getColorDisplay(color)}
                          aria-label={getColorDisplay(color)}
                          className={`h-2.5 w-2.5 rounded-full border border-gray-300 sm:h-3 sm:w-3 ${getColorClass(
                            color,
                          )}`}
                          style={getColorStyle(color, product.colorHexes)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
