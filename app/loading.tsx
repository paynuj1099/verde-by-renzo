export default function Loading() {
  return (
    <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center">
      <div className="flex flex-col items-center px-4">
        {/* Logo */}
        <div className="w-48 h-20 mb-8">
          <img
            src="/images/verde-logo.png"
            alt="Verde by Renzo"
            className="w-full h-full object-contain"
          />
        </div>
        {/* Elegant progress bar */}
        <div className="w-64 max-w-full h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-forest-600 to-gold-500 animate-loading-bar"></div>
        </div>
        {/* Tagline */}
        <p className="mt-6 text-gray-500 text-sm tracking-wider text-center">
          Every detail. Every swing. Elevated.
        </p>
      </div>
    </div>
  )
}
