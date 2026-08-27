import type { Metadata } from 'next'
import '../styles/globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { LanguageProvider } from '@/components/providers/language-provider'
import { DemoModeProvider } from '@/components/providers/demo-mode-provider'
import { AppShell } from '@/components/app-shell/app-shell'

export const metadata: Metadata = {
  title: 'PRAVAAH — Agricultural Intelligence',
  description:
    'Agricultural intelligence for farmers — early warning, crop health, and market prices.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <LanguageProvider>
            <DemoModeProvider>
              <AppShell>{children}</AppShell>
            </DemoModeProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
