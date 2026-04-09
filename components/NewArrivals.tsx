'use client'

import { useState } from 'react'

const categories = [
  { id: 'women', label: 'WOMEN' },
  { id: 'men', label: 'MEN' },
  { id: 'shoes', label: 'SHOES' },
  { id: 'bags', label: 'BAGS' },
  { id: 'accessories', label: 'ACCESSORIES' },
]

const products = [
  {
    id: 1,
    category: 'MEN',
    name: 'Premium Performance Polo',
    price: '$89.00',
    colors: ['forest', 'navy', 'white'],
  },
  {
    id: 2,
    category: 'MEN',
    name: 'Classic Fit Polo',
    price: '$79.00',
    colors: ['forest', 'gray'],
  },
  {
    id: 3,
    category: 'MEN',
    name: 'Athletic Fit Polo',
    price: '$85.00',
    colors: ['forest', 'navy'],
  },
  {
    id: 4,
    category: 'MEN',
    name: 'Signature Polo',
    price: '$92.00',
    colors: ['forest'],
  },
  {
    id: 5,
    category: 'ACCESSORIES',
    name: 'Performance Cap',
    price: '$35.00',
    colors: ['forest', 'navy'],
  },
  {
    id: 6,
    category: 'MEN',
    name: 'Pullover Hoodie',
    price: '$125.00',
    colors: ['forest'],
  },
  {
    id: 7,
    category: 'MEN',
    name: 'Graphic Tee',
    price: '$45.00',
    colors: ['white'],
  },
  {
    id: 8,
    category: 'MEN',
    name: 'Crewneck Sweatshirt',
    price: '$95.00',
    colors: ['white', 'forest'],
  },
]

export default function NewArrivals() {
  const [activeCategory, setActiveCategory] = useState('WOMEN')

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white">
      <div className="container">
        {/* Section Title */}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-center mb-6 sm:mb-8 text-gray-900">
          New Arrivals
        </h2>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-8 sm:mb-12 px-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.label)}
              className={`text-xs sm:text-sm uppercase tracking-wider transition-colors pb-2 ${
                activeCategory === category.label
                  ? 'text-forest-600 border-b-2 border-forest-600 font-semibold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {products.map((product) => (
            <div key={product.id} className="group">
              {/* Product Image Placeholder */}
              <div className="relative aspect-square bg-gray-100 mb-3 sm:mb-4 overflow-hidden rounded-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs sm:text-sm">
                  Image Placeholder
                </div>
              </div>

              {/* Product Info */}
              <div className="text-center">
                <p className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-500 mb-1">
                  {product.category}
                </p>
                <h3 className="text-xs sm:text-sm lg:text-base text-gray-900 mb-1 sm:mb-2 group-hover:text-forest-600 transition-colors line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-sm sm:text-base lg:text-lg font-semibold text-forest-600">
                  {product.price}
                </p>

                {/* Color Dots */}
                {product.colors && product.colors.length > 0 && (
                  <div className="flex justify-center gap-1 mt-2 sm:mt-3">
                    {product.colors.map((color, idx) => (
                      <div
                        key={idx}
                        className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border border-gray-300 ${
                          color === 'forest' ? 'bg-forest-600' :
                          color === 'navy' ? 'bg-blue-900' :
                          color === 'white' ? 'bg-white' :
                          'bg-gray-400'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
