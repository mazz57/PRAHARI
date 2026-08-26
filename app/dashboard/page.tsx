import Link from 'next/link'
import { CloudSun, Camera, ArrowRight, Info } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { RiskSummaryStrip } from '@/components/risk/risk-summary-strip'

export const metadata = {
  title: 'Dashboard — Prahari',
  description: 'Two tools, one goal: catch crop disease early. Predict the risk, and check a leaf.',
}

/**
 * Dashboard = an honest hub. Its most important job is to keep the TWO features from being confused:
 *   • FIELD RISK  — predictive early warning from weather + crop (answers "could disease come SOON?")
 *   • CHECK MY CROP — image detection of a leaf you already suspect (answers "is this disease NOW?")
 * The live strip below is fed by the real engine via /api/disease-risk — no hardcoded bands.
 */
export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="max-w-2xl text-muted-foreground">
            Two different tools with one goal — catch crop disease early. They answer different
            questions, so pick the one that matches your situation.
          </p>
        </header>

        {/* The two clearly-separated features. */}
        <div className="grid gap-5 md:grid-cols-2">
          {/* FIELD RISK — prediction */}
          <Link
            href="/field-risk"
            className="group relative flex flex-col rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-lg"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <CloudSun className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Field Risk</h2>
            <p className="mt-1 text-sm font-medium text-primary">Could disease become a problem soon?</p>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">
              Looks at the weather forecast for each of your fields and checks it against the science
              of late blight (Hutton criterion + Wallin severity). Tells you SAFE, WATCH, or ACT — before
              you can see anything on the plant.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
              Open Field Risk <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>

          {/* CHECK MY CROP — detection */}
          <Link
            href="/check-crop"
            className="group relative flex flex-col rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-lg"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
              <Camera className="h-6 w-6 text-accent" />
            </div>
            <h2 className="text-xl font-semibold">Check my crop</h2>
            <p className="mt-1 text-sm font-medium text-accent">Does my crop show disease right now?</p>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">
              For when you already see spots on a leaf and want a second opinion from a photo. This is
              detection of a problem that is present now — not a forecast.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
              Open Check my crop <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </div>

        {/* Real engine output, right on the dashboard. */}
        <RiskSummaryStrip scenario="blight_outbreak" />

        {/* Honest framing of what these tools are and are not. */}
        <div className="flex gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <span className="font-medium text-foreground">How to read this:</span> Field Risk is a
            weather-based early warning — it is rule-based science, not a magic AI, and it never shows a
            band it could not actually compute. Image detection (“Check my crop”) is a separate tool; its
            honest current status is shown on that page.
          </p>
        </div>
      </div>
      <Footer />
    </main>
  )
}
