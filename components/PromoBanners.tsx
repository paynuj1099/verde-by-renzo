"use client";

import Link from "next/link";
import Image from "next/image";
import { useSiteAssets } from "@/context/SiteAssetsContext";

export default function PromoBanners() {
  const { getAsset } = useSiteAssets();

  return (
    <section className="bg-[#111914] py-16 sm:py-20 lg:py-28">
      <div className="container">
        <div className="mb-10 max-w-xl sm:mb-14">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#cda653] sm:text-xs">
            The Verde Edit
          </p>

          <h2 className="font-serif text-3xl leading-tight text-[#f2e8d5] sm:text-4xl lg:text-5xl">
            Made for life on and off the course.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 lg:gap-8">
          {/* Banner 1 - Signature Apparel */}
          <div className="group relative min-h-[360px] overflow-hidden border border-white/10 sm:min-h-[440px] lg:min-h-[560px]">
            <Image
              src={getAsset("promo-apparel")}
              alt="Signature Golf Apparel"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-[1.035]"
              priority
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#07100a]/90 via-black/20 to-black/5" />

            <div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-8 lg:p-12">
              <div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#e1ba68] sm:text-xs">
                  Signature Apparel
                </p>

                <h3 className="mb-4 max-w-md font-serif text-3xl leading-tight text-[#fff8ea] sm:text-4xl lg:text-5xl">
                  Elevated Polos for the Modern Golfer
                </h3>
              </div>

              <Link
                href="/shop"
                className="self-start border border-[#dfb65e] bg-[#dfb65e] px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#142219] transition-all hover:bg-[#edcc82] sm:px-7 sm:text-xs"
              >
                Shop Now
              </Link>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8">
            {/* Banner 2 - Course Essentials */}
            <div className="group relative min-h-[240px] overflow-hidden border border-white/10 sm:min-h-[270px]">
              <Image
                src={getAsset("promo-accessories")}
                alt="Golf Course Essentials"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-[1.035]"
                priority
              />

              <div className="absolute inset-0 bg-gradient-to-r from-[#07100a]/75 via-black/25 to-transparent" />

              <div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-8 lg:p-12">
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#e1ba68] sm:text-xs">
                    Course Essentials
                  </p>

                  <h3 className="mb-4 font-serif text-2xl text-[#fff8ea] sm:text-3xl">
                    Designed for Every Round
                  </h3>
                </div>

                <Link
                  href="/shop"
                  className="self-start border-b border-[#dfb65e] pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#f5dfad] transition-colors hover:text-white sm:text-xs"
                >
                  Shop Now
                </Link>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8">
              {/* Banner 3 - Lifestyle / Details */}
              <div className="group relative min-h-[240px] overflow-hidden border border-white/10 sm:min-h-[270px]">
                <Image
                  src={getAsset("promo-lifestyle")}
                  alt="Verde Golf Lifestyle Essentials"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-[1.035]"
                  priority
                />

                <div className="absolute inset-0 bg-gradient-to-r from-[#07100a]/80 via-black/25 to-transparent" />

                <div className="relative z-10 flex h-full flex-col justify-between p-4 sm:p-6 lg:p-8">
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#e1ba68] sm:text-xs">
                      The Details
                    </p>

                    <h3 className="mb-2 max-w-xs font-serif text-xl leading-tight text-[#fff8ea] sm:text-2xl">
                      Small Essentials. Better Rounds.
                    </h3>
                  </div>

                  <Link
                    href="/shop"
                    className="self-start border-b border-[#dfb65e] pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#f5dfad] transition-colors hover:text-white sm:text-xs"
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
  );
}