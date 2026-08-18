'use client'

import {
  useState,
} from 'react'

import Image from 'next/image'
import Link from 'next/link'
import { useSiteAssets } from '@/context/SiteAssetsContext'

import {
  ArrowRight,
  Expand,
  Hand,
  Mail,
  Ruler,
  Shirt,
  X,
} from 'lucide-react'

type GuideImage = {
  id: string
  title: string
  subtitle: string
  image: string
  alt: string
  icon: 'polo' | 'glove'
}

const guides: GuideImage[] = [
  {
    id:
      'performance-polo',
    title:
      'Performance Polo Size Guide',
    subtitle:
      'Chest, shoulder, body length, and sleeve measurements for our Performance Polo.',
    image:
      'size-guide-polo',
    alt:
      'Verde by Renzo Performance Polo size guide with measurement instructions and size chart',
    icon:
      'polo',
  },
  {
    id:
      'golf-glove',
    title:
      'Golf Glove Size Guide',
    subtitle:
      'Measure your dominant hand circumference to find the best glove size.',
    image:
      'size-guide-glove',
    alt:
      'Verde by Renzo Golf Glove size guide with hand measurement instructions and size chart',
    icon:
      'glove',
  },
]

export default function SizeGuidePage() {
  const { getAsset } = useSiteAssets()
  const [
    selectedGuide,
    setSelectedGuide,
  ] = useState<
    GuideImage | null
  >(null)

  return (
    <>
      <main className="min-h-screen bg-gray-50 pt-24 pb-14 sm:pt-28 sm:pb-16 lg:pt-32 lg:pb-20">

        <div className="container mx-auto max-w-7xl px-4 sm:px-6">

          {/* ======================= */}
          {/* PAGE HEADER */}
          {/* ======================= */}

          <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-14">

            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-gold-600">
              Verde by Renzo
            </p>

            <h1 className="mb-4 font-serif text-4xl text-forest-700 sm:text-5xl lg:text-6xl">
              Size Guide
            </h1>

            <p className="text-base leading-relaxed text-gray-600 sm:text-lg">
              Find your best fit before placing your pre-order. Select a guide below and compare the measurements with an item you already own.
            </p>

          </div>

          {/* ======================= */}
          {/* QUICK MEASURING NOTE */}
          {/* ======================= */}

          <div className="mb-10 rounded-2xl border border-gold-200 bg-gold-50 p-5 sm:p-6">

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white">
                <Ruler
                  size={22}
                  className="text-gold-600"
                />
              </div>

              <div>

                <h2 className="mb-1 font-semibold text-forest-700">
                  Measure before you order
                </h2>

                <p className="text-sm leading-relaxed text-gray-700">
                  For the most accurate fit, follow the measuring instructions shown in each guide. If you are between sizes, use the fit notes in the guide or contact us for assistance.
                </p>

              </div>

            </div>

          </div>

          {/* ======================= */}
          {/* SIZE GUIDE CARDS */}
          {/* ======================= */}

          <div className="space-y-10">

            {guides.map(
              (
                guide,
                index
              ) => {
                const Icon =
                  guide.icon ===
                  'polo'
                    ? Shirt
                    : Hand

                return (
                  <section
                    id={
                      guide.id
                    }
                    key={
                      guide.title
                    }
                    className="scroll-mt-28 overflow-hidden rounded-2xl bg-white shadow-md"
                  >

                    <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">

                      <div className="flex items-start gap-3">

                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-forest-50">
                          <Icon
                            size={22}
                            className="text-forest-600"
                          />
                        </div>

                        <div>

                          <h2 className="font-serif text-2xl text-forest-700 sm:text-3xl">
                            {guide.title}
                          </h2>

                          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-gray-600">
                            {guide.subtitle}
                          </p>

                        </div>

                      </div>

                      <button
                        type="button"
                        onClick={
                          () =>
                            setSelectedGuide(
                              guide
                            )
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-forest-600 px-4 py-2.5 text-sm font-semibold text-forest-700 transition-colors hover:bg-forest-50"
                      >
                        <Expand
                          size={17}
                        />
                        View Full Size
                      </button>

                    </div>

                    <button
                      type="button"
                      onClick={
                        () =>
                          setSelectedGuide(
                            guide
                          )
                      }
                      className="block w-full bg-[#f7f2ea] text-left"
                      aria-label={`Open ${guide.title}`}
                    >

                      <div className="relative w-full">

                        <Image
                          src={
                            getAsset(guide.image)
                          }
                          alt={
                            guide.alt
                          }
                          width={
                            index === 0
                              ? 1536
                              : 1536
                          }
                          height={
                            1024
                          }
                          className="h-auto w-full object-contain"
                          priority={
                            index === 0
                          }
                          sizes="(max-width: 768px) 100vw, 1200px"
                        />

                      </div>

                    </button>

                  </section>
                )
              }
            )}

          </div>

          {/* ======================= */}
          {/* FIT HELP */}
          {/* ======================= */}

          <section className="mt-12 overflow-hidden rounded-2xl bg-forest-700 p-6 text-white shadow-md sm:p-8">

            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

              <div className="max-w-2xl">

                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-gold-300">
                  Need help choosing?
                </p>

                <h2 className="mb-3 font-serif text-2xl sm:text-3xl">
                  Not sure which size is right for you?
                </h2>

                <p className="text-sm leading-relaxed text-forest-100 sm:text-base">
                  Send us your measurements and the product you&apos;re interested in. We&apos;ll help you choose the closest fit before you place your pre-order.
                </p>

              </div>

              <div className="flex flex-col gap-3 sm:flex-row">

                <Link
                  href="/contact-us"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 font-semibold text-forest-700 transition-colors hover:bg-gray-100"
                >
                  <Mail
                    size={18}
                  />
                  Contact Us
                </Link>

                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-5 py-3 font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Shop Collection
                  <ArrowRight
                    size={18}
                  />
                </Link>

              </div>

            </div>

          </section>

        </div>

      </main>

      {/* ======================= */}
      {/* FULL-SIZE IMAGE MODAL */}
      {/* ======================= */}

      {selectedGuide && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={
            selectedGuide.title
          }
          onClick={
            () =>
              setSelectedGuide(
                null
              )
          }
        >

          <div
            className="relative max-h-[95vh] w-full max-w-7xl overflow-auto rounded-xl bg-white shadow-2xl"
            onClick={
              (
                e
              ) =>
                e.stopPropagation()
            }
          >

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-5">

              <div>
                <h2 className="font-serif text-lg text-forest-700 sm:text-xl">
                  {selectedGuide.title}
                </h2>

                <p className="hidden text-xs text-gray-500 sm:block">
                  Scroll or zoom to inspect the measurements.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  () =>
                    setSelectedGuide(
                      null
                    )
                }
                className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close size guide"
              >
                <X
                  size={22}
                />
              </button>

            </div>

            <div className="bg-[#f7f2ea]">

              <Image
                src={
                    getAsset(selectedGuide.image)
                }
                alt={
                  selectedGuide.alt
                }
                width={
                  1536
                }
                height={
                  1024
                }
                className="h-auto min-w-[900px] w-full object-contain lg:min-w-0"
                sizes="100vw"
              />

            </div>

          </div>

        </div>
      )}
    </>
  )
}
