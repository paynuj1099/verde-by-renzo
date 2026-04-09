'use client'

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center space-y-6 px-4">
        {/* Logo */}
        <div className="w-48 md:w-56">
          <img
            src="/images/verde-logo.png"
            alt="Verde by Renzo"
            className="w-full h-auto"
          />
        </div>
        
        {/* Progress Bar */}
        <div className="w-64 md:w-80 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-forest-600 via-forest-500 to-gold-500 animate-loading-progress"></div>
        </div>
        
        {/* Tagline */}
        <p className="font-montserrat text-xs md:text-sm text-gray-500 tracking-wide">
          Every detail. Every swing. Elevated.
        </p>
      </div>
    </div>
  )
}
