import Link from 'next/link'
import { ArrowUpRight, Camera, CloudSun, Map, Store, Bell, Leaf, CheckCircle2 } from 'lucide-react'
import { ProductPage, PageIntro, Surface, Stat } from '@/components/product-shell'
import { DEMO_FIELDS } from '@/lib/fields'

export const metadata = { title: 'Home — PRAVAAH', description: 'Know what is happening on your farm today.' }

export default function HomePage() {
  return <ProductPage>
    <PageIntro eyebrow="Tuesday, 27 August 2026" title="Good morning." description="Here is what is happening across your farm today." />
    <section className="farm-hero">
      <div><p className="eyebrow text-primary-foreground/70">My farm</p><h2>Stay close to every field.</h2><p className="max-w-md text-primary-foreground/75">PRAVAAH brings crop health, weather risk and market signals together so you know what to do next.</p></div>
      <div className="farm-stats"><Stat value={`${DEMO_FIELDS.length}`} label="Fields monitored" /><Stat value="—" label="Needs attention" tone="attention" /><Stat value="—" label="Looking good" tone="good" /></div>
    </section>
    <div className="section-heading"><div><p className="eyebrow">Your farm, today</p><h2>What needs your attention?</h2></div><Link href="/alerts" className="text-link">See all alerts <ArrowUpRight className="h-4 w-4" /></Link></div>
    <div className="today-grid">
      <Surface className="today-main"><div className="flex items-start justify-between"><div><span className="status-dot status-unknown" /> <span className="eyebrow inline">Farm status</span><h3>Risk data is ready to check</h3><p>Open Field Risk to calculate conditions around your fields using live weather data.</p></div><CloudSun className="h-8 w-8 text-primary" /></div><Link className="button-primary" href="/field-risk">Check field risk <ArrowUpRight className="h-4 w-4" /></Link></Surface>
      <Surface><div className="icon-label"><CloudSun className="h-5 w-5" /><span>Weather</span></div><h3 className="mt-5 text-3xl">Live check</h3><p className="mt-2 text-muted-foreground">Conditions are available through Field Risk.</p></Surface>
      <Surface><div className="icon-label"><Store className="h-5 w-5" /><span>Mandi snapshot</span></div><h3 className="mt-5 text-3xl">Government data</h3><p className="mt-2 text-muted-foreground">See today&apos;s reported prices before you sell.</p><Link href="/mandi" className="text-link mt-5">Open Mandi <ArrowUpRight className="h-4 w-4" /></Link></Surface>
    </div>
    <div className="section-heading"><div><p className="eyebrow">Next step</p><h2>Quick actions</h2></div></div>
    <div className="quick-actions"><Link href="/crop-health"><Camera /><span><strong>Check a crop</strong><small>Take or upload a leaf photo</small></span><ArrowUpRight /></Link><Link href="/fields"><Map /><span><strong>View my fields</strong><small>See every field at a glance</small></span><ArrowUpRight /></Link><Link href="/mandi"><Store /><span><strong>Check mandi prices</strong><small>Use government-reported rates</small></span><ArrowUpRight /></Link><Link href="/alerts"><Bell /><span><strong>Review alerts</strong><small>Know what needs attention</small></span><ArrowUpRight /></Link></div>
    <p className="trust-note"><CheckCircle2 className="h-4 w-4" /> PRAVAAH never fills gaps with made-up data. When a signal is unavailable, we tell you.</p>
  </ProductPage>
}
