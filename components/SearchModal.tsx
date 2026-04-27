'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { X, Search as SearchIcon, TrendingUp, Shirt, SearchX } from 'lucide-react'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

const trendingSearches = [
  'Premium Polo',
  'Casual Shirts',
  'Summer Collection',
  'Accessories',
  'Gift Cards'
]

const popularProducts = [
  { id: 1, name: 'Premium Performance Polo', category: 'Men', price: 89 },
  { id: 2, name: 'Classic Fit Polo', category: 'Men', price: 79 },
  { id: 3, name: 'Athletic Fit Polo', category: 'Men', price: 85 },
  { id: 4, name: 'Signature Polo', category: 'Men', price: 92 },
]

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<typeof popularProducts>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      // Focus input when modal opens
      setTimeout(() => inputRef.current?.focus(), 100)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Handle Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (searchQuery.trim()) {
      // Filter products based on search query
      const filtered = popularProducts.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setSearchResults(filtered)
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full shadow-2xl">
        <div className="container py-6">
          {/* Search Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products, collections, or articles..."
                className="w-full pl-14 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-forest-500 transition-colors"
              />
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close search"
            >
              <X size={24} />
            </button>
          </div>

          {/* Search Results or Suggestions */}
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
            {searchQuery.trim() ? (
              // Search Results
              <div>
                {searchResults.length > 0 ? (
                  <>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                      Products ({searchResults.length})
                    </h3>
                    <div className="space-y-2">
                      {searchResults.map((product) => (
                        <Link
                          key={product.id}
                          href={`/shop?product=${product.id}`}
                          onClick={onClose}
                          className="flex items-center gap-4 p-4 hover:bg-forest-50 rounded-lg transition-colors group"
                        >
                          <div className="w-16 h-16 bg-gradient-to-br from-forest-200 to-forest-300 rounded-lg flex items-center justify-center">
                            <Shirt size={32} className="text-forest-700" strokeWidth={1.5} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 group-hover:text-forest-600 transition-colors">
                              {product.name}
                            </h4>
                            <p className="text-sm text-gray-500">{product.category}</p>
                          </div>
                          <div className="text-forest-600 font-semibold">
                            ${product.price}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <SearchX size={64} className="mx-auto mb-4 text-gray-300" strokeWidth={1.5} />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No results found
                    </h3>
                    <p className="text-gray-600">
                      Try searching with different keywords
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Suggestions
              <div className="space-y-8">
                {/* Trending Searches */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp size={20} className="text-forest-600" />
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                      Trending Searches
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {trendingSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => setSearchQuery(term)}
                        className="px-4 py-2 bg-forest-50 hover:bg-forest-100 text-forest-700 rounded-full text-sm font-medium transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Popular Products */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                    Popular Products
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {popularProducts.map((product) => (
                      <Link
                        key={product.id}
                        href={`/shop?product=${product.id}`}
                        onClick={onClose}
                        className="flex items-center gap-3 p-3 hover:bg-forest-50 rounded-lg transition-colors group"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-forest-200 to-forest-300 rounded-lg flex items-center justify-center">
                          <Shirt size={24} className="text-forest-700" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 group-hover:text-forest-600 transition-colors truncate">
                            {product.name}
                          </h4>
                          <p className="text-sm text-gray-500">${product.price}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Quick Links */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                    Quick Links
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <Link
                      href="/shop"
                      onClick={onClose}
                      className="p-3 hover:bg-forest-50 rounded-lg text-gray-700 hover:text-forest-600 transition-colors"
                    >
                      All Products →
                    </Link>
                    <Link
                      href="/blog"
                      onClick={onClose}
                      className="p-3 hover:bg-forest-50 rounded-lg text-gray-700 hover:text-forest-600 transition-colors"
                    >
                      Blog →
                    </Link>
                    <Link
                      href="/contact-us"
                      onClick={onClose}
                      className="p-3 hover:bg-forest-50 rounded-lg text-gray-700 hover:text-forest-600 transition-colors"
                    >
                      Contact Us →
                    </Link>
                    <Link
                      href="/wishlist"
                      onClick={onClose}
                      className="p-3 hover:bg-forest-50 rounded-lg text-gray-700 hover:text-forest-600 transition-colors"
                    >
                      Wishlist →
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
