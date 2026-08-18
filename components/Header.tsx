
'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getIdTokenResult } from 'firebase/auth'
import { Menu, X, Search, User, Heart, ShoppingCart, LogOut, LayoutDashboard } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import CartModal from './CartModal'
import SearchModal from './SearchModal'
import { useAuth } from '@/context/AuthContext'

export default function Header() {
  const { user, logout } = useAuth()
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
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

  useEffect(() => {
    if (!user) {
      setIsAdmin(false)
      return
    }
    getIdTokenResult(user).then((token) => setIsAdmin(token.claims.admin === true)).catch(() => setIsAdmin(false))
  }, [user])

  const handleLogout = async () => {
    await logout()
    setIsAccountOpen(false)
    window.location.assign('/')
  }

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
          <div className="flex items-center justify-end gap-3 lg:gap-6">
            <button 
              onClick={() => setIsSearchOpen(true)}
              className={`hidden sm:block transition-colors ${
              isScrolled || !isHome ? 'text-gray-700 hover:text-forest-600' : 'text-white hover:text-gold-300'
            }`} aria-label="Search">
              <Search size={20} />
            </button>
            {user ? (
              <div className="relative order-last hidden sm:block">
                <button
                  onClick={() => setIsAccountOpen(!isAccountOpen)}
                  className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-forest-600 text-xs font-semibold text-white ring-2 ring-white/70"
                  aria-label="Open account menu"
                >
                  {user.photoURL ? (
                    <Image src={user.photoURL} alt={user.displayName || 'Account'} width={32} height={32} className="h-full w-full object-cover" />
                  ) : (user.displayName || user.email || 'A').charAt(0).toUpperCase()}
                </button>
                {isAccountOpen && (
                  <div className="absolute right-0 mt-3 w-64 rounded-xl border border-gray-100 bg-white p-3 text-gray-700 shadow-xl">
                    <p className="truncate font-semibold text-forest-800">{user.displayName || 'Verde customer'}</p>
                    <p className="mb-3 truncate text-xs text-gray-500">{user.email}</p>
                    <Link href="/profile" onClick={() => setIsAccountOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-forest-50"><User size={16} />My Profile</Link>
                    {isAdmin && <Link href="/admin" onClick={() => setIsAccountOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-forest-700 hover:bg-forest-50"><LayoutDashboard size={16} />Dashboard</Link>}
                    <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                      <LogOut size={16} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className={`order-last hidden sm:block transition-colors ${
                isScrolled || !isHome ? 'text-gray-700 hover:text-forest-600' : 'text-white hover:text-gold-300'
              }`} aria-label="Account">
                <User size={20} />
              </Link>
            )}
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
                <Link href={user ? '/profile' : '/login'} className="flex items-center gap-2 text-gray-700 hover:text-forest-600" aria-label="Account" onClick={() => setIsMenuOpen(false)}>
                  <User size={20} /> {user && <span className="text-sm">{user.displayName || user.email}</span>}
                </Link>
                <Link href="/wishlist" className="text-gray-700 hover:text-forest-600 relative" aria-label="Wishlist" onClick={() => setIsMenuOpen(false)}>
                  <Heart size={20} />
                  {getWishlistCount() > 0 && (
                    <span className="absolute -top-2 -right-2 bg-gold-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold text-[10px]">
                      {getWishlistCount()}
                    </span>
                  )}
                </Link>
                {user && (
                  <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700" aria-label="Sign out">
                    <LogOut size={18} /> Sign out
                  </button>
                )}
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
