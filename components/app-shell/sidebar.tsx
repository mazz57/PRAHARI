'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Leaf } from 'lucide-react'
import { PRIMARY_NAV, SETTINGS_NAV, isNavActive } from '@/components/app-shell/nav'
import { LanguageMenu } from '@/components/app-shell/language-menu'
import { DemoModeToggle } from '@/components/app-shell/demo-mode-toggle'
import { useLanguage } from '@/components/providers/language-provider'
import { UI } from '@/lib/i18n/ui-strings'
import { APP_STRINGS } from '@/lib/i18n/app-strings'

/**
 * Desktop sidebar (lg+). PRAVAAH branding, the 7 primary areas with an obvious active state, and a
 * clearly-separated secondary section for Settings, Demo/Test mode, and Language.
 */
export function Sidebar() {
  const pathname = usePathname()
  const { lang } = useLanguage()
  const ui = UI[lang]
  const t = APP_STRINGS[lang]
  const SettingsIcon = SETTINGS_NAV.icon
  const settingsActive = isNavActive(pathname, SETTINGS_NAV.href)

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <Link href="/" className="flex items-center gap-2.5 px-5 py-5 transition-opacity hover:opacity-90">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Leaf className="h-5 w-5" />
        </div>
        <div>
          <div className="text-lg font-bold leading-none tracking-tight">{ui.appName}</div>
          <div className="mt-1 text-xs text-muted-foreground">{t.brandTagline}</div>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {PRIMARY_NAV.map((item) => {
          const Icon = item.icon
          const active = isNavActive(pathname, item.href)
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {t.nav[item.key]}
            </Link>
          )
        })}
      </nav>

      <div className="space-y-3 border-t border-sidebar-border px-3 py-4">
        <Link
          href={SETTINGS_NAV.href}
          aria-current={settingsActive ? 'page' : undefined}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            settingsActive
              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          }`}
        >
          <SettingsIcon className="h-[18px] w-[18px] shrink-0" />
          {t.nav.settings}
        </Link>

        <DemoModeToggle />

        <div className="flex items-center justify-between gap-2 px-1 pt-1">
          <span className="text-xs text-muted-foreground">{t.language}</span>
          <LanguageMenu />
        </div>
      </div>
    </aside>
  )
}
