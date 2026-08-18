# VERDE by Renzo

A modern, premium golf apparel and accessories e-commerce website built with Next.js, React, TypeScript, and Tailwind CSS.

VERDE by Renzo delivers a clean and sophisticated shopping experience featuring product variants, dedicated product imagery, wishlist functionality, persistent cart management, product search, pre-order checkout, blog content, and responsive layouts.

<img width="1884" height="947" alt="image" src="https://github.com/user-attachments/assets/b90179f4-95d9-4c4b-a553-7c176c1617e6" />



---

## Design

- **Color Scheme:** White base with forest green and gold accents
- **Primary Forest Green:** `#123C2D`
- **Gold Accent:** `#C9A15B`
- **Typography:** Serif fonts for headings and sans-serif fonts for body content
- **Style:** Clean, minimalist, sophisticated, and golf-inspired
- **Responsive Design:** Mobile-first design optimized for desktop, tablet, and mobile devices

---

## Tech Stack

- **Framework:** Next.js with App Router
- **Language:** TypeScript
- **Frontend:** React
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Images:** Next.js Image Optimization
- **State Management:** React Context API
- **Persistent Storage:** Browser Local Storage
- **Blog Content:** Markdown
- **Authentication:** Google OAuth support

---

## Project Structure

```text
verde-by-renzo/
│
├── app/
│   │
│   ├── blog/
│   │   ├── page.tsx
│   │   └── [slug]/
│   │       └── page.tsx
│   │
│   ├── contact-us/
│   │   └── page.tsx
│   │
│   ├── shop/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   │
│   ├── wishlist/
│   │   └── page.tsx
│   │
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── BlogArticle.tsx
│   ├── CartModal.tsx
│   ├── Footer.tsx
│   ├── Header.tsx
│   ├── Hero.tsx
│   ├── NewArrivals.tsx
│   ├── PromoBanners.tsx
│   └── SearchModal.tsx
│
├── content/
│   └── blog/
│       ├── choosing-the-right-golf-polo.md
│       ├── essential-golf-accessories.md
│       ├── golf-course-style-guide.md
│       └── ...
│
├── context/
│   ├── CartContext.tsx
│   └── WishlistContext.tsx
│
├── data/
│   └── products.ts
│
├── lib/
│   ├── blog.ts
│   └── productUtils.ts
│
├── public/
│   └── images/
│       ├── blog/
│       ├── performance-polo-green.png
│       ├── performance-polo-black.png
│       ├── performance-polo-ivory.png
│       ├── performance-polo-banner.png
│       ├── golf-cap-green.png
│       ├── golf-cap-banner.png
│       ├── leather-golf-glove-ivory.png
│       └── ...
│
├── .env.local
├── .env.local.example
├── next.config.js
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

# Product Architecture

All product information is centralized inside:

```text
data/products.ts
```

This file acts as the **single source of truth** for products throughout the website.

Instead of defining products separately inside the Shop, Cart, Wishlist, Search, Contact page, and New Arrivals components, those sections retrieve their information directly from the centralized product catalog.

---

## Product Type

Products use the following structure:

```ts
export type Product = {
  id: number
  category: string
  name: string
  price: number
  colors: string[]
  images: Record<string, string>

  newArrivalImage?: string

  description: string
  longDescription: string
  materials: string[]
  features: string[]
  care?: string[]
  includes?: string[]

  isNew?: boolean
  isPopular?: boolean
}
```

---

## Example Product

```ts
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
      '/images/leather-golf-glove-ivory.png',
  },

  newArrivalImage:
    '/images/leather-golf-glove-ivory.png',

  description:
    'Premium Cabretta leather golf glove designed for superior grip, comfort, and confident performance.',

  longDescription:
    'Crafted from premium Cabretta leather, the VERDE Leather Golf Glove combines a soft, refined feel with dependable grip and flexibility.',

  materials: [
    'Premium Cabretta leather',
    'Breathable perforated leather panels',
    'Reinforced wrist closure',
  ],

  features: [
    'Soft premium leather construction',
    'Designed for superior grip and control',
    'Perforated fingers for breathability',
    'Adjustable wrist closure',
    'Signature VERDE branding',
  ],

  care: [
    'Wipe clean with a soft damp cloth',
    'Do not machine wash',
    'Allow to air dry naturally',
  ],

  includes: [
    '1 VERDE Leather Golf Glove',
  ],

  isNew: true,

  isPopular: false,
}
```

---

# Automatic Product Data

The following sections automatically retrieve product information from:

```text
data/products.ts
```

These include:

- Shop
- Product Details
- Shopping Cart
- Wishlist
- Search
- Contact / Checkout
- New Arrivals
- Popular Products

For example, changing:

```ts
price: 1290
```

to:

```ts
price: 1490
```

inside `products.ts` automatically updates the price anywhere that product is retrieved from the centralized catalog.

There is no need to manually update the price inside Cart, Wishlist, Search, or Checkout.

---

# Product Images

Normal product images are stored inside the product's:

```ts
images
```

property.

Example:

```ts
images: {
  forest:
    '/images/performance-polo-green.png',

  black:
    '/images/performance-polo-black.png',

  ivory:
    '/images/performance-polo-ivory.png',
}
```

These images are used by areas such as:

```text
Shop
Product Details
Cart
Wishlist
Search
Contact / Checkout
```

The selected color determines which product image should be displayed.

For example:

```text
Product ID: 1
Color: black
```

resolves to:

```text
/images/performance-polo-black.png
```

---

# New Arrivals Images

The homepage New Arrivals section can use a different image from the normal Shop product image.

This is useful for:

```text
Lifestyle renders
Product sets
Banner renders
Marketing photography
Styled product presentations
```

Each product can optionally define:

```ts
newArrivalImage:
  '/images/performance-polo-banner.png'
```

For example:

```ts
{
  id: 1,

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
}
```

The normal `images` property continues to be used by Shop, Cart, Wishlist, Search, and Checkout.

The `newArrivalImage` is used only by the New Arrivals presentation.

If `newArrivalImage` is missing, the New Arrivals component automatically falls back to the product's normal default image.

---

# New Arrivals

Products displayed in New Arrivals are controlled using:

```ts
isNew: true
```

Example:

```ts
{
  id: 9,
  name: 'Leather Golf Glove',
  isNew: true,
}
```

To keep a product inside the Shop while hiding it from New Arrivals:

```ts
isNew: false
```

For example:

```ts
{
  id: 8,
  name: 'Divot Tool Set',
  isNew: false,
}
```

The Divot Tool can still appear in Shop and Search but will not appear in the New Arrivals section.

---

# Popular Products

Products can also be marked as popular:

```ts
isPopular: true
```

Example:

```ts
{
  id: 2,
  name: 'Golf Cap',
  isPopular: true,
}
```

Components such as the Search modal can automatically retrieve popular products using:

```ts
products.filter(
  (product) =>
    product.isPopular
)
```

---

# Product Utilities

Shared product-related functions are located inside:

```text
lib/productUtils.ts
```

This prevents components from duplicating common product logic.

The utility file can contain functions such as:

```ts
getProductById()
getProductImage()
getColorDisplay()
getColorClass()
```

---

## Product Lookup

Example:

```ts
const product =
  getProductById(9)
```

This returns the corresponding product from:

```text
data/products.ts
```

---

## Product Image Lookup

Example:

```ts
const image =
  getProductImage(
    product,
    'ivory'
  )
```

The function resolves the correct image based on the selected color.

---

# Shopping Cart

The shopping cart uses:

```text
context/CartContext.tsx
```

The cart stores only information specific to the customer's selection.

Example:

```ts
{
  id: 9,
  color: 'ivory',
  quantity: 1,
}
```

The following data does **not** need to be duplicated inside the cart:

```text
Product name
Product price
Product category
Product image
Product description
```

Those values are retrieved from:

```text
data/products.ts
```

using the product ID.

---

## Cart Image Resolution

For example:

```text
Cart Item
↓
ID: 9
Color: ivory
↓
getProductById(9)
↓
Leather Golf Glove
↓
product.images.ivory
↓
/images/leather-golf-glove-ivory.png
```

This means adding a new product image to `products.ts` automatically makes it available to the Cart.

---

## Cart Persistence

Cart items are stored in browser Local Storage using:

```text
verde-cart
```

This allows cart selections to remain available after page refreshes.

---

# Wishlist

Wishlist functionality uses:

```text
context/WishlistContext.tsx
```

A wishlist item can store the product ID and saved colors.

Example:

```ts
{
  id: 1,

  colors: [
    'forest',
    'black',
  ],
}
```

Product information is then retrieved from:

```text
data/products.ts
```

This means names, prices, descriptions, and product images stay synchronized with the main catalog.

---

# Search

The Search modal reads products directly from:

```text
data/products.ts
```

No separate Search product database is required.

Search can match information such as:

```text
Product name
Category
Description
Colors
Materials
Features
```

For example:

```text
glove
```

can match:

```text
Leather Golf Glove
```

Adding another product to `products.ts` automatically makes it available to Search.

---

# Contact & Pre-Order Checkout

The Contact page also acts as the pre-order checkout page when the customer has products inside their cart.

The checkout retrieves product information directly from:

```text
data/products.ts
```

including:

```text
Product name
Current price
Selected color
Product image
Quantity
Item subtotal
Order total
```

No separate product image database should be maintained inside the Contact page.

---

## Checkout Image Resolution

Example:

```text
Cart
↓
ID: 9
Color: ivory
↓
products.ts
↓
Leather Golf Glove
↓
images.ivory
↓
/images/leather-golf-glove-ivory.png
```

This allows new products to automatically work inside Checkout without manually adding additional image mappings.

---

## Generated Pre-Order Summary

The Contact page can generate an order summary such as:

```text
VERDE BY RENZO - PRE-ORDER

Order Date: August 18, 2026

Customer Information:
Name: Juan Dela Cruz
Email: juan@example.com
Phone: +63 912 345 6789
Address: Sample Address

ORDER DETAILS:
========================================

1. Leather Golf Glove
   Color: Ivory
   Quantity: 1
   Price: ₱1,290 each
   Subtotal: ₱1,290

========================================
Total Items: 1
TOTAL AMOUNT: ₱1,290

This is a pre-order request.
Payment details will be provided upon confirmation.
```

Customers can copy the generated order information and send it through the available communication channels.

---

# Blog Content

Blog articles are stored inside:

```text
content/blog/
```

Each article is stored as a Markdown `.md` file.

Example:

```text
content/
└── blog/
    ├── choosing-the-right-golf-polo.md
    ├── essential-golf-accessories.md
    ├── golf-course-style-guide.md
    └── how-to-care-for-a-golf-glove.md
```

---

# Blog Architecture

The blog system uses:

```text
content/blog/
        ↓
lib/blog.ts
        ↓
app/blog/page.tsx
        ↓
app/blog/[slug]/page.tsx
        ↓
components/BlogArticle.tsx
```

The Markdown files contain the article content.

`lib/blog.ts` handles reading and processing the articles.

`app/blog/page.tsx` displays the Blog listing.

`app/blog/[slug]/page.tsx` displays individual articles.

`BlogArticle.tsx` handles article presentation.

---

# Adding a Blog Article

Create a Markdown file inside:

```text
content/blog/
```

Example:

```text
content/blog/how-to-care-for-a-golf-glove.md
```

The file name can become the URL slug:

```text
/blog/how-to-care-for-a-golf-glove
```

---

## Markdown Front Matter

Blog posts can contain metadata at the beginning of the file.

Example:

```md
---
title: "How to Care for Your Leather Golf Glove"
date: "2026-08-18"
excerpt: "Simple ways to keep your VERDE leather golf glove clean, comfortable, and ready for every round."
author: "VERDE by Renzo"
coverImage: "/images/blog/golf-glove-care.jpg"
---

A premium leather golf glove can provide excellent grip and comfort when properly maintained.

## Keep It Dry

Allow your glove to air dry naturally after every round.

## Avoid Direct Heat

Do not place leather golf gloves directly under strong sunlight or near heating appliances.

## Store It Properly

Keep the glove flat when not in use to help maintain its shape.
```

---

# Blog Images

Blog images should be stored inside:

```text
public/images/blog/
```

Example:

```text
public/
└── images/
    └── blog/
        ├── golf-glove-care.jpg
        ├── golf-polo-guide.jpg
        └── golf-accessories-guide.jpg
```

Inside Markdown, reference them as:

```text
/images/blog/golf-glove-care.jpg
```

Do not include `/public` in the URL.

Correct:

```text
/images/blog/golf-glove-care.jpg
```

Incorrect:

```text
/public/images/blog/golf-glove-care.jpg
```

---

# Adding a New Product

Adding a new product normally only requires updating:

```text
data/products.ts
```

Example:

```ts
{
  id: 10,

  category:
    'ACCESSORIES',

  name:
    'New Golf Accessory',

  price:
    999,

  colors: [
    'forest',
  ],

  images: {
    forest:
      '/images/new-golf-accessory-green.png',
  },

  newArrivalImage:
    '/images/new-golf-accessory-banner.png',

  description:
    'Short product description.',

  longDescription:
    'Detailed product description.',

  materials: [
    'Premium material',
  ],

  features: [
    'Premium construction',
    'VERDE branding',
  ],

  isNew:
    true,

  isPopular:
    false,
}
```

Then place its images inside:

```text
public/images/
```

For example:

```text
public/images/new-golf-accessory-green.png
public/images/new-golf-accessory-banner.png
```

The product can then automatically become available to:

```text
Shop
Product Details
Cart
Wishlist
Search
Checkout
New Arrivals
```

depending on its configuration.

---

# Adding Images

All static website images should be stored inside:

```text
public/images/
```

Example:

```text
public/
└── images/
    ├── performance-polo-green.png
    ├── performance-polo-black.png
    ├── performance-polo-ivory.png
    ├── performance-polo-banner.png
    │
    ├── golf-cap-green.png
    ├── golf-cap-navy.png
    ├── golf-cap-banner.png
    │
    ├── microfiber-golf-towel-green.png
    ├── microfiber-golf-towel-banner.png
    │
    ├── golf-totebag-green.png
    ├── golf-totebag-green-banner.png
    │
    ├── bamboo-golf-tees-set.png
    │
    ├── club-cleaning-brush-box-green.png
    ├── club-cleaning-brush-box.png
    │
    ├── golf-ball.png
    ├── premium-golf-ball-set-of-three.png
    │
    ├── leather-golf-glove-ivory.png
    │
    └── blog/
        └── ...
```

Files inside `public/` are referenced without `/public`.

Example:

```ts
'/images/golf-ball.png'
```

---

# Getting Started

## 1. Install Dependencies

```bash
npm install
```

---

## 2. Configure Environment Variables

Copy:

```text
.env.local.example
```

to:

```text
.env.local
```

Add the required environment variables.

Do not commit `.env.local` to the repository.

---

## 3. Run Development Server

```bash
npm run dev
```

---

## 4. Open the Website

Open:

```text
http://localhost:3000
```

in your browser.

---

# Google OAuth Setup

To enable Google authentication, configure a Google Cloud project and OAuth credentials.

## Create Google OAuth Credentials

Create an OAuth 2.0 Client ID for a web application in Google Cloud.

Add the appropriate redirect URLs required by the authentication implementation used by the project.

Development example:

```text
http://localhost:3000/api/auth/google/callback
```

Production example:

```text
https://yourdomain.com/api/auth/google/callback
```

---

## Environment Variables

Add your credentials inside:

```text
.env.local
```

Example:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

Never expose private secrets directly inside frontend components.

---

# Customization

## Product Catalog

Edit:

```text
data/products.ts
```

This controls:

```text
Product names
Prices
Categories
Colors
Product images
New Arrivals images
Descriptions
Materials
Features
Care instructions
Included items
New Arrivals status
Popular status
```

---

## Product Utilities

Edit:

```text
lib/productUtils.ts
```

for shared product logic.

---

## Blog Content

Add or edit Markdown files inside:

```text
content/blog/
```

---

## Blog Logic

Edit:

```text
lib/blog.ts
```

to modify how Markdown articles are loaded and processed.

---

## Hero Section

Edit:

```text
components/Hero.tsx
```

---

## New Arrivals

Product selection is controlled inside:

```text
data/products.ts
```

using:

```ts
isNew: true
```

The component presentation itself is located at:

```text
components/NewArrivals.tsx
```

---

## Promotional Banners

Edit:

```text
components/PromoBanners.tsx
```

---

## Search

Edit:

```text
components/SearchModal.tsx
```

Product information itself should continue coming from:

```text
data/products.ts
```

---

## Cart

Cart state and persistence are managed inside:

```text
context/CartContext.tsx
```

Cart presentation is located inside:

```text
components/CartModal.tsx
```

---

## Wishlist

Wishlist state is managed inside:

```text
context/WishlistContext.tsx
```

The Wishlist page is located inside:

```text
app/wishlist/page.tsx
```

---

## Contact / Checkout

Checkout and pre-order functionality are located inside:

```text
app/contact-us/page.tsx
```

Products displayed during checkout are automatically resolved from:

```text
data/products.ts
```

---

# Build for Production

Create an optimized production build:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

---

# Features

- ✅ Responsive mobile-first design
- ✅ Premium golf apparel and accessories catalog
- ✅ Centralized product database
- ✅ Dynamic product pages
- ✅ Product color variants
- ✅ Automatic color-based product images
- ✅ Dedicated New Arrivals images
- ✅ New Arrivals product controls
- ✅ Popular product controls
- ✅ Shopping cart
- ✅ Persistent cart using Local Storage
- ✅ Automatic cart product resolution
- ✅ Wishlist functionality
- ✅ Variant-specific wishlist entries
- ✅ Automatic wishlist product resolution
- ✅ Product search
- ✅ Automatic Search catalog
- ✅ Contact page
- ✅ Pre-order checkout
- ✅ Automatic checkout product images
- ✅ Automatic current product pricing
- ✅ Generated pre-order summaries
- ✅ Blog listing page
- ✅ Dynamic Markdown blog articles
- ✅ Markdown front matter support
- ✅ Dedicated blog cover images
- ✅ Google authentication support
- ✅ Password reset functionality
- ✅ Responsive navigation
- ✅ Newsletter section
- ✅ Promotional sections
- ✅ Next.js image optimization
- ✅ Smooth hover animations and transitions
- ✅ TypeScript type safety
- ✅ SEO-friendly Next.js structure

---

# Content Management Overview

The project separates different types of content into clear locations:

```text
data/products.ts
    ↓
Product catalog

content/blog/
    ↓
Blog articles

public/images/
    ↓
Images and visual assets

lib/productUtils.ts
    ↓
Shared product logic

lib/blog.ts
    ↓
Blog / Markdown processing
```

This keeps product information, editorial content, media, and application logic separated and easier to maintain.

---

# Recommended Workflow

When adding a **new product**:

```text
1. Add product images to public/images/
2. Add the product to data/products.ts
3. Set isNew / isPopular as needed
4. Add newArrivalImage if a special homepage image exists
```

When adding a **new blog article**:

```text
1. Add the cover image to public/images/blog/
2. Create a Markdown file inside content/blog/
3. Add the article front matter
4. Write the Markdown content
```

There should normally be no need to manually add product information to Cart, Wishlist, Search, or Checkout.

---

# License

Private project.

All rights reserved © VERDE by Renzo.
