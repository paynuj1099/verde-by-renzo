import type { Metadata, Viewport } from "next";
import { Playfair_Display, Montserrat } from "next/font/google";
import "./globals.css";

import InitialLoader from "@/components/InitialLoader";
import SiteChrome from "@/components/SiteChrome";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProductProvider } from "@/context/ProductContext";
import { SiteAssetsProvider } from "@/context/SiteAssetsContext";
import { BlogProvider } from "@/context/BlogContext";
import DevicePresence from "@/components/DevicePresence";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Verde by Renzo",
  description:
    "Elevate every moment with Verde by Renzo premium performance polo shirts designed for the modern golfer.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${montserrat.variable}`}>
      <body className={montserrat.className}>
        <AuthProvider>
          <DevicePresence />
          <SiteAssetsProvider>
            <ProductProvider>
              <BlogProvider>
                <WishlistProvider>
                  <CartProvider>
                    <InitialLoader>
                      <SiteChrome>{children}</SiteChrome>
                    </InitialLoader>
                  </CartProvider>
                </WishlistProvider>
              </BlogProvider>
            </ProductProvider>
          </SiteAssetsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
