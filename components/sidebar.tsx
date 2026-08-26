'use client'

import Link from 'next/link'
import { Home, Leaf, Bug, TrendingUp, Settings, LogOut } from 'lucide-react'
import { Button } from './ui/button'
import { usePathname } from 'next/navigation'

export function Sidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card min-h-screen">
      <div className="border-b border-border p-5">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="leading-none">
            <span className="block text-base font-black tracking-[0.16em] text-foreground">PRAVAAH</span>
            <span className="mt-1 block text-[8px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Agricultural Intelligence</span>
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground px-3 py-2 uppercase tracking-wider">
          Menu
        </h3>

        <Link href="/dashboard">
          <Button
            variant={isActive('/dashboard') ? 'default' : 'ghost'}
            className="w-full justify-start gap-3"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Button>
        </Link>

        <Link href="/crops">
          <Button
            variant={isActive('/crops') ? 'default' : 'ghost'}
            className="w-full justify-start gap-3"
          >
            <Leaf className="w-4 h-4" />
            Crop Recommendation
          </Button>
        </Link>

        <Link href="/disease-detection">
          <Button
            variant={isActive('/disease-detection') ? 'default' : 'ghost'}
            className="w-full justify-start gap-3"
          >
            <Bug className="w-4 h-4" />
            Disease Detection
          </Button>
        </Link>

        <Link href="/mandi">
          <Button
            variant={isActive('/mandi') ? 'default' : 'ghost'}
            className="w-full justify-start gap-3"
          >
            <TrendingUp className="w-4 h-4" />
            Mandi Prices
          </Button>
        </Link>
      </div>

      <div className="border-t border-border p-4 space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground px-3 py-2 uppercase tracking-wider">
          Account
        </h3>

        <Link href="/settings">
          <Button
            variant={isActive('/settings') ? 'default' : 'ghost'}
            className="w-full justify-start gap-3"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </Link>

        <Button variant="ghost" className="w-full justify-start gap-3 text-destructive">
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </aside>
  )
}
