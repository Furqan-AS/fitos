import { useState, useEffect, useRef } from 'react'
import { Check, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SetLoggerProps {
  setNumber: number
  targetRepsMin: number
  targetRepsMax: number
  suggestedWeight: number
  previousWeight?: number
  previousReps?: number
  overrideWeight?: number
  isAssisted?: boolean
  onComplete: (weight: number, reps: number, rpe: number) => void
  completed?: boolean
  completedWeight?: number
  completedReps?: number
}

export default function SetLogger({
  setNumber,
  targetRepsMin,
  targetRepsMax,
  suggestedWeight,
  previousWeight,
  overrideWeight,
  isAssisted = false,
  onComplete,
  completed,
  completedWeight,
  completedReps,
}: SetLoggerProps) {
  const [weight, setWeight] = useState(overrideWeight ?? suggestedWeight)
  const [reps, setReps] = useState(targetRepsMin)
  const [rpe, setRpe] = useState(7)
  const [editingWeight, setEditingWeight] = useState(false)
  const [weightInput, setWeightInput] = useState(String(overrideWeight ?? suggestedWeight))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (overrideWeight !== undefined) {
      setWeight(overrideWeight)
      setWeightInput(String(overrideWeight))
    }
  }, [overrideWeight])

  function commitWeight() {
    const parsed = parseFloat(weightInput)
    if (!isNaN(parsed) && parsed >= 0) {
      const rounded = Math.round(parsed * 4) / 4
      setWeight(rounded)
      setWeightInput(String(rounded))
    } else {
      setWeightInput(String(weight))
    }
    setEditingWeight(false)
  }

  if (completed) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
        style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)' }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }}>
          <Check size={13} strokeWidth={3} className="text-white" />
        </div>
        <span className="text-sm text-white/60 flex-1">Set {setNumber}</span>
        <span className="text-base font-black text-white">{completedWeight}</span>
        <span className="text-white/30 text-sm">{isAssisted ? 'kg assist ×' : 'kg ×'}</span>
        <span className="text-base font-black text-white">{completedReps}</span>
        <span className="text-xs text-white/30">reps</span>
      </div>
    )
  }

  return (
    <div className="p-4 rounded-3xl space-y-5"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Set header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Set {setNumber}</span>
        {previousWeight && (
          <span className="text-xs text-white/25">Last session: {previousWeight} kg</span>
        )}
      </div>

      {/* Big number controls — gym-readable */}
      <div className="grid grid-cols-2 gap-4">
        {/* Weight */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-[10px] text-white/30 uppercase tracking-widest">Weight</span>
          <button
            onClick={() => setWeight((v) => Math.round((v + 2.5) * 4) / 4)}
            className="w-11 h-11 flex items-center justify-center rounded-2xl active:scale-90 transition-all"
            style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.2)' }}>
            <Plus size={18} className="text-amber-400" strokeWidth={2.5} />
          </button>
          <div className="text-center">
            {editingWeight ? (
              <input
                ref={inputRef}
                type="number"
                inputMode="decimal"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                onBlur={commitWeight}
                onKeyDown={(e) => { if (e.key === 'Enter') commitWeight() }}
                className="w-24 text-5xl font-black text-white tabular-nums leading-none text-center bg-transparent border-b-2 border-amber-400 outline-none"
                style={{ appearance: 'textfield' }}
                autoFocus
              />
            ) : (
              <button
                onClick={() => {
                  setWeightInput(String(weight))
                  setEditingWeight(true)
                  setTimeout(() => inputRef.current?.select(), 50)
                }}
                className="text-center active:opacity-70 transition-opacity"
                title="Tap to type weight">
                <span className="text-5xl font-black text-white tabular-nums leading-none">{weight}</span>
                <span className="text-lg font-light ml-1.5" style={{ color: isAssisted ? '#a5b4fc' : 'rgba(255,255,255,0.3)' }}>
                  {isAssisted ? 'kg assist' : 'kg'}
                </span>
              </button>
            )}
            {isAssisted && (
              <p className="text-[10px] text-indigo-300/60 mt-1">
                ~{Math.max(0, 100 - weight)} kg actual load
              </p>
            )}
          </div>
          <button
            onClick={() => setWeight((v) => Math.max(0, Math.round((v - 2.5) * 4) / 4))}
            className="w-11 h-11 flex items-center justify-center rounded-2xl active:scale-90 transition-all"
            style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.2)' }}>
            <Minus size={18} className="text-amber-400" strokeWidth={2.5} />
          </button>
        </div>

        {/* Reps */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-[10px] text-white/30 uppercase tracking-widest">Reps</span>
          <button
            onClick={() => setReps((v) => v + 1)}
            className="w-11 h-11 flex items-center justify-center rounded-2xl active:scale-90 transition-all"
            style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.2)' }}>
            <Plus size={18} className="text-amber-400" strokeWidth={2.5} />
          </button>
          <div className="text-center">
            <span className="text-5xl font-black text-white tabular-nums leading-none">{reps}</span>
            <span className="text-lg text-white/30 font-light ml-1.5">reps</span>
          </div>
          <button
            onClick={() => setReps((v) => Math.max(0, v - 1))}
            className="w-11 h-11 flex items-center justify-center rounded-2xl active:scale-90 transition-all"
            style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.2)' }}>
            <Minus size={18} className="text-amber-400" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* RPE slider */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-white/30">
          <span>Effort (RPE)</span>
          <span className={cn(
            'font-black',
            rpe <= 6 ? 'text-green-400' : rpe <= 8 ? 'text-amber-400' : 'text-red-400'
          )}>
            {rpe} / 10
          </span>
        </div>
        <input
          type="range" min={1} max={10} value={rpe}
          onChange={(e) => setRpe(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #f97316 ${(rpe - 1) * 11.1}%, rgba(255,255,255,0.08) ${(rpe - 1) * 11.1}%)`,
          }}
        />
        <div className="flex justify-between text-[10px] text-white/20">
          <span>Easy</span><span>Max</span>
        </div>
      </div>

      {/* Target reminder */}
      <p className="text-xs text-white/25">
        Target: {targetRepsMin}–{targetRepsMax} reps · suggested {suggestedWeight} kg
      </p>

      {/* Log button */}
      <button
        onClick={() => onComplete(weight, reps, rpe)}
        className="w-full py-4 font-black rounded-2xl text-white text-sm flex items-center justify-center gap-2 glow-brand-sm transition-all active:scale-[0.98]"
        style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
        <Check size={16} strokeWidth={3} /> Log Set {setNumber}
      </button>
    </div>
  )
}
