import { useEffect, useRef, useState, useCallback } from 'react'
import { Play, Pause, SkipForward, Heart, Zap, Wind } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buildHIITSession, formatTime, type HIITPhase } from '@/lib/vo2'
import Button from '@/components/ui/Button'

interface VO2SessionProps {
  age: number
  mode: 'zone2' | 'hiit'
  onComplete: (durationMin: number) => void
}

const PHASE_COLORS: Record<HIITPhase['type'], string> = {
  warmup:   '#3b82f6',
  work:     '#ef4444',
  rest:     '#22c55e',
  cooldown: '#3b82f6',
}

const PHASE_ICONS: Record<HIITPhase['type'], React.ReactNode> = {
  warmup:   <Wind size={20} />,
  work:     <Zap size={20} />,
  rest:     <Heart size={20} />,
  cooldown: <Wind size={20} />,
}

export default function VO2Session({ age, mode, onComplete }: VO2SessionProps) {
  const phases = mode === 'hiit' ? buildHIITSession(age) : []
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [totalElapsed, setTotalElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const zone2Duration = mode === 'zone2' ? 40 * 60 : 0
  const currentPhase = phases[phaseIdx]
  const phaseDuration = mode === 'zone2' ? zone2Duration : (currentPhase?.durationSeconds ?? 0)
  const phaseRemaining = phaseDuration - elapsed
  const color = mode === 'zone2' ? '#22c55e' : PHASE_COLORS[currentPhase?.type ?? 'rest']

  const handleTick = useCallback(() => {
    setElapsed((e) => {
      const next = e + 1
      setTotalElapsed((t) => t + 1)
      if (next >= phaseDuration) {
        if (mode === 'hiit' && phaseIdx < phases.length - 1) {
          setPhaseIdx((i) => i + 1)
          return 0
        } else {
          setRunning(false)
          return e
        }
      }
      return next
    })
  }, [mode, phaseDuration, phaseIdx, phases.length])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(handleTick, 1000)
    } else {
      clearInterval(intervalRef.current!)
    }
    return () => clearInterval(intervalRef.current!)
  }, [running, handleTick])

  const totalDuration = mode === 'zone2' ? zone2Duration : phases.reduce((s, p) => s + p.durationSeconds, 0)
  const globalPct = totalDuration > 0 ? totalElapsed / totalDuration : 0
  const phasePct = phaseDuration > 0 ? elapsed / phaseDuration : 0
  const circumference = 2 * Math.PI * 48

  function skipPhase() {
    if (mode === 'hiit' && phaseIdx < phases.length - 1) {
      setPhaseIdx((i) => i + 1)
      setElapsed(0)
    }
  }

  return (
    <div className="flex flex-col items-center gap-8 py-6">
      {/* Phase label */}
      <div className="text-center space-y-1">
        <p className="text-xs text-slate-500 uppercase tracking-widest">
          {mode === 'zone2' ? 'Zone 2 Cardio' : `Phase ${phaseIdx + 1} / ${phases.length}`}
        </p>
        <h2 className="text-xl font-bold" style={{ color }}>
          {mode === 'zone2' ? 'Steady State' : currentPhase?.label}
        </h2>
        {mode === 'hiit' && currentPhase && (
          <p className="text-sm text-slate-400">
            {currentPhase.targetHRLow}–{currentPhase.targetHRHigh} bpm target
          </p>
        )}
      </div>

      {/* Timer ring */}
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 112 112">
          {/* Global progress (thin outer) */}
          <circle cx="56" cy="56" r="50" fill="none" stroke="#1e293b" strokeWidth="4" />
          <circle
            cx="56" cy="56" r="50" fill="none"
            stroke={color} strokeWidth="4" strokeOpacity="0.3"
            strokeLinecap="round"
            strokeDasharray={`${314 * globalPct} ${314 * (1 - globalPct)}`}
            style={{ transition: 'stroke-dasharray 1s linear' }}
          />
          {/* Phase progress (inner) */}
          <circle cx="56" cy="56" r="44" fill="none" stroke="#1e293b" strokeWidth="8" />
          <circle
            cx="56" cy="56" r="44" fill="none"
            stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${circumference * phasePct} ${circumference * (1 - phasePct)}`}
            style={{ transition: 'stroke-dasharray 1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          {mode === 'hiit' && PHASE_ICONS[currentPhase?.type ?? 'rest']}
          <span className="text-3xl font-bold text-white tabular-nums">
            {formatTime(phaseRemaining > 0 ? phaseRemaining : 0)}
          </span>
          {mode === 'hiit' && (
            <span className="text-xs text-slate-500">{formatTime(totalDuration - totalElapsed)} left</span>
          )}
        </div>
      </div>

      {/* HR zones guide */}
      {mode === 'hiit' && currentPhase && (
        <div className={cn(
          'w-full max-w-xs p-4 rounded-2xl text-center transition-colors',
          currentPhase.type === 'work' ? 'bg-red-500/10 border border-red-500/20' : 'bg-green-500/10 border border-green-500/20'
        )}>
          <p className="text-sm font-semibold" style={{ color }}>
            {currentPhase.type === 'work' ? '🔥 Push hard!' : '😮‍💨 Recover — breathe'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Heart rate: {currentPhase.targetHRLow}–{currentPhase.targetHRHigh} bpm
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-4">
        <Button
          size="lg"
          onClick={() => setRunning((r) => !r)}
          className="w-36"
        >
          {running ? <><Pause size={18} /> Pause</> : <><Play size={18} /> {totalElapsed > 0 ? 'Resume' : 'Start'}</>}
        </Button>
        {mode === 'hiit' && phaseIdx < phases.length - 1 && (
          <Button size="lg" variant="secondary" onClick={skipPhase}>
            <SkipForward size={18} />
          </Button>
        )}
      </div>

      {totalElapsed > 30 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onComplete(Math.round(totalElapsed / 60))}
        >
          Finish session
        </Button>
      )}
    </div>
  )
}
