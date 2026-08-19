'use client'

import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  useParams,
  useSearchParams,
} from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

import {
  ArrowLeft,
  Check,
  Heart,
  ShoppingCart,
  ChevronDown,
  Package,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  Ruler,
} from 'lucide-react'

import { useProducts } from '@/context/ProductContext'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'

import {
  GLOVE_HANDS,
  GloveHand,
  getProductSizeOptions,
  productRequiresGloveHand,
} from '@/data/productOptions'

export default function ProductDetailPage() {
  const { products } = useProducts()
  const params = useParams<{
    id: string
  }>()

  const searchParams =
    useSearchParams()

  const product = products.find(
    (item) =>
      item.id === Number(params.id)
  )

  const { addToCart } =
    useCart()

  const {
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
  } = useWishlist()

  const [
    selectedColor,
    setSelectedColor,
  ] = useState('')

  const [
    selectedSize,
    setSelectedSize,
  ] = useState('')

  const [
    selectedHand,
    setSelectedHand,
  ] = useState<
    GloveHand | ''
  >('')

  const [
    optionError,
    setOptionError,
  ] = useState('')

  const [
    addedToCart,
    setAddedToCart,
  ] = useState(false)

  const [
    openSection,
    setOpenSection,
  ] = useState<string | null>(
    'details'
  )

  const [
    isZoomed,
    setIsZoomed,
  ] = useState(false)

  const [
    isDragging,
    setIsDragging,
  ] = useState(false)

  const [
    position,
    setPosition,
  ] = useState({
    x: 0,
    y: 0,
  })

  const viewerRef =
    useRef<HTMLDivElement | null>(
      null
    )

  const dragStart =
    useRef({
      pointerX: 0,
      pointerY: 0,
      imageX: 0,
      imageY: 0,
    })

  const ZOOM_SCALE = 1.6

  /*
   * Use the color from the URL when valid.
   * Example: /shop/1?color=ivory
   * Falls back to the first product color.
   */
  const colorFromUrl =
    searchParams.get('color')

  useEffect(() => {
    if (
      !product ||
      product.colors.length === 0
    ) {
      return
    }

    const validColor =
      colorFromUrl &&
      product.colors.includes(
        colorFromUrl
      )
        ? colorFromUrl
        : product.colors[0]

    setSelectedColor(
      validColor
    )

    setIsZoomed(false)
    setIsDragging(false)

    setPosition({
      x: 0,
      y: 0,
    })
  }, [product, colorFromUrl])

  /*
   * Reset size/hand when moving
   * between different products.
   */
  useEffect(() => {
    setSelectedSize('')
    setSelectedHand('')
    setOptionError('')
    setAddedToCart(false)
  }, [product?.id])

  /*
   * Product not found
   */
  if (!product) {
    return (
      <main className="min-h-screen bg-white pt-32">
        <div className="container text-center">
          <h1 className="mb-4 font-serif text-3xl text-gray-900">
            Product not found
          </h1>

          <Link
            href="/shop"
            className="text-forest-600 transition-colors hover:text-forest-700"
          >
            Return to Shop
          </Link>
        </div>
      </main>
    )
  }

  /*
   * Use first color during
   * the initial render.
   */
  const requestedColor =
    colorFromUrl &&
    product.colors.includes(
      colorFromUrl
    )
      ? colorFromUrl
      : product.colors[0]

  const currentColor =
    selectedColor ||
    requestedColor

  /*
   * Dedicated size guide.
   *
   * Performance Polo:
   * /size-guide#performance-polo
   *
   * Leather Golf Glove:
   * /size-guide#golf-glove
   */
  const sizeGuideHref =
    product.sizeGuideHref || (product.id === 1
      ? '/size-guide#performance-polo'
      : product.id === 9
        ? '/size-guide#golf-glove'
        : null)

  const sizeOptions =
    getProductSizeOptions(
      product.id
    )

  const requiresGloveHand =
    productRequiresGloveHand(
      product.id
    )

  /*
   * Get image for selected color.
   */
  const selectedImage =
    product.images?.[
      currentColor
    ] ||
    product.images?.[
      product.colors[0]
    ] ||
    Object.values(
      product.images || {}
    )[0]

  const getColorDisplay = (
    color: string
  ) => {
    const colorMap: Record<
      string,
      string
    > = {
      forest:
        'Forest Green',

      black:
        'Black',

      gold:
        'Gold',

      ivory:
        'Ivory',

      navy:
        'Navy Blue',

      cream:
        'Cream',

      khaki:
        'Khaki',

      white:
        'White',

      burgundy:
        'Burgundy',

      'green-gold':
        'Green / Gold',
    }

    return (
      colorMap[color] ||
      color
    )
  }

  const getColorClass = (
    color: string
  ) => {
    const colorClasses: Record<
      string,
      string
    > = {
      forest:
        'bg-[#123C2D]',

      black:
        'bg-black',

      gold:
        'bg-[#C9A15B]',

      ivory:
        'bg-[#F5F1E8]',

      navy:
        'bg-[#1F2A44]',

      cream:
        'bg-[#FFF4D6]',

      khaki:
        'bg-[#C3B091]',

      white:
        'bg-white',

      burgundy:
        'bg-[#800020]',

      'green-gold':
        'bg-[repeating-linear-gradient(45deg,#123C2D_0px,#123C2D_6px,#C9A15B_6px,#C9A15B_12px)]',
    }

    return (
      colorClasses[color] ||
      'bg-gray-400'
    )
  }

  /*
   * Reset zoom + pan.
   */
  const resetZoom = () => {
    setIsZoomed(false)

    setPosition({
      x: 0,
      y: 0,
    })

    setIsDragging(false)
  }

  /*
   * Zoom button.
   */
  const handleToggleZoom =
    () => {
      if (isZoomed) {
        resetZoom()
      } else {
        setIsZoomed(true)

        setPosition({
          x: 0,
          y: 0,
        })
      }
    }

  /*
   * Double-click image:
   * zoom in / zoom out.
   */
  const handleDoubleClick = (
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    e.preventDefault()

    if (isZoomed) {
      resetZoom()
      return
    }

    setIsZoomed(true)

    setPosition({
      x: 0,
      y: 0,
    })
  }

  /*
   * Color change also
   * resets zoom.
   */
  const handleColorChange = (
    color: string
  ) => {
    setSelectedColor(color)
    resetZoom()
  }

  /*
   * Begin dragging.
   */
  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!isZoomed) {
      return
    }

    e.currentTarget.setPointerCapture(
      e.pointerId
    )

    dragStart.current = {
      pointerX:
        e.clientX,

      pointerY:
        e.clientY,

      imageX:
        position.x,

      imageY:
        position.y,
    }

    setIsDragging(true)
  }

  /*
   * Drag zoomed image.
   */
  const handlePointerMove = (
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (
      !isZoomed ||
      !isDragging
    ) {
      return
    }

    const viewer =
      viewerRef.current

    if (!viewer) {
      return
    }

    const deltaX =
      e.clientX -
      dragStart.current.pointerX

    const deltaY =
      e.clientY -
      dragStart.current.pointerY

    /*
     * Calculate maximum movement
     * based on the actual viewer size.
     *
     * This prevents dragging the image
     * so far that blank space appears.
     */
    const maxX =
      (viewer.clientWidth *
        (ZOOM_SCALE - 1)) /
      2

    const maxY =
      (viewer.clientHeight *
        (ZOOM_SCALE - 1)) /
      2

    const nextX =
      Math.max(
        -maxX,
        Math.min(
          maxX,
          dragStart.current
            .imageX +
            deltaX
        )
      )

    const nextY =
      Math.max(
        -maxY,
        Math.min(
          maxY,
          dragStart.current
            .imageY +
            deltaY
        )
      )

    setPosition({
      x: nextX,
      y: nextY,
    })
  }

  /*
   * Stop dragging.
   */
  const handlePointerUp = (
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!isDragging) {
      return
    }

    if (
      e.currentTarget.hasPointerCapture(
        e.pointerId
      )
    ) {
      e.currentTarget.releasePointerCapture(
        e.pointerId
      )
    }

    setIsDragging(false)
  }

  /*
   * Add the exact selected variant
   * to the cart.
   */
  const handleAddToCart =
    () => {
      if (
        sizeOptions.length > 0 &&
        !selectedSize
      ) {
        setOptionError(
          'Please select a size.'
        )

        return
      }

      if (
        requiresGloveHand &&
        !selectedHand
      ) {
        setOptionError(
          'Please select which hand the glove will be worn on.'
        )

        return
      }

      setOptionError('')

      addToCart({
        id: product.id,
        name: product.name,
        price:
          product.price,
        category:
          product.category,
        color:
          currentColor,
        size:
          selectedSize ||
          undefined,
        hand:
          selectedHand ||
          undefined,
      })

      setAddedToCart(
        true
      )

      setTimeout(() => {
        setAddedToCart(
          false
        )
      }, 2000)
    }

  /*
   * Wishlist selected color.
   */
  const handleWishlist =
    () => {
      if (
        isInWishlist(
          product.id,
          currentColor
        )
      ) {
        removeFromWishlist(
          product.id,
          currentColor
        )

        return
      }

      addToWishlist({
        id:
          product.id,

        name:
          product.name,

        price:
          product.price,

        category:
          product.category,

        colors: [
          currentColor,
        ],

        description:
          product.description,
      })
    }

  const toggleSection = (
    section: string
  ) => {
    setOpenSection(
      openSection === section
        ? null
        : section
    )
  }

  return (
    <main className="min-h-screen bg-white pt-24 pb-16 sm:pt-28 lg:pt-32">
      <div className="container">

        {/* Back */}
        <Link
          href="/shop"
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-forest-600"
        >
          <ArrowLeft
            size={17}
          />

          Back to Shop
        </Link>

        {/* Main Product */}
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">

          {/* ======================== */}
          {/* IMAGE / ZOOM VIEWER */}
          {/* ======================== */}

          <div>

            <div
              ref={
                viewerRef
              }
              onDoubleClick={
                handleDoubleClick
              }
              onPointerDown={
                handlePointerDown
              }
              onPointerMove={
                handlePointerMove
              }
              onPointerUp={
                handlePointerUp
              }
              onPointerCancel={
                handlePointerUp
              }
              onDragStart={(
                e
              ) =>
                e.preventDefault()
              }
              className={`group relative aspect-[4/5] touch-none overflow-hidden rounded-xl bg-gray-100 select-none ${
                isZoomed
                  ? isDragging
                    ? 'cursor-grabbing'
                    : 'cursor-grab'
                  : 'cursor-zoom-in'
              }`}
            >

              {selectedImage ? (
                <Image
                  key={
                    selectedImage
                  }
                  src={
                    selectedImage
                  }
                  alt={`${product.name} - ${getColorDisplay(
                    currentColor
                  )}`}
                  fill
                  priority
                  draggable={
                    false
                  }
                  onDragStart={(
                    e
                  ) =>
                    e.preventDefault()
                  }
                  className="pointer-events-none object-cover object-center select-none"
                  style={{
                    transform:
                      isZoomed
                        ? `translate3d(${position.x}px, ${position.y}px, 0) scale(${ZOOM_SCALE})`
                        : 'translate3d(0px, 0px, 0) scale(1)',

                    transition:
                      isDragging
                        ? 'none'
                        : 'transform 350ms ease',
                  }}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
                  Product image unavailable
                </div>
              )}

              {/* Zoom Button */}
              <button
                type="button"
                onPointerDown={(
                  e
                ) => {
                  /*
                   * Do not start image dragging
                   * when clicking this button.
                   */
                  e.stopPropagation()
                }}
                onDoubleClick={(
                  e
                ) => {
                  /*
                   * Prevent double-click on
                   * button from triggering the
                   * image viewer.
                   */
                  e.stopPropagation()
                }}
                onClick={(
                  e
                ) => {
                  e.stopPropagation()

                  handleToggleZoom()
                }}
                className="absolute right-4 bottom-4 z-20 flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-medium text-gray-700 shadow-md backdrop-blur-sm transition hover:bg-white"
              >

                {isZoomed ? (
                  <ZoomOut
                    size={16}
                  />
                ) : (
                  <ZoomIn
                    size={16}
                  />
                )}

                {isZoomed
                  ? 'Zoom Out'
                  : 'Zoom In'}

              </button>

            </div>

            {/* Instructions */}
            <p className="mt-3 text-center text-xs text-gray-400">

              {isZoomed
                ? 'Drag to explore the image. Double-click to zoom out.'
                : 'Double-click the image to zoom in.'}

            </p>

          </div>

          {/* ======================== */}
          {/* PRODUCT INFORMATION */}
          {/* ======================== */}

          <div className="lg:sticky lg:top-28 lg:self-start">

            {/* Category */}
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-forest-600">
              {
                product.category
              }
            </p>

            {/* Name */}
            <h1 className="mb-4 font-serif text-3xl text-gray-900 sm:text-4xl lg:text-5xl">
              {product.name}
            </h1>

            {/* Price */}
            <p className="mb-6 text-2xl font-semibold text-forest-600">
              ₱
              {product.price.toLocaleString(
                'en-PH'
              )}
            </p>

            {/* short Description */}
            <p className="mb-8 leading-7 text-gray-600">
              {
                product.description
              }
            </p>

            {/* ================= */}
            {/* SIZE & FIT */}
            {/* ================= */}

            {sizeGuideHref && (
              <div className="mb-8 rounded-xl border border-gold-200 bg-gold-50 p-4 sm:p-5">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <p className="text-sm font-semibold text-gray-900">
                      Size &amp; Fit
                    </p>

                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      Check the measurements before adding this item to your cart.
                    </p>

                  </div>

                  <Link
                    href={
                      sizeGuideHref
                    }
                    className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-lg border border-forest-600 bg-white px-4 py-2.5 text-sm font-semibold text-forest-700 transition-colors hover:bg-forest-50"
                  >
                    <Ruler
                      size={17}
                    />

                    View Size Guide
                  </Link>

                </div>

              </div>
            )}

            {/* ================= */}
            {/* SIZE */}
            {/* ================= */}

            {sizeOptions.length > 0 && (
              <div className="mb-8">

                <div className="mb-3 flex items-center justify-between">

                  <span className="text-sm font-semibold text-gray-900">
                    Select Size
                  </span>

                  {selectedSize && (
                    <span className="text-sm text-gray-500">
                      {selectedSize}
                    </span>
                  )}

                </div>

                <div className="flex flex-wrap gap-2.5">

                  {sizeOptions.map(
                    (size) => (
                      <button
                        key={
                          size
                        }
                        type="button"
                        onClick={
                          () => {
                            setSelectedSize(
                              size
                            )

                            setOptionError('')
                          }
                        }
                        className={`min-w-12 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-all ${
                          selectedSize ===
                          size
                            ? 'border-forest-600 bg-forest-600 text-white shadow-sm'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-forest-500 hover:text-forest-700'
                        }`}
                        aria-pressed={
                          selectedSize ===
                          size
                        }
                      >
                        {size}
                      </button>
                    )
                  )}

                </div>

              </div>
            )}

            {/* ================= */}
            {/* GLOVE HAND */}
            {/* ================= */}

            {requiresGloveHand && (
              <div className="mb-8">

                <div className="mb-3 flex items-center justify-between">

                  <span className="text-sm font-semibold text-gray-900">
                    Glove Hand
                  </span>

                  {selectedHand && (
                    <span className="text-sm text-gray-500">
                      {selectedHand ===
                      'left'
                        ? 'Left Hand'
                        : 'Right Hand'}
                    </span>
                  )}

                </div>

                <div className="grid grid-cols-2 gap-3">

                  {GLOVE_HANDS.map(
                    (hand) => (
                      <button
                        key={
                          hand.value
                        }
                        type="button"
                        onClick={
                          () => {
                            setSelectedHand(
                              hand.value
                            )

                            setOptionError('')
                          }
                        }
                        className={`rounded-lg border px-4 py-3 text-sm font-semibold transition-all ${
                          selectedHand ===
                          hand.value
                            ? 'border-forest-600 bg-forest-600 text-white shadow-sm'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-forest-500 hover:text-forest-700'
                        }`}
                        aria-pressed={
                          selectedHand ===
                          hand.value
                        }
                      >
                        {hand.label}
                      </button>
                    )
                  )}

                </div>

                <p className="mt-2 text-xs leading-5 text-gray-500">
                  Choose the hand the glove will be worn on. Right-handed golfers typically wear a glove on the left hand; left-handed golfers typically wear it on the right.
                </p>

              </div>
            )}

            {optionError && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {optionError}
              </div>
            )}

            {/* ================= */}
            {/* COLOR */}
            {/* ================= */}

            <div className="mb-8">

              <div className="mb-3 flex items-center justify-between">

                <span className="text-sm font-semibold text-gray-900">
                  Select Color
                </span>

                <span className="text-sm text-gray-500">
                  {getColorDisplay(
                    currentColor
                  )}
                </span>

              </div>

              <div className="flex flex-wrap gap-3">

                {product.colors.map(
                  (color) => (
                    <button
                      key={
                        color
                      }
                      type="button"
                      onClick={() =>
                        handleColorChange(
                          color
                        )
                      }
                      className={`h-10 w-10 rounded-full border-2 transition-all ${getColorClass(
                        color
                      )} ${
                        currentColor ===
                        color
                          ? 'scale-110 border-forest-600 ring-2 ring-forest-600/20'
                          : 'border-gray-300 hover:border-gray-500'
                      }`}
                      style={product.colorHexes?.[color] ? { backgroundColor: product.colorHexes[color] } : undefined}
                      title={
                        getColorDisplay(
                          color
                        )
                      }
                      aria-label={`Select ${getColorDisplay(
                        color
                      )}`}
                    />
                  )
                )}

              </div>

            </div>

            {/* ================= */}
            {/* CART / WISHLIST */}
            {/* ================= */}

            <div className="mb-8 flex gap-3">

              <button
                type="button"
                onClick={
                  handleAddToCart
                }
                disabled={
                  addedToCart
                }
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3.5 font-semibold transition-all ${
                  addedToCart
                    ? 'bg-green-600 text-white'
                    : 'bg-forest-600 text-white hover:bg-forest-700'
                }`}
              >

                {addedToCart ? (
                  <>
                    <Check
                      size={20}
                    />

                    Added to Cart
                  </>
                ) : (
                  <>
                    <ShoppingCart
                      size={20}
                    />

                    Add to Cart
                  </>
                )}

              </button>

              <button
                type="button"
                onClick={
                  handleWishlist
                }
                className={`flex h-[52px] w-[52px] items-center justify-center rounded-lg border transition-all ${
                  isInWishlist(
                    product.id,
                    currentColor
                  )
                    ? 'border-red-200 bg-red-50'
                    : 'border-gray-300 hover:border-forest-600'
                }`}
                aria-label={
                  isInWishlist(
                    product.id,
                    currentColor
                  )
                    ? 'Remove from wishlist'
                    : 'Add to wishlist'
                }
              >

                <Heart
                  size={21}
                  className={
                    isInWishlist(
                      product.id,
                      currentColor
                    )
                      ? 'fill-red-500 text-red-500'
                      : 'text-gray-600'
                  }
                />

              </button>

            </div>

            {/* ================= */}
            {/* INFO CARDS */}
            {/* ================= */}

            <div className="mb-8 grid grid-cols-2 gap-3">

              <div className="rounded-lg bg-gray-50 p-4">

                <Package
                  size={22}
                  className="mb-2 text-forest-600"
                />

                <p className="text-sm font-semibold text-gray-900">
                  Pre-Order
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Availability will be confirmed after your request.
                </p>

              </div>

              <div className="rounded-lg bg-gray-50 p-4">

                <ShieldCheck
                  size={22}
                  className="mb-2 text-forest-600"
                />

                <p className="text-sm font-semibold text-gray-900">
                  VERDE Quality
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Designed with attention to quality and detail.
                </p>

              </div>

            </div>

            {/* ================= */}
            {/* PRODUCT DETAILS */}
            {/* ================= */}

            <div className="border-t border-gray-200">

              {/* DETAILS */}
              <div className="border-b border-gray-200">

                <button
                  type="button"
                  onClick={() =>
                    toggleSection(
                      'details'
                    )
                  }
                  className="flex w-full items-center justify-between py-5 text-left"
                >

                  <span className="font-semibold text-gray-900">
                    Product Details
                  </span>

                  <ChevronDown
                    size={20}
                    className={`transition-transform ${
                      openSection ===
                      'details'
                        ? 'rotate-180'
                        : ''
                    }`}
                  />

                </button>

                {openSection ===
                  'details' && (
                  <div className="pb-5">

                    <p className="leading-7 text-gray-600">
                      {
                        product.longDescription
                      }
                    </p>

                    <ul className="mt-5 space-y-3">

                      {product.features.map(
                        (
                          feature
                        ) => (
                          <li
                            key={
                              feature
                            }
                            className="flex gap-2 text-sm text-gray-600"
                          >

                            <Check
                              size={16}
                              className="mt-0.5 flex-shrink-0 text-forest-600"
                            />

                            {
                              feature
                            }

                          </li>
                        )
                      )}

                    </ul>

                  </div>
                )}

              </div>

              {/* MATERIALS */}
              <div className="border-b border-gray-200">

                <button
                  type="button"
                  onClick={() =>
                    toggleSection(
                      'materials'
                    )
                  }
                  className="flex w-full items-center justify-between py-5 text-left"
                >

                  <span className="font-semibold text-gray-900">
                    Materials
                  </span>

                  <ChevronDown
                    size={20}
                    className={`transition-transform ${
                      openSection ===
                      'materials'
                        ? 'rotate-180'
                        : ''
                    }`}
                  />

                </button>

                {openSection ===
                  'materials' && (
                  <div className="pb-5">

                    <ul className="space-y-2 text-sm text-gray-600">

                      {product.materials.map(
                        (
                          material
                        ) => (
                          <li
                            key={
                              material
                            }
                          >
                            •{' '}
                            {
                              material
                            }
                          </li>
                        )
                      )}

                    </ul>

                  </div>
                )}

              </div>

              {/* WHAT'S INCLUDED */}
              {product.includes &&
                product.includes
                  .length >
                  0 && (
                  <div className="border-b border-gray-200">

                    <button
                      type="button"
                      onClick={() =>
                        toggleSection(
                          'includes'
                        )
                      }
                      className="flex w-full items-center justify-between py-5 text-left"
                    >

                      <span className="font-semibold text-gray-900">
                        What's Included
                      </span>

                      <ChevronDown
                        size={20}
                        className={`transition-transform ${
                          openSection ===
                          'includes'
                            ? 'rotate-180'
                            : ''
                        }`}
                      />

                    </button>

                    {openSection ===
                      'includes' && (
                      <div className="pb-5">

                        <ul className="space-y-2 text-sm text-gray-600">

                          {product.includes.map(
                            (
                              item
                            ) => (
                              <li
                                key={
                                  item
                                }
                              >
                                •{' '}
                                {
                                  item
                                }
                              </li>
                            )
                          )}

                        </ul>

                      </div>
                    )}

                  </div>
                )}

              {/* CARE */}
              {product.care &&
                product.care
                  .length >
                  0 && (
                  <div className="border-b border-gray-200">

                    <button
                      type="button"
                      onClick={() =>
                        toggleSection(
                          'care'
                        )
                      }
                      className="flex w-full items-center justify-between py-5 text-left"
                    >

                      <span className="font-semibold text-gray-900">
                        Care Instructions
                      </span>

                      <ChevronDown
                        size={20}
                        className={`transition-transform ${
                          openSection ===
                          'care'
                            ? 'rotate-180'
                            : ''
                        }`}
                      />

                    </button>

                    {openSection ===
                      'care' && (
                      <div className="pb-5">

                        <ul className="space-y-2 text-sm text-gray-600">

                          {product.care.map(
                            (
                              instruction
                            ) => (
                              <li
                                key={
                                  instruction
                                }
                              >
                                •{' '}
                                {
                                  instruction
                                }
                              </li>
                            )
                          )}

                        </ul>

                      </div>
                    )}

                  </div>
                )}

            </div>

          </div>
        </div>
      </div>
    </main>
  )
}
