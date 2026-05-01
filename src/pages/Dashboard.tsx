import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Scale } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { today } from '@/lib/utils'
import { getTodaysProgramDay, isRestDay } from '@/lib/programs/upperLowerSplit'
import type { BodyMetric } from '@/types'

export default function Dashboard() {
  const [name, setName]               = useState<string | null>(null)
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

  const now      = new Date(new Date().toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' }))
  const hour     = now.getHours()
  const greeting = hour < 5 ? "You're up late" : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const toGoal   = latestWeight ? Math.max(0, latestWeight - 85) : null
  const pctDone  = latestWeight ? Math.min(((100 - latestWeight) / 15) * 100, 100) : 0

  return (
    <div className="px-5 pb-page max-w-md mx-auto" style={{ paddingTop: '52px' }}>

      {/* ── Greeting ─────────────────────────────────────── */}
      <div style={{ marginBottom: 44 }}>
        <p style={{ fontSize: 15, color: 'var(--text-2)', marginBottom: 6 }}>{greeting}</p>
        <h1 className="display" style={{ color: 'var(--text)' }}>
          {name ?? 'Furqan'}.
        </h1>
      </div>

      {/* ── Today's session ──────────────────────────────── */}
      <div style={{ marginBottom: 8 }}>
        <p className="label" style={{ marginBottom: 14 }}>Today</p>
      </div>

      <Link to="/workout">
        <div
          className={sessionDone ? 'card-green' : 'card-accent'}
          style={{ padding: '24px', marginBottom: 44, transition: 'opacity 0.15s' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              {restDay ? (
                <>
                  <p style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 6 }}>
                    Rest &amp; Walk
                  </p>
                  <p style={{ fontSize: 14, color: 'var(--text-2)' }}>30–45 min Zone 2 walk</p>
                </>
              ) : programDay ? (
                <>
                  <p style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 6, lineHeight: 1.2 }}>
                    {programDay.focus_label}
                  </p>
                  <p style={{ fontSize: 14, color: 'var(--text-2)' }}>
                    {programDay.exercises.length > 0
                      ? `${programDay.exercises.length} exercises · ${programDay.cardio_duration_min} min cardio`
                      : `${programDay.cardio_duration_min} min VO₂ session`}
                  </p>
                </>
              ) : (
                <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-2)' }}>No session today</p>
              )}
            </div>
            <div
              style={{
                width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 16,
                background: sessionDone ? 'rgba(24,200,122,0.2)' : 'var(--accent)',
              }}
            >
              <ArrowRight size={20} color={sessionDone ? '#18C87A' : '#000'} strokeWidth={2.5} />
            </div>
          </div>

          {sessionDone && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(24,200,122,0.15)' }}>
              <p style={{ fontSize: 13, color: '#18C87A', fontWeight: 600 }}>Session complete ✓</p>
            </div>
          )}
        </div>
      </Link>

      {/* ── Body ─────────────────────────────────────────── */}
      <p className="label" style={{ marginBottom: 20 }}>Body</p>

      {latestWeight ? (
        <div style={{ marginBottom: 44 }}>
          {/* Numbers row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 32, marginBottom: 24 }}>
            <div>
              <p className="metric" style={{ color: 'var(--text)' }}>{latestWeight}</p>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>kg now</p>
            </div>
            {toGoal !== null && toGoal > 0 && (
              <div>
                <p className="metric-sm" style={{ color: 'var(--accent)' }}>{toGoal.toFixed(1)}</p>
                <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>kg to goal</p>
              </div>
            )}
            {toGoal === 0 && (
              <div>
                <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)' }}>Goal reached</p>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ height: '100%', width: `${pctDone}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.6s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>100 kg</span>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Goal · 85 kg</span>
          </div>
        </div>
      ) : (
        <Link to="/progress" style={{ display: 'block', marginBottom: 44 }}>
          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <Scale size={18} color="var(--accent)" />
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Log your weight</p>
              <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>Track progress toward 85 kg</p>
            </div>
            <ArrowRight size={14} color="var(--text-3)" style={{ marginLeft: 'auto' }} />
          </div>
        </Link>
      )}

      {/* ── Daily targets ─────────────────────────────────── */}
      <p className="label" style={{ marginBottom: 20 }}>Daily targets</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div className="card" style={{ padding: '20px 16px' }}>
          <p style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>2,400</p>
          <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>kcal</p>
        </div>
        <div className="card" style={{ padding: '20px 16px' }}>
          <p style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--green)', fontVariantNumeric: 'tabular-nums' }}>180g</p>
          <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>protein</p>
        </div>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
        Protein first — build meals around it. Open Eat tab for food reference.
      </p>

    </div>
  )
}
