export default function Loading() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-white via-gray-50 to-white z-[100] flex items-center justify-center transition-opacity duration-500">
      <div className="flex flex-col items-center">
        {/* Logo */}
        <div className="relative w-48 h-20 mb-8 animate-fade-in">
          <img
            src="/images/verde-logo.png"
            alt="Verde by Renzo"
            style={{ objectFit: 'contain', width: '100%', height: '100%' }}
          />
        </div>
        {/* Elegant progress bar */}
        <div className="w-64 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-forest-600 to-gold-500 animate-loading-bar"></div>
        </div>
        {/* Tagline */}
        <p className="mt-6 text-gray-500 text-sm tracking-wider animate-pulse">
          Every detail. Every swing. Elevated.
        </p>
      </div>
    </div>
  )
}
