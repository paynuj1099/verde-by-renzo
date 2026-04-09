import Header from '@/components/Header'
import Hero from '@/components/Hero'
import NewArrivals from '@/components/NewArrivals'
import PromoBanners from '@/components/PromoBanners'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <NewArrivals />
      <PromoBanners />
      <Footer />
    </main>
  )
}
