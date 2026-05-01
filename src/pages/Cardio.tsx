import { useEffect, useState } from 'react'
import { Wind, Zap, Plus, CheckCircle, ChevronRight } from 'lucide-react'
import VO2Session from '@/components/cardio/VO2Session'
import { supabase } from '@/lib/supabase'
import { today } from '@/lib/utils'
import { getZone2Range, getHIITRange } from '@/lib/vo2'
import type { CardioSession } from '@/types'

type Mode = 'select' | 'zone2' | 'hiit' | 'log' | 'done'

export default function Cardio() {
  const [mode, setMode] = useState<Mode>('select')
  const [age, setAge] = useState(37)
  const [pastSessions, setPastSessions] = useState<CardioSession[]>([])
  const [lastDuration, setLastDuration] = useState(0)
  const [weekCount, setWeekCount] = useState(0)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: prof } = await supabase.from('profiles').select('age').eq('user_id', user.id).single()
      if (prof) setAge(prof.age)

      const { data: sessions } = await supabase
        .from('cardio_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(10)
      if (sessions) setPastSessions(sessions as CardioSession[])

      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const { count } = await supabase
        .from('cardio_sessions')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .gte('date', weekStart.toISOString().split('T')[0])
      setWeekCount(count ?? 0)
    }
    load()
  }, [])

  async function saveSession(type: 'zone2' | 'hiit' | 'other', durationMin: number) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('cardio_sessions').insert({
      user_id: user.id,
      type,
      duration_min: durationMin,
      date: today(),
    })
    setLastDuration(durationMin)
    setMode('done')
  }

  const zone2 = getZone2Range(age)
  const hiit = getHIITRange(age)

  if (mode === 'zone2' || mode === 'hiit') {
    return (
      <div className="px-4 pt-6 pb-page max-w-md mx-auto">
        <button onClick={() => setMode('select')}
          className="text-sm text-white/40 hover:text-white mb-6 flex items-center gap-1 transition-colors">
          ← Back
        </button>
        <VO2Session
          age={age}
          mode={mode}
          onComplete={(dur) => saveSession(mode, dur)}
        />
      </div>
    )
  }

  if (mode === 'done') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-6 max-w-md mx-auto text-center">
        <div className="w-28 h-28 rounded-full flex items-center justify-center"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0.05) 70%)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <CheckCircle size={52} className="text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white">Cardio Done</h1>
          <p className="text-white/40 mt-1">{lastDuration} min logged · excellent work</p>
        </div>
        <button
          onClick={() => setMode('select')}
          className="px-8 py-4 rounded-2xl font-bold text-white glow-green-sm transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }}>
          Back to Cardio
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 pt-8 pb-page max-w-md mx-auto space-y-4">
      {/* Header */}
      <div className="mb-2">
        <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Training</p>
        <h1 className="text-3xl font-black text-white">Cardio & VO₂</h1>
        <p className="text-white/40 text-sm mt-1">Max HR: {220 - age} bpm · Age {age}</p>
      </div>

      {/* Week progress */}
      <div className="glass rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-white">This week</p>
          <span className="text-xs text-white/40 font-medium">{weekCount} / 5 sessions</span>
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-2 flex-1 rounded-full transition-all duration-500"
              style={{
                background: i < weekCount
                  ? 'linear-gradient(90deg, #3b82f6, #60a5fa)'
                  : 'rgba(255,255,255,0.06)',
              }}
            />
          ))}
        </div>
        <p className="text-xs text-white/25 mt-3">
          {weekCount >= 5 ? 'Week goal complete — exceptional' : `${5 - weekCount} more to hit your weekly target`}
        </p>
      </div>

      {/* Zone 2 */}
      <button onClick={() => setMode('zone2')} className="w-full text-left">
        <div className="glass rounded-3xl p-5 flex items-start gap-4 transition-all active:scale-[0.98]"
          style={{ borderColor: 'rgba(59,130,246,0.2)', background: 'rgba(59,130,246,0.05)' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(59,130,246,0.15)' }}>
            <Wind size={22} className="text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-white text-sm">Zone 2 — Aerobic Base</h3>
            </div>
            <p className="text-xs text-white/40 mb-1.5">{zone2.low}–{zone2.high} bpm · conversational pace · 20–40 min</p>
            <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">Recommended</span>
          </div>
          <ChevronRight size={16} className="text-white/20 mt-1 shrink-0" />
        </div>
      </button>

      {/* HIIT */}
      <button onClick={() => setMode('hiit')} className="w-full text-left">
        <div className="glass rounded-3xl p-5 flex items-start gap-4 transition-all active:scale-[0.98]"
          style={{ borderColor: 'rgba(239,68,68,0.15)', background: 'rgba(239,68,68,0.04)' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(239,68,68,0.15)' }}>
            <Zap size={22} className="text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white mb-1">Norwegian 4×4 HIIT</h3>
            <p className="text-xs text-white/40">Work: {hiit.low}–{hiit.high} bpm · ~30 min total</p>
            <p className="text-xs text-white/25 mt-1">4 × 4 min hard intervals · raises VO₂ max ceiling</p>
          </div>
          <ChevronRight size={16} className="text-white/20 mt-1 shrink-0" />
        </div>
      </button>

      {/* Manual log */}
      <ManualCardioLog onSave={saveSession} />

      {/* Past sessions */}
      {pastSessions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-white/30 uppercase tracking-widest px-1">Recent Sessions</p>
          {pastSessions.slice(0, 5).map((s) => (
            <div key={s.id} className="glass rounded-2xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">
                  {s.type === 'zone2' ? 'Zone 2' : s.type === 'hiit' ? 'HIIT 4×4' : 'Cardio'}
                </p>
                <p className="text-xs text-white/30">{s.date}</p>
              </div>
              <span className="text-sm font-bold text-blue-400">{s.duration_min} min</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ManualCardioLog({ onSave }: { onSave: (type: 'zone2' | 'hiit' | 'other', dur: number) => void }) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'zone2' | 'hiit' | 'other'>('zone2')
  const [dur, setDur] = useState(30)

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="w-full flex items-center justify-center gap-2 py-3 text-sm text-white/30 hover:text-white/60 transition-colors">
      <Plus size={14} /> Log manually
    </button>
  )

  return (
    <div className="glass rounded-3xl p-5 space-y-4">
      <p className="text-sm font-bold text-white">Log Cardio Manually</p>
      <div className="flex gap-2">
        {(['zone2', 'hiit', 'other'] as const).map((t) => (
          <button key={t} onClick={() => setType(t)}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold capitalize transition-all"
            style={{
              background: type === t ? 'linear-gradient(135deg, #22c55e, #10b981)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${type === t ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
              color: type === t ? 'white' : 'rgba(255,255,255,0.4)',
            }}>
            {t === 'zone2' ? 'Zone 2' : t === 'hiit' ? 'HIIT' : 'Other'}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-white/40">Duration</span>
        <input type="number" value={dur} min={1} onChange={(e) => setDur(Number(e.target.value))}
          className="w-24 glass-bright rounded-xl px-3 py-2 text-sm text-white text-center focus:outline-none focus:ring-2 focus:ring-green-500/40" />
        <span className="text-white/40 text-sm">min</span>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setOpen(false)}
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-white/50 glass transition-all active:scale-95">
          Cancel
        </button>
        <button onClick={() => { onSave(type, dur); setOpen(false); }}
          className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 glow-green-sm transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }}>
          <Plus size={14} /> Save
        </button>
      </div>
    </div>
  )
}
