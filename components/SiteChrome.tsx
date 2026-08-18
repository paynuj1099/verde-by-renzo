'use client'

import { usePathname } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Chatbot from '@/components/Chatbot'

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin')

  return <>
    {!isAdmin && <Header />}
    {children}
    {!isAdmin && <Footer />}
    {!isAdmin && <Chatbot />}
  </>
}
