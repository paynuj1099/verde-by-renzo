export default function PromoBanners() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Banner 1 - Ethereal Elegance */}
          <div className="relative bg-gray-200 rounded-lg overflow-hidden group min-h-[300px] sm:min-h-[400px] lg:min-h-[500px]">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400" />
            <div className="relative h-full flex flex-col justify-between p-6 sm:p-8 lg:p-12">
              <div>
                <p className="text-xs sm:text-sm uppercase tracking-widest text-gray-600 mb-2">
                  Ethereal Elegance
                </p>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-gray-900 mb-3 sm:mb-4">
                  Where Dreams Meet Couture
                </h3>
              </div>
              <button className="self-start px-5 sm:px-6 py-2.5 sm:py-3 bg-white hover:bg-forest-600 hover:text-white transition-all text-xs sm:text-sm uppercase tracking-wider font-semibold rounded">
                Pre Order
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8">
            {/* Banner 2 - Radiant Reverie */}
            <div className="relative bg-gray-200 rounded-lg overflow-hidden group min-h-[200px] sm:min-h-[240px]">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400" />
              <div className="relative h-full flex flex-col justify-between p-6 sm:p-8 lg:p-12">
                <div>
                  <p className="text-xs sm:text-sm uppercase tracking-widest text-gray-600 mb-2">
                    Radiant Reverie
                  </p>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-serif text-gray-900 mb-3 sm:mb-4">
                    Enchanting Styles for Every Woman
                  </h3>
                </div>
                <button className="self-start px-5 sm:px-6 py-2.5 sm:py-3 bg-white hover:bg-forest-600 hover:text-white transition-all text-xs sm:text-sm uppercase tracking-wider font-semibold rounded">
                  Pre Order
                </button>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {/* Banner 3 - Footwear */}
              <div className="relative bg-gray-200 rounded-lg overflow-hidden group min-h-[200px] sm:min-h-[240px]">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400" />
                <div className="relative h-full flex flex-col justify-between p-4 sm:p-6 lg:p-8">
                  <div>
                    <p className="text-[10px] sm:text-xs uppercase tracking-widest text-gray-600 mb-1 sm:mb-2">
                      Urban Strides
                    </p>
                    <h3 className="text-sm sm:text-base lg:text-xl font-serif text-gray-900 mb-1 sm:mb-2 leading-tight">
                      Chic Footwear for City Living
                    </h3>
                  </div>
                  <button className="self-start px-3 sm:px-4 py-2 bg-white hover:bg-forest-600 hover:text-white transition-all text-[10px] sm:text-xs uppercase tracking-wider font-semibold rounded">
                    Pre Order
                  </button>
                </div>
              </div>

              {/* Banner 4 - Bags Sale */}
              <div className="relative bg-forest-600 rounded-lg overflow-hidden group min-h-[200px] sm:min-h-[240px]">
                <div className="absolute inset-0 bg-gradient-to-br from-forest-600 to-forest-700" />
                <div className="relative h-full flex flex-col justify-between p-4 sm:p-6 lg:p-8 text-white">
                  <div>
                    <p className="text-[10px] sm:text-xs uppercase tracking-widest text-gold-300 mb-1 sm:mb-2">
                      Urban Strides
                    </p>
                    <h3 className="text-sm sm:text-base lg:text-xl font-serif mb-1 sm:mb-2 leading-tight">
                      Trendsetting Bags for Her
                    </h3>
                  </div>
                  <div>
                    <p className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-2">50%</p>
                    <button className="self-start px-3 sm:px-4 py-2 bg-white text-forest-600 hover:bg-gold-500 hover:text-white transition-all text-[10px] sm:text-xs uppercase tracking-wider font-semibold rounded">
                      Pre Order
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
