export type Product = {
  id: number
  category: string
  name: string
  price: number
  colors: string[]
  images: Record<string, string>

  /*
   * Optional image used specifically
   * by the New Arrivals section.
   *
   * If omitted, NewArrivals.tsx
   * automatically falls back to the
   * normal product image.
   */
  newArrivalImage?: string

  description: string
  longDescription: string
  materials: string[]
  features: string[]
  care?: string[]
  includes?: string[]

  /*
   * Homepage / search controls
   */
  isNew?: boolean
  isPopular?: boolean

  /*
   * Optional size-guide destination.
   * Only products with a dedicated
   * size guide should define this.
   */
  sizeGuideHref?: string
}

export const products: Product[] = [
  {
    id: 1,
    category: 'APPAREL',
    name: 'Performance Polo',
    price: 2490,

    colors: [
      'forest',
      'black',
      'ivory',
    ],

    images: {
      forest:
        '/images/performance-polo-green.png',

      black:
        '/images/performance-polo-black.png',

      ivory:
        '/images/performance-polo-ivory.png',
    },

    newArrivalImage:
      '/images/performance-polo-banner.png',

    description:
      'Premium performance polo designed for comfort, movement, and effortless style on and off the course.',

    longDescription:
      'Designed for golfers who value understated style and performance, the VERDE Performance Polo combines a clean silhouette with lightweight comfort for the course, clubhouse, and everyday wear.',

    materials: [
      'Performance fabric blend',
      'Lightweight breathable construction',
      'Moisture-managing fabric',
    ],

    features: [
      'Classic polo collar',
      'Embroidered VERDE branding',
      'Designed for unrestricted movement',
      'Lightweight construction',
      'On-course and casual styling',
    ],

    care: [
      'Machine wash cold',
      'Wash with similar colors',
      'Do not bleach',
      'Air dry when possible',
    ],

    isNew: true,
    isPopular: true,

    sizeGuideHref:
      '/size-guide#performance-polo',
  },

  {
    id: 2,
    category: 'ACCESSORIES',
    name: 'Golf Cap',
    price: 1290,

    colors: [
      'forest',
      'navy',
      'cream',
      'khaki',
      'black',
      'white',
      'burgundy',
    ],

    images: {
      forest:
        '/images/golf-cap-green.png',

      navy:
        '/images/golf-cap-navy.png',

      cream:
        '/images/golf-cap-cream.png',

      khaki:
        '/images/golf-cap-khaki.png',

      black:
        '/images/golf-cap-black.png',

      white:
        '/images/golf-cap-white.png',

      burgundy:
        '/images/golf-cap-burgundy.png',
    },

    newArrivalImage:
      '/images/golf-cap-banner.png',

    description:
      'Premium embroidered golf cap designed for lightweight comfort and everyday wear.',

    longDescription:
      'A refined golf essential featuring VERDE branding and a versatile silhouette designed to transition easily from the course to everyday casual wear.',

    materials: [
      'Premium woven fabric',
      'Structured front panels',
      'Embroidered VERDE logo',
    ],

    features: [
      'Adjustable fit',
      'Embroidered front branding',
      'Curved visor',
      'Lightweight construction',
      'Multiple color options',
    ],

    care: [
      'Spot clean only',
      'Do not machine wash',
      'Air dry',
    ],

    isNew: true,
    isPopular: true,
  },

  {
    id: 3,
    category: 'ACCESSORIES',
    name: 'Microfiber Golf Towel',
    price: 749,

    colors: [
      'forest',
      'navy',
      'cream',
      'khaki',
      'white',
      'black',
    ],

    images: {
      forest:
        '/images/microfiber-golf-towel-green.png',

      navy:
        '/images/microfiber-golf-towel-navy.png',

      cream:
        '/images/microfiber-golf-towel-cream.png',

      khaki:
        '/images/microfiber-golf-towel-khaki.png',

      white:
        '/images/microfiber-golf-towel-white.png',

      black:
        '/images/microfiber-golf-towel-black.png',
    },

    newArrivalImage:
      '/images/microfiber-golf-towel-banner.png',

    description:
      'Soft microfiber golf towel with carabiner attachment for convenient use throughout every round.',

    longDescription:
      'Keep your clubs and equipment clean throughout every round with the VERDE Microfiber Golf Towel, designed for convenient attachment to your golf bag.',

    materials: [
      'Soft microfiber fabric',
      'Metal carabiner attachment',
    ],

    features: [
      'Soft microfiber construction',
      'Quick-access carabiner',
      'Compact golf-bag friendly design',
      'VERDE branding',
    ],

    care: [
      'Machine wash cold',
      'Do not use fabric softener',
      'Air dry',
    ],

    isNew: true,
    isPopular: false,
  },

{
    id: 9,
    category: 'ACCESSORIES',
    name: 'Leather Golf Glove',
    price: 1290,

    colors: [
      'ivory',
    ],

    images: {
      ivory:
        '/images/Leather-golf-glove-ivory.png',
    },

    /*
     * Change this path if you create
     * a dedicated glove banner image.
     *
     * For now it uses the normal
     * ivory product render.
     */
    newArrivalImage:
      '/images/Leather-golf-glove.png',

    description:
      'Premium Cabretta leather golf glove designed for superior grip, comfort, and confident performance.',

    longDescription:
      'Crafted from premium Cabretta leather, the VERDE Leather Golf Glove combines a soft, refined feel with dependable grip and flexibility. Perforated detailing improves breathability while the adjustable wrist closure provides a secure and comfortable fit throughout every round.',

    materials: [
      'Premium Cabretta leather',
      'Breathable perforated leather panels',
      'Reinforced wrist closure',
    ],

    features: [
      'Soft premium leather construction',
      'Designed for superior grip and control',
      'Perforated fingers for breathability',
      'Flexible construction for natural movement',
      'Adjustable wrist closure',
      'Signature VERDE branding',
    ],

    care: [
      'Wipe clean with a soft damp cloth',
      'Do not machine wash',
      'Do not bleach',
      'Allow to air dry naturally',
      'Keep away from direct heat',
      'Store flat when not in use',
    ],

    includes: [
      '1 VERDE Leather Golf Glove',
    ],

    isNew: true,
    isPopular: false,

    sizeGuideHref:
      '/size-guide#golf-glove',
  },

  {
    id: 5,
    category: 'ACCESSORIES',
    name: 'Bamboo Golf Tee',
    price: 349,

    colors: [
      'forest',
      'ivory',
      'black',
      'gold',
      'green-gold',
    ],

    images: {
      forest:
        '/images/golf-tee-green.png',

      ivory:
        '/images/golf-tee-ivory.png',

      black:
        '/images/golf-tee-black.png',

      gold:
        '/images/golf-tee-gold.png',

      'green-gold':
        '/images/golf-tee-striped-green.png',
    },

    newArrivalImage:
      '/images/bamboo-golf-tees-set.png',

    description:
      'Premium branded bamboo golf tee combining classic styling with practical performance.',

    longDescription:
      'The VERDE Bamboo Golf Tee brings signature VERDE styling to one of the most essential accessories in every golfer’s bag.',

    materials: [
      'Bamboo construction',
      'Printed VERDE branding',
    ],

    features: [
      'Lightweight bamboo construction',
      'Multiple VERDE colorways',
      'Printed VERDE branding',
      'Clean premium finish',
    ],

    includes: [
      '1 VERDE Bamboo Golf Tee',
    ],

    isNew: true,
    isPopular: true,
  },

  {
    id: 6,
    category: 'ACCESSORIES',
    name: 'Club Cleaning Brush',
    price: 649,

    colors: [
      'forest',
    ],

    images: {
      forest:
        '/images/club-cleaning-brush-box-green.png',
    },

    newArrivalImage:
      '/images/club-cleaning-brush-box.png',

    description:
      'Dual-bristle golf club cleaning brush with convenient carabiner attachment.',

    longDescription:
      'Designed for quick maintenance between shots, the VERDE Club Cleaning Brush helps remove grass, dirt, and debris from your golf clubs.',

    materials: [
      'Dual-bristle brush head',
      'Durable molded handle',
      'Metal carabiner',
    ],

    features: [
      'Dual-bristle cleaning',
      'Compact design',
      'Golf bag carabiner',
      'VERDE branding',
    ],

    includes: [
      'Club Cleaning Brush',
      'Carabiner attachment',
    ],

    isNew: true,
    isPopular: false,
  },

  {
    id: 7,
    category: 'ACCESSORIES',
    name: 'Premium Golf Ball',
    price: 499,

    colors: [
      'white',
    ],

    images: {
      white:
        '/images/golf-ball.png',
    },

    newArrivalImage:
      '/images/premium-golf-ball-set-of-three.png',

    description:
      'VERDE premium branded golf ball featuring a clean white finish and signature VERDE branding.',

    longDescription:
      'A clean branded golf ball designed as an everyday course essential or an easy VERDE gift.',

    materials: [
      'Golf ball construction',
      'Printed VERDE branding',
    ],

    features: [
      'VERDE logo treatment',
      'Classic white finish',
      'Single-ball presentation',
    ],

    includes: [
      '1 VERDE Golf Ball',
    ],

    isNew: true,
    isPopular: true,
  },

  {
    id: 8,
    category: 'ACCESSORIES',
    name: 'Divot Tool Set',
    price: 799,

    colors: [
      'black',
    ],

    images: {
      black:
        '/images/divot-tool-set-black.png',
    },

    newArrivalImage:
      '/images/divot-tool-set.png',

    description:
      'Premium divot repair tool set designed as an essential companion for every round.',

    longDescription:
      'A compact course essential designed for repairing pitch marks while keeping your everyday golf accessories organized and ready to use.',

    materials: [
      'Durable metal construction',
      'Premium finished components',
    ],

    features: [
      'Compact divot repair tool',
      'Minimal VERDE styling',
      'Easy to carry',
      'Premium presentation',
    ],

    includes: [
      'Divot Repair Tool',
      'Matching accessory set',
    ],

    /*
     * Still available in the Shop,
     * Product Details, Cart,
     * Wishlist and Search.
     *
     * It is simply hidden from
     * New Arrivals.
     */
    isNew: false,
    isPopular: false,
  },
{
    id: 4,
    category: 'BAGS',
    name: 'Premium Tote Bag',
    price: 1290,

    colors: [
      'forest',
    ],

    images: {
      forest:
        '/images/golf-totebag-green.png',
    },

    newArrivalImage:
      '/images/golf-totebag-green-banner.png',

    description:
      'Structured premium canvas tote designed for the clubhouse, course, and everyday carry.',

    longDescription:
      'A clean and versatile tote featuring a structured silhouette and understated VERDE styling, designed for everyday essentials whether heading to the club or around the city.',

    materials: [
      'Structured canvas body',
      'Reinforced carry handles',
    ],

    features: [
      'Spacious main compartment',
      'Structured silhouette',
      'VERDE branding',
      'Durable carry handles',
      'Versatile everyday design',
    ],

    care: [
      'Spot clean with a damp cloth',
      'Air dry',
      'Do not bleach',
    ],

    isNew: true,
    isPopular: false,
  },
]