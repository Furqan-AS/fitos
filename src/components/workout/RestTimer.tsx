import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

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

  const pct = (remaining / seconds) * 100
  const circumference = 2 * Math.PI * 44
  const dashOffset = circumference * (1 - pct / 100)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md">
      <div className="flex flex-col items-center gap-6 p-8">
        <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">Rest</p>

        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="#1e293b" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="44" fill="none"
              stroke="#22c55e" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={cn(
                'text-4xl font-bold tabular-nums',
                remaining <= 10 ? 'text-amber-400' : 'text-white'
              )}
            >
              {remaining}
            </span>
          </div>
        </div>

        <p className="text-slate-500 text-sm">Next set in {remaining}s</p>

        <button
          onClick={onDismiss}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
        >
          <X size={14} /> Skip rest
        </button>
      </div>
    </div>
  )
}
