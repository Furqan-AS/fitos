export function getMaxHR(age: number): number {
  return 220 - age
}

export function getZone2Range(age: number): { low: number; high: number } {
  const max = getMaxHR(age)
  return { low: Math.round(max * 0.6), high: Math.round(max * 0.7) }
}

export function getHIITRange(age: number): { low: number; high: number } {
  const max = getMaxHR(age)
  return { low: Math.round(max * 0.9), high: Math.round(max * 0.95) }
}

export interface HIITPhase {
  label: string
  durationSeconds: number
  type: 'warmup' | 'work' | 'rest' | 'cooldown'
  targetHRLow: number
  targetHRHigh: number
}

export function buildHIITSession(age: number): HIITPhase[] {
  const max = getMaxHR(age)
  const zone2Low = Math.round(max * 0.6)
  const zone2High = Math.round(max * 0.7)
  const hiitLow = Math.round(max * 0.9)
  const hiitHigh = Math.round(max * 0.95)

  const phases: HIITPhase[] = [
    { label: 'Warmup', durationSeconds: 300, type: 'warmup', targetHRLow: zone2Low, targetHRHigh: zone2High },
  ]
  for (let i = 0; i < 4; i++) {
    phases.push({ label: `Interval ${i + 1}`, durationSeconds: 240, type: 'work', targetHRLow: hiitLow, targetHRHigh: hiitHigh })
    if (i < 3) {
      phases.push({ label: 'Recovery', durationSeconds: 180, type: 'rest', targetHRLow: zone2Low, targetHRHigh: zone2High })
    }
  }
  phases.push({ label: 'Cooldown', durationSeconds: 300, type: 'cooldown', targetHRLow: zone2Low, targetHRHigh: zone2High })
  return phases
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
