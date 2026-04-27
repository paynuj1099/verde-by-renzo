'use client'

import Link from 'next/link'
import { FileText, PenTool } from 'lucide-react'

export default function BlogPage() {
  return (
    <main className="min-h-screen pt-36 pb-16">
      <div className="container">
        {/* Page Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h1 className="text-4xl lg:text-5xl font-serif font-bold text-forest-900 mb-4">
            The Verde Journal
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Stories, insights, and inspiration from the world of Verde by Renzo
          </p>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-20 lg:py-32">
          <div className="mb-8 relative">
            <div className="w-32 h-32 bg-forest-50 rounded-full flex items-center justify-center">
              <PenTool size={64} className="text-forest-300" strokeWidth={1.5} />
            </div>
          </div>
          
          <h2 className="text-2xl lg:text-3xl font-serif font-bold text-gray-900 mb-4">
            No Articles Yet
          </h2>
          
          <p className="text-gray-600 text-center max-w-md mb-8">
            We're working on creating amazing content for you. Check back soon for stories, style guides, and insights from Verde by Renzo.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/shop"
              className="px-8 py-3 bg-forest-600 hover:bg-forest-700 text-white font-semibold rounded-lg transition-colors"
            >
              Browse Our Collection
            </Link>
            <Link
              href="/contact-us"
              className="px-8 py-3 border-2 border-forest-600 text-forest-600 hover:bg-forest-50 font-semibold rounded-lg transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="mt-16 bg-gradient-to-r from-forest-600 to-forest-800 rounded-2xl p-8 lg:p-12 text-center text-white">
          <h2 className="text-3xl lg:text-4xl font-serif font-bold mb-4">
            Stay Updated
          </h2>
          <p className="text-forest-100 mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter and be the first to know about new articles, collections, and exclusive offers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-3 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
            <button className="px-8 py-3 bg-gold-500 hover:bg-gold-600 text-white font-semibold rounded-full transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
