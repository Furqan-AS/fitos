import { useEffect, useState } from 'react'
import { Plus, Target, CheckCircle, Dumbbell } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine,
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { today } from '@/lib/utils'
import { calcE1RM } from '@/lib/progression'
import { exercises as exerciseLibrary } from '@/lib/programs/exerciseLibrary'
import type { BodyMetric } from '@/types'

const KEY_LIFTS = ['bench-press', 'low-bar-squat', 'sumo-deadlift', 'barbell-row']

interface CompletedSession {
  id: string
  date: string
  focus?: string
  exerciseCount: number
}

const Tip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-xs" style={{ background: 'rgba(8,8,14,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <p className="text-white/40 mb-1">{label}</p>
      <p className="font-black text-white">{payload[0].value}</p>
    </div>
  )
}

export default function Progress() {
  const [weights, setWeights]         = useState<BodyMetric[]>([])
  const [sessions, setSessions]       = useState<CompletedSession[]>([])
  const [strengthData, setStrengthData] = useState<Record<string, { date: string; e1rm: number }[]>>({})
  const [showWeightLog, setShowWeightLog] = useState(false)
  const [newWeight, setNewWeight]     = useState('')
  const [loading, setLoading]         = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    // Bodyweight
    const { data: wt } = await supabase
      .from('body_metrics')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true })
      .limit(60)

    // Completed sessions
    const { data: userSessions } = await supabase
      .from('workout_sessions')
      .select('id, date, completed')
      .eq('user_id', user.id)
      .eq('completed', true)
      .order('date', { ascending: false })
      .limit(30)

    if (wt) setWeights(wt as BodyMetric[])

    if (userSessions && userSessions.length > 0) {
      const sessionIds = userSessions.map((s: { id: string }) => s.id)

      // Count exercises per session
      const { data: exLogs } = await supabase
        .from('exercise_logs')
        .select('session_id, exercise_id')
        .in('session_id', sessionIds)

      const countBySession: Record<string, Set<string>> = {}
      for (const l of (exLogs ?? []) as { session_id: string; exercise_id: string }[]) {
        if (!countBySession[l.session_id]) countBySession[l.session_id] = new Set()
        countBySession[l.session_id].add(l.exercise_id)
      }

      setSessions(
        userSessions.map((s: { id: string; date: string }) => ({
          id: s.id,
          date: s.date,
          exerciseCount: countBySession[s.id]?.size ?? 0,
        }))
      )

      // Strength e1RM — only from this user's sessions
      const { data: strengthLogs } = await supabase
        .from('exercise_logs')
        .select('exercise_id, weight_kg, reps_completed, session_id')
        .in('session_id', sessionIds)
        .in('exercise_id', KEY_LIFTS)

      if (strengthLogs) {
        // Map session_id → date
        const sessionDateMap: Record<string, string> = {}
        for (const s of userSessions as { id: string; date: string }[]) sessionDateMap[s.id] = s.date

        const grouped: Record<string, Record<string, number[]>> = {}
        for (const log of strengthLogs as { exercise_id: string; weight_kg: number; reps_completed: number; session_id: string }[]) {
          const date = sessionDateMap[log.session_id]
          if (!date) continue
          if (!grouped[log.exercise_id]) grouped[log.exercise_id] = {}
          if (!grouped[log.exercise_id][date]) grouped[log.exercise_id][date] = []
          grouped[log.exercise_id][date].push(calcE1RM(log.weight_kg, log.reps_completed))
        }

        const result: Record<string, { date: string; e1rm: number }[]> = {}
        for (const [ex, dates] of Object.entries(grouped)) {
          result[ex] = Object.entries(dates)
            .map(([date, e1rms]) => ({
              date,
              e1rm: Math.round(Math.max(...e1rms) * 10) / 10,
            }))
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-16)
        }
        setStrengthData(result)
      }
    }

    setLoading(false)
  }

  async function logWeight() {
    const val = parseFloat(newWeight)
    if (!val || val < 30 || val > 300) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('body_metrics').upsert({ user_id: user.id, date: today(), weight_kg: val })
    setShowWeightLog(false)
    setNewWeight('')
    load()
  }

  const latestWeight = weights.at(-1)?.weight_kg
  const startWeight  = weights[0]?.weight_kg
  const totalLost    = startWeight && latestWeight && latestWeight < startWeight ? +(startWeight - latestWeight).toFixed(1) : null
  const toGoal       = latestWeight ? +(latestWeight - 85).toFixed(1) : null

  const weightChartData = weights.map((m) => ({
    date: new Date(m.date + 'T12:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
    weight: m.weight_kg,
  }))

  function formatDate(d: string) {
    return new Date(d + 'T12:00:00').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  return (
    <div className="px-5 pt-12 pb-page max-w-md mx-auto space-y-8">

      {/* Header */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/25">Transformation</p>
        <h1 className="text-4xl font-black text-white tracking-tight mt-2">Progress</h1>
        <p className="text-sm text-white/35 mt-1">100 kg → 85 kg · 24 weeks</p>
      </div>

      {/* Weight stats */}
      {latestWeight ? (
        <div className="space-y-4">
          <div className="flex items-baseline gap-6">
            <div>
              <p className="text-5xl font-black text-white tabular-nums tracking-tight">{latestWeight}</p>
              <p className="text-xs text-white/30 mt-1">kg now</p>
            </div>
            {totalLost && totalLost > 0 && (
              <>
                <div className="h-10 w-px bg-white/8" />
                <div>
                  <p className="text-3xl font-black text-green-400 tabular-nums">−{totalLost}</p>
                  <p className="text-xs text-white/30 mt-1">kg lost</p>
                </div>
              </>
            )}
            {toGoal !== null && toGoal > 0 && (
              <>
                <div className="h-10 w-px bg-white/8" />
                <div>
                  <p className="text-3xl font-black tabular-nums" style={{ color: 'rgba(245,158,11,0.8)' }}>{toGoal}</p>
                  <p className="text-xs text-white/30 mt-1">kg to go</p>
                </div>
              </>
            )}
          </div>

          {/* Goal bar */}
          <div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(Math.max(((100 - (latestWeight ?? 100)) / 15) * 100, 0), 100)}%`,
                  background: 'linear-gradient(90deg, #f59e0b, #f97316)',
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-white/20">Start 100 kg</span>
              <span className="text-[10px] text-amber-500/60 flex items-center gap-1"><Target size={8} /> Goal 85 kg</span>
            </div>
          </div>
        </div>
      ) : !loading && (
        <div
          className="rounded-[20px] p-5 text-center space-y-2"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-sm font-semibold text-white">Log your first weight</p>
          <p className="text-xs text-white/30">Start tracking your 100 → 85 kg journey</p>
        </div>
      )}

      {/* Log weight */}
      {showWeightLog ? (
        <div className="rounded-[20px] p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-sm font-bold text-white">Today's weight</p>
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <input
                type="number" step="0.1" placeholder="e.g. 99.5"
                value={newWeight} onChange={(e) => setNewWeight(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && logWeight()}
                autoFocus
                className="w-full rounded-2xl px-4 py-3.5 text-white placeholder-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 pr-10"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-xs font-medium">kg</span>
            </div>
            <button
              onClick={logWeight}
              className="px-6 py-3.5 rounded-2xl font-bold text-white text-sm active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}
            >
              Save
            </button>
          </div>
          <button onClick={() => setShowWeightLog(false)} className="text-xs text-white/25 hover:text-white/50 w-full text-center transition-colors">
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowWeightLog(true)}
          className="flex items-center gap-3 transition-all active:scale-[0.98] w-full text-left"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}
          >
            <Plus size={15} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold text-white/60">Log today's weight</span>
        </button>
      )}

      {/* Recent sessions — immediately useful */}
      {sessions.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/25">Sessions</p>
          <div className="space-y-2">
            {sessions.slice(0, 8).map((s) => (
              <div
                key={s.id}
                className="rounded-[18px] px-4 py-3.5 flex items-center gap-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(34,197,94,0.12)' }}
                >
                  <CheckCircle size={14} className="text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{formatDate(s.date)}</p>
                  <p className="text-xs text-white/30 mt-0.5">
                    {s.exerciseCount > 0 ? `${s.exerciseCount} exercises logged` : 'Session complete'}
                  </p>
                </div>
                <Dumbbell size={13} className="text-white/15 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && sessions.length === 0 && weights.length === 0 && (
        <div className="py-12 text-center space-y-3">
          <p className="text-white/20 text-sm leading-relaxed">
            Complete your first session and log your weight.<br />
            Your transformation timeline appears here.
          </p>
        </div>
      )}

      {/* Bodyweight chart */}
      {weightChartData.length > 1 && (
        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/25">Bodyweight</p>
          <div className="rounded-[20px] p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={weightChartData} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip content={<Tip />} />
                <ReferenceLine y={85} stroke="rgba(245,158,11,0.4)" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="weight" stroke="#f59e0b" strokeWidth={2}
                  dot={{ fill: '#f59e0b', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#f59e0b', stroke: 'rgba(245,158,11,0.3)', strokeWidth: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Strength charts */}
      {KEY_LIFTS.filter((id) => (strengthData[id]?.length ?? 0) > 0).length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/25">Strength · Est. 1RM</p>
          {KEY_LIFTS.filter((id) => (strengthData[id]?.length ?? 0) > 0).map((id) => {
            const ex       = exerciseLibrary.find((e) => e.id === id)
            const data     = strengthData[id] ?? []
            const latest   = data.at(-1)?.e1rm
            const first    = data[0]?.e1rm
            const gained   = latest && first && latest > first ? +(latest - first).toFixed(1) : null
            const chartData = data.map((d) => ({
              date: new Date(d.date + 'T12:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
              e1rm: d.e1rm,
            }))
            return (
              <div key={id} className="rounded-[20px] p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex justify-between items-baseline mb-4">
                  <div>
                    <p className="text-sm font-bold text-white">{ex?.name}</p>
                    {latest && <p className="text-xs text-white/30 mt-0.5">{latest} kg e1RM</p>}
                  </div>
                  {gained !== null && (
                    <p className="text-xs font-bold text-green-400">+{gained} kg</p>
                  )}
                </div>
                {chartData.length > 1 ? (
                  <ResponsiveContainer width="100%" height={110}>
                    <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <Tooltip content={<Tip />} />
                      <Line type="monotone" dataKey="e1rm" stroke="#f97316" strokeWidth={2}
                        dot={{ fill: '#f97316', r: 3, strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: '#f97316', stroke: 'rgba(249,115,22,0.3)', strokeWidth: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-white/25 py-4 text-center">Log 2+ sessions to see trend</p>
                )}
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
