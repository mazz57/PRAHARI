'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Map, ScanLine, CloudSun, Store, Bell, BarChart3, Settings, Leaf } from 'lucide-react'
import type { ReactNode } from 'react'

const nav = [
  ['/', 'Home', Home], ['/fields', 'My Fields', Map], ['/crop-health', 'Crop Health', ScanLine],
  ['/field-risk', 'Field Risk', CloudSun], ['/mandi', 'Mandi', Store], ['/alerts', 'Alerts', Bell], ['/insights', 'Insights', BarChart3],
] as const

function Brand() { return <Link href="/" className="flex items-center gap-3"><span className="brand-mark"><Leaf className="h-5 w-5" /></span><span><strong className="block text-[17px] tracking-[.18em]">PRAVAAH</strong><small className="block text-[9px] uppercase tracking-[.16em] text-muted-foreground">Agricultural Intelligence</small></span></Link> }

export function ProductShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  return <div className="min-h-screen bg-background text-foreground md:flex">
    <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col border-r border-border bg-card">
      <div className="p-6 border-b border-border"><Brand /></div>
      <nav className="flex-1 space-y-1 p-4" aria-label="Primary navigation">
        <p className="eyebrow px-3 pb-3">Your farm</p>
        {nav.map(([href, label, Icon]) => <Link key={href} href={href} className={`nav-link ${pathname === href ? 'nav-link-active' : ''}`}><Icon className="h-[18px] w-[18px]" />{label}</Link>)}
      </nav>
      <div className="border-t border-border p-4"><Link href="/settings" className="nav-link"><Settings className="h-[18px] w-[18px]" />Settings</Link></div>
    </aside>
    <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
      <header className="flex items-center justify-between border-b border-border bg-background/90 px-5 py-4 backdrop-blur md:hidden"><Brand /><span className="h-2 w-2 rounded-full bg-primary" title="Connected" /></header>
      <main className="flex-1">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-border bg-card/95 px-1 py-2 backdrop-blur md:hidden" aria-label="Mobile navigation">{nav.slice(0, 5).map(([href, label, Icon]) => <Link key={href} href={href} className={`mobile-nav-link ${pathname === href ? 'text-primary' : ''}`}><Icon className="h-5 w-5" /><span>{label === 'My Fields' ? 'Fields' : label}</span></Link>)}</nav>
    </div>
  </div>
}

export function PageIntro({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) { return <header className="page-intro"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p className="page-description">{description}</p>}</div>{action}</header> }

export function Surface({ children, className = '' }: { children: ReactNode; className?: string }) { return <section className={`surface ${className}`}>{children}</section> }

export function Stat({ value, label, tone = 'default' }: { value: string; label: string; tone?: 'default'|'good'|'attention' }) { return <div className={`stat stat-${tone}`}><strong>{value}</strong><span>{label}</span></div> }

export function ProductPage({ children }: { children: ReactNode }) { return <ProductShell><div className="content-wrap">{children}</div></ProductShell> }

export { nav }
