
'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, X, Search, User, Heart, ShoppingCart } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import CartModal from './CartModal'
import SearchModal from './SearchModal'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const pathname = usePathname()
  const { getCartCount } = useCart()
  const { getWishlistCount } = useWishlist()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isHome = pathname === '/'

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled || !isHome ? 'bg-white shadow-md' : 'bg-transparent'
    }`}>
      <div className="container">
        <div className="grid grid-cols-3 items-center h-16 lg:h-20">
          {/* Left Navigation */}
          <nav className="hidden lg:flex items-center space-x-8 justify-start">
            <Link href="/" className={`transition-colors text-sm ${
              isScrolled || !isHome ? 'text-gray-700 hover:text-forest-600' : 'text-white hover:text-gold-300'
            }`}>
              Home
            </Link>
            <Link href="/shop" className={`transition-colors text-sm ${
              isScrolled || !isHome ? 'text-gray-700 hover:text-forest-600' : 'text-white hover:text-gold-300'
            }`}>
              Shop
            </Link>
            <Link href="/blog" className={`transition-colors text-sm ${
              isScrolled || !isHome ? 'text-gray-700 hover:text-forest-600' : 'text-white hover:text-gold-300'
            }`}>
              Blog
            </Link>
            <Link href="/contact-us" className={`transition-colors text-sm ${
              isScrolled || !isHome ? 'text-gray-700 hover:text-forest-600' : 'text-white hover:text-gold-300'
            }`}>
              Contact Us
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`lg:hidden p-2 ${isScrolled || !isHome ? 'text-gray-700' : 'text-white'}`}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo - Centered */}
          <div className="flex justify-center">
            <a href="/" className="relative w-24 h-10 sm:w-28 sm:h-12 lg:w-36 lg:h-14">
              <Image
                src="/images/verde-logo.png"
                alt="Verde by Renzo"
                fill
                sizes="(max-width: 640px) 96px, (max-width: 1024px) 112px, 144px"
                className="object-contain"
                priority
              />
            </a>
          </div>

          {/* Right Icons */}
          <div className="flex items-center space-x-3 lg:space-x-6 justify-end">
            <button 
              onClick={() => setIsSearchOpen(true)}
              className={`hidden sm:block transition-colors ${
              isScrolled || !isHome ? 'text-gray-700 hover:text-forest-600' : 'text-white hover:text-gold-300'
            }`} aria-label="Search">
              <Search size={20} />
            </button>
            <Link href="/login" className={`hidden sm:block transition-colors ${
              isScrolled || !isHome ? 'text-gray-700 hover:text-forest-600' : 'text-white hover:text-gold-300'
            }`} aria-label="Account">
              <User size={20} />
            </Link>
            <Link href="/wishlist" className={`hidden sm:block transition-colors relative ${
              isScrolled || !isHome ? 'text-gray-700 hover:text-forest-600' : 'text-white hover:text-gold-300'
            }`} aria-label="Wishlist">
              <Heart size={20} />
              {getWishlistCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-gold-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                  {getWishlistCount()}
                </span>
              )}
            </Link>
            <button 
              onClick={() => setIsCartOpen(true)}
              className={`relative transition-colors ${
              isScrolled || !isHome ? 'text-gray-700 hover:text-forest-600' : 'text-white hover:text-gold-300'
            }`} aria-label="Cart">
              <ShoppingCart size={20} />
              {getCartCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-gold-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                  {getCartCount()}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="lg:hidden py-4 bg-white/95 backdrop-blur-md rounded-b-lg shadow-lg">
            <div className="flex flex-col space-y-4">
              <Link href="/" className="text-gray-700 hover:text-forest-600 transition-colors px-2" onClick={() => setIsMenuOpen(false)}>
                Home
              </Link>
              <Link href="/shop" className="text-gray-700 hover:text-forest-600 transition-colors px-2" onClick={() => setIsMenuOpen(false)}>
                Shop
              </Link>
              <Link href="/blog" className="text-gray-700 hover:text-forest-600 transition-colors px-2" onClick={() => setIsMenuOpen(false)}>
                Blog
              </Link>
              <Link href="/contact-us" className="text-gray-700 hover:text-forest-600 transition-colors px-2" onClick={() => setIsMenuOpen(false)}>
                Contact Us
              </Link>
              <div className="flex sm:hidden items-center gap-4 px-2 pt-4 border-t border-gray-200">
                <button 
                  onClick={() => { setIsSearchOpen(true); setIsMenuOpen(false); }}
                  className="text-gray-700 hover:text-forest-600" 
                  aria-label="Search"
                >
                  <Search size={20} />
                </button>
                <Link href="/login" className="text-gray-700 hover:text-forest-600" aria-label="Account" onClick={() => setIsMenuOpen(false)}>
                  <User size={20} />
                </Link>
                <Link href="/wishlist" className="text-gray-700 hover:text-forest-600 relative" aria-label="Wishlist" onClick={() => setIsMenuOpen(false)}>
                  <Heart size={20} />
                  {getWishlistCount() > 0 && (
                    <span className="absolute -top-2 -right-2 bg-gold-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold text-[10px]">
                      {getWishlistCount()}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </nav>
        )}
      </div>

      {/* Cart Modal */}
      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      
      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  )
}
