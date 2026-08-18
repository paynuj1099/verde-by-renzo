'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSiteAssets } from '@/context/SiteAssetsContext'

export default function PromoBanners() {
  const { getAsset } = useSiteAssets()
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Banner 1 - Signature Apparel */}
          <div className="relative rounded-lg overflow-hidden group min-h-[300px] sm:min-h-[400px] lg:min-h-[500px]">
            
            {/* Background Image */}
            <Image
              src={getAsset('promo-apparel')}
              alt="Signature Golf Apparel"
              fill
              className="object-cover object-center"
              priority
            />

            {/* Optional dark overlay for text readability */}
            <div className="absolute inset-0 bg-black/20" />

            <div className="relative z-10 h-full flex flex-col justify-between p-6 sm:p-8 lg:p-12">
              <div>
                <p className="text-xs sm:text-sm uppercase tracking-widest text-white/80 mb-2">
                  Signature Apparel
                </p>

                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-white mb-3 sm:mb-4">
                  Elevated Polos for the Modern Golfer
                </h3>
              </div>

              <Link
                href="/shop"
                className="self-start px-5 sm:px-6 py-2.5 sm:py-3 bg-white hover:bg-forest-600 hover:text-white transition-all text-xs sm:text-sm uppercase tracking-wider font-semibold rounded"
              >
                Shop Now
              </Link>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8">
            {/* Banner 2 - Course Essentials */}
            <div className="relative bg-gray-200 rounded-lg overflow-hidden group min-h-[200px] sm:min-h-[240px]">

            {/* Background Image */}
            <Image
              src={getAsset('promo-accessories')}
              alt="Signature Golf Apparel"
              fill
              className="object-cover object-center"
              priority
            />

            {/* Optional dark overlay for text readability */}
            <div className="absolute inset-0 bg-black/20" />

              <div className="relative h-full flex flex-col justify-between p-6 sm:p-8 lg:p-12">
                <div>
                  <p className="text-xs sm:text-sm uppercase tracking-widest text-white mb-2">
                    Course Essentials
                  </p>

                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-serif text-white mb-3 sm:mb-4">
                    Designed for Every Round
                  </h3>
                </div>
                <Link
                  href="/shop"
                  className="self-start px-5 sm:px-6 py-2.5 sm:py-3 bg-white hover:bg-forest-600 hover:text-white transition-all text-xs sm:text-sm uppercase tracking-wider font-semibold rounded"
                >
                  Shop Now
                </Link>
              </div>
            </div>

            {/* Bottom Row - Only Footwear Banner Remains */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8">
              {/* Banner 3 - Footwear */}
              <div className="relative bg-gray-200 rounded-lg overflow-hidden group min-h-[200px] sm:min-h-[240px]">
                {/* Background Image */}
                <Image
                  src={getAsset('promo-lifestyle')}
                  alt="Signature Golf Apparel"
                  fill
                  className="object-cover object-center"
                  priority
                />

                {/* Optional dark overlay for text readability */}
                <div className="absolute inset-0 bg-black/20" />

                <div className="relative h-full flex flex-col justify-between p-4 sm:p-6 lg:p-8">
                  <div>
                    <p className="text-[10px] sm:text-xs uppercase tracking-widest text-gray-600 mb-1 sm:mb-2">
                      The Details
                    </p>
                    <h3 className="text-sm sm:text-base lg:text-xl font-serif text-gray-900 mb-1 sm:mb-2 leading-tight">
                      Small Essentials. Better Rounds.
                    </h3>
                  </div>
                  <Link
                    href="/shop"
                    className="self-start px-3 sm:px-4 py-2 bg-white hover:bg-forest-600 hover:text-white transition-all text-[10px] sm:text-xs uppercase tracking-wider font-semibold rounded"
                  >
                    Shop Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
