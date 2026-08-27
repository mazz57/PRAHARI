import type { ReactNode } from 'react'
import { AlertTriangle, Loader2, Inbox, CloudOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Reusable, honest state components. These are the ONLY way pages should render "nothing yet",
 * "still loading", "it broke", or "there is genuinely no data" — so the experience is consistent
 * and we never paper over missing data with fabricated content.
 */

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
      {children}
    </div>
  )
}

export function LoadingState({ label }: { label?: string }) {
  return (
    <Frame>
      <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{label ?? 'Loading…'}</p>
    </Frame>
  )
}

export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string
  description?: string
  icon?: ReactNode
}) {
  return (
    <Frame>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
    </Frame>
  )
}

export function ErrorState({
  title,
  description,
  hint,
  retryLabel,
  onRetry,
}: {
  title: string
  description?: string
  hint?: string
  retryLabel?: string
  onRetry?: () => void
}) {
  return (
    <Frame>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
      {hint && <p className="max-w-md text-xs text-muted-foreground/80">{hint}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
          <RefreshCw className="h-4 w-4" />
          {retryLabel ?? 'Try again'}
        </Button>
      )}
    </Frame>
  )
}

/** For data that is genuinely not configured/available (e.g. a live feed with no API key). */
export function UnavailableState({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <Frame>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <CloudOff className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
    </Frame>
  )
}
