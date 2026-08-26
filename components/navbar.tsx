'use client'

import Link from 'next/link'
import { Leaf, Menu } from 'lucide-react'
import { Button } from './ui/button'
import { LanguageSwitcher } from './language-switcher'
import { useState } from 'react'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Leaf className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold text-foreground hidden sm:inline">AgroAI</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm text-foreground hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/dashboard" className="text-sm text-foreground hover:text-primary transition-colors">
              Dashboard
            </Link>
            <Link href="/field-risk" className="text-sm text-foreground hover:text-primary transition-colors">
              Field Risk
            </Link>
            <Link href="/check-crop" className="text-sm text-foreground hover:text-primary transition-colors">
              Check my crop
            </Link>
            <Link href="/mandi" className="text-sm text-foreground hover:text-primary transition-colors">
              Mandi
            </Link>
            <LanguageSwitcher />
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/" className="block px-4 py-2 text-sm text-foreground hover:bg-muted rounded-md">
              Home
            </Link>
            <Link href="/dashboard" className="block px-4 py-2 text-sm text-foreground hover:bg-muted rounded-md">
              Dashboard
            </Link>
            <Link href="/field-risk" className="block px-4 py-2 text-sm text-foreground hover:bg-muted rounded-md">
              Field Risk
            </Link>
            <Link href="/check-crop" className="block px-4 py-2 text-sm text-foreground hover:bg-muted rounded-md">
              Check my crop
            </Link>
            <Link href="/mandi" className="block px-4 py-2 text-sm text-foreground hover:bg-muted rounded-md">
              Mandi
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
