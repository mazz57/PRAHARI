'use client'

import { useEffect, useState } from 'react'
import { Volume2, Square } from 'lucide-react'
import type { Lang } from '@/lib/i18n/advisory-templates'

/**
 * Honest voice: reads the REAL, engine-generated advisory text aloud using the browser's built-in
 * speech synthesis. It invents nothing — it simply voices the exact text already shown on screen,
 * which genuinely helps a farmer who cannot read comfortably.
 *
 * (This file previously held a mock "AI farm assistant" that returned random canned answers and a
 * fabricated mandi price. That violated the project's core rule — never present hardcoded output as
 * a real AI answer — so it was replaced with this truthful reader. If the device has no speech
 * synthesis, or no voice for the chosen language, the button simply hides itself.)
 */
const BCP47: Record<Lang, string> = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN' }

export function SpeakButton({ text, lang, label }: { text: string; lang: Lang; label: string }) {
  const [supported, setSupported] = useState(false)
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window)
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
    }
  }, [])

  if (!supported) return null

  function toggle() {
    const synth = window.speechSynthesis
    if (speaking) {
      synth.cancel()
      setSpeaking(false)
      return
    }
    synth.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = BCP47[lang]
    // Prefer a voice that matches the language if the device has one.
    const match = synth.getVoices().find((v) => v.lang?.toLowerCase().startsWith(lang))
    if (match) u.voice = match
    u.onend = () => setSpeaking(false)
    u.onerror = () => setSpeaking(false)
    setSpeaking(true)
    synth.speak(u)
  }

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium hover:bg-muted"
      aria-label={label}
    >
      {speaking ? <Square className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
      {label}
    </button>
  )
}
