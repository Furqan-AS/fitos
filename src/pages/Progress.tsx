import { useEffect, useState } from 'react'
import { Plus, Target, CheckCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'
import { supabase } from '@/lib/supabase'
import { today } from '@/lib/utils'
import { calcE1RM } from '@/lib/progression'
import { exercises as exerciseLibrary } from '@/lib/programs/exerciseLibrary'
import type { BodyMetric } from '@/types'

const KEY_LIFTS = ['bench-press', 'low-bar-squat', 'sumo-deadlift', 'barbell-row']

interface CompletedSession { id: string; date: string; exerciseCount: number }

const ChartTip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--surface-hi)', border: '1px solid var(--border-hi)', borderRadius: 10, padding: '8px 12px', fontSize: 12 }}>
      <p style={{ color: 'var(--text-2)', marginBottom: 4 }}>{label}</p>
      <p style={{ color: 'var(--text)', fontWeight: 800 }}>{payload[0].value}</p>
    </div>
  )
}

export default function Progress() {
  const [weights, setWeights]             = useState<BodyMetric[]>([])
  const [sessions, setSessions]           = useState<CompletedSession[]>([])
  const [strengthData, setStrengthData]   = useState<Record<string, { date: string; e1rm: number }[]>>({})
  const [showWeightLog, setShowWeightLog] = useState(false)
  const [newWeight, setNewWeight]         = useState('')
  const [loading, setLoading]             = useState(true)
  const [goalWeight, setGoalWeight]       = useState(85)
  const [profileWeight, setProfileWeight] = useState(100)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: prof } = await supabase.from('profiles').select('weight_kg,goal_weight_kg').eq('user_id', user.id).maybeSingle()
    if (prof?.goal_weight_kg) setGoalWeight(prof.goal_weight_kg)
    if (prof?.weight_kg)      setProfileWeight(prof.weight_kg)

    const { data: wt } = await supabase.from('body_metrics').select('*').eq('user_id', user.id).order('date', { ascending: true }).limit(60)
    const { data: userSessions } = await supabase.from('workout_sessions').select('id, date, completed').eq('user_id', user.id).eq('completed', true).order('date', { ascending: false }).limit(30)

    if (wt) setWeights(wt as BodyMetric[])

    if (userSessions && userSessions.length > 0) {
      const sessionIds = userSessions.map((s: { id: string }) => s.id)
      const { data: exLogs } = await supabase.from('exercise_logs').select('session_id, exercise_id').in('session_id', sessionIds)

      const countBySession: Record<string, Set<string>> = {}
      for (const l of (exLogs ?? []) as { session_id: string; exercise_id: string }[]) {
        if (!countBySession[l.session_id]) countBySession[l.session_id] = new Set()
        countBySession[l.session_id].add(l.exercise_id)
      }
      setSessions(userSessions.map((s: { id: string; date: string }) => ({
        id: s.id, date: s.date, exerciseCount: countBySession[s.id]?.size ?? 0,
      })))

      const { data: strengthLogs } = await supabase.from('exercise_logs').select('exercise_id, weight_kg, reps_completed, session_id').in('session_id', sessionIds).in('exercise_id', KEY_LIFTS)
      if (strengthLogs) {
        const sessionDateMap: Record<string, string> = {}
        for (const s of userSessions as { id: string; date: string }[]) sessionDateMap[s.id] = s.date
        const grouped: Record<string, Record<string, number[]>> = {}
        for (const log of strengthLogs as { exercise_id: string; weight_kg: number; reps_completed: number; session_id: string }[]) {
          const date = sessionDateMap[log.session_id]; if (!date) continue
          if (!grouped[log.exercise_id]) grouped[log.exercise_id] = {}
          if (!grouped[log.exercise_id][date]) grouped[log.exercise_id][date] = []
          grouped[log.exercise_id][date].push(calcE1RM(log.weight_kg, log.reps_completed))
        }
        const result: Record<string, { date: string; e1rm: number }[]> = {}
        for (const [ex, dates] of Object.entries(grouped)) {
          result[ex] = Object.entries(dates).map(([date, e1rms]) => ({ date, e1rm: Math.round(Math.max(...e1rms) * 10) / 10 })).sort((a, b) => a.date.localeCompare(b.date)).slice(-16)
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
    setShowWeightLog(false); setNewWeight(''); load()
  }

  const latestWeight   = weights.at(-1)?.weight_kg
  const startWeight    = weights[0]?.weight_kg ?? profileWeight
  const totalLost      = startWeight && latestWeight && latestWeight < startWeight ? +(startWeight - latestWeight).toFixed(1) : null
  const toGoal         = latestWeight ? Math.max(0, +(latestWeight - goalWeight).toFixed(1)) : null
  const totalJourney   = Math.max(startWeight - goalWeight, 1)
  const pctDone        = latestWeight ? Math.min(Math.max(((startWeight - latestWeight) / totalJourney) * 100, 0), 100) : 0

  function fmtDate(d: string) {
    return new Date(d + 'T12:00:00').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
  }
  function fmtShort(d: string) {
    return new Date(d + 'T12:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
  }

  return (
    <div style={{ padding: '52px 20px 0', maxWidth: 448, margin: '0 auto' }} className="pb-page">

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <p className="label" style={{ marginBottom: 8 }}>Transformation</p>
        <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 6 }}>Progress</h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)' }}>{startWeight} kg → {goalWeight} kg</p>
      </div>

      {/* Weight stats */}
      {latestWeight ? (
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 28, marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 64, fontWeight: 900, letterSpacing: '-0.045em', color: 'var(--text)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{latestWeight}</p>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6 }}>kg now</p>
            </div>
            {totalLost && totalLost > 0 && (
              <>
                <div style={{ width: 1, height: 48, background: 'var(--border)', marginBottom: 22 }} />
                <div>
                  <p style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--green)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>−{totalLost}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6 }}>kg lost</p>
                </div>
              </>
            )}
            {toGoal !== null && toGoal > 0 && (
              <>
                <div style={{ width: 1, height: 48, background: 'var(--border)', marginBottom: 22 }} />
                <div>
                  <p style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--accent)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{toGoal}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6 }}>kg to go</p>
                </div>
              </>
            )}
          </div>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ height: '100%', width: `${pctDone}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.6s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Start {startWeight} kg</span>
            <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Target size={9} color="var(--accent)" /> Goal {goalWeight} kg
            </span>
          </div>
        </div>
      ) : !loading && (
        <div className="card" style={{ padding: '20px', textAlign: 'center', marginBottom: 36 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Log your first weight</p>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6 }}>Start tracking your 100 → 85 kg journey</p>
        </div>
      )}

      {/* Log weight */}
      {showWeightLog ? (
        <div className="card" style={{ padding: 20, marginBottom: 36 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Today's weight</p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="number" step="0.1" placeholder="99.5" value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && logWeight()}
                autoFocus
                style={{ width: '100%', background: 'var(--surface-hi)', border: '1px solid var(--border-hi)', borderRadius: 14, padding: '14px 44px 14px 16px', color: 'var(--text)', fontSize: 16, fontWeight: 600, outline: 'none' }}
              />
              <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text-2)' }}>kg</span>
            </div>
            <button onClick={logWeight} className="btn-primary" style={{ padding: '14px 22px', fontSize: 14, flexShrink: 0 }}>Save</button>
          </div>
          <button onClick={() => setShowWeightLog(false)} style={{ fontSize: 12, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 12, display: 'block', width: '100%', textAlign: 'center' }}>
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowWeightLog(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Plus size={16} color="#000" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>Log today's weight</span>
        </button>
      )}

      {/* Recent sessions */}
      {sessions.length > 0 && (
        <div style={{ marginBottom: 36 }}>
          <p className="label" style={{ marginBottom: 16 }}>Sessions</p>
          <div>
            {sessions.slice(0, 8).map((s, i) => (
              <div
                key={s.id}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: i < sessions.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <CheckCircle size={16} color="var(--green)" />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{fmtDate(s.date)}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                    {s.exerciseCount > 0 ? `${s.exerciseCount} exercises` : 'Session complete'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && sessions.length === 0 && weights.length === 0 && (
        <div style={{ paddingTop: 48, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.7 }}>Complete your first session and log your weight.<br />Your transformation timeline appears here.</p>
        </div>
      )}

      {/* Bodyweight chart */}
      {weights.length > 1 && (
        <div style={{ marginBottom: 36 }}>
          <p className="label" style={{ marginBottom: 16 }}>Bodyweight</p>
          <div className="card" style={{ padding: '20px 16px 12px' }}>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={weights.map(m => ({ date: fmtShort(m.date), weight: m.weight_kg }))} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-3)', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: 'var(--text-3)', fontSize: 10 }} tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip content={<ChartTip />} />
                <ReferenceLine y={85} stroke="rgba(233,160,32,0.35)" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="weight" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: 'var(--accent)', stroke: 'rgba(233,160,32,0.3)', strokeWidth: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Strength charts */}
      {KEY_LIFTS.filter(id => (strengthData[id]?.length ?? 0) > 0).map(id => {
        const ex = exerciseLibrary.find(e => e.id === id)
        const data = strengthData[id] ?? []
        const latest = data.at(-1)?.e1rm
        const first = data[0]?.e1rm
        const gained = latest && first && latest > first ? +(latest - first).toFixed(1) : null
        const chartData = data.map(d => ({ date: fmtShort(d.date), e1rm: d.e1rm }))
        return (
          <div key={id} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{ex?.name}</p>
                {latest && <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{latest} kg e1RM</p>}
              </div>
              {gained !== null && <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>+{gained} kg</p>}
            </div>
            {chartData.length > 1 ? (
              <div className="card" style={{ padding: '16px 12px 8px' }}>
                <ResponsiveContainer width="100%" height={100}>
                  <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-3)', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: 'var(--text-3)', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTip />} />
                    <Line type="monotone" dataKey="e1rm" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--text-3)', padding: '12px 0' }}>Log 2+ sessions to see trend</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
