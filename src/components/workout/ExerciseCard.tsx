import { useState } from 'react'
import { ChevronDown, ChevronRight, Info, TrendingUp, CheckCircle, RotateCcw, CopyCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
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
  onSetsComplete: (sets: LoggedSet[]) => void
  onUncomplete?: () => void
  isActive: boolean
  onActivate: () => void
}

export default function ExerciseCard({
  exercise,
  template,
  suggestedWeight,
  lastWeight,
  progressDirection,
  onSetsComplete,
  onUncomplete,
  isActive,
  onActivate,
}: ExerciseCardProps) {
  const [loggedSets, setLoggedSets] = useState<LoggedSet[]>([])
  const [showTips, setShowTips] = useState(false)
  const [showRest, setShowRest] = useState(false)
  const [activeSet, setActiveSet] = useState(1)
  const [imgFailed, setImgFailed] = useState(false)
  const [globalWeight, setGlobalWeight] = useState<number | null>(null)
  const [applyWeightStr, setApplyWeightStr] = useState(String(suggestedWeight))

  const allDone = loggedSets.length >= template.sets
  const hasLongFemurNote = exercise.tips.includes('⚠️') || exercise.tips.includes('⭐')
  const isAssisted = !!exercise.isAssisted
  const imgFolder = EXERCISE_IMGS[exercise.id]
  const imgBase = imgFolder ? `${IMG_BASE}/${imgFolder}` : null

  function handleSetComplete(weight: number, reps: number, rpe: number) {
    const newSet: LoggedSet = { set_number: activeSet, weight_kg: weight, reps_completed: reps, rpe }
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
    const updated = loggedSets.slice(0, -1)
    setLoggedSets(updated)
    setActiveSet(loggedSets.length) // go back one set number
    if (wasAllDone) onUncomplete?.()
  }

  function applyWeightToAll() {
    const parsed = parseFloat(applyWeightStr)
    if (!isNaN(parsed) && parsed >= 0) {
      setGlobalWeight(Math.round(parsed * 4) / 4)
    }
  }

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
        className="rounded-3xl border transition-all duration-200"
        style={{
          background: allDone
            ? 'rgba(34,197,94,0.05)'
            : isActive
            ? 'rgba(249,115,22,0.06)'
            : 'rgba(255,255,255,0.03)',
          borderColor: allDone
            ? 'rgba(34,197,94,0.2)'
            : isActive
            ? 'rgba(249,115,22,0.2)'
            : 'rgba(255,255,255,0.07)',
          boxShadow: isActive ? '0 4px 24px rgba(249,115,22,0.08)' : 'none',
        }}
      >
        {/* Header */}
        <button className="w-full flex items-start gap-3 p-4 text-left" onClick={onActivate}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 mt-0.5"
            style={{
              background: allDone
                ? 'linear-gradient(135deg, #22c55e, #10b981)'
                : isActive
                ? 'linear-gradient(135deg, #f59e0b, #f97316)'
                : 'rgba(255,255,255,0.08)',
              color: allDone || isActive ? 'white' : 'rgba(255,255,255,0.4)',
              boxShadow: allDone
                ? '0 0 10px rgba(34,197,94,0.3)'
                : isActive
                ? '0 0 10px rgba(249,115,22,0.3)'
                : 'none',
            }}>
            {allDone ? <CheckCircle size={14} strokeWidth={2.5} /> : template.sort_order}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-white text-sm leading-snug">{exercise.name}</h3>
              {progressDirection === 'increase' && (
                <span className="text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <TrendingUp size={9} /> +weight
                </span>
              )}
              {progressDirection === 'deload' && (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  Deload
                </span>
              )}
              {hasLongFemurNote && (
                <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                  Form tip
                </span>
              )}
            </div>
            <p className="text-xs text-white/35 mt-0.5">
              {template.sets} × {template.target_reps_min}–{template.target_reps_max} reps · {suggestedWeight} kg suggested
              {lastWeight ? ` · last: ${lastWeight} kg` : ''}
            </p>
          </div>

          <ChevronRight size={15}
            className={cn('text-white/20 shrink-0 mt-1 transition-transform', isActive && 'rotate-90')} />
        </button>

        {/* Expanded */}
        {isActive && (
          <div className="px-4 pb-4 space-y-3">
            {/* Tips toggle */}
            <button
              onClick={() => setShowTips(!showTips)}
              className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors">
              <Info size={12} />
              {showTips ? 'Hide' : 'Show'} form tips
              <ChevronDown size={11} className={cn('transition-transform', showTips && 'rotate-180')} />
            </button>

            {showTips && (
              <div className="p-3 rounded-2xl space-y-3"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {imgBase && !imgFailed && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <img
                        src={`${imgBase}/0.jpg`}
                        alt={`${exercise.name} start`}
                        onError={() => setImgFailed(true)}
                        className="w-full rounded-xl object-cover"
                        style={{ background: 'rgba(0,0,0,0.3)' }}
                      />
                      <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold text-white/50 bg-black/50 px-1.5 py-0.5 rounded-full">START</span>
                    </div>
                    <div className="relative">
                      <img
                        src={`${imgBase}/1.jpg`}
                        alt={`${exercise.name} end`}
                        onError={() => setImgFailed(true)}
                        className="w-full rounded-xl object-cover"
                        style={{ background: 'rgba(0,0,0,0.3)' }}
                      />
                      <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold text-white/50 bg-black/50 px-1.5 py-0.5 rounded-full">END</span>
                    </div>
                  </div>
                )}
                <p className="text-xs text-white/50 leading-relaxed">{exercise.instructions}</p>
                <p className={cn('text-xs leading-relaxed', hasLongFemurNote ? 'text-amber-300/80' : 'text-white/35')}>
                  {exercise.tips}
                </p>
              </div>
            )}

            {isAssisted && (
              <div className="px-3 py-2 rounded-2xl text-xs"
                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <p className="text-indigo-300 font-semibold mb-0.5">Assisted machine — weight works in reverse</p>
                <p className="text-white/40">The number you select on the machine is subtracted from your bodyweight. Lower assist = harder. Log what the machine shows.</p>
              </div>
            )}

            {/* Apply weight to all sets */}
            <div className="flex items-center gap-2 p-3 rounded-2xl"
              style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.12)' }}>
              <span className="text-[10px] text-white/40 uppercase tracking-widest shrink-0">All sets</span>
              <input
                type="number"
                inputMode="decimal"
                value={applyWeightStr}
                onChange={(e) => setApplyWeightStr(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') applyWeightToAll() }}
                className="flex-1 bg-transparent text-white font-black text-lg text-center outline-none border-b border-white/20 focus:border-amber-400 transition-colors w-0"
                style={{ appearance: 'textfield' }}
              />
              <span className="text-xs text-white/30 shrink-0">kg</span>
              <button
                onClick={applyWeightToAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shrink-0 active:scale-95 transition-all"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
                <CopyCheck size={12} /> Apply
              </button>
            </div>

            {/* Sets */}
            <div className="space-y-2">
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
                    isAssisted={isAssisted}
                    onComplete={handleSetComplete}
                    completed={!!logged}
                    completedWeight={logged?.weight_kg}
                    completedReps={logged?.reps_completed}
                  />
                )
              })}
            </div>

            {/* Undo last set */}
            {loggedSets.length > 0 && (
              <button
                onClick={handleUndo}
                className="flex items-center gap-2 text-xs text-white/25 hover:text-white/50 transition-colors mx-auto">
                <RotateCcw size={11} />
                Undo last set
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}
