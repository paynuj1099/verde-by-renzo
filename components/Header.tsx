'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Menu, X, Search, User, Heart, ShoppingCart } from 'lucide-react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white shadow-md' : 'bg-transparent'
    }`}>
      <div className="container">
        <div className="grid grid-cols-3 items-center h-16 lg:h-20">
          {/* Left Navigation */}
          <nav className="hidden lg:flex items-center space-x-8 justify-start">
            <a href="#" className={`transition-colors text-sm ${
              isScrolled ? 'text-gray-700 hover:text-forest-600' : 'text-white hover:text-gold-300'
            }`}>
              Home
            </a>
            <a href="#" className={`transition-colors text-sm ${
              isScrolled ? 'text-gray-700 hover:text-forest-600' : 'text-white hover:text-gold-300'
            }`}>
              Shop
            </a>
            <a href="#" className={`transition-colors text-sm ${
              isScrolled ? 'text-gray-700 hover:text-forest-600' : 'text-white hover:text-gold-300'
            }`}>
              Pages
            </a>
            <a href="#" className={`transition-colors text-sm ${
              isScrolled ? 'text-gray-700 hover:text-forest-600' : 'text-white hover:text-gold-300'
            }`}>
              Blog
            </a>
            <a href="#" className={`transition-colors text-sm ${
              isScrolled ? 'text-gray-700 hover:text-forest-600' : 'text-white hover:text-gold-300'
            }`}>
              Contact Us
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`lg:hidden p-2 ${isScrolled ? 'text-gray-700' : 'text-white'}`}
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
                className="object-contain"
                priority
              />
            </a>
          </div>

          {/* Right Icons */}
          <div className="flex items-center space-x-3 lg:space-x-6 justify-end">
            <button className={`hidden sm:block transition-colors ${
              isScrolled ? 'text-gray-700 hover:text-forest-600' : 'text-white hover:text-gold-300'
            }`} aria-label="Search">
              <Search size={20} />
            </button>
            <button className={`hidden sm:block transition-colors ${
              isScrolled ? 'text-gray-700 hover:text-forest-600' : 'text-white hover:text-gold-300'
            }`} aria-label="Account">
              <User size={20} />
            </button>
            <button className={`hidden sm:block transition-colors ${
              isScrolled ? 'text-gray-700 hover:text-forest-600' : 'text-white hover:text-gold-300'
            }`} aria-label="Wishlist">
              <Heart size={20} />
            </button>
            <button className={`relative transition-colors ${
              isScrolled ? 'text-gray-700 hover:text-forest-600' : 'text-white hover:text-gold-300'
            }`} aria-label="Cart">
              <ShoppingCart size={20} />
              <span className="absolute -top-2 -right-2 bg-gold-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                0
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="lg:hidden py-4 bg-white/95 backdrop-blur-md rounded-b-lg shadow-lg">
            <div className="flex flex-col space-y-4">
              <a href="#" className="text-gray-700 hover:text-forest-600 transition-colors px-2">
                Home
              </a>
              <a href="#" className="text-gray-700 hover:text-forest-600 transition-colors px-2">
                Shop
              </a>
              <a href="#" className="text-gray-700 hover:text-forest-600 transition-colors px-2">
                Pages
              </a>
              <a href="#" className="text-gray-700 hover:text-forest-600 transition-colors px-2">
                Blog
              </a>
              <a href="#" className="text-gray-700 hover:text-forest-600 transition-colors px-2">
                Contact Us
              </a>
              <div className="flex sm:hidden items-center gap-4 px-2 pt-4 border-t border-gray-200">
                <button className="text-gray-700 hover:text-forest-600" aria-label="Search">
                  <Search size={20} />
                </button>
                <button className="text-gray-700 hover:text-forest-600" aria-label="Account">
                  <User size={20} />
                </button>
                <button className="text-gray-700 hover:text-forest-600" aria-label="Wishlist">
                  <Heart size={20} />
                </button>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
