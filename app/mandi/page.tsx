import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { MandiView } from '@/components/mandi/mandi-view'

export const metadata = {
  title: 'Mandi Intelligence — Prahari',
  description:
    'Live daily agricultural mandi prices and arrivals across markets sourced from data.gov.in and AGMARKNET.',
}

export default function MandiPage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <Navbar />
      <div className="flex-1">
        <MandiView />
      </div>
      <Footer />
    </main>
  )
}
