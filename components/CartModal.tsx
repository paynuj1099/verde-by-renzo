'use client'

import { useCart } from '@/context/CartContext'
import { X, Minus, Plus, Trash2, ShoppingCart } from 'lucide-react'
import Link from 'next/link'

interface CartModalProps {
  isOpen: boolean
  onClose: () => void
}

const usdToPhp = (usd: number) => Math.round(usd * 57)

export default function CartModal({ isOpen, onClose }: CartModalProps) {
  const { cart, updateQuantity, removeFromCart, getCartTotal } = useCart()

  if (!isOpen) return null

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
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Cart Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-xl font-serif font-semibold text-forest-700">
            Shopping Cart
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close cart"
          >
            <X size={24} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingCart size={64} className="text-gray-300 mb-4" strokeWidth={1} />
              <p className="text-gray-500 mb-6">Your cart is empty</p>
              <Link
                href="/shop"
                onClick={onClose}
                className="bg-forest-600 text-white px-6 py-2.5 rounded-lg hover:bg-forest-700 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={`${item.id}-${item.color}`}
                  className="flex gap-4 p-4 bg-gray-50 rounded-lg"
                >
                  {/* Product Image Placeholder */}
                  <div className="w-20 h-20 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center text-xs text-gray-400">
                    Image
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-gray-900 mb-1 truncate">
                      {item.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">
                      {getColorDisplay(item.color)}
                    </p>
                    <p className="text-sm font-semibold text-forest-600">
                      ₱{usdToPhp(item.price).toLocaleString('en-PH')}.00
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.color, item.quantity - 1)
                        }
                        className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-100 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-medium w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.color, item.quantity + 1)
                        }
                        className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-100 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id, item.color)}
                        className="ml-auto text-red-500 hover:text-red-600 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-gray-200 p-4 sm:p-6 space-y-4 bg-white">
            {/* Subtotal */}
            <div className="flex items-center justify-between text-lg font-semibold">
              <span className="text-gray-700">Subtotal:</span>
              <span className="text-forest-600">
                ₱{usdToPhp(getCartTotal()).toLocaleString('en-PH')}.00
              </span>
            </div>

            {/* Checkout Button */}
            <Link
              href="/contact-us"
              onClick={onClose}
              className="block w-full bg-forest-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-forest-700 transition-colors"
            >
              Proceed to Checkout
            </Link>

            {/* Continue Shopping */}
            <Link
              href="/shop"
              onClick={onClose}
              className="block w-full text-center text-forest-600 hover:text-forest-700 transition-colors text-sm"
            >
              Continue Shopping
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
