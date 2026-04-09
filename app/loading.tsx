export default function Loading() {
  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center min-h-screen w-full overflow-hidden">
      <div className="flex flex-col items-center justify-center px-4 w-full max-w-md mx-auto">
        {/* Logo */}
        <div className="w-40 sm:w-48 h-16 sm:h-20 mb-6 sm:mb-8">
          <img
            src="/images/verde-logo.png"
            alt="Verde by Renzo"
            className="w-full h-full object-contain"
            loading="eager"
          />
        </div>
        {/* Elegant progress bar */}
        <div className="w-full max-w-[16rem] sm:max-w-xs h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-forest-600 to-gold-500 animate-loading-bar"></div>
        </div>
        {/* Tagline */}
        <p className="mt-4 sm:mt-6 text-gray-500 text-xs sm:text-sm tracking-wider text-center px-2">
          Every detail. Every swing. Elevated.
        </p>
      </div>
    </div>
  )
}
