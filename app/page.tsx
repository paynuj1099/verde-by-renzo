import Header from '@/components/Header'
import Hero from '@/components/Hero'
import NewArrivals from '@/components/NewArrivals'
import PromoBanners from '@/components/PromoBanners'
import Footer from '@/components/Footer'

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function Home() {
  // Artificial delay to trigger loading screen (matches loading bar animation)
  await wait(2000);
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
