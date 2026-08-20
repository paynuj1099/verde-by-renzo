# VERDE by Renzo

A modern, premium golf apparel and accessories e-commerce platform built with **Next.js, React, TypeScript, Tailwind CSS, Firebase, Firestore, ImageKit, and PayMongo**.

VERDE by Renzo combines a luxury golf-inspired storefront with a full administration experience. Customers can browse product variants, manage a wishlist and cart, authenticate with Firebase, place orders through PayMongo-powered checkout flows, and view editorial content through the VERDE Journal. Administrators can manage products, new arrivals, orders, and user accounts from a protected dashboard.

<img width="1869" height="947" alt="VERDE by Renzo storefront" src="https://github.com/user-attachments/assets/ac6ec9c6-913b-444d-9abe-e1a93c9e7b8c" />
<img width="1906" height="939" alt="Screenshot 2026-08-20 153144" src="https://github.com/user-attachments/assets/6d15671f-282f-4001-a2b4-29c1f5255a43" />
<img width="1890" height="942" alt="Screenshot 2026-08-20 153115" src="https://github.com/user-attachments/assets/5465f0b0-b121-4f1e-9e07-06d02a7296b2" />
<img width="1890" height="940" alt="Screenshot 2026-08-20 153540" src="https://github.com/user-attachments/assets/120d2154-fafc-4107-a7ee-a5bb0fbc4f42" />

---

## Design

- **Color Scheme:** White / ivory base with forest green, black, and gold accents
- **Primary Forest Green:** `#123C2D`
- **Gold Accent:** `#C9A15B`
- **Typography:** Serif headings with clean sans-serif body typography
- **Style:** Minimal, premium, sophisticated, and golf-inspired
- **Responsive Design:** Optimized for desktop, tablet, and mobile devices
- **Admin UI:** Dark luxury dashboard treatment consistent with the VERDE brand

---

# Core Features

## Storefront

- Responsive premium e-commerce interface
- Dynamic product catalog backed by Firestore
- Product categories and filtering
- Product color variants
- Variant-specific product imagery
- Product detail pages
- New Arrivals and Popular Product controls
- Product search
- Wishlist functionality
- Persistent shopping cart
- Quantity controls and cart totals
- Product size and product information sections
- Responsive navigation and modal experiences
- Newsletter and promotional sections

## Authentication & Accounts

- Firebase Authentication
- Email/password authentication
- OAuth provider support through Firebase Authentication
- Google sign-in support
- GitHub sign-in support
- Password reset flow
- User profile/account records stored in Firestore
- Secure Firebase Admin SDK operations on the server
- Firebase custom claims for administrator authorization
- Protected admin routes and server-side admin checks

## Checkout & Payments

- PayMongo payment integration
- Server-side PayMongo secret key usage
- Checkout Session API route
- Payment Intent API route
- Public PayMongo key available to the browser where required
- Order creation and payment flow integration
- Product price and order information resolved from application data instead of trusting client-submitted totals
- Support for PayMongo payment methods enabled for the merchant account

## Administration

- Protected Admin Dashboard
- Product management
- Create, edit, and remove product records
- Product image and variant management
- Journal Management (create, edit, and remove blogs)
- New Arrivals management
- Order management
- Order status tracking/management
- Coupon Management
- Customer/account management
- Firebase Authentication user management through server-side Admin SDK operations
- Firestore user profile management
- Promote eligible users to administrator using Firebase custom claims
- Admin-only actions protected from normal customer accounts

## Content

- VERDE Journal / blog
- Markdown-based articles
- Dynamic blog routes
- Front matter metadata
- Blog cover images
- Web3Forms-powered contact form

## Media & Deployment

- ImageKit-hosted media support
- Next.js Image optimization
- Vercel deployment
- Firebase / Google Cloud infrastructure
- Environment-based configuration for development and production

---

# Tech Stack

| Area | Technology |
| --- | --- |
| Framework | Next.js / App Router |
| Frontend | React |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Authentication | Firebase Authentication |
| OAuth | Firebase OAuth providers / OAuth 2.0 |
| Database | Cloud Firestore |
| Server Administration | Firebase Admin SDK |
| Authorization | Firebase Custom Claims |
| Payments | PayMongo |
| Media | ImageKit |
| Contact Forms | Web3Forms |
| Blog | Markdown |
| Client State | React Context API |
| Local Persistence | Browser Local Storage where appropriate |
| Hosting | Vercel |
| Cloud Platform | Firebase / Google Cloud Platform |

---

# High-Level Architecture

```text
Customer Browser
      |
      v
Next.js App Router
      |
      +--------------------+
      |                    |
      v                    v
Firebase Client SDK     Next.js Server/API Routes
      |                    |
      |                    +--------------------+
      |                    |                    |
      v                    v                    v
Firebase Auth       Firebase Admin SDK      PayMongo API
      |                    |
      +---------+----------+
                |
                v
           Cloud Firestore
                |
                +------------------+
                |                  |
                v                  v
             Products            Users
             Orders              Profiles

Media --------------------------> ImageKit
Contact Form -------------------> Web3Forms
Deployment ---------------------> Vercel
```

The frontend uses the Firebase client SDK for normal customer authentication and Firestore access allowed by security rules. Privileged operations are performed only on the server using the Firebase Admin SDK.

PayMongo secret-key operations are also handled server-side and must never be executed directly from client components.

---

# Suggested Project Structure

The exact structure can evolve as features are added, but the application is organized around the following areas:

```text
verde-by-renzo/
|
├── app/
│   ├── admin/
│   │   ├── page.tsx
│   │   ├── products/
│   │   ├── orders/
│   │   ├── users/
│   │   ├── new-arrivals/
│   │   └── ...
│   │
│   ├── api/
│   │   ├── auth/
│   │   ├── admin/
│   │   ├── payments/
│   │   └── ...
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
│   ├── admin/
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
├── lib/
│   ├── blog.ts
│   ├── firebase.ts
│   ├── firebaseAdmin.ts
│   ├── productUtils.ts
│   └── ...
│
├── public/
│   └── images/
│       ├── blog/
│       └── ...
│
├── .env.local
├── .env.local.example
├── next.config.js
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

> Route and file names can differ slightly from the example above. Keep the actual repository structure as the source of truth.

---

# Firebase Architecture

Firebase provides authentication, application data storage, and privileged server administration.

## Firebase Client SDK

The client SDK is used for browser-safe functionality such as:

- Sign in
- Sign up
- Sign out
- Google authentication
- GitHub authentication when enabled
- Password reset
- Reading/writing Firestore data allowed by security rules
- Maintaining the current signed-in Firebase user session

Only `NEXT_PUBLIC_FIREBASE_*` values should be used in browser-side Firebase initialization.

## Firebase Admin SDK

The Admin SDK is server-only and is configured using:

```env
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
```

It is used for privileged operations such as:

- Reading Firebase Authentication users
- Looking up users by UID/email
- Updating users
- Assigning administrator custom claims
- Verifying Firebase ID tokens
- Authorizing protected Admin API routes
- Secure server-side Firestore operations

Never import `firebase-admin` into a client component.

---

# Authentication and User Accounts

Firebase Authentication is the identity provider for the application.

A Firebase Authentication user and a Firestore `users` document are related but are not the same record:

```text
Firebase Authentication
    -> identity, UID, provider, email, password/OAuth

Firestore /users/{uid}
    -> application profile and account-related data
```

This distinction is important when building the Admin Accounts page. A document existing inside Firestore does not automatically mean a corresponding Firebase Authentication account exists.

## Example Firestore User Document

```ts
{
  uid: 'firebase-user-uid',
  email: 'customer@example.com',
  displayName: 'Juan Dela Cruz',
  role: 'customer',
  createdAt: '...',
  updatedAt: '...'
}
```

---

# Administrator Authorization

Administrator access uses Firebase custom claims.

Example custom claim:

```ts
{
  admin: true
}
```

Admin pages and privileged API routes should verify this claim server-side before allowing protected operations.

## Promote a User to Admin

A server-side Firebase Admin operation can assign the claim:

```ts
await adminAuth.setCustomUserClaims(uid, {
  admin: true,
})
```

After a claim changes, the affected user may need to sign in again or refresh their Firebase ID token before the new authorization is reflected in the client session.

Do not allow normal client code to assign custom claims directly.

---

# Firestore Data

Firestore is used as the application's cloud database.

Typical collections include:

```text
products/
users/
orders/
```

Additional collections can be added as the platform grows.

---

# Product Management

Products are managed through the application and stored in Firestore.

A typical product can contain:

```ts
export type Product = {
  id: string
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

## Example Product

```ts
{
  id: 'leather-golf-glove',
  category: 'ACCESSORIES',
  name: 'Leather Golf Glove',
  price: 1290,
  colors: ['ivory'],
  images: {
    ivory: 'https://ik.imagekit.io/your_imagekit_id/products/leather-golf-glove-ivory.png',
  },
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
  includes: ['1 VERDE Leather Golf Glove'],
  isNew: true,
  isPopular: false,
}
```

The storefront, product details, search, cart resolution, wishlist presentation, checkout, and Admin Dashboard should resolve current product information from the shared product source rather than maintaining duplicate hard-coded product copies.

---

# Admin Dashboard

The Admin Dashboard provides a central management interface for VERDE by Renzo.

## Dashboard

The dashboard can surface operational information such as:

- Total products
- New Arrivals
- Orders
- Customers
- Sales/revenue metrics
- Recent orders
- Order status summaries

## Product Management

Administrators can manage the catalog without directly editing storefront components.

Typical actions include:

- Add a product
- Edit product information
- Update price
- Update category
- Manage color variants
- Update product images
- Set New Arrival status
- Set Popular status
- Remove/archive products

## New Arrivals Management

Products can be controlled using fields such as:

```ts
isNew: true
```

and, where applicable:

```ts
newArrivalImage: 'https://ik.imagekit.io/...'
```

This allows the homepage to use dedicated lifestyle/banner artwork without replacing the normal product detail image.

## Order Management

The admin area can be used to review and manage customer orders.

Typical order information includes:

```text
Order ID
Customer
Email
Items
Quantity
Selected variant/color
Subtotal
Total
Payment status
Order status
Created date
```

Example order statuses may include:

```text
Pending
Processing
Paid
Shipped
Completed
Cancelled
```

Use the statuses that match the actual implementation in the project.

## Account Management

Administrators can review customer account/profile records and perform protected account operations.

Firebase Authentication is used for authentication identities, while Firestore can store application-specific user profile information.

Admin promotion must be performed through a protected server-side Firebase Admin route or trusted administration script using Firebase custom claims.

---

# Product Images and ImageKit

ImageKit is used for hosted product/media assets.

Example URL:

```text
https://ik.imagekit.io/your_imagekit_id/verdebyrenzo/products/example-product.png
```

ImageKit configuration uses:

```env
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
```

The private key is server-only.

Do not expose `IMAGEKIT_PRIVATE_KEY` in client-side components or rename it with a `NEXT_PUBLIC_` prefix.

Static application assets can still live inside:

```text
public/images/
```

Files inside `public/` are referenced without `/public`.

Example:

```ts
'/images/logo.png'
```

---

# Shopping Cart

The cart is managed through React Context and can persist customer selections in browser Local Storage.

A cart item should primarily store selection-specific information such as:

```ts
{
  id: 'product-id',
  color: 'ivory',
  quantity: 1,
}
```

Current product information such as name and price should be resolved from the product catalog when possible.

This reduces stale duplicated data when an administrator updates a product.

## Cart Persistence

A Local Storage key can be used to preserve cart selections between page refreshes, for example:

```text
verde-cart
```

---

# Wishlist

Wishlist functionality is managed through the shared Wishlist context.

Variant-specific wishlist behavior allows a selected color to be saved independently.

Example:

```ts
{
  id: 'performance-polo',
  colors: ['forest', 'black'],
}
```

The displayed product name, current price, and current product image should be resolved from the current product catalog rather than being permanently duplicated inside wishlist storage.

---

# Search

Product search uses the current catalog and can match information such as:

- Product name
- Category
- Description
- Colors
- Materials
- Features

Adding or updating a Firestore product makes it available to search once the application's product query/state refreshes.

---

# PayMongo Payments

VERDE by Renzo uses PayMongo for online payment processing.

The project includes server-side routes for PayMongo flows such as:

- Checkout Sessions
- Payment Intents

The exact payment methods shown to the customer depend on the methods enabled and supported by the PayMongo account and the selected PayMongo integration flow.

## Security Rules

`PAYMONGO_SECRET_KEY` is server-only.

Never do this in a client component:

```ts
const secretKey = process.env.PAYMONGO_SECRET_KEY
```

and never expose it using:

```env
NEXT_PUBLIC_PAYMONGO_SECRET_KEY=
```

Only the PayMongo public key should use the `NEXT_PUBLIC_` prefix when the browser needs it.

## Payment Flow

A typical application flow is:

```text
1. Customer reviews cart
2. Application resolves current products and prices
3. Customer starts checkout
4. Browser calls a Next.js server/API route
5. Server validates the order
6. Server creates the PayMongo Checkout Session or Payment Intent
7. Customer completes payment through the PayMongo flow
8. Application records/updates the order in Firestore
9. Admin can review the order from the Admin Dashboard
```

Do not trust totals submitted by the browser. Recalculate or validate prices on the server using the current product data before creating the PayMongo transaction.

---

# Orders

Orders are stored in Firestore so they can be displayed to both the customer-facing experience and the protected Admin Dashboard.

A simplified order structure can look like:

```ts
{
  id: 'order-id',
  userId: 'firebase-user-uid',
  customerEmail: 'customer@example.com',
  items: [
    {
      productId: 'performance-polo',
      color: 'forest',
      quantity: 1,
      unitPrice: 2490,
    },
  ],
  subtotal: 2490,
  total: 2490,
  paymentProvider: 'paymongo',
  paymentStatus: 'pending',
  orderStatus: 'pending',
  createdAt: '...',
  updatedAt: '...',
}
```

Store the PayMongo identifiers needed by the actual implementation so a payment/order can be reconciled safely.

---

# Blog Content

Blog articles are stored inside:

```text
content/blog/
```

Each article is a Markdown `.md` file.

Example:

```text
content/
└── blog/
    ├── choosing-the-right-golf-polo.md
    ├── essential-golf-accessories.md
    ├── golf-course-style-guide.md
    └── how-to-care-for-a-golf-glove.md
```

## Blog Architecture

```text
content/blog/
      |
      v
lib/blog.ts
      |
      v
app/blog/page.tsx
      |
      v
app/blog/[slug]/page.tsx
      |
      v
components/BlogArticle.tsx
```

`lib/blog.ts` reads and processes the Markdown content, the blog listing page displays available articles, and the dynamic slug page renders an individual article.

## Example Front Matter

```md
---
title: "How to Care for Your Leather Golf Glove"
date: "2026-08-18"
excerpt: "Simple ways to keep your VERDE leather golf glove clean, comfortable, and ready for every round."
author: "VERDE by Renzo"
coverImage: "/images/blog/golf-glove-care.jpg"
---
```

---

# Web3Forms Contact Form

Web3Forms is used for contact-form submissions.

The public access key is configured using:

```env
NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY=
```

This key is intentionally used by the browser for Web3Forms form submission. Never place unrelated server secrets in the same client-side request.

---

# Environment Variables

Create a `.env.local` file in the project root.

A safe `.env.local.example` can contain the following variable names and fake example values:

```env
# =========================================================
# Web3Forms
# =========================================================
# Browser-accessible Web3Forms access key.
NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY=12345678-abcd-1234-abcd-1234567890ab


# =========================================================
# Firebase Client Configuration
# =========================================================
# These values are used by the Firebase Web SDK.
# Replace every example with the values from your Firebase project.
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyEXAMPLE_ONLY_NOT_A_REAL_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=verde-by-renzo.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=verde-by-renzo
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=verde-by-renzo.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890abcd
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-EXAMPLE123


# =========================================================
# Firebase Admin SDK - SERVER ONLY
# =========================================================
# Use values from your Firebase / Google Cloud service account.
# Do NOT prefix these with NEXT_PUBLIC_.
FIREBASE_ADMIN_PROJECT_ID=verde-by-renzo
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-example@verde-by-renzo.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nEXAMPLE_PRIVATE_KEY_CONTENT\n-----END PRIVATE KEY-----\n"


# =========================================================
# ImageKit
# =========================================================
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/verdebyrenzo
IMAGEKIT_PUBLIC_KEY=public_EXAMPLE_IMAGEKIT_KEY
IMAGEKIT_PRIVATE_KEY=private_EXAMPLE_IMAGEKIT_KEY


# =========================================================
# PayMongo
# =========================================================
# Secret key is server-only.
PAYMONGO_SECRET_KEY=sk_test_EXAMPLE_PAYMONGO_SECRET_KEY

# Public key may be used in browser-side PayMongo flows.
NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_test_EXAMPLE_PAYMONGO_PUBLIC_KEY

# Local development URL:
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Production example:
# NEXT_PUBLIC_SITE_URL=https://verde-by-renzo.vercel.app
```

## Important Environment Variable Notes

### `NEXT_PUBLIC_*`

Next.js exposes variables beginning with `NEXT_PUBLIC_` to browser-side JavaScript.

They must never contain private credentials.

Browser-safe configuration variables in this project include:

```text
NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY
NEXT_PUBLIC_SITE_URL
```

### Server-only Secrets

These values must remain server-only:

```text
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY
IMAGEKIT_PUBLIC_KEY
IMAGEKIT_PRIVATE_KEY
PAYMONGO_SECRET_KEY
```

Although an ImageKit public key is not equivalent to the private key, keeping SDK signing/authentication operations server-side avoids exposing the private signing flow.

## Firebase Private Key Formatting

For Vercel and `.env.local`, the private key is commonly stored on one line with escaped newlines:

```env
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

Then normalize it server-side:

```ts
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
```

Do not commit a real service-account private key to GitHub.

---

# Local Development

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure Environment Variables

Copy:

```text
.env.local.example
```

to:

```text
.env.local
```

Replace the example values with the actual development credentials.

## 3. Run the Development Server

```bash
npm run dev
```

## 4. Open the Website

```text
http://localhost:3000
```

---

# Firebase Setup

## 1. Create or Select a Firebase Project

Use Firebase Console / Google Cloud for the project that backs VERDE by Renzo.

## 2. Enable Authentication

Enable the authentication providers used by the application, such as:

- Email/Password
- Google
- GitHub, if used in the deployed application

Configure each OAuth provider's required client credentials and authorized callback/redirect settings.

## 3. Create Firestore

Create the Firestore database and configure appropriate Firestore Security Rules.

## 4. Configure Firebase Admin

Create/use a Google Cloud service account and add the required Admin SDK environment variables.

Never expose the service account private key to the browser.

---

# OAuth Notes

Firebase Authentication can broker OAuth sign-in for supported providers.

When Google authentication is configured through Firebase, the application signs in through Firebase Authentication while the underlying provider still uses OAuth 2.0.

Provider configuration must match the domains and callback/redirect URLs used by the deployed application.

For production, ensure the Vercel/custom domain is listed in the appropriate Firebase authorized domains and provider configuration.

---

# PayMongo Setup

1. Create/configure the PayMongo account.
2. Obtain test keys first.
3. Add the test public and secret keys to `.env.local`.
4. Configure the server-side Checkout Session and/or Payment Intent routes.
5. Use test mode while developing.
6. Add the production keys to Vercel only when the PayMongo account is ready for live transactions.
7. Confirm the payment methods available to the account before exposing them in the checkout UI.

PayMongo transaction fees apply to successful transactions according to the merchant's PayMongo pricing and enabled payment method.

---

# ImageKit Setup

1. Create/configure the ImageKit account.
2. Copy the URL endpoint.
3. Add the ImageKit public and private keys to server configuration.
4. Keep the private key server-only.
5. Store the returned media URLs in Firestore product records where appropriate.

Example product image field:

```ts
images: {
  forest: 'https://ik.imagekit.io/verdebyrenzo/products/performance-polo-green.png',
  black: 'https://ik.imagekit.io/verdebyrenzo/products/performance-polo-black.png',
  ivory: 'https://ik.imagekit.io/verdebyrenzo/products/performance-polo-ivory.png',
}
```

---

# Vercel Deployment

The production deployment is hosted on Vercel.

When deploying:

- Add all production environment variables in **Vercel Project Settings -> Environment Variables**
- Do not upload `.env.local`
- Do not commit private keys
- Set `NEXT_PUBLIC_SITE_URL` to the production domain
- Confirm Firebase authorized domains
- Confirm OAuth redirect/callback configuration
- Confirm PayMongo production keys before accepting live payments
- Redeploy after changing environment variables when required

Production URL:

```text
https://verde-by-renzo.vercel.app/
```

---

# Security Checklist

- Keep `PAYMONGO_SECRET_KEY` server-only
- Keep `FIREBASE_ADMIN_PRIVATE_KEY` server-only
- Keep `IMAGEKIT_PRIVATE_KEY` server-only
- Never commit `.env.local`
- Never expose Firebase Admin credentials in client code
- Verify Firebase ID tokens on protected server routes
- Verify the Firebase `admin` custom claim for administrator actions
- Do not use a visible Admin UI alone as authorization
- Validate product IDs, quantities, and prices server-side before payment creation
- Do not trust totals submitted by the browser
- Use Firestore Security Rules for client-accessible collections
- Restrict admin Firestore operations to trusted server routes where appropriate
- Use PayMongo test mode during development

---

# Feature Summary

- ✅ Responsive premium golf e-commerce storefront
- ✅ Next.js App Router
- ✅ React + TypeScript
- ✅ Tailwind CSS
- ✅ Firebase Authentication
- ✅ Email/password authentication
- ✅ Google OAuth support
- ✅ GitHub OAuth support when configured
- ✅ Password reset
- ✅ Cloud Firestore
- ✅ Firebase Admin SDK
- ✅ Firebase custom admin claims
- ✅ Protected Admin Dashboard
- ✅ Product management
- ✅ New Arrivals management
- ✅ Order management
- ✅ Account/user management
- ✅ Admin promotion support
- ✅ Product color variants
- ✅ Variant-specific product imagery
- ✅ ImageKit media integration
- ✅ Product detail pages
- ✅ Product search
- ✅ Wishlist
- ✅ Persistent cart
- ✅ PayMongo payment integration
- ✅ PayMongo Checkout Session route
- ✅ PayMongo Payment Intent route
- ✅ Order/payment data integration
- ✅ Web3Forms contact form
- ✅ Markdown blog
- ✅ Dynamic blog routes
- ✅ Vercel deployment
- ✅ Firebase / Google Cloud infrastructure
- ✅ SEO-friendly Next.js structure

---

# Recommended Product Workflow

When adding a new product through the application/admin tooling:

```text
1. Prepare/upload product images
2. Save image URLs from ImageKit
3. Create the product in Firestore
4. Add product colors/variants
5. Add product descriptions, materials, features, and care information
6. Set New Arrival / Popular status as needed
7. Verify the storefront and product details page
8. Verify Cart, Wishlist, Search, and Checkout resolution
```

When editing a product:

```text
1. Update the Firestore product record through Admin
2. Verify current product price and images
3. Confirm the storefront refreshes correctly
4. Confirm server-side checkout uses the current price
```

---

# Recommended Order Workflow

```text
Customer adds product to Cart
        |
        v
Customer starts Checkout
        |
        v
Server validates products/prices
        |
        v
PayMongo Checkout Session / Payment Intent
        |
        v
Payment result
        |
        v
Firestore Order
        |
        v
Admin Order Management
```

---

# License

Private project.

All rights reserved © VERDE by Renzo.
