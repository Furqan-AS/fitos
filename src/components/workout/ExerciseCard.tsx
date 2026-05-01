import { useState } from 'react'
import { ChevronDown, Info, Check, RotateCcw, CopyCheck } from 'lucide-react'
import type { Exercise } from '@/types'
import type { ProgramExerciseTemplate } from '@/lib/programs/upperLowerSplit'
import SetLogger from './SetLogger'
import RestTimer from './RestTimer'

const IMG_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises'

const EXERCISE_IMGS: Record<string, string> = {
  'bench-press':           'Barbell_Bench_Press_-_Medium_Grip',
  'barbell-row':           'Bent_Over_Barbell_Row',
  'db-shoulder-press':     'Dumbbell_Shoulder_Press',
  'lat-pulldown':          'Wide-Grip_Lat_Pulldown',
  'tricep-pushdown':       'Triceps_Pushdown',
  'db-curl':               'Dumbbell_Bicep_Curl',
  'low-bar-squat':         'Barbell_Full_Squat',
  'rdl':                   'Romanian_Deadlift',
  'leg-press':             'Leg_Press',
  'leg-curl':              'Lying_Leg_Curls',
  'calf-raise-standing':   'Standing_Calf_Raises',
  'incline-db-press':      'Incline_Dumbbell_Press',
  'pull-up':               'Pullups',
  'cable-row':             'Seated_Cable_Rows',
  'lateral-raise':         'Side_Lateral_Raise',
  'close-grip-bench':      'Close-Grip_Barbell_Bench_Press',
  'hammer-curl':           'Hammer_Curls',
  'sumo-deadlift':         'Sumo_Deadlift',
  'bulgarian-split-squat': 'Split_Squats',
  'hip-thrust':            'Barbell_Hip_Thrust',
  'leg-extension':         'Leg_Extensions',
  'calf-raise-seated':     'Seated_Calf_Raise',
}

interface LoggedSet {
  set_number: number
  weight_kg: number
  reps_completed: number
  rpe: number
}

interface ExerciseCardProps {
  exercise: Exercise
  template: ProgramExerciseTemplate
  suggestedWeight: number
  lastWeight?: number
  progressDirection?: 'increase' | 'maintain' | 'deload'
  initialCompletedSets?: LoggedSet[]
  onSetsComplete: (sets: LoggedSet[]) => void
  onUncomplete?: () => void
  onSetLogged?: (set: LoggedSet) => void
  onSetUnlogged?: (setNumber: number) => void
  isActive: boolean
  onActivate: () => void
}

export default function ExerciseCard({
  exercise,
  template,
  suggestedWeight,
  lastWeight,
  progressDirection,
  initialCompletedSets = [],
  onSetsComplete,
  onUncomplete,
  onSetLogged,
  onSetUnlogged,
  isActive,
  onActivate,
}: ExerciseCardProps) {
  const [loggedSets, setLoggedSets]       = useState<LoggedSet[]>(initialCompletedSets)
  const [showTips, setShowTips]           = useState(false)
  const [showRest, setShowRest]           = useState(false)
  const [activeSet, setActiveSet]         = useState(Math.min(initialCompletedSets.length + 1, template.sets))
  const [imgFailed, setImgFailed]         = useState(false)
  const [globalWeight, setGlobalWeight]   = useState<number | null>(null)
  const [applyWeightStr, setApplyWeightStr] = useState(String(suggestedWeight))

  const allDone   = loggedSets.length >= template.sets
  const imgFolder = EXERCISE_IMGS[exercise.id]
  const imgBase   = imgFolder ? `${IMG_BASE}/${imgFolder}` : null

  function handleSetComplete(weight: number, reps: number, rpe: number) {
    const newSet: LoggedSet = { set_number: activeSet, weight_kg: weight, reps_completed: reps, rpe }
    onSetLogged?.(newSet)
    const updated = [...loggedSets, newSet]
    setLoggedSets(updated)
    if (updated.length >= template.sets) {
      onSetsComplete(updated)
    } else {
      setActiveSet((s) => s + 1)
      setShowRest(true)
    }
  }

  function handleUndo() {
    if (loggedSets.length === 0) return
    const wasAllDone = loggedSets.length >= template.sets
    const lastSet = loggedSets[loggedSets.length - 1]
    const updated = loggedSets.slice(0, -1)
    setLoggedSets(updated)
    setActiveSet(loggedSets.length)
    onSetUnlogged?.(lastSet.set_number)
    if (wasAllDone) onUncomplete?.()
  }

  function applyWeightToAll() {
    const parsed = parseFloat(applyWeightStr)
    if (!isNaN(parsed) && parsed >= 0) setGlobalWeight(Math.round(parsed * 4) / 4)
  }

  /* ── Collapsed / done row ── */
  if (!isActive) {
    return (
      <button
        onClick={onActivate}
        style={{
          width: '100%', textAlign: 'left',
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '16px 0',
          borderBottom: '1px solid var(--border)',
          background: 'transparent',
          cursor: 'pointer',
          transition: 'opacity 0.15s',
        }}
      >
        {/* Number / check */}
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: allDone ? 'var(--green)' : 'var(--surface-hi)',
          border: allDone ? 'none' : '1px solid var(--border-hi)',
        }}>
          {allDone
            ? <Check size={14} color="#000" strokeWidth={3} />
            : <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>{template.sort_order}</span>
          }
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: allDone ? 'var(--text-2)' : 'var(--text)', marginBottom: 3 }}>
            {exercise.name}
            {progressDirection === 'increase' && (
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', marginLeft: 8 }}>↑ weight</span>
            )}
            {progressDirection === 'deload' && (
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginLeft: 8 }}>deload</span>
            )}
          </p>
          {allDone ? (
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {loggedSets.map(s => `${s.weight_kg}×${s.reps_completed}`).join(', ')}
            </p>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {template.sets} × {template.target_reps_min}–{template.target_reps_max} · {suggestedWeight} kg
            </p>
          )}
        </div>

        <ChevronDown size={16} color="var(--text-3)" />
      </button>
    )
  }

  /* ── Active / expanded card ── */
  return (
    <>
      {showRest && (
        <RestTimer
          seconds={template.rest_seconds}
          onComplete={() => setShowRest(false)}
          onDismiss={() => setShowRest(false)}
        />
      )}

      <div
        className="card-hi"
        style={{ padding: '20px', marginBottom: 0 }}
      >
        {/* Card header */}
        <button
          onClick={onActivate}
          style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}
        >
          <div>
            <p style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text)', marginBottom: 4 }}>
              {exercise.name}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-2)' }}>
              {template.sets} × {template.target_reps_min}–{template.target_reps_max} reps
              {lastWeight ? ` · last: ${lastWeight} kg` : ''}
            </p>
          </div>
          <ChevronDown size={16} color="var(--text-3)" style={{ marginTop: 4, transform: 'rotate(180deg)' }} />
        </button>

        {/* Assisted note */}
        {exercise.isAssisted && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)', marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: '#a5b4fc', fontWeight: 600 }}>
              Assisted machine — lower number = harder. Log what the machine shows.
            </p>
          </div>
        )}

        {/* Apply to all sets */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 12,
          background: 'var(--surface)', border: '1px solid var(--border)',
          marginBottom: 16,
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', flexShrink: 0 }}>
            All sets
          </span>
          <input
            type="number" inputMode="decimal"
            value={applyWeightStr}
            onChange={(e) => setApplyWeightStr(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') applyWeightToAll() }}
            style={{
              flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 16, fontWeight: 700, color: 'var(--text)', textAlign: 'center',
              fontVariantNumeric: 'tabular-nums',
            }}
          />
          <span style={{ fontSize: 12, color: 'var(--text-3)', flexShrink: 0 }}>kg</span>
          <button
            onClick={applyWeightToAll}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 9,
              background: 'var(--accent)', color: '#000', fontSize: 12, fontWeight: 700,
              flexShrink: 0,
            }}
          >
            <CopyCheck size={12} strokeWidth={2.5} />
            Apply
          </button>
        </div>

        {/* Set list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {Array.from({ length: template.sets }, (_, i) => i + 1).map((setNum) => {
            const logged = loggedSets.find((s) => s.set_number === setNum)
            return (
              <SetLogger
                key={setNum}
                setNumber={setNum}
                targetRepsMin={template.target_reps_min}
                targetRepsMax={template.target_reps_max}
                suggestedWeight={suggestedWeight}
                previousWeight={lastWeight}
                overrideWeight={globalWeight ?? undefined}
                isAssisted={!!exercise.isAssisted}
                onComplete={handleSetComplete}
                completed={!!logged}
                completedWeight={logged?.weight_kg}
                completedReps={logged?.reps_completed}
              />
            )
          })}
        </div>

        {/* Undo + tips */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {loggedSets.length > 0 ? (
            <button
              onClick={handleUndo}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <RotateCcw size={11} />
              Undo last set
            </button>
          ) : <div />}

          <button
            onClick={() => setShowTips(!showTips)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <Info size={11} />
            {showTips ? 'Hide tips' : 'Form tips'}
          </button>
        </div>

        {/* Form tips */}
        {showTips && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            {imgBase && !imgFailed && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                {['start', 'end'].map((label, idx) => (
                  <div key={label} style={{ position: 'relative' }}>
                    <img
                      src={`${imgBase}/${idx}.jpg`}
                      alt={`${exercise.name} ${label}`}
                      onError={() => setImgFailed(true)}
                      style={{ width: '100%', borderRadius: 10, display: 'block', background: 'var(--surface)' }}
                    />
                    <span style={{
                      position: 'absolute', bottom: 6, left: 6,
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                      color: 'rgba(255,255,255,0.6)', background: 'rgba(0,0,0,0.6)',
                      padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase',
                    }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 8 }}>{exercise.instructions}</p>
            <p style={{ fontSize: 12, color: exercise.tips.includes('⚠️') || exercise.tips.includes('⭐') ? 'var(--accent)' : 'var(--text-3)', lineHeight: 1.6 }}>
              {exercise.tips}
            </p>
          </div>
        )}
      </div>
    </>
  )
}
