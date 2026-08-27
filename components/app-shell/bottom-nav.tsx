'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MoreHorizontal, X } from 'lucide-react'
import { PRIMARY_NAV, SETTINGS_NAV, MOBILE_BAR_KEYS, isNavActive, type NavItem } from '@/components/app-shell/nav'
import { LanguageMenu } from '@/components/app-shell/language-menu'
import { DemoModeToggle } from '@/components/app-shell/demo-mode-toggle'
import { useLanguage } from '@/components/providers/language-provider'
import { APP_STRINGS } from '@/lib/i18n/app-strings'

/**
 * Mobile navigation (below lg). NOT a compressed sidebar — a bottom bar with four large,
 * one-handed targets plus a "More" sheet that surfaces the remaining areas and secondary controls.
 */
export function BottomNav() {
  const pathname = usePathname()
  const { lang } = useLanguage()
  const t = APP_STRINGS[lang]
  const [open, setOpen] = useState(false)

  const barItems = MOBILE_BAR_KEYS.map((k) => PRIMARY_NAV.find((n) => n.key === k)).filter(
    Boolean,
  ) as NavItem[]
  const moreItems = PRIMARY_NAV.filter((n) => !MOBILE_BAR_KEYS.includes(n.key))
  const moreActive =
    moreItems.some((i) => isNavActive(pathname, i.href)) || isNavActive(pathname, SETTINGS_NAV.href)

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden />
          <div className="pv-animate-in absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-border bg-card p-4 pb-6 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">{t.menu}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[...moreItems, SETTINGS_NAV].map((item) => {
                const Icon = item.icon
                const active = isNavActive(pathname, item.href)
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-3 text-sm font-medium transition-colors ${
                      active
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {t.nav[item.key]}
                  </Link>
                )
              })}
            </div>

            <div className="mt-4 space-y-3 border-t border-border pt-4">
              <DemoModeToggle showScenario />
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">{t.language}</span>
                <LanguageMenu full />
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {barItems.map((item) => {
            const Icon = item.icon
            const active = isNavActive(pathname, item.href)
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-[22px] w-[22px]" />
                <span className="max-w-full truncate px-1">{t.nav[item.key]}</span>
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
              moreActive ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <MoreHorizontal className="h-[22px] w-[22px]" />
            <span>{t.more}</span>
          </button>
        </div>
      </nav>
    </>
  )
}
