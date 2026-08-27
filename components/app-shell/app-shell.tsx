'use client'

import Link from 'next/link'
import { Leaf } from 'lucide-react'
import { Sidebar } from '@/components/app-shell/sidebar'
import { BottomNav } from '@/components/app-shell/bottom-nav'
import { DemoBanner } from '@/components/app-shell/demo-banner'
import { LanguageMenu } from '@/components/app-shell/language-menu'
import { useLanguage } from '@/components/providers/language-provider'
import { UI } from '@/lib/i18n/ui-strings'

/**
 * The single, consistent chrome for every page. Desktop gets a persistent left sidebar; mobile gets
 * a compact top header plus a bottom nav bar (built separately — never a squeezed sidebar). Demo
 * mode surfaces a persistent banner above the content on both.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { lang } = useLanguage()
  const ui = UI[lang]

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Leaf className="h-[18px] w-[18px]" />
            </div>
            <span className="text-base font-bold tracking-tight">{ui.appName}</span>
          </Link>
          <LanguageMenu />
        </header>

        <DemoBanner />

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-8 lg:pb-8">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
