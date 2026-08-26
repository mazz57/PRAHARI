'use client'

import { useState } from 'react'
import { Droplets, Bug, Check, PhoneCall, Clock } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { UiStrings } from '@/lib/i18n/ui-strings'

/**
 * CONFIRM → MONITOR, kept honest. The farmer records what actually happened in the field
 * ("I sprayed", "I see symptoms", …). Entries live in React state for THIS session only — there is
 * no server or database behind it, and the UI says so plainly rather than implying saved history.
 * "Need an expert" reveals a real referral (KVK / extension officer) instead of a fake auto-diagnosis.
 */
type Choice = 'sprayed' | 'symptoms' | 'noChange' | 'needExpert'
interface LogEntry {
  choice: Choice
  label: string
  at: string
}

export function FieldConfirmation({ ui }: { ui: UiStrings }) {
  const [log, setLog] = useState<LogEntry[]>([])
  const [showExpert, setShowExpert] = useState(false)

  const options: { choice: Choice; label: string; icon: React.ReactNode }[] = [
    { choice: 'sprayed', label: ui.confirmSprayed, icon: <Droplets className="h-4 w-4" /> },
    { choice: 'symptoms', label: ui.confirmSymptoms, icon: <Bug className="h-4 w-4" /> },
    { choice: 'noChange', label: ui.confirmNoChange, icon: <Check className="h-4 w-4" /> },
    { choice: 'needExpert', label: ui.confirmNeedExpert, icon: <PhoneCall className="h-4 w-4" /> },
  ]

  function record(choice: Choice, label: string) {
    const at = new Date().toLocaleString()
    setLog((prev) => [{ choice, label, at }, ...prev])
    if (choice === 'needExpert') setShowExpert(true)
  }

  return (
    <div className="space-y-3 border-t border-border pt-3">
      <div className="text-sm font-medium">{ui.confirmTitle}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.choice}
            onClick={() => record(o.choice, o.label)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            {o.icon}
            {o.label}
          </button>
        ))}
      </div>

      {showExpert && (
        <Alert>
          <PhoneCall className="h-4 w-4" />
          <AlertTitle>{ui.expertTitle}</AlertTitle>
          <AlertDescription>{ui.expertReferral}</AlertDescription>
        </Alert>
      )}

      {log.length > 0 && (
        <div className="rounded-lg border border-border p-3">
          <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {ui.monitoringLog}
          </div>
          <ul className="space-y-1">
            {log.map((e, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">{e.label}</span>
                <span className="text-muted-foreground">· {e.at}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">{ui.confirmRecorded}</p>
        </div>
      )}
    </div>
  )
}
