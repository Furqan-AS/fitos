import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// en-CA locale reliably returns ISO YYYY-MM-DD format regardless of browser/OS
// This avoids the en-AU DD/MM/YYYY ambiguity that breaks new Date() parsing
export function today(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Melbourne' })
}

// Returns day-of-week (0=Sun…6=Sat) in Melbourne time
export function getDayOfWeek(): number {
  const [y, m, d] = today().split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}

// Returns YYYY-MM-DD offset by `offsetDays` from today (Melbourne)
export function getDateOffset(offsetDays: number): string {
  const [y, m, d] = today().split('-').map(Number)
  const dt = new Date(y, m - 1, d + offsetDays)
  const yr = dt.getFullYear()
  const mo = String(dt.getMonth() + 1).padStart(2, '0')
  const dy = String(dt.getDate()).padStart(2, '0')
  return `${yr}-${mo}-${dy}`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function round(value: number, decimals = 1): number {
  return Math.round(value * 10 ** decimals) / 10 ** decimals
}
