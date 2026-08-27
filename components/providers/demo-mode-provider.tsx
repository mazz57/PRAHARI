'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

/**
 * Global Demo / Test mode. When ON, data pages request a saved weather scenario
 * (?scenario=...) from /api/disease-risk instead of the live forecast. It is deliberately a
 * clearly-labelled, secondary control: a banner is always shown while it is on, so a demo can never
 * be mistaken for live field conditions. Default is OFF (live). Persisted to localStorage.
 */
export type Scenario = 'blight_outbreak' | 'borderline_watch' | 'dry_spell'
const SCENARIOS: Scenario[] = ['blight_outbreak', 'borderline_watch', 'dry_spell']

const DEMO_KEY = 'prahari.demo'
const SCENARIO_KEY = 'prahari.scenario'

interface DemoModeContextValue {
  demo: boolean
  scenario: Scenario
  setDemo: (on: boolean) => void
  toggleDemo: () => void
  setScenario: (s: Scenario) => void
}

const DemoModeContext = createContext<DemoModeContextValue>({
  demo: false,
  scenario: 'blight_outbreak',
  setDemo: () => {},
  toggleDemo: () => {},
  setScenario: () => {},
})

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [demo, setDemoState] = useState(false)
  const [scenario, setScenarioState] = useState<Scenario>('blight_outbreak')

  useEffect(() => {
    try {
      setDemoState(localStorage.getItem(DEMO_KEY) === '1')
      const s = localStorage.getItem(SCENARIO_KEY)
      if (s && (SCENARIOS as string[]).includes(s)) setScenarioState(s as Scenario)
    } catch {
      /* ignore */
    }
  }, [])

  const setDemo = (on: boolean) => {
    setDemoState(on)
    try {
      localStorage.setItem(DEMO_KEY, on ? '1' : '0')
    } catch {
      /* ignore */
    }
  }
  const toggleDemo = () => setDemo(!demo)
  const setScenario = (s: Scenario) => {
    setScenarioState(s)
    try {
      localStorage.setItem(SCENARIO_KEY, s)
    } catch {
      /* ignore */
    }
  }

  return (
    <DemoModeContext.Provider value={{ demo, scenario, setDemo, toggleDemo, setScenario }}>
      {children}
    </DemoModeContext.Provider>
  )
}

export function useDemoMode(): DemoModeContextValue {
  return useContext(DemoModeContext)
}
