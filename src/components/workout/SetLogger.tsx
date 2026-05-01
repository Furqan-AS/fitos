import { useState, useEffect, useRef } from 'react'
import { Check, Minus, Plus } from 'lucide-react'

interface SetLoggerProps {
  setNumber: number
  targetRepsMin: number
  targetRepsMax: number
  suggestedWeight: number
  previousWeight?: number
  overrideWeight?: number
  isAssisted?: boolean
  onComplete: (weight: number, reps: number, rpe: number) => void
  completed?: boolean
  completedWeight?: number
  completedReps?: number
}

function Stepper({
  label, value, unit, onInc, onDec,
  onTap, editing, inputRef, inputValue, onInputChange, onInputBlur, onInputKey,
}: {
  label: string; value: number; unit: string
  onInc: () => void; onDec: () => void
  onTap: () => void; editing: boolean
  inputRef: React.RefObject<HTMLInputElement | null>; inputValue: string
  onInputChange: (v: string) => void; onInputBlur: () => void; onInputKey: (e: React.KeyboardEvent) => void
}) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
        {label}
      </p>

      {/* Up */}
      <button
        onClick={onInc}
        style={{
          width: 48, height: 48, borderRadius: 14, border: '1px solid var(--border-hi)',
          background: 'var(--surface-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Plus size={20} color="var(--accent)" strokeWidth={2.5} />
      </button>

      {/* Value — tap to type */}
      <button onClick={onTap} style={{ textAlign: 'center', minWidth: 80 }}>
        {editing ? (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="number"
            inputMode="decimal"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onBlur={onInputBlur}
            onKeyDown={onInputKey}
            autoFocus
            style={{
              width: 90, fontSize: 52, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text)',
              background: 'transparent', border: 'none', borderBottom: `2px solid var(--accent)`,
              outline: 'none', textAlign: 'center', fontVariantNumeric: 'tabular-nums',
            }}
          />
        ) : (
          <p style={{ fontSize: 52, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {value}
          </p>
        )}
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>{unit}</p>
      </button>

      {/* Down */}
      <button
        onClick={onDec}
        style={{
          width: 48, height: 48, borderRadius: 14, border: '1px solid var(--border-hi)',
          background: 'var(--surface-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Minus size={20} color="var(--accent)" strokeWidth={2.5} />
      </button>
    </div>
  )
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
  const [weight, setWeight]           = useState(overrideWeight ?? suggestedWeight)
  const [reps, setReps]               = useState(targetRepsMin)
  const [rpe, setRpe]                 = useState(7)
  const [editingWeight, setEditingWeight] = useState(false)
  const [editingReps, setEditingReps] = useState(false)
  const [weightInput, setWeightInput] = useState(String(overrideWeight ?? suggestedWeight))
  const [repsInput, setRepsInput]     = useState(String(targetRepsMin))
  const weightRef = useRef<HTMLInputElement>(null)
  const repsRef   = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (overrideWeight !== undefined) {
      setWeight(overrideWeight)
      setWeightInput(String(overrideWeight))
    }
  }, [overrideWeight])

  function commitWeight() {
    const v = parseFloat(weightInput)
    if (!isNaN(v) && v >= 0) {
      const r = Math.round(v * 4) / 4
      setWeight(r); setWeightInput(String(r))
    } else { setWeightInput(String(weight)) }
    setEditingWeight(false)
  }
  function commitReps() {
    const v = parseInt(repsInput)
    if (!isNaN(v) && v >= 0) { setReps(v); setRepsInput(String(v)) }
    else { setRepsInput(String(reps)) }
    setEditingReps(false)
  }

  /* ── Completed state — compact row ── */
  if (completed) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', borderRadius: 12,
        background: 'rgba(24,200,122,0.06)', border: '1px solid rgba(24,200,122,0.14)',
      }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Check size={13} color="#000" strokeWidth={3} />
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-2)', flex: 1 }}>Set {setNumber}</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
          {completedWeight} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-2)' }}>{isAssisted ? 'kg assist' : 'kg'}</span>
          &nbsp;×&nbsp;
          {completedReps} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-2)' }}>reps</span>
        </span>
      </div>
    )
  }

  /* ── Active set ── */
  return (
    <div className="card-hi" style={{ padding: '24px 20px' }}>
      <p style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 20 }}>
        Set {setNumber} &nbsp;·&nbsp; target {targetRepsMin}–{targetRepsMax} reps
        {previousWeight ? ` · last ${previousWeight} kg` : ''}
      </p>

      {/* Steppers */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <Stepper
          label={isAssisted ? 'Assist kg' : 'Weight'}
          value={weight} unit={isAssisted ? 'kg assist' : 'kg'}
          onInc={() => setWeight(v => Math.round((v + 2.5) * 4) / 4)}
          onDec={() => setWeight(v => Math.max(0, Math.round((v - 2.5) * 4) / 4))}
          onTap={() => { setWeightInput(String(weight)); setEditingWeight(true); setTimeout(() => weightRef.current?.select(), 50) }}
          editing={editingWeight} inputRef={weightRef} inputValue={weightInput}
          onInputChange={setWeightInput} onInputBlur={commitWeight}
          onInputKey={(e) => { if (e.key === 'Enter') commitWeight() }}
        />
        <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch', margin: '0 4px' }} />
        <Stepper
          label="Reps"
          value={reps} unit="reps"
          onInc={() => setReps(v => v + 1)}
          onDec={() => setReps(v => Math.max(0, v - 1))}
          onTap={() => { setRepsInput(String(reps)); setEditingReps(true); setTimeout(() => repsRef.current?.select(), 50) }}
          editing={editingReps} inputRef={repsRef} inputValue={repsInput}
          onInputChange={setRepsInput} onInputBlur={commitReps}
          onInputKey={(e) => { if (e.key === 'Enter') commitReps() }}
        />
      </div>

      {/* Effort */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Effort</p>
          <p style={{ fontSize: 13, fontWeight: 800, color: rpe <= 6 ? 'var(--green)' : rpe <= 8 ? 'var(--accent)' : 'var(--red)' }}>
            RPE {rpe} / 10
          </p>
        </div>
        <input
          type="range" min={1} max={10} value={rpe}
          onChange={(e) => setRpe(Number(e.target.value))}
          style={{ width: '100%', background: `linear-gradient(to right, var(--accent) ${(rpe - 1) * 11.1}%, rgba(255,255,255,0.08) ${(rpe - 1) * 11.1}%)` }}
        />
      </div>

      {/* Log button */}
      <button
        onClick={() => onComplete(weight, reps, rpe)}
        className="btn-primary"
        style={{ width: '100%', height: 52, fontSize: 15 }}
      >
        <Check size={17} strokeWidth={3} />
        Log Set {setNumber}
      </button>

      {isAssisted && (
        <p style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', marginTop: 10 }}>
          ~{Math.max(0, 100 - weight)} kg actual load on your body
        </p>
      )}
    </div>
  )
}
