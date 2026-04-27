'use client'

import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import { ShoppingCart, Check, Heart } from 'lucide-react'

const categories = [
  { id: 'all', label: 'ALL' },
  { id: 'men', label: 'MEN' },
  { id: 'women', label: 'WOMEN' },
  { id: 'shoes', label: 'SHOES' },
  { id: 'bags', label: 'BAGS' },
  { id: 'accessories', label: 'ACCESSORIES' },
]

const usdToPhp = (usd: number) => Math.round(usd * 57)

const products = [
  {
    id: 1,
    category: 'MEN',
    name: 'Premium Performance Polo',
    price: 89.00,
    colors: ['forest', 'navy', 'white'],
    description: 'High-performance polo with moisture-wicking technology',
  },
  {
    id: 2,
    category: 'MEN',
    name: 'Classic Fit Polo',
    price: 79.00,
    colors: ['forest', 'gray'],
    description: 'Timeless classic fit for everyday elegance',
  },
  {
    id: 3,
    category: 'MEN',
    name: 'Athletic Fit Polo',
    price: 85.00,
    colors: ['forest', 'navy'],
    description: 'Modern athletic fit with enhanced flexibility',
  },
  {
    id: 4,
    category: 'MEN',
    name: 'Signature Polo',
    price: 92.00,
    colors: ['forest'],
    description: 'Signature Verde by Renzo design',
  },
  {
    id: 5,
    category: 'ACCESSORIES',
    name: 'Performance Cap',
    price: 35.00,
    colors: ['forest', 'navy'],
    description: 'Breathable cap with UV protection',
  },
  {
    id: 6,
    category: 'MEN',
    name: 'Pullover Hoodie',
    price: 125.00,
    colors: ['forest'],
    description: 'Comfortable pullover hoodie for cooler days',
  },
  {
    id: 7,
    category: 'MEN',
    name: 'Graphic Tee',
    price: 45.00,
    colors: ['white'],
    description: 'Premium cotton tee with Verde signature',
  },
  {
    id: 8,
    category: 'MEN',
    name: 'Crewneck Sweatshirt',
    price: 95.00,
    colors: ['white', 'forest'],
    description: 'Classic crewneck for layering',
  },
  {
    id: 9,
    category: 'WOMEN',
    name: 'Women\'s Performance Polo',
    price: 89.00,
    colors: ['white', 'navy'],
    description: 'Tailored fit with feminine silhouette',
  },
  {
    id: 10,
    category: 'WOMEN',
    name: 'Women\'s Casual Tee',
    price: 48.00,
    colors: ['white', 'gray'],
    description: 'Soft and comfortable casual wear',
  },
  {
    id: 11,
    category: 'BAGS',
    name: 'Golf Duffle Bag',
    price: 150.00,
    colors: ['forest', 'navy'],
    description: 'Spacious duffle with multiple compartments',
  },
  {
    id: 12,
    category: 'ACCESSORIES',
    name: 'Premium Belt',
    price: 65.00,
    colors: ['forest'],
    description: 'Leather belt with signature buckle',
  },
]

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState('ALL')
  const [selectedColors, setSelectedColors] = useState<{ [key: number]: string }>({})
  const [addedToCart, setAddedToCart] = useState<string | null>(null)
  const { addToCart } = useCart()
  const { wishlist, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()

  const filteredProducts = activeCategory === 'ALL' 
    ? products 
    : products.filter(product => product.category === activeCategory)

  const handleAddToCart = (product: typeof products[0]) => {
    const selectedColor = selectedColors[product.id] || product.colors[0]
    
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      color: selectedColor,
    })

    // Show success feedback
    setAddedToCart(`${product.id}-${selectedColor}`)
    setTimeout(() => setAddedToCart(null), 2000)
  }

  const handleToggleWishlist = (product: typeof products[0]) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        colors: product.colors,
        description: product.description,
      })
    }
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
            Shop Collection
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our premium collection of golf apparel and accessories. Pre-order now!
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-8 sm:mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.label)}
              className={`px-4 py-2 text-xs sm:text-sm uppercase tracking-wider rounded-full transition-all ${
                activeCategory === category.label
                  ? 'bg-forest-600 text-white font-semibold shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 opacity-60">
              <span className="text-5xl mb-4">🛒</span>
              <p className="text-gray-500 text-center">No products available in this category.</p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const selectedColor = selectedColors[product.id] || product.colors[0]
              const isAdded = addedToCart === `${product.id}-${selectedColor}`
              
              return (
                <div key={product.id} className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all">
                  {/* Product Image Placeholder */}
                  <div className="relative aspect-square bg-gray-100 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                      Image Placeholder
                    </div>
                    
                    {/* Category Badge */}
                    <div className="absolute top-3 left-3 bg-forest-600 text-white text-xs px-2 py-1 rounded uppercase tracking-wide">
                      {product.category}
                    </div>

                    {/* Wishlist Button */}
                    <button
                      onClick={() => handleToggleWishlist(product)}
                      className="absolute top-3 right-3 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 transition-colors"
                      aria-label={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <Heart 
                        size={18} 
                        className={isInWishlist(product.id) ? 'text-red-500 fill-red-500' : 'text-gray-400'} 
                      />
                    </button>
                  </div>

                  {/* Product Info */}
                  <div className="p-4 sm:p-5">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 group-hover:text-forest-600 transition-colors">
                      {product.name}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.description}
                    </p>

                    <div className="text-xl font-bold text-forest-600 mb-4">
                      ₱{usdToPhp(product.price).toLocaleString('en-PH')}.00
                    </div>

                    {/* Color Selection */}
                    {product.colors.length > 1 && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-2">
                          Color: {getColorDisplay(selectedColor)}
                        </p>
                        <div className="flex gap-2">
                          {product.colors.map((color) => (
                            <button
                              key={color}
                              onClick={() => setSelectedColors({ ...selectedColors, [product.id]: color })}
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
                      onClick={() => handleAddToCart(product)}
                      disabled={isAdded}
                      className={`w-full py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                        isAdded
                          ? 'bg-green-600 text-white'
                          : 'bg-forest-600 text-white hover:bg-forest-700'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check size={18} />
                          Added to Cart
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={18} />
                          Add to Cart
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </main>
  )
}
