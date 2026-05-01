import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Dumbbell, Activity, Salad, ChevronRight, Flame, Wind, Pill, ArrowRight, TrendingDown } from 'lucide-react'
import ProgressRing from '@/components/ui/ProgressRing'
import { supabase } from '@/lib/supabase'
import { today } from '@/lib/utils'
import { getTodaysProgramDay, isRestDay } from '@/lib/programs/upperLowerSplit'
import { sumMacros } from '@/lib/nutrition'
import type { NutritionLog, BodyMetric } from '@/types'

export default function Dashboard() {
  const [profile, setProfile] = useState<{ name: string; weight_kg: number } | null>(null)
  const [target, setTarget] = useState<{ calories: number; protein_g: number } | null>(null)
  const [consumed, setConsumed] = useState({ calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 })
  const [lastWeight, setLastWeight] = useState<number | null>(null)
  const [sessionDone, setSessionDone] = useState(false)

  const programDay = getTodaysProgramDay()
  const restDay = isRestDay()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: prof }, { data: tgt }, { data: logs }, { data: metrics }, { data: session }] = await Promise.all([
        supabase.from('profiles').select('name, weight_kg').eq('user_id', user.id).single(),
        supabase.from('nutrition_targets').select('calories, protein_g').eq('user_id', user.id).single(),
        supabase.from('nutrition_logs').select('calories, protein_g, carbs_g, fat_g').eq('user_id', user.id).eq('date', today()),
        supabase.from('body_metrics').select('weight_kg').eq('user_id', user.id).order('date', { ascending: false }).limit(1),
        supabase.from('workout_sessions').select('completed').eq('user_id', user.id).eq('date', today()).maybeSingle(),
      ])
      if (prof) setProfile(prof)
      if (tgt) setTarget(tgt)
      if (logs) setConsumed(sumMacros(logs as NutritionLog[]))
      if (metrics?.[0]) setLastWeight((metrics[0] as BodyMetric).weight_kg)
      if (session?.completed) setSessionDone(true)
    }
    load()
  }, [])

  const now = new Date(new Date().toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' }))
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const calPct = target ? consumed.calories / target.calories : 0
  const proteinPct = target ? consumed.protein_g / target.protein_g : 0
  const toGoal = lastWeight ? Math.max(0, lastWeight - 85).toFixed(1) : null

  return (
    <div className="px-4 pt-8 pb-page max-w-md mx-auto space-y-4">

      {/* Greeting */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-white/30 text-sm">{greeting}</p>
          <h1 className="text-3xl font-black text-white mt-0.5 tracking-tight">
            {profile?.name ?? 'Athlete'}
          </h1>
        </div>
        {toGoal !== null && (
          <div className="glass rounded-2xl px-4 py-2.5 text-right">
            <p className="text-[10px] text-white/30 uppercase tracking-wider flex items-center gap-1 justify-end">
              <TrendingDown size={9} /> To goal
            </p>
            <p className="text-xl font-black gradient-text">{toGoal} kg</p>
          </div>
        )}
      </div>

      {/* Workout hero */}
      <Link to="/workout">
        <div className="relative rounded-3xl overflow-hidden p-5"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(249,115,22,0.08) 50%, rgba(234,88,12,0.05) 100%)',
            border: '1px solid rgba(249,115,22,0.2)',
            boxShadow: '0 8px 32px rgba(249,115,22,0.08)',
          }}>
          {/* Glow orb */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)' }} />

          <div className="flex items-start justify-between relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
                <Dumbbell size={15} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">Today's Session</span>
            </div>
            {sessionDone && (
              <span className="text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
                Done ✓
              </span>
            )}
          </div>

          {restDay ? (
            <div>
              <h2 className="text-xl font-black text-white">Rest & Walk Day</h2>
              <p className="text-white/50 text-sm mt-1">30–45 min Zone 2 walk · 110–128 bpm</p>
            </div>
          ) : programDay ? (
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-xl font-black text-white leading-tight">{programDay.focus_label}</h2>
                <p className="text-white/50 text-sm mt-1">
                  {programDay.exercises.length > 0
                    ? `${programDay.exercises.length} exercises · ${programDay.cardio_duration_min} min cardio`
                    : `${programDay.cardio_duration_min} min VO₂ max session`}
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/8">
                <ArrowRight size={16} className="text-white/60" />
              </div>
            </div>
          ) : (
            <p className="text-white/40 text-sm">No session today</p>
          )}
        </div>
      </Link>

      {/* Nutrition ring */}
      <Link to="/nutrition">
        <div className="glass rounded-3xl p-5 flex items-center gap-5">
          <ProgressRing
            value={consumed.calories}
            max={target?.calories ?? 2400}
            size={80}
            strokeWidth={8}
            color={calPct > 1 ? '#ef4444' : '#22c55e'}
            trackColor="rgba(255,255,255,0.06)"
          >
            <span className="text-xs font-bold text-white">{Math.round(calPct * 100)}%</span>
          </ProgressRing>

          <div className="flex-1 space-y-2.5">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-white/40 uppercase tracking-wider">Calories</span>
              <span className="text-sm font-bold text-white">{consumed.calories} <span className="text-white/25 font-normal">/ {target?.calories ?? 2400}</span></span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(calPct * 100, 100)}%`, background: calPct > 1 ? '#ef4444' : 'linear-gradient(90deg, #22c55e, #10b981)' }} />
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-white/40 uppercase tracking-wider">Protein</span>
              <span className="text-sm font-bold text-green-400">{consumed.protein_g}g <span className="text-white/25 font-normal">/ {target?.protein_g ?? 180}g</span></span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(proteinPct * 100, 100)}%`, background: 'linear-gradient(90deg, #22c55e, #4ade80)' }} />
            </div>
          </div>
          <ChevronRight size={14} className="text-white/20 shrink-0" />
        </div>
      </Link>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Cardio',    icon: <Activity size={18} />, to: '/cardio',    color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
          { label: 'Nutrition', icon: <Salad size={18} />,    to: '/nutrition', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
          { label: 'Progress',  icon: <Flame size={18} />,    to: '/progress',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
        ].map(({ label, icon, to, color, bg }) => (
          <Link key={label} to={to}>
            <div className="glass rounded-2xl p-4 flex flex-col items-center gap-2.5 active:scale-95 transition-all">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <span style={{ color }}>{icon}</span>
              </div>
              <span className="text-xs font-medium text-white/50">{label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Zone 2 reminder */}
      <div className="glass rounded-2xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(59,130,246,0.12)' }}>
          <Wind size={18} className="text-blue-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Zone 2 target</p>
          <p className="text-xs text-white/40 mt-0.5">110–128 bpm · speak in full sentences</p>
        </div>
      </div>

      {/* Supplement reminder */}
      <div className="glass rounded-2xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(168,85,247,0.12)' }}>
          <Pill size={18} className="text-purple-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Morning supplements</p>
          <p className="text-xs text-white/40 mt-0.5">Vitamin C · NAC · Creatine 5g · Whey post-workout</p>
        </div>
      </div>
    </div>
  )
}
