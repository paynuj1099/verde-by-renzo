"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useSiteAssets } from "@/context/SiteAssetsContext";

const slides = [
  {
    imageId: "hero-primary",

    // Product destination
    productId: 1,
    color: "forest",

    caption: {
      subtitle: "Premium Performance Polo",
      title: "Elevate Every Moment",
      desc1: "Designed for the modern golfer.",
      desc2: "Built for comfort. Made to stand out.",
      button: "Pre Order",
    },
  },

  {
    imageId: "hero-secondary",

    // Product destination
    productId: 1,
    color: "ivory",

    caption: {
      subtitle: "Limited Edition Drop",
      title: "Unleash Your Style",
      desc1: "Exclusive colors. Limited stock.",
      desc2: "Don’t miss out on our latest release.",
      button: "Pre Order",
    },
  },
];

export default function Hero() {
  const { getAsset } = useSiteAssets();
  const [slideIndex, setSlideIndex] = useState(0);

  const handlePrev = () => {
    setSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setSlideIndex((prev) => (prev + 1) % slides.length);
  };

  const { imageId, caption, productId, color } = slides[slideIndex];

  return (
    <section className="relative overflow-hidden bg-[#101813] text-white">
      {/* Background */}
      <div className="absolute inset-0 min-h-screen">
        <Image
          src={getAsset(imageId)}
          alt={caption.title}
          fill
          sizes="100vw"
          className="object-cover object-top"
          priority
          quality={95}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b2117]/50 via-[#0b2117]/10 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/5" />
      </div>

      {/* Slide Dots */}
      <div className="absolute bottom-7 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/15 bg-black/15 px-4 py-2 backdrop-blur-md">
        {slides.map((_, idx) => (
          <button
            key={idx}
            type="button"
            className={`h-1.5 rounded-full transition-all duration-500 ${
              slideIndex === idx
                ? "w-8 bg-[#d4ab58]"
                : "w-1.5 bg-white/55 hover:bg-white"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
            onClick={() => setSlideIndex(idx)}
            style={{
              outline: "none",
            }}
          >
            <span className="sr-only">Go to slide {idx + 1}</span>
          </button>
        ))}
      </div>

      <div className="container relative">
        <div className="relative flex min-h-[650px] items-center py-24 sm:min-h-[720px] lg:min-h-screen lg:py-32">
          {/* Previous */}
          <button
            type="button"
            className="absolute left-2 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[#d4ab58]/50 bg-[#101813]/45 text-[#e7c677] shadow-xl backdrop-blur-md transition-all hover:border-[#e7c677] hover:bg-[#101813]/80 sm:-left-2 lg:-left-5 lg:h-12 lg:w-12"
            aria-label="Previous slide"
            onClick={handlePrev}
          >
            <ChevronLeft className="text-current" size={18} />
          </button>

          {/* Content */}
          <div className="max-w-xl flex-1 px-12 sm:pl-14 lg:max-w-3xl lg:pl-16">
            <p className="mb-5 border-l border-[#d4ab58] pl-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#e0b862] sm:mb-7 sm:text-xs">
              {caption.subtitle}
            </p>

            <h1 className="mb-5 max-w-2xl font-serif text-4xl leading-[1.02] tracking-[-0.02em] text-[#f5ead4] sm:mb-7 sm:text-5xl md:text-6xl lg:text-[76px]">
              {caption.title}
            </h1>

            <p className="mb-1 text-sm font-light tracking-wide text-white/90 sm:text-base lg:text-lg">
              {caption.desc1}
            </p>

            <p className="mb-9 text-sm font-light tracking-wide text-white/75 sm:mb-11 sm:text-base lg:text-lg">
              {caption.desc2}
            </p>

            {/* CTA */}
            <Link
              href={`/shop/${productId}?color=${color}`}
              className="inline-flex items-center border border-[#d4ab58] bg-[#d4ab58] px-7 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#122017] shadow-[0_10px_30px_rgba(212,171,88,0.15)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#e1bd70] sm:px-9 sm:py-3.5 sm:text-xs"
            >
              {caption.button}
            </Link>
          </div>

          {/* Next */}
          <button
            type="button"
            className="absolute right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[#d4ab58]/50 bg-[#101813]/45 text-[#e7c677] shadow-xl backdrop-blur-md transition-all hover:border-[#e7c677] hover:bg-[#101813]/80 sm:-right-2 lg:-right-5 lg:h-12 lg:w-12"
            aria-label="Next slide"
            onClick={handleNext}
          >
            <ChevronRight className="text-current" size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
