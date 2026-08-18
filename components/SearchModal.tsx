"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";
import Link from "next/link";

import type { Product } from "@/data/products";
import { useProducts } from "@/context/ProductContext";

import { getProductImage } from "@/lib/productUtils";

import { Search as SearchIcon, SearchX, TrendingUp, X } from "lucide-react";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const { products } = useProducts();
  const popularProducts = products
    .filter((product) => product.isPopular)
    .slice(0, 4);
  const trendingSearches = [
    ...popularProducts.map((product) => product.name),
    ...products
      .filter((product) => product.isNew && !product.isPopular)
      .slice(0, 2)
      .map((product) => product.name),
    "Accessories",
  ].slice(0, 7);
  const [searchQuery, setSearchQuery] = useState("");

  const [searchResults, setSearchResults] = useState<Product[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  /*
   * ============================
   * MODAL
   * ============================
   */
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);

      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";

      setSearchQuery("");
      setSearchResults([]);
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);

      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  /*
   * ============================
   * SEARCH
   * ============================
   */
  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      setSearchResults([]);
      return;
    }

    const filtered = products.filter((product) => {
      const searchable = [
        product.name,
        product.category,
        product.description,

        ...product.colors,

        ...product.materials,

        ...product.features,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });

    setSearchResults(filtered);
  }, [searchQuery, products]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-[#07100a]/75 backdrop-blur-md">
      <div className="h-full w-full overflow-hidden bg-white shadow-2xl md:h-auto md:max-h-[88vh] md:border-b md:border-gray-200">
        <div className="container flex h-full flex-col py-5 sm:py-7 md:h-auto">
          {/* HEADER */}
          <div className="mb-6 flex items-center gap-3 border-b border-gray-200 pb-5 sm:gap-4">
            <div className="relative flex-1">
              <SearchIcon
                className="absolute left-4 top-1/2 -translate-y-1/2 text-forest-600"
                size={21}
              />

              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="What are you looking for?"
                className="w-full rounded-none border border-gray-300 bg-white py-4 pl-12 pr-4 text-base text-[#17251c] placeholder:text-[#9c958a] focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/10 sm:text-lg"
              />
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-gray-300 text-[#26342b] hover:border-forest-600 hover:bg-forest-50"
              aria-label="Close search"
            >
              <X size={24} />
            </button>
          </div>

          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto pb-8 md:max-h-[calc(88vh-130px)]">
            {searchQuery.trim() ? (
              <div>
                {searchResults.length > 0 ? (
                  <>
                    <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-500 sm:text-xs">
                      Products ({searchResults.length})
                    </h3>

                    <div className="space-y-2">
                      {searchResults.map((product) => {
                        const image = getProductImage(product);

                        return (
                          <Link
                            key={product.id}
                            href={`/shop/${product.id}`}
                            onClick={onClose}
                            className="group flex items-center gap-4 border-b border-gray-200 p-3 hover:bg-forest-50 sm:p-4"
                          >
                            {/* IMAGE */}
                            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden bg-[#e9e3d8] sm:h-24 sm:w-24">
                              {image ? (
                                <Image
                                  src={image}
                                  alt={product.name}
                                  fill
                                  className="object-cover object-center group-hover:scale-105"
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
                              <h4 className="font-serif text-lg text-[#17251c] group-hover:text-forest-700">
                                {product.name}
                              </h4>

                              <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[#858077]">
                                {product.category.toLowerCase()}
                              </p>
                            </div>

                            {/* PRICE */}
                            <div className="font-semibold text-[#294630]">
                              ₱{product.price.toLocaleString("en-PH")}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="py-16 text-center">
                    <SearchX
                      size={64}
                      className="mx-auto mb-4 text-[#c4bdaF]"
                      strokeWidth={1.5}
                    />

                    <h3 className="mb-2 font-serif text-2xl text-[#17251c]">
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
                    <TrendingUp size={20} className="text-forest-600" />

                    <h3 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-500 sm:text-xs">
                      Trending Searches
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {trendingSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => setSearchQuery(term)}
                        className="rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-[#31503a] hover:border-forest-500 hover:bg-forest-50"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>

                {/* POPULAR */}
                <div>
                  <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-500 sm:text-xs">
                    Popular Products
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {popularProducts.map((product) => {
                      const image = getProductImage(product);

                      return (
                        <Link
                          key={product.id}
                          href={`/shop/${product.id}`}
                          onClick={onClose}
                          className="group flex items-center gap-3 border border-gray-200 bg-white p-3 hover:border-forest-400 hover:bg-forest-50 hover:shadow-sm"
                        >
                          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden bg-[#e9e3d8]">
                            {image && (
                              <Image
                                src={image}
                                alt={product.name}
                                fill
                                className="object-cover object-center group-hover:scale-105"
                                sizes="56px"
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="truncate font-medium text-[#17251c] group-hover:text-forest-700">
                              {product.name}
                            </h4>

                            <p className="text-sm font-semibold text-[#294630]">
                              ₱{product.price.toLocaleString("en-PH")}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* QUICK LINKS */}
                <div>
                  <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-500 sm:text-xs">
                    Quick Links
                  </h3>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <Link
                      href="/shop"
                      onClick={onClose}
                      className="border-b border-gray-200 p-3 text-sm text-[#344038] hover:border-forest-500 hover:text-forest-700"
                    >
                      All Products →
                    </Link>

                    <Link
                      href="/wishlist"
                      onClick={onClose}
                      className="border-b border-gray-200 p-3 text-sm text-[#344038] hover:border-forest-500 hover:text-forest-700"
                    >
                      Wishlist →
                    </Link>

                    <Link
                      href="/size-guide"
                      onClick={onClose}
                      className="border-b border-gray-200 p-3 text-sm text-[#344038] hover:border-forest-500 hover:text-forest-700"
                    >
                      Size Guide →
                    </Link>

                    <Link
                      href="/blog"
                      onClick={onClose}
                      className="border-b border-gray-200 p-3 text-sm text-[#344038] hover:border-forest-500 hover:text-forest-700"
                    >
                      Blog →
                    </Link>

                    <Link
                      href="/contact-us"
                      onClick={onClose}
                      className="border-b border-gray-200 p-3 text-sm text-[#344038] hover:border-forest-500 hover:text-forest-700"
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
  );
}
