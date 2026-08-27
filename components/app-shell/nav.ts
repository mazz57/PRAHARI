import {
  Home,
  Sprout,
  Stethoscope,
  CloudSun,
  Store,
  Bell,
  BarChart3,
  Settings,
  type LucideIcon,
} from 'lucide-react'

/**
 * Canonical navigation config — the single source of truth for the 7 primary areas plus Settings.
 * Order here is the order shown everywhere (sidebar, mobile). Labels are resolved per-language from
 * APP_STRINGS[lang].nav[key], so this file stays language-agnostic.
 */
export type NavKey =
  | 'home'
  | 'fields'
  | 'cropHealth'
  | 'fieldRisk'
  | 'mandi'
  | 'alerts'
  | 'insights'
  | 'settings'

export interface NavItem {
  key: NavKey
  href: string
  icon: LucideIcon
}

export const PRIMARY_NAV: NavItem[] = [
  { key: 'home', href: '/', icon: Home },
  { key: 'fields', href: '/fields', icon: Sprout },
  { key: 'cropHealth', href: '/crop-health', icon: Stethoscope },
  { key: 'fieldRisk', href: '/field-risk', icon: CloudSun },
  { key: 'mandi', href: '/mandi', icon: Store },
  { key: 'alerts', href: '/alerts', icon: Bell },
  { key: 'insights', href: '/insights', icon: BarChart3 },
]

export const SETTINGS_NAV: NavItem = { key: 'settings', href: '/settings', icon: Settings }

/** The four primary items shown directly in the mobile bottom bar; the rest live behind "More". */
export const MOBILE_BAR_KEYS: NavKey[] = ['home', 'fields', 'cropHealth', 'fieldRisk']

/** Active-route test. Home matches only exactly; others match the segment and its children. */
export function isNavActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(href + '/')
}
