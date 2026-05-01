import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

interface RestTimerProps {
  seconds: number
  onComplete: () => void
  onDismiss: () => void
}

export default function RestTimer({ seconds, onComplete, onDismiss }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          onComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [onComplete])

  const pct = remaining / seconds
  const r = 54
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(13,13,19,0.97)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32,
    }}>
      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
        Rest
      </p>

      {/* Ring */}
      <div style={{ position: 'relative', width: 160, height: 160 }}>
        <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <circle
            cx="80" cy="80" r={r} fill="none"
            stroke={remaining <= 10 ? 'var(--accent)' : 'var(--green)'}
            strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{
            fontSize: 52, fontWeight: 900, letterSpacing: '-0.04em',
            color: remaining <= 10 ? 'var(--accent)' : 'var(--text)',
            fontVariantNumeric: 'tabular-nums', lineHeight: 1,
            transition: 'color 0.3s',
          }}>
            {remaining}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>seconds</p>
        </div>
      </div>

      <p style={{ fontSize: 15, color: 'var(--text-2)' }}>Next set ready soon</p>

      <button
        onClick={onDismiss}
        className="btn-ghost"
        style={{ padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}
      >
        <X size={14} />
        Skip rest
      </button>
    </div>
  )
}
