import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Clock, Activity, ArrowRight, Wind, Check } from 'lucide-react'
import ExerciseCard from '@/components/workout/ExerciseCard'
import { getProgramDayByDOW } from '@/lib/programs/upperLowerSplit'
import { getExerciseById } from '@/lib/programs/exerciseLibrary'
import { getWeightRecommendation } from '@/lib/progression'
import { supabase } from '@/lib/supabase'
import { today, getDayOfWeek, getDateOffset } from '@/lib/utils'
import type { ExerciseLog } from '@/types'
import type { ProgramExerciseTemplate, ProgramDayTemplate } from '@/lib/programs/upperLowerSplit'

interface SessionExercise {
  template: ProgramExerciseTemplate
  exercise: ReturnType<typeof getExerciseById>
  suggestedWeight: number
  lastWeight?: number
  progressDirection?: 'increase' | 'maintain' | 'deload'
  completedSets: { set_number: number; weight_kg: number; reps_completed: number; rpe: number }[]
}

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const TRAINING_DAYS = new Set([0, 1, 3, 5, 6])

function WeekCalendar({ todayDOW, selectedDOW, onSelect }: {
  todayDOW: number; selectedDOW: number; onSelect: (dow: number) => void
}) {
  const days = Array.from({ length: 7 }, (_, i) => (i + 1) % 7)
  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }} className="scrollbar-hide">
      {days.map((dow) => {
        const isToday    = dow === todayDOW
        const isSelected = dow === selectedDOW
        const isTrain    = TRAINING_DAYS.has(dow)
        let diff = dow - todayDOW
        if (diff < -3) diff += 7
        if (diff > 3) diff -= 7
        const dayNum = new Date(getDateOffset(diff) + 'T12:00:00').getDate()
        return (
          <button
            key={dow}
            onClick={() => onSelect(dow)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '10px 12px', borderRadius: 14, flexShrink: 0,
              background: isSelected ? 'var(--accent)' : isToday ? 'rgba(233,160,32,0.1)' : 'var(--surface)',
              border: `1px solid ${isSelected ? 'transparent' : isToday ? 'rgba(233,160,32,0.25)' : 'var(--border)'}`,
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: isSelected ? '#000' : 'var(--text-2)' }}>
              {DOW_LABELS[dow]}
            </span>
            <span style={{ fontSize: 17, fontWeight: 800, color: isSelected ? '#000' : isToday ? 'var(--accent)' : 'var(--text)', lineHeight: 1 }}>
              {dayNum}
            </span>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: isTrain ? (isSelected ? '#000' : 'var(--accent)') : 'transparent' }} />
          </button>
        )
      })}
    </div>
  )
}

export default function Workout() {
  const navigate = useNavigate()
  const todayDOW = getDayOfWeek()
  const [selectedDOW, setSelectedDOW]   = useState(todayDOW)
  const [exercises, setExercises]       = useState<SessionExercise[]>([])
  const [activeIdx, setActiveIdx]       = useState(0)
  const [sessionId, setSessionId]       = useState<string | null>(null)
  const [startTime]                     = useState(Date.now())
  const [elapsed, setElapsed]           = useState(0)
  const [saving, setSaving]             = useState(false)
  const [done, setDone]                 = useState(false)

  const isViewingToday  = selectedDOW === todayDOW
  const programDay: ProgramDayTemplate | null = getProgramDayByDOW(selectedDOW)
  const isSelectedRestDay = !TRAINING_DAYS.has(selectedDOW)

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000)
    return () => clearInterval(t)
  }, [startTime])

  useEffect(() => {
    if (!isViewingToday) return
    async function init() {
      if (!programDay || programDay.exercises.length === 0) return
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let sid: string | null = null
      const { data: existing } = await supabase
        .from('workout_sessions').select('id').eq('user_id', user.id).eq('date', today()).maybeSingle()

      if (existing?.id) {
        sid = existing.id
      } else {
        const { data: created } = await supabase
          .from('workout_sessions')
          .insert({ user_id: user.id, date: today(), started_at: new Date().toISOString(), completed: false })
          .select('id').single()
        if (created) sid = created.id
      }
      setSessionId(sid)

      const todaysLogs: Record<string, { set_number: number; weight_kg: number; reps_completed: number; rpe: number }[]> = {}
      if (sid) {
        const { data: logs } = await supabase
          .from('exercise_logs')
          .select('exercise_id, set_number, weight_kg, reps_completed, rpe')
          .eq('session_id', sid)
        if (logs) {
          for (const log of logs) {
            if (!todaysLogs[log.exercise_id]) todaysLogs[log.exercise_id] = []
            todaysLogs[log.exercise_id].push({ set_number: log.set_number, weight_kg: log.weight_kg, reps_completed: log.reps_completed, rpe: log.rpe ?? 7 })
          }
        }
      }

      // Fetch this user's past session IDs once — used to correctly filter history per exercise
      const { data: pastSessionData } = await supabase
        .from('workout_sessions')
        .select('id')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(30)
      const pastSessionIds = (pastSessionData ?? []).map((s: { id: string }) => s.id).filter(id => id !== sid)

      const loaded: SessionExercise[] = await Promise.all(
        programDay.exercises.map(async (tmpl) => {
          const exercise = getExerciseById(tmpl.exercise_id)

          const groupedHistory: ExerciseLog[][] = []
          if (pastSessionIds.length > 0) {
            // Fetch without relying on joined-table ordering (unreliable in PostgREST).
            // We know pastSessionIds is newest-first; we'll sort manually below.
            const { data: history } = await supabase
              .from('exercise_logs')
              .select('session_id, set_number, weight_kg, reps_completed, rpe, skipped')
              .in('session_id', pastSessionIds.slice(0, 15))
              .eq('exercise_id', tmpl.exercise_id)
              .order('set_number', { ascending: true })

            if (history && history.length > 0) {
              // Group logs by session
              const bySession: Record<string, ExerciseLog[]> = {}
              for (const log of history as ExerciseLog[]) {
                if (!bySession[log.session_id]) bySession[log.session_id] = []
                bySession[log.session_id].push(log)
              }
              // pastSessionIds is newest-first. Build groupedHistory oldest→newest
              // so history[history.length - 1] = most recent (required by progression.ts).
              for (let i = pastSessionIds.length - 1; i >= 0; i--) {
                const logs = bySession[pastSessionIds[i]]
                if (logs) groupedHistory.push(logs)
              }
              // Keep last 5 sessions for progression analysis
              if (groupedHistory.length > 5) groupedHistory.splice(0, groupedHistory.length - 5)
            }
          }

          const lastSession   = groupedHistory[groupedHistory.length - 1]   // most recent
          const lastWeight    = lastSession?.[0]?.weight_kg
          const rec           = getWeightRecommendation(groupedHistory, tmpl.sets, tmpl.target_reps_min, tmpl.exercise_type)
          const defaultWeight = tmpl.exercise_type === 'lower_compound' ? 40
            : tmpl.exercise_type === 'upper_compound' ? 30 : 12
          // Fallback chain: progression rec → last used weight → hardcoded default
          const suggestedWeight = rec?.recommended_weight_kg ?? lastWeight ?? defaultWeight
          const completedSets   = todaysLogs[tmpl.exercise_id] ?? []
          return { template: tmpl, exercise, suggestedWeight, lastWeight, progressDirection: rec?.direction, completedSets }
        })
      )

      setExercises(loaded)
      const firstIncomplete = loaded.findIndex((e) => e.completedSets.length < e.template.sets)
      setActiveIdx(firstIncomplete === -1 ? 0 : firstIncomplete)
    }
    init()
  }, [selectedDOW])

  const handleSetLogged = useCallback(async (
    exIdx: number,
    set: { set_number: number; weight_kg: number; reps_completed: number; rpe: number }
  ) => {
    if (!sessionId || !programDay) return
    const tmpl = programDay.exercises[exIdx]
    if (!tmpl) return
    await supabase.from('exercise_logs').insert({ session_id: sessionId, exercise_id: tmpl.exercise_id, ...set, skipped: false })
  }, [sessionId, programDay])

  const handleSetUnlogged = useCallback(async (exIdx: number, setNumber: number) => {
    if (!sessionId || !programDay) return
    const tmpl = programDay.exercises[exIdx]
    if (!tmpl) return
    await supabase.from('exercise_logs').delete().eq('session_id', sessionId).eq('exercise_id', tmpl.exercise_id).eq('set_number', setNumber)
    setExercises((prev) => prev.map((e, i) =>
      i === exIdx ? { ...e, completedSets: e.completedSets.filter((s) => s.set_number !== setNumber) } : e
    ))
  }, [sessionId, programDay])

  const handleSetsComplete = useCallback((
    exIdx: number,
    sets: { set_number: number; weight_kg: number; reps_completed: number; rpe: number }[]
  ) => {
    if (!programDay) return
    setExercises((prev) => prev.map((e, i) => (i === exIdx ? { ...e, completedSets: sets } : e)))
    if (exIdx < programDay.exercises.length - 1) setActiveIdx(exIdx + 1)
  }, [programDay])

  async function finishWorkout() {
    if (!sessionId) return
    setSaving(true)
    await supabase.from('workout_sessions').update({ completed: true, ended_at: new Date().toISOString() }).eq('id', sessionId)
    setSaving(false)
    setDone(true)
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')
  const allExercisesDone = exercises.length > 0 && exercises.every((e) => e.completedSets.length >= e.template.sets)
  const completedCount   = exercises.filter(e => e.completedSets.length >= e.template.sets).length

  /* ── Done screen ── */
  if (done) {
    return (
      <div style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', gap: 32, maxWidth: 448, margin: '0 auto' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--green-dim)', border: '1px solid rgba(24,200,122,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle size={40} color="var(--green)" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 8 }}>Session complete.</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)' }}>{mm}:{ss} · {exercises.length} exercises · overload logged</p>
        </div>
        <div className="card" style={{ padding: '16px 20px', width: '100%', textAlign: 'center' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 4 }}>Zone 2 finisher</p>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>{programDay?.cardio_duration_min} min at 110–128 bpm · bike or treadmill</p>
        </div>
        <div style={{ display: 'flex', gap: 12, width: '100%' }}>
          <button
            onClick={() => navigate('/cardio')}
            className="btn-ghost"
            style={{ flex: 1, height: 52, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Activity size={15} /> Log cardio
          </button>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
            style={{ flex: 1, height: 52, fontSize: 14 }}
          >
            Done <ArrowRight size={15} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '52px 20px 0', maxWidth: 448, margin: '0 auto' }} className="pb-page">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <p className="label" style={{ marginBottom: 8 }}>Training</p>
          <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1 }}>Train</h1>
        </div>
        {isViewingToday && programDay && programDay.exercises.length > 0 && (
          <div className="card" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={12} color="var(--text-3)" />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace' }}>{mm}:{ss}</span>
          </div>
        )}
      </div>

      {/* Week calendar */}
      <div style={{ marginBottom: 28 }}>
        <WeekCalendar todayDOW={todayDOW} selectedDOW={selectedDOW} onSelect={setSelectedDOW} />
      </div>

      {/* Preview banner */}
      {!isViewingToday && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderRadius: 12, background: 'var(--accent-dim)', border: '1px solid rgba(233,160,32,0.2)', marginBottom: 20 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>Previewing {DOW_LABELS[selectedDOW]}</span>
          <button onClick={() => setSelectedDOW(todayDOW)} style={{ fontSize: 12, color: 'var(--text-2)', background: 'none', border: 'none', cursor: 'pointer' }}>
            Back to today
          </button>
        </div>
      )}

      {/* Rest day */}
      {isSelectedRestDay ? (
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>🚶</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Rest &amp; Walk</p>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 20 }}>30–45 min brisk walk · Zone 2 pace</p>
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Muscles grow during recovery. This day is doing the work.</p>
          {isViewingToday && (
            <button onClick={() => navigate('/cardio')} className="btn-ghost" style={{ marginTop: 20, padding: '12px 24px', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              <Activity size={14} /> Log walk
            </button>
          )}
        </div>

      ) : !programDay ? null : programDay.exercises.length === 0 ? (
        /* VO2 Max day */
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(224,84,84,0.1)', border: '1px solid rgba(224,84,84,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Wind size={24} color="var(--red)" />
          </div>
          <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>VO₂ Max Day</p>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 8 }}>Norwegian 4×4 or 40 min Zone 2</p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 24 }}>The session that raises your ceiling</p>
          {isViewingToday && (
            <button onClick={() => navigate('/cardio')} className="btn-primary" style={{ padding: '14px 28px', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Start session <ArrowRight size={15} />
            </button>
          )}
        </div>

      ) : (
        /* Lifting day */
        <>
          {/* Session header */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 6 }}>{programDay.focus_label}</p>
            <p style={{ fontSize: 13, color: 'var(--text-2)' }}>
              {programDay.exercises.length} exercises · {programDay.cardio_duration_min} min Zone 2 after
            </p>

            {/* Progress dots */}
            {isViewingToday && exercises.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
                {exercises.map((e, i) => (
                  <div
                    key={i}
                    style={{
                      height: 3, flex: 1, borderRadius: 2,
                      background: e.completedSets.length >= e.template.sets
                        ? 'var(--green)'
                        : i === activeIdx ? 'rgba(233,160,32,0.6)' : 'rgba(255,255,255,0.08)',
                      transition: 'background 0.3s',
                    }}
                  />
                ))}
              </div>
            )}
            {isViewingToday && exercises.length > 0 && (
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>
                {completedCount} of {exercises.length} exercises done
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="divider" style={{ marginBottom: 4 }} />

          {/* Exercise list */}
          {isViewingToday && exercises.length > 0 ? (
            <div>
              {exercises.map((ex, i) => (
                <ExerciseCard
                  key={ex.template.exercise_id}
                  exercise={ex.exercise!}
                  template={ex.template}
                  suggestedWeight={ex.suggestedWeight}
                  lastWeight={ex.lastWeight}
                  progressDirection={ex.progressDirection}
                  initialCompletedSets={ex.completedSets}
                  isActive={i === activeIdx}
                  onActivate={() => setActiveIdx(i)}
                  onSetsComplete={(sets) => handleSetsComplete(i, sets)}
                  onSetLogged={(set) => handleSetLogged(i, set)}
                  onSetUnlogged={(setNum) => handleSetUnlogged(i, setNum)}
                  onUncomplete={() => {/* handled by handleSetUnlogged */}}
                />
              ))}
            </div>
          ) : (
            /* Preview mode */
            <div>
              {programDay.exercises.map((tmpl, i) => {
                const ex = getExerciseById(tmpl.exercise_id)
                return (
                  <div
                    key={tmpl.exercise_id}
                    style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--border)' }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)', width: 20, textAlign: 'center', flexShrink: 0 }}>{i + 1}</span>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{ex?.name ?? tmpl.exercise_id}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{tmpl.sets} × {tmpl.target_reps_min}–{tmpl.target_reps_max} reps</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Zone 2 reminder */}
          <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, marginTop: 24 }}>
            <Activity size={16} color="var(--text-3)" />
            <p style={{ fontSize: 13, color: 'var(--text-2)' }}>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>After lifting:</span> {programDay.cardio_duration_min} min Zone 2 · 110–128 bpm
            </p>
          </div>

          {/* Finish button */}
          {isViewingToday && allExercisesDone && (
            <button
              onClick={finishWorkout}
              disabled={saving}
              className="btn-primary"
              style={{ width: '100%', height: 56, fontSize: 16, marginTop: 16 }}
            >
              <Check size={18} strokeWidth={2.5} />
              {saving ? 'Saving…' : 'Finish workout'}
            </button>
          )}
        </>
      )}
    </div>
  )
}
