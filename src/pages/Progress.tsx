import { useEffect, useState } from 'react'
import { TrendingDown, TrendingUp, Plus, Target } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar, ReferenceLine,
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { today } from '@/lib/utils'
import { calcE1RM } from '@/lib/progression'
import { exercises } from '@/lib/programs/exerciseLibrary'
import type { BodyMetric, CardioSession, ExerciseLog } from '@/types'

const KEY_LIFTS = ['bench-press', 'low-bar-squat', 'sumo-deadlift', 'barbell-row']

const ChartTip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-3 py-2 text-xs" style={{ background: 'rgba(9,9,11,0.95)' }}>
      <p className="text-white/40 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-bold">{p.value}</p>
      ))}
    </div>
  )
}

export default function Progress() {
  const [weights, setWeights] = useState<BodyMetric[]>([])
  const [cardio, setCardio] = useState<CardioSession[]>([])
  const [strengthData, setStrengthData] = useState<Record<string, { date: string; e1rm: number }[]>>({})
  const [showWeightLog, setShowWeightLog] = useState(false)
  const [newWeight, setNewWeight] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: wt }, { data: cv }, { data: logs }] = await Promise.all([
      supabase.from('body_metrics').select('*').eq('user_id', user.id).order('date', { ascending: true }).limit(30),
      supabase.from('cardio_sessions').select('date, duration_min, type').eq('user_id', user.id).order('date', { ascending: true }).limit(30),
      supabase.from('exercise_logs')
        .select('*, workout_sessions!inner(date, user_id)')
        .in('exercise_id', KEY_LIFTS)
        .order('workout_sessions(date)', { ascending: true })
        .limit(200),
    ])

    if (wt) setWeights(wt as BodyMetric[])
    if (cv) setCardio(cv as CardioSession[])

    if (logs) {
      const grouped: Record<string, Record<string, number[]>> = {}
      for (const log of logs as (ExerciseLog & { workout_sessions: { date: string } })[]) {
        const date = log.workout_sessions.date
        if (!grouped[log.exercise_id]) grouped[log.exercise_id] = {}
        if (!grouped[log.exercise_id][date]) grouped[log.exercise_id][date] = []
        grouped[log.exercise_id][date].push(calcE1RM(log.weight_kg, log.reps_completed))
      }
      const result: Record<string, { date: string; e1rm: number }[]> = {}
      for (const [ex, dates] of Object.entries(grouped)) {
        result[ex] = Object.entries(dates)
          .map(([date, e1rms]) => ({ date, e1rm: Math.round(Math.max(...e1rms) * 10) / 10 }))
          .slice(-12)
      }
      setStrengthData(result)
    }
  }

  async function logWeight() {
    if (!newWeight) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('body_metrics').upsert({ user_id: user.id, date: today(), weight_kg: Number(newWeight) })
    setShowWeightLog(false)
    setNewWeight('')
    load()
  }

  const latestWeight = weights.at(-1)?.weight_kg
  const startWeight = weights[0]?.weight_kg
  const totalLost = startWeight && latestWeight ? startWeight - latestWeight : null
  const toGoal = latestWeight ? latestWeight - 85 : null

  const weightChartData = weights.map((m) => ({
    date: new Date(m.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
    weight: m.weight_kg,
  }))

  const cardioChartData = cardio.map((s) => ({
    date: new Date(s.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
    duration: s.duration_min,
    type: s.type,
  }))

  return (
    <div className="px-4 pt-8 pb-page max-w-md mx-auto space-y-4">
      {/* Header */}
      <div className="mb-2">
        <p className="text-white/30 text-xs uppercase tracking-widest mb-1">Transformation</p>
        <h1 className="text-3xl font-black text-white">Progress</h1>
        <p className="text-white/40 text-sm mt-1">100 kg → 85 kg · 24 weeks</p>
      </div>

      {/* Weight stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Current',  value: latestWeight ? `${latestWeight}` : '—', unit: 'kg', color: 'text-white' },
          { label: 'Lost',     value: totalLost && totalLost > 0 ? `${totalLost.toFixed(1)}` : '—', unit: 'kg', color: 'text-green-400', icon: <TrendingDown size={11} /> },
          { label: 'To Goal',  value: toGoal && toGoal > 0 ? `${toGoal.toFixed(1)}` : toGoal === 0 ? '0' : '—', unit: 'kg', color: 'text-amber-400' },
        ].map(({ label, value, unit, color, icon }) => (
          <div key={label} className="glass rounded-2xl p-4 text-center">
            <div className={`flex items-center justify-center gap-1 text-xl font-black ${color}`}>
              {icon}{value}
              <span className="text-sm font-medium text-white/40">{value !== '—' ? unit : ''}</span>
            </div>
            <p className="text-xs text-white/30 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Log weight */}
      {showWeightLog ? (
        <div className="glass rounded-3xl p-5 space-y-3">
          <p className="text-sm font-bold text-white">Today's Weight</p>
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 99.5"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="w-full glass-bright rounded-2xl px-4 py-3.5 text-white placeholder-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 pr-10"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-xs">kg</span>
            </div>
            <button onClick={logWeight}
              className="px-6 py-3.5 rounded-2xl font-bold text-white glow-brand-sm active:scale-95 transition-all text-sm"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
              Save
            </button>
          </div>
          <button onClick={() => setShowWeightLog(false)}
            className="text-xs text-white/30 hover:text-white/60 w-full text-center transition-colors">Cancel</button>
        </div>
      ) : (
        <button onClick={() => setShowWeightLog(true)}
          className="glass rounded-2xl px-4 py-3 text-sm font-semibold text-white/50 flex items-center gap-2 transition-all active:scale-[0.98]">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
            <Plus size={14} className="text-white" strokeWidth={2.5} />
          </div>
          Log today's weight
        </button>
      )}

      {/* Bodyweight chart */}
      {weightChartData.length > 1 && (
        <div className="glass rounded-3xl p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-bold text-white">Bodyweight</p>
              <p className="text-xs text-white/30">Goal line: 85 kg</p>
            </div>
            {toGoal !== null && toGoal > 0 && (
              <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                <Target size={11} /> {toGoal.toFixed(1)} kg to go
              </div>
            )}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weightChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
              <Tooltip content={<ChartTip />} />
              <ReferenceLine y={85} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.5} />
              <Line type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={2.5}
                dot={{ fill: '#22c55e', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#22c55e', stroke: 'rgba(34,197,94,0.3)', strokeWidth: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Strength charts */}
      {KEY_LIFTS.filter((id) => (strengthData[id]?.length ?? 0) > 1).map((id) => {
        const ex = exercises.find((e) => e.id === id)
        const data = strengthData[id] ?? []
        const latest = data.at(-1)?.e1rm
        const first = data[0]?.e1rm
        const gained = latest && first ? latest - first : null
        return (
          <div key={id} className="glass rounded-3xl p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-bold text-white">{ex?.name}</p>
                <p className="text-xs text-white/30">Est. 1-rep max</p>
              </div>
              {gained !== null && gained > 0 && (
                <div className="flex items-center gap-1 text-xs font-bold text-green-400">
                  <TrendingUp size={11} /> +{gained.toFixed(1)} kg
                </div>
              )}
            </div>
            <ResponsiveContainer width="100%" height={130}>
              <LineChart
                data={data.map((d) => ({
                  ...d,
                  date: new Date(d.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
                }))}
                margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTip />} />
                <Line type="monotone" dataKey="e1rm" stroke="#f59e0b" strokeWidth={2.5}
                  dot={{ fill: '#f59e0b', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#f59e0b', stroke: 'rgba(245,158,11,0.3)', strokeWidth: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )
      })}

      {/* Cardio chart */}
      {cardioChartData.length > 0 && (
        <div className="glass rounded-3xl p-5">
          <div className="mb-4">
            <p className="text-sm font-bold text-white">Cardio Volume</p>
            <p className="text-xs text-white/30">Minutes per session</p>
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={cardioChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="duration" fill="#3b82f6" radius={[4, 4, 0, 0]}
                style={{ filter: 'drop-shadow(0 0 6px rgba(59,130,246,0.3))' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {weights.length === 0 && Object.keys(strengthData).length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 glass rounded-3xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={28} className="text-white/20" />
          </div>
          <p className="text-white/30 text-sm">Log your first workout and weight to see your transformation here</p>
        </div>
      )}
    </div>
  )
}
