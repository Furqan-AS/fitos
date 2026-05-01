import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Scale } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { today } from '@/lib/utils'
import { getTodaysProgramDay, isRestDay } from '@/lib/programs/upperLowerSplit'
import type { BodyMetric } from '@/types'

export default function Dashboard() {
  const [name, setName]           = useState<string | null>(null)
  const [latestWeight, setLatestWeight] = useState<number | null>(null)
  const [sessionDone, setSessionDone]   = useState(false)

  const programDay = getTodaysProgramDay()
  const restDay    = isRestDay()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: prof }, { data: metrics }, { data: session }] = await Promise.all([
        supabase.from('profiles').select('name').eq('user_id', user.id).single(),
        supabase.from('body_metrics').select('weight_kg').eq('user_id', user.id).order('date', { ascending: false }).limit(1),
        supabase.from('workout_sessions').select('completed').eq('user_id', user.id).eq('date', today()).maybeSingle(),
      ])
      if (prof?.name) setName(prof.name)
      if (metrics?.[0]) setLatestWeight((metrics[0] as BodyMetric).weight_kg)
      if (session?.completed) setSessionDone(true)
    }
    load()
  }, [])

  const now     = new Date(new Date().toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' }))
  const hour    = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr  = now.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })
  const toGoal   = latestWeight ? Math.max(0, latestWeight - 85) : null

  return (
    <div className="px-5 pt-12 pb-page max-w-md mx-auto space-y-8">

      {/* Greeting */}
      <div>
        <p className="text-white/30 text-sm font-medium">{dateStr}</p>
        <h1 className="text-4xl font-black text-white tracking-tight mt-1 leading-tight">
          {greeting},<br />
          <span style={{ background: 'linear-gradient(90deg, #f59e0b, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {name ?? 'Furqan'}.
          </span>
        </h1>
      </div>

      {/* Today's training — primary card */}
      <Link to="/workout">
        <div
          className="rounded-[24px] p-6 flex items-end justify-between transition-all active:scale-[0.98]"
          style={{
            background: sessionDone
              ? 'linear-gradient(145deg, rgba(34,197,94,0.12) 0%, rgba(16,185,129,0.06) 100%)'
              : 'linear-gradient(145deg, rgba(245,158,11,0.14) 0%, rgba(249,115,22,0.08) 100%)',
            border: sessionDone
              ? '1px solid rgba(34,197,94,0.15)'
              : '1px solid rgba(249,115,22,0.18)',
          }}
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-2">
              {sessionDone ? 'Completed' : 'Today'}
            </p>
            {restDay ? (
              <>
                <h2 className="text-2xl font-black text-white leading-tight">Rest & Walk</h2>
                <p className="text-sm text-white/40 mt-1">30–45 min Zone 2 walk</p>
              </>
            ) : programDay ? (
              <>
                <h2 className="text-2xl font-black text-white leading-tight">{programDay.focus_label}</h2>
                <p className="text-sm text-white/40 mt-1">
                  {programDay.exercises.length > 0
                    ? `${programDay.exercises.length} exercises · ${programDay.cardio_duration_min} min cardio`
                    : `${programDay.cardio_duration_min} min VO₂ session`}
                </p>
              </>
            ) : (
              <h2 className="text-2xl font-black text-white">No session today</h2>
            )}
          </div>
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ml-4"
            style={{
              background: sessionDone
                ? 'rgba(34,197,94,0.2)'
                : 'linear-gradient(135deg, #f59e0b, #f97316)',
            }}
          >
            <ArrowRight size={18} className="text-white" />
          </div>
        </div>
      </Link>

      {/* Weight progress */}
      {latestWeight ? (
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/25">Body</p>
          <div className="flex items-baseline gap-6 mt-3">
            <div>
              <p className="text-5xl font-black text-white tabular-nums tracking-tight">{latestWeight}</p>
              <p className="text-xs text-white/30 mt-1 font-medium">kg current</p>
            </div>
            {toGoal !== null && toGoal > 0 && (
              <>
                <div className="h-10 w-px bg-white/8" />
                <div>
                  <p className="text-5xl font-black tabular-nums tracking-tight"
                    style={{ color: 'rgba(245,158,11,0.7)' }}>{toGoal.toFixed(1)}</p>
                  <p className="text-xs text-white/30 mt-1 font-medium">kg to go</p>
                </div>
              </>
            )}
            {toGoal === 0 && (
              <p className="text-sm font-bold text-green-400">Goal reached 🎯</p>
            )}
          </div>

          {/* Progress bar toward 85kg */}
          {toGoal !== null && (
            <div className="mt-4">
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(((100 - latestWeight) / (100 - 85)) * 100, 100)}%`,
                    background: 'linear-gradient(90deg, #f59e0b, #f97316)',
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-white/20">100 kg</span>
                <span className="text-[10px] text-white/20">Goal 85 kg</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* No weight logged yet */
        <Link to="/progress">
          <div
            className="rounded-[20px] p-4 flex items-center gap-3 transition-all active:scale-[0.98]"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)' }}>
              <Scale size={16} className="text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Log today's weight</p>
              <p className="text-xs text-white/35">Track your 100 → 85 kg journey</p>
            </div>
            <ArrowRight size={14} className="text-white/20 ml-auto" />
          </div>
        </Link>
      )}

      {/* Nutrition target — single line, no logging */}
      <div className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/25">Today's targets</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Calories', value: '2,400', unit: 'kcal', color: 'text-white' },
            { label: 'Protein',  value: '180g',  unit: 'minimum', color: 'text-green-400' },
          ].map(({ label, value, unit, color }) => (
            <div
              key={label}
              className="rounded-[18px] p-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p className={`text-2xl font-black tabular-nums ${color}`}>{value}</p>
              <p className="text-xs text-white/30 mt-1">{label}</p>
              <p className="text-[10px] text-white/18 mt-0.5">{unit}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-white/25 px-1">
          Hit protein first. Everything else fills around it. Open Eat tab for food reference.
        </p>
      </div>

    </div>
  )
}
