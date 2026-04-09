export default function Loading() {
  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="flex flex-col items-center">
        {/* Logo Area */}
        <div className="mb-8 animate-pulse">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-serif text-forest-600 tracking-wider mb-2">VERDE</span>
            <span className="text-sm text-gold-500 tracking-widest italic">by RENZO</span>
          </div>
        </div>
        
        {/* Elegant Spinner */}
        <div className="relative w-16 h-16">
          {/* Outer ring */}
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          {/* Animated ring */}
          <div className="absolute inset-0 border-4 border-transparent border-t-forest-600 border-r-gold-500 rounded-full animate-spin"></div>
        </div>
        
        {/* Loading text */}
        <p className="mt-6 text-gray-500 text-sm tracking-wider animate-pulse">Loading...</p>
      </div>
    </div>
  )
}
