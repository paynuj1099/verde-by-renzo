# Verde by Renzo - Premium Performance Polo Showcase

A modern, elegant e-commerce showcase website built with Next.js 14, React, and Tailwind CSS.

## Design

- **Color Scheme**: White base with forest green (#2d5016) and gold (#d4af37) accents
- **Typography**: Serif fonts for headings (Georgia), Sans-serif for body (Inter)
- **Style**: Clean, minimalist, and sophisticated

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Project Structure

```
verde-by-renzo/
├── app/
│   ├── globals.css          # Global styles and Tailwind directives
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/
│   ├── Header.tsx           # Navigation header
│   ├── Hero.tsx             # Hero section with slider
│   ├── NewArrivals.tsx      # Product grid with category tabs
│   ├── PromoBanners.tsx     # Promotional banners section
│   └── Footer.tsx           # Footer with links and newsletter
├── public/                  # Static assets (add images here)
├── tailwind.config.ts       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Add your Google OAuth credentials (see Google OAuth Setup below)

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Google OAuth Setup

To enable Google login functionality:

1. **Create a Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Google OAuth API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Select "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback` (for development)
     - `https://yourdomain.com/api/auth/google/callback` (for production)
   - Click "Create"

4. **Add Credentials to .env.local**:
   ```bash
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   ```

5. **Restart your development server**

## Adding Images

Image placeholders are ready throughout the site. Add your images to the `public` folder and update the components:

- **Hero section**: Update `components/Hero.tsx`
- **Product images**: Update `components/NewArrivals.tsx`
- **Promotional banners**: Update `components/PromoBanners.tsx`

## Customization

### Colors
Edit `tailwind.config.ts` to adjust the forest green and gold color palettes.

### Content
- Update product data in `components/NewArrivals.tsx`
- Modify hero content in `components/Hero.tsx`
- Edit footer links in `components/Footer.tsx`

## Build for Production

```bash
npm run build
npm start
```

## Features

- ✅ Responsive design (mobile-first)
- ✅ Clean, modern UI
- ✅ Product showcase with category filtering
- ✅ Promotional banner sections
- ✅ Newsletter subscription
- ✅ Shopping cart integration
- ✅ Wishlist functionality
- ✅ Blog page with articles
- ✅ Contact page
- ✅ User authentication (Login with Google OAuth)
- ✅ Password reset functionality
- ✅ Search modal with product filtering
- ✅ Smooth animations and transitions
- ✅ TypeScript for type safety
- ✅ SEO-friendly structure

## License

Private project - All rights reserved
