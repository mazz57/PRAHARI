import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { FieldRiskView } from '@/components/risk/field-risk-view'

export const metadata = {
  title: 'Field Risk — Prahari',
  description: 'Weather-driven early warning for crop disease, using the Hutton criterion and Wallin severity.',
}

export default function FieldRiskPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <FieldRiskView />
      <Footer />
    </main>
  )
}
