import { Navbar } from '@/components/navbar'
import { HeroSection, FeaturesSection, StatsSection, TrustedBySection } from '@/components/hero-section'
import { Footer } from '@/components/footer'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <TrustedBySection />
      <Footer />
    </main>
  )
}