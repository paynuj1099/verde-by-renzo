import { Mail, Instagram, Facebook, Twitter, Linkedin } from 'lucide-react'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-[#0a0f0a] text-white mt-16 sm:mt-20">
      <div className="container py-10 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div>
            <div className="flex flex-col items-start mb-4">
              <div className="relative w-56 h-24 mb-3">
                <Image
                  src="/images/verde-logo.png"
                  alt="Verde by Renzo Logo"
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Premium performance polo shirts designed for the modern golfer. Every detail, every swing, elevated.
            </p>
            
            {/* Social Media */}
            <div className="flex items-center gap-3">
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-gold-500 flex items-center justify-center transition-all duration-300 group"
                aria-label="Instagram"
              >
                <Instagram size={18} className="text-gray-400 group-hover:text-gray-900" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-gold-500 flex items-center justify-center transition-all duration-300 group"
                aria-label="Facebook"
              >
                <Facebook size={18} className="text-gray-400 group-hover:text-gray-900" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-gold-500 flex items-center justify-center transition-all duration-300 group"
                aria-label="Twitter"
              >
                <Twitter size={18} className="text-gray-400 group-hover:text-gray-900" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-gold-500 flex items-center justify-center transition-all duration-300 group"
                aria-label="LinkedIn"
              >
                <Linkedin size={18} className="text-gray-400 group-hover:text-gray-900" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-white uppercase tracking-wider text-xs sm:text-sm">Quick Links</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-gold-500 transition-colors">About Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-gold-500 transition-colors">Shop</a></li>
              <li><a href="#" className="text-gray-400 hover:text-gold-500 transition-colors">Contact</a></li>
              <li><a href="#" className="text-gray-400 hover:text-gold-500 transition-colors">Blog</a></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-semibold mb-4 text-white uppercase tracking-wider text-xs sm:text-sm">Customer Service</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-gold-500 transition-colors">Shipping Info</a></li>
              <li><a href="#" className="text-gray-400 hover:text-gold-500 transition-colors">Returns</a></li>
              <li><a href="#" className="text-gray-400 hover:text-gold-500 transition-colors">Size Guide</a></li>
              <li><a href="#" className="text-gray-400 hover:text-gold-500 transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold mb-4 text-white uppercase tracking-wider text-xs sm:text-sm">Newsletter</h3>
            <p className="text-gray-400 text-sm mb-4 leading-relaxed">
              Subscribe to get special offers and updates.
            </p>
            <form className="flex flex-col gap-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                  type="email"
                  placeholder="Your email"
                  className="w-full pl-10 pr-4 py-3 text-sm bg-white/5 border border-white/10 text-gray-200 rounded-lg focus:outline-none focus:border-gold-500 transition-colors placeholder:text-gray-600"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-gold-500 hover:bg-gold-600 text-gray-900 text-sm rounded-lg font-semibold transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 sm:mt-12 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-gray-500">
          <p>&copy; 2026 Verde by Renzo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
