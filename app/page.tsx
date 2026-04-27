
import Hero from '@/components/Hero'
import NewArrivals from '@/components/NewArrivals'
import PromoBanners from '@/components/PromoBanners'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <NewArrivals />
      <PromoBanners />
    </main>
  )
}
