import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Clock, Activity, ArrowRight, Dumbbell, Wind } from 'lucide-react'
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
const TRAINING_DAYS = new Set([0, 1, 3, 5, 6]) // Sun, Mon, Wed, Fri, Sat

function WeekCalendar({
  todayDOW,
  selectedDOW,
  onSelect,
}: {
  todayDOW: number
  selectedDOW: number
  onSelect: (dow: number) => void
}) {
  // Build Mon–Sun week starting from this Monday
  const days = Array.from({ length: 7 }, (_, i) => (i + 1) % 7) // Mon=1,Tue=2,...,Sun=0

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {days.map((dow) => {
        const isToday = dow === todayDOW
        const isSelected = dow === selectedDOW
        const isTrain = TRAINING_DAYS.has(dow)

        // Get date offset for display
        let diff = dow - todayDOW
        if (diff < -3) diff += 7
        if (diff > 3) diff -= 7
        const dateStr = getDateOffset(diff)
        const dayNum = new Date(dateStr + 'T12:00:00').getDate()

        return (
          <button
            key={dow}
            onClick={() => onSelect(dow)}
            className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl transition-all shrink-0 active:scale-95"
            style={{
              background: isSelected
                ? 'linear-gradient(135deg, #f59e0b, #f97316)'
                : isToday
                ? 'rgba(249,115,22,0.12)'
                : 'rgba(255,255,255,0.04)',
              border: isSelected
                ? '1px solid transparent'
                : isToday
                ? '1px solid rgba(249,115,22,0.25)'
                : '1px solid rgba(255,255,255,0.07)',
              boxShadow: isSelected ? '0 0 14px rgba(249,115,22,0.3)' : 'none',
            }}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: isSelected ? 'white' : 'rgba(255,255,255,0.4)' }}>
              {DOW_LABELS[dow]}
            </span>
            <span className="text-base font-black"
              style={{ color: isSelected ? 'white' : isToday ? '#fbbf24' : 'rgba(255,255,255,0.8)' }}>
              {dayNum}
            </span>
            <div className="w-1 h-1 rounded-full"
              style={{ background: isTrain ? (isSelected ? 'white' : '#f59e0b') : 'rgba(255,255,255,0.2)' }} />
          </button>
        )
      })}
    </div>
  )
}

export default function Workout() {
  const navigate = useNavigate()
  const todayDOW = getDayOfWeek()
  const [selectedDOW, setSelectedDOW] = useState(todayDOW)
  const [exercises, setExercises] = useState<SessionExercise[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [startTime] = useState(Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const isViewingToday = selectedDOW === todayDOW
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

      // Find or create today's session first so we can restore completed sets
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

      // Fetch already-logged sets for this session so we can restore them
      const todaysLogs: Record<string, { set_number: number; weight_kg: number; reps_completed: number; rpe: number }[]> = {}
      if (sid) {
        const { data: logs } = await supabase
          .from('exercise_logs')
          .select('exercise_id, set_number, weight_kg, reps_completed, rpe')
          .eq('session_id', sid)
        if (logs) {
          for (const log of logs) {
            if (!todaysLogs[log.exercise_id]) todaysLogs[log.exercise_id] = []
            todaysLogs[log.exercise_id].push({
              set_number: log.set_number,
              weight_kg: log.weight_kg,
              reps_completed: log.reps_completed,
              rpe: log.rpe ?? 7,
            })
          }
        }
      }

      const loaded: SessionExercise[] = await Promise.all(
        programDay.exercises.map(async (tmpl) => {
          const exercise = getExerciseById(tmpl.exercise_id)
          const { data: history } = await supabase
            .from('exercise_logs')
            .select('*, workout_sessions!inner(user_id, date)')
            .eq('exercise_id', tmpl.exercise_id)
            .order('workout_sessions(date)', { ascending: false })
            .limit(30)

          const groupedHistory: ExerciseLog[][] = []
          if (history && history.length > 0) {
            const bySession: Record<string, ExerciseLog[]> = {}
            for (const log of history as ExerciseLog[]) {
              const s = log.session_id
              if (!bySession[s]) bySession[s] = []
              bySession[s].push(log)
            }
            groupedHistory.push(...Object.values(bySession).slice(0, 3))
          }

          const lastSession = groupedHistory[groupedHistory.length - 1]
          const lastWeight = lastSession?.[0]?.weight_kg
          const rec = getWeightRecommendation(groupedHistory, tmpl.sets, tmpl.target_reps_min, tmpl.exercise_type)
          const suggestedWeight = rec?.recommended_weight_kg ?? (tmpl.exercise_type === 'lower_compound' ? 40 : 20)

          const completedSets = todaysLogs[tmpl.exercise_id] ?? []
          return { template: tmpl, exercise, suggestedWeight, lastWeight, progressDirection: rec?.direction, completedSets }
        })
      )

      setExercises(loaded)
      // Resume at the first exercise that still has sets remaining
      const firstIncomplete = loaded.findIndex((e) => e.completedSets.length < e.template.sets)
      setActiveIdx(firstIncomplete === -1 ? 0 : firstIncomplete)
    }
    init()
  }, [selectedDOW])

  const handleSetsComplete = useCallback(async (
    exIdx: number,
    sets: { set_number: number; weight_kg: number; reps_completed: number; rpe: number }[]
  ) => {
    if (!sessionId || !programDay) return
    const tmpl = programDay.exercises[exIdx]
    if (!tmpl) return

    await supabase.from('exercise_logs').insert(
      sets.map((s) => ({ session_id: sessionId, exercise_id: tmpl.exercise_id, ...s, skipped: false }))
    )

    setExercises((prev) => prev.map((e, i) => (i === exIdx ? { ...e, completedSets: sets } : e)))
    if (exIdx < programDay.exercises.length - 1) setActiveIdx(exIdx + 1)
  }, [sessionId, programDay])

  async function finishWorkout() {
    if (!sessionId) return
    setSaving(true)
    await supabase.from('workout_sessions')
      .update({ completed: true, ended_at: new Date().toISOString() })
      .eq('id', sessionId)
    setSaving(false)
    setDone(true)
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')
  const allExercisesDone = exercises.length > 0 && exercises.every((e) => e.completedSets.length >= e.template.sets)

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-6 max-w-md mx-auto animate-slide-up">
        <div className="w-28 h-28 rounded-full flex items-center justify-center"
          style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.18) 0%, rgba(34,197,94,0.04) 70%)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <CheckCircle size={52} className="text-green-400" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-black text-white">Session Complete</h1>
          <p className="text-white/40 mt-2 text-sm">{mm}:{ss} · {exercises.length} exercises · progressive overload saved</p>
        </div>
        <div className="w-full glass rounded-2xl p-4 text-center"
          style={{ borderColor: 'rgba(59,130,246,0.2)', background: 'rgba(59,130,246,0.05)' }}>
          <p className="text-sm font-bold text-blue-300">Zone 2 Finisher</p>
          <p className="text-xs text-white/40 mt-1">{programDay?.cardio_duration_min} min at 110–128 bpm · bike or treadmill</p>
        </div>
        <div className="flex gap-3 w-full">
          <button onClick={() => navigate('/cardio')}
            className="flex-1 py-4 rounded-2xl font-bold text-blue-300 glass flex items-center justify-center gap-2 active:scale-95 text-sm transition-all">
            <Activity size={16} /> Cardio
          </button>
          <button onClick={() => navigate('/')}
            className="flex-1 py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 glow-brand-sm active:scale-95 transition-all text-sm"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
            Home <ArrowRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-page max-w-md mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="text-white/30 text-xs uppercase tracking-widest mb-1">Training</p>
          <h1 className="text-2xl font-black text-white">Weekly Plan</h1>
        </div>
        {isViewingToday && programDay && programDay.exercises.length > 0 && (
          <div className="glass rounded-2xl px-3 py-2 flex items-center gap-2">
            <Clock size={12} className="text-white/40" />
            <span className="text-sm font-mono text-white tabular-nums">{mm}:{ss}</span>
          </div>
        )}
      </div>

      {/* Week calendar */}
      <WeekCalendar todayDOW={todayDOW} selectedDOW={selectedDOW} onSelect={setSelectedDOW} />

      {/* Day preview label */}
      {!isViewingToday && (
        <div className="glass rounded-2xl px-4 py-2.5 flex items-center justify-between"
          style={{ borderColor: 'rgba(249,115,22,0.2)', background: 'rgba(249,115,22,0.05)' }}>
          <span className="text-xs text-amber-400 font-semibold">Previewing {DOW_LABELS[selectedDOW]}'s session</span>
          <button onClick={() => setSelectedDOW(todayDOW)}
            className="text-xs text-white/40 hover:text-white transition-colors">Back to today</button>
        </div>
      )}

      {/* Rest day */}
      {isSelectedRestDay ? (
        <div className="glass rounded-3xl p-6 text-center space-y-3"
          style={{ borderColor: 'rgba(59,130,246,0.15)', background: 'rgba(59,130,246,0.04)' }}>
          <div className="text-4xl">🚶</div>
          <div>
            <h2 className="text-xl font-black text-white">Rest & Walk Day</h2>
            <p className="text-white/40 text-sm mt-1">30–45 min brisk walk at Zone 2 pace</p>
            <p className="text-xs text-white/20 mt-2">Muscles grow during recovery. This day is doing the work.</p>
          </div>
          {isViewingToday && (
            <button onClick={() => navigate('/cardio')}
              className="px-6 py-3 rounded-2xl font-bold text-white glass flex items-center gap-2 mx-auto transition-all active:scale-95 text-sm"
              style={{ borderColor: 'rgba(59,130,246,0.2)' }}>
              <Activity size={15} className="text-blue-400" /> Log Walk
            </button>
          )}
        </div>
      ) : !programDay ? null : programDay.exercises.length === 0 ? (
        /* VO2 day */
        <div className="glass rounded-3xl p-6 text-center space-y-3"
          style={{ borderColor: 'rgba(239,68,68,0.15)', background: 'rgba(239,68,68,0.04)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: 'rgba(239,68,68,0.15)' }}>
            <Wind size={28} className="text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">VO₂ Max Day</h2>
            <p className="text-white/40 text-sm mt-1">Norwegian 4×4 or 40 min Zone 2</p>
            <p className="text-xs text-white/20 mt-2">The session that raises your ceiling</p>
          </div>
          {isViewingToday && (
            <button onClick={() => navigate('/cardio')}
              className="px-6 py-3 rounded-2xl font-bold text-white flex items-center gap-2 mx-auto glow-brand-sm transition-all active:scale-95 text-sm"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
              Start Session <ArrowRight size={15} />
            </button>
          )}
        </div>
      ) : (
        /* Lifting day */
        <>
          {/* Focus card */}
          <div className="glass rounded-3xl p-5"
            style={{ borderColor: 'rgba(249,115,22,0.2)', background: 'rgba(249,115,22,0.04)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
                <Dumbbell size={13} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                {isViewingToday ? "Today's Session" : DOW_LABELS[selectedDOW]}
              </span>
            </div>
            <h2 className="text-xl font-black text-white">{programDay.focus_label}</h2>
            <p className="text-white/40 text-sm mt-1">
              {programDay.exercises.length} exercises · {programDay.cardio_duration_min} min Zone 2 finisher
            </p>

            {/* Exercise progress bar */}
            {isViewingToday && exercises.length > 0 && (
              <div className="flex gap-1.5 mt-4">
                {exercises.map((e, i) => (
                  <div key={i} className="h-1 flex-1 rounded-full transition-all duration-500"
                    style={{
                      background: e.completedSets.length >= e.template.sets
                        ? '#22c55e'
                        : i === activeIdx
                        ? 'rgba(249,115,22,0.5)'
                        : 'rgba(255,255,255,0.08)',
                    }} />
                ))}
              </div>
            )}
          </div>

          {/* Exercise list — only active for today */}
          {isViewingToday && exercises.length > 0 ? (
            <div className="space-y-3">
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
                  onUncomplete={() => setExercises((prev) => prev.map((e, idx) => idx === i ? { ...e, completedSets: [] } : e))}
                />
              ))}
            </div>
          ) : (
            /* Preview mode — show exercise list read-only */
            <div className="space-y-2">
              {programDay.exercises.map((tmpl, i) => {
                const ex = getExerciseById(tmpl.exercise_id)
                return (
                  <div key={tmpl.exercise_id} className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
                    <span className="text-xs font-bold text-white/30 w-5 text-center">{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{ex?.name ?? tmpl.exercise_id}</p>
                      <p className="text-xs text-white/30">
                        {tmpl.sets} × {tmpl.target_reps_min}–{tmpl.target_reps_max} reps
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Cardio reminder */}
          <div className="glass rounded-2xl p-4 flex items-center gap-3"
            style={{ borderColor: 'rgba(59,130,246,0.15)', background: 'rgba(59,130,246,0.04)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(59,130,246,0.15)' }}>
              <Activity size={16} className="text-blue-400" />
            </div>
            <p className="text-sm text-white/60">
              <span className="font-semibold text-blue-300">After lifting:</span> {programDay.cardio_duration_min} min Zone 2 · 110–128 bpm
            </p>
          </div>

          {/* Finish button */}
          {isViewingToday && allExercisesDone && (
            <button
              onClick={finishWorkout}
              disabled={saving}
              className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 glow-brand-sm transition-all active:scale-95 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
              <CheckCircle size={18} />
              {saving ? 'Saving…' : 'Finish Workout'}
            </button>
          )}
        </>
      )}
    </div>
  )
}
