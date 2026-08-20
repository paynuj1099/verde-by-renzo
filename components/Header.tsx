"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getIdTokenResult } from "firebase/auth";
import {
  Menu,
  X,
  Search,
  User,
  Heart,
  ShoppingCart,
  PackageSearch,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import CartModal from "./CartModal";
import SearchModal from "./SearchModal";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();
  const { getCartCount } = useCart();
  const { getWishlistCount } = useWishlist();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)");

    const closeMenuOnDesktop = (
      event: MediaQueryListEvent | MediaQueryList,
    ) => {
      if (event.matches) setIsMenuOpen(false);
    };

    closeMenuOnDesktop(desktopQuery);
    desktopQuery.addEventListener("change", closeMenuOnDesktop);

    return () => desktopQuery.removeEventListener("change", closeMenuOnDesktop);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    getIdTokenResult(user)
      .then((token) => setIsAdmin(token.claims.admin === true))
      .catch(() => setIsAdmin(false));
  }, [user]);

  const handleLogout = async () => {
    await logout();
    setIsAccountOpen(false);
    window.location.assign("/");
  };

  const isHome = pathname === "/";

  return (
    <header
      className={`fixed top-0 left-0 right-0 transition-all duration-300 ${isCartOpen || isSearchOpen ? "z-[1010]" : isMenuOpen ? "z-[980]" : "z-50"} ${
        isScrolled || !isHome || isMenuOpen
          ? "bg-white shadow-md"
          : "bg-transparent"
      }`}
    >
      <div className="container">
        <div className="grid grid-cols-3 items-center h-16 lg:h-20">
          {/* Left Navigation */}
          <nav className="hidden lg:flex items-center space-x-8 justify-start">
            <Link
              href="/"
              className={`transition-colors text-sm ${
                isScrolled || !isHome || isMenuOpen
                  ? "text-gray-700 hover:text-forest-600"
                  : "text-white hover:text-gold-300"
              }`}
            >
              Home
            </Link>
            <Link
              href="/shop"
              className={`transition-colors text-sm ${
                isScrolled || !isHome || isMenuOpen
                  ? "text-gray-700 hover:text-forest-600"
                  : "text-white hover:text-gold-300"
              }`}
            >
              Shop
            </Link>
            <Link
              href="/blog"
              className={`transition-colors text-sm ${
                isScrolled || !isHome
                  ? "text-gray-700 hover:text-forest-600"
                  : "text-white hover:text-gold-300"
              }`}
            >
              Blog
            </Link>
            <Link
              href="/contact-us"
              className={`transition-colors text-sm ${
                isScrolled || !isHome
                  ? "text-gray-700 hover:text-forest-600"
                  : "text-white hover:text-gold-300"
              }`}
            >
              Contact Us
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all lg:hidden ${isScrolled || !isHome || isMenuOpen ? "border-[#d8d1c4] text-[#17251c]" : "border-white/30 text-white hover:border-[#d8ae58] hover:text-[#e0b65f]"}`}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo - Centered */}
          <div className="flex justify-center">
            <a
              href="/"
              className="relative h-11 w-28 sm:h-12 sm:w-28 lg:h-14 lg:w-36"
            >
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
          <div className="flex items-center justify-end gap-1.5 sm:gap-3 lg:gap-6">
            <button
              onClick={() => setIsSearchOpen(true)}
              className={`hidden transition-all lg:flex ${
                isScrolled || !isHome || isMenuOpen
                  ? "text-gray-700 hover:text-forest-600"
                  : "text-white hover:text-gold-300"
              }`}
              aria-label="Search"
            >
              <Search size={20} />
            </button>
            {!user && (
              <Link
                href="/track-order"
                className={`hidden sm:block transition-colors ${
                  isScrolled || !isHome || isMenuOpen
                    ? "text-gray-700 hover:text-forest-600"
                    : "text-white hover:text-gold-300"
                }`}
                aria-label="Track Order"
                title="Track Order"
              >
                <PackageSearch size={20} />
              </Link>
            )}
            {user ? (
              <div className="relative order-last hidden sm:block">
                <button
                  onClick={() => setIsAccountOpen(!isAccountOpen)}
                  className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-forest-600 text-xs font-semibold text-white ring-2 ring-white/70"
                  aria-label="Open account menu"
                >
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={user.displayName || "Account"}
                      width={32}
                      height={32}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (user.displayName || user.email || "A")
                      .charAt(0)
                      .toUpperCase()
                  )}
                </button>
                {isAccountOpen && (
                  <div className="absolute right-0 mt-3 w-64 rounded-xl border border-gray-100 bg-white p-3 text-gray-700 shadow-xl">
                    <p className="truncate font-semibold text-forest-800">
                      {user.displayName || "Verde customer"}
                    </p>
                    <p className="mb-3 truncate text-xs text-gray-500">
                      {user.email}
                    </p>
                    <Link
                      href={isAdmin ? "/admin/settings" : "/profile"}
                      onClick={() => setIsAccountOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-forest-50"
                    >
                      <User size={16} />
                      My Profile
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setIsAccountOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-forest-700 hover:bg-forest-50"
                      >
                        <LayoutDashboard size={16} />
                        Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={16} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className={`order-last hidden sm:block transition-colors ${
                  isScrolled || !isHome
                    ? "text-gray-700 hover:text-forest-600"
                    : "text-white hover:text-gold-300"
                }`}
                aria-label="Account"
              >
                <User size={20} />
              </Link>
            )}
            <Link
              href="/wishlist"
              className={`hidden sm:block transition-colors relative ${
                isScrolled || !isHome
                  ? "text-gray-700 hover:text-forest-600"
                  : "text-white hover:text-gold-300"
              }`}
              aria-label="Wishlist"
            >
              <Heart size={20} />
              {getWishlistCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-gold-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                  {getWishlistCount()}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsCartOpen(true)}
              className={`relative hidden transition-all lg:flex ${
                isScrolled || !isHome || isMenuOpen
                  ? "text-gray-700 hover:text-forest-600"
                  : "text-white hover:text-gold-300"
              }`}
              aria-label="Cart"
            >
              <ShoppingCart size={20} />
              {getCartCount() > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold-500 text-[9px] font-semibold text-white sm:-right-2 sm:-top-2 sm:h-5 sm:w-5 sm:text-xs">
                  {getCartCount()}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="fixed inset-x-0 bottom-0 top-16 overflow-y-auto border-t border-[#c9a24f]/25 bg-[#111914] text-[#f3ecde] lg:hidden">
            <div className="container flex min-h-full flex-col px-6 py-6">
              <p className="mb-5 text-[9px] font-semibold uppercase tracking-[0.28em] text-[#c9a24f]">
                Explore Verde
              </p>
              <div className="flex flex-col border-t border-white/10">
                {[
                  ["Home", "/"],
                  ["Shop", "/shop"],
                  ["Journal", "/blog"],
                  ["Contact Us", "/contact-us"],
                ].map(([label, href], index) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsMenuOpen(false)}
                    className="group flex items-center justify-between border-b border-white/10 py-3.5 font-serif text-2xl transition-colors hover:text-[#deb45c]"
                  >
                    <span>{label}</span>
                    <span className="font-sans text-xs text-[#756f64] transition-all group-hover:translate-x-1 group-hover:text-[#c9a24f]">
                      0{index + 1}
                    </span>
                  </Link>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsSearchOpen(true);
                  }}
                  className="flex items-center gap-2.5 border border-white/10 bg-white/[0.03] px-3.5 py-3 text-left text-xs hover:border-[#c9a24f]/50"
                >
                  <Search size={18} className="text-[#c9a24f]" /> Search
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsCartOpen(true);
                  }}
                  className="flex items-center gap-2.5 border border-white/10 bg-white/[0.03] px-3.5 py-3 text-left text-xs hover:border-[#c9a24f]/50"
                >
                  <ShoppingCart size={18} className="text-[#c9a24f]" /> Cart
                  {getCartCount() > 0 && (
                    <span className="ml-auto text-xs text-[#dcb45f]">
                      {getCartCount()}
                    </span>
                  )}
                </button>
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:hidden">
                <Link
                  href={
                    user ? (isAdmin ? "/admin/settings" : "/profile") : "/login"
                  }
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2.5 border border-white/10 bg-white/[0.03] px-3.5 py-3 text-xs hover:border-[#c9a24f]/50"
                >
                  <User size={18} className="text-[#c9a24f]" />
                  {user ? "My Profile" : "Sign In"}
                </Link>
                <Link
                  href="/wishlist"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2.5 border border-white/10 bg-white/[0.03] px-3.5 py-3 text-xs hover:border-[#c9a24f]/50"
                >
                  <Heart size={18} className="text-[#c9a24f]" /> Wishlist
                  {getWishlistCount() > 0 && (
                    <span className="ml-auto text-xs text-[#dcb45f]">
                      {getWishlistCount()}
                    </span>
                  )}
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="col-span-2 flex items-center gap-2.5 border border-white/10 bg-white/[0.03] px-3.5 py-3 text-xs hover:border-[#c9a24f]/50"
                  >
                    <LayoutDashboard size={18} className="text-[#c9a24f]" />{" "}
                    Admin Dashboard
                  </Link>
                )}
              </div>

              <div className="mt-auto flex items-end justify-between pb-3 pt-7">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-[#8d8679]">
                    Verde by Renzo
                  </p>
                  <p className="mt-2 max-w-[230px] text-xs leading-5 text-[#aaa397]">
                    Performance essentials, thoughtfully elevated.
                  </p>
                </div>
                {user && (
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-xs text-[#c9a24f]"
                    aria-label="Sign out"
                  >
                    <LogOut size={16} /> Sign out
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
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </header>
  );
}
