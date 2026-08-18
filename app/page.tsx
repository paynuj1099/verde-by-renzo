import Hero from "@/components/Hero";
import NewArrivals from "@/components/NewArrivals";
import PromoBanners from "@/components/PromoBanners";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f4f0e7]">
      <Hero />
      <NewArrivals />
      <PromoBanners />
    </main>
  );
}
