'use client'

import { useWishlist } from '@/context/WishlistContext'
import { useCart } from '@/context/CartContext'
import { Heart, ShoppingCart, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const usdToPhp = (usd: number) => Math.round(usd * 57)

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist()
  const { addToCart } = useCart()
  const [selectedColors, setSelectedColors] = useState<{ [key: number]: string }>({})

  const handleAddToCart = (item: typeof wishlist[0]) => {
    const selectedColor = selectedColors[item.id] || item.colors[0]
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category,
      color: selectedColor,
    })
  }

  const getColorDisplay = (color: string) => {
    const colorMap: { [key: string]: string } = {
      forest: 'Forest Green',
      navy: 'Navy Blue',
      white: 'White',
      gray: 'Gray',
    }
    return colorMap[color] || color
  }

  return (
    <main className="pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 lg:pb-20 bg-white min-h-screen">
      <div className="container">
        {/* Page Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-forest-700 mb-4">
            My Wishlist
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Your favorite items saved for later
          </p>
        </div>

        {wishlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Heart size={80} className="text-gray-300 mb-6" strokeWidth={1} />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-8">Start adding items you love!</p>
            <Link
              href="/shop"
              className="bg-forest-600 text-white px-8 py-3 rounded-lg hover:bg-forest-700 transition-colors inline-flex items-center gap-2"
            >
              <ShoppingCart size={18} />
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            {/* Wishlist Count */}
            <div className="mb-6 text-center">
              <p className="text-gray-600">
                {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} in your wishlist
              </p>
            </div>

            {/* Wishlist Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {wishlist.map((item) => {
                const selectedColor = selectedColors[item.id] || item.colors[0]
                
                return (
                  <div key={item.id} className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all relative">
                    {/* Remove from Wishlist Button */}
                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      className="absolute top-3 right-3 z-10 bg-white rounded-full p-2 shadow-md hover:bg-red-50 transition-colors"
                      aria-label="Remove from wishlist"
                    >
                      <Heart size={18} className="text-red-500 fill-red-500" />
                    </button>

                    {/* Product Image Placeholder */}
                    <div className="relative aspect-square bg-gray-100 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                        Image Placeholder
                      </div>
                      
                      {/* Category Badge */}
                      <div className="absolute top-3 left-3 bg-forest-600 text-white text-xs px-2 py-1 rounded uppercase tracking-wide">
                        {item.category}
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4 sm:p-5">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                        {item.name}
                      </h3>
                      
                      {item.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      <div className="text-xl font-bold text-forest-600 mb-4">
                        ₱{usdToPhp(item.price).toLocaleString('en-PH')}.00
                      </div>

                      {/* Color Selection */}
                      {item.colors.length > 1 && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-500 mb-2">
                            Color: {getColorDisplay(selectedColor)}
                          </p>
                          <div className="flex gap-2">
                            {item.colors.map((color) => (
                              <button
                                key={color}
                                onClick={() => setSelectedColors({ ...selectedColors, [item.id]: color })}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${
                                  selectedColor === color
                                    ? 'border-forest-600 scale-110'
                                    : 'border-gray-300 hover:border-gray-400'
                                } ${
                                  color === 'forest' ? 'bg-forest-600' :
                                  color === 'navy' ? 'bg-blue-900' :
                                  color === 'white' ? 'bg-white' :
                                  'bg-gray-400'
                                }`}
                                aria-label={`Select ${color} color`}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Add to Cart Button */}
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="w-full bg-forest-600 text-white py-2.5 rounded-lg font-semibold hover:bg-forest-700 transition-all flex items-center justify-center gap-2"
                      >
                        <ShoppingCart size={18} />
                        Add to Cart
                      </button>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromWishlist(item.id)}
                        className="w-full mt-2 text-red-500 hover:text-red-600 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 size={16} />
                        Remove
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
