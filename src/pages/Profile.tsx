import { useEffect, useState } from 'react'
import { LogOut, Save, Pill, Flame, Wine, Target, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { calcBMR, calcTDEE, calcMacroTargets } from '@/lib/nutrition'
import type { Profile as ProfileType } from '@/types'

const SUPPLEMENTS = [
  { name: 'Vitamin C',           dose: '1,000 mg',   timing: 'Morning',       why: 'Depleted by smoking · lung & immune protection' },
  { name: 'NAC',                 dose: '600 mg',     timing: 'Morning',       why: 'Lung mucus clearance · glutathione precursor' },
  { name: 'Omega-3 Fish Oil',    dose: '3g EPA+DHA', timing: 'With dinner',   why: 'Anti-inflammatory · counters smoking CV damage' },
  { name: 'Zinc',                dose: '20 mg',      timing: 'Evening',       why: 'Depleted by smoking · testosterone support' },
  { name: 'Vitamin D3',          dose: '4,000 IU',   timing: 'With dinner',   why: 'South Asian deficiency risk · immunity + T-levels' },
  { name: 'Magnesium Glycinate', dose: '400 mg',     timing: 'Before bed',    why: 'Sleep quality · muscle recovery' },
  { name: 'Creatine',            dose: '5g',         timing: 'Post-workout',  why: 'Proven strength & muscle gains · completely safe' },
  { name: 'Whey Protein',        dose: '30–40g',     timing: 'Post-workout',  why: 'Hit 180g daily protein target for muscle preservation' },
]

const TIMING_COLORS: Record<string, string> = {
  'Morning': 'rgba(245,158,11,0.15)',
  'With dinner': 'rgba(59,130,246,0.12)',
  'Evening': 'rgba(139,92,246,0.12)',
  'Before bed': 'rgba(99,102,241,0.12)',
  'Post-workout': 'rgba(34,197,94,0.12)',
}
const TIMING_TEXT: Record<string, string> = {
  'Morning': '#f59e0b',
  'With dinner': '#60a5fa',
  'Evening': '#c084fc',
  'Before bed': '#818cf8',
  'Post-workout': '#4ade80',
}

export default function Profile() {
  const [profile, setProfile] = useState<Partial<ProfileType>>({})
  const [saved, setSaved] = useState(false)
  const [showSupplements, setShowSupplements] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
      if (data) setProfile(data as ProfileType)
    }
    load()
  }, [])

  async function save() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const age = Number(profile.age ?? 37)
    const weight = Number(profile.weight_kg ?? 100)
    const height = Number(profile.height_cm ?? 180)
    const gender = profile.gender ?? 'male'

    await supabase.from('profiles').upsert({ ...profile, user_id: user.id, updated_at: new Date().toISOString() })

    const bmr = calcBMR(weight, height, age, gender)
    const tdee = calcTDEE(bmr, 1.65)
    const macros = calcMacroTargets(weight, tdee)
    await supabase.from('nutrition_targets').upsert({ user_id: user.id, ...macros })

    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.reload()
  }

  function set(field: keyof ProfileType, value: string | number) {
    setProfile((p) => ({ ...p, [field]: value }))
  }

  const bmr = calcBMR(Number(profile.weight_kg ?? 100), Number(profile.height_cm ?? 180), Number(profile.age ?? 37), profile.gender ?? 'male')
  const tdee = calcTDEE(bmr, 1.65)
  const macros = calcMacroTargets(Number(profile.weight_kg ?? 100), tdee)

  return (
    <div className="px-4 pt-8 pb-page max-w-md mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-white/30 text-xs uppercase tracking-widest mb-1">Account</p>
          <h1 className="text-3xl font-black text-white">{profile.name ?? 'Athlete'}</h1>
          <p className="text-white/40 text-sm mt-0.5">Melbourne, Victoria</p>
        </div>
        <button onClick={signOut}
          className="flex items-center gap-1.5 text-xs text-white/30 hover:text-red-400 transition-colors glass rounded-xl px-3 py-2">
          <LogOut size={13} /> Sign out
        </button>
      </div>

      {/* Stats editor */}
      <div className="glass rounded-3xl p-5 space-y-4">
        <p className="text-sm font-bold text-white">Your Stats</p>

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-xs text-white/40 uppercase tracking-wider">Name</label>
          <input
            value={profile.name ?? ''}
            onChange={(e) => set('name', e.target.value)}
            className="w-full glass-bright rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 placeholder-white/20"
            placeholder="Your name"
          />
        </div>

        {/* Age + Weight */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Age', field: 'age' as const, unit: 'yrs' },
            { label: 'Weight', field: 'weight_kg' as const, unit: 'kg' },
          ].map(({ label, field, unit }) => (
            <div key={field} className="space-y-1.5">
              <label className="text-xs text-white/40 uppercase tracking-wider">{label}</label>
              <div className="relative">
                <input type="number" value={String(profile[field] ?? '')}
                  onChange={(e) => set(field, e.target.value)}
                  className="w-full glass-bright rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 pr-10" />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 text-xs">{unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Height + Gender */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-white/40 uppercase tracking-wider">Height</label>
            <div className="relative">
              <input type="number" value={String(profile.height_cm ?? '')}
                onChange={(e) => set('height_cm', e.target.value)}
                className="w-full glass-bright rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 pr-10" />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 text-xs">cm</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-white/40 uppercase tracking-wider">Gender</label>
            <div className="flex gap-2">
              {(['male', 'female'] as const).map((g) => (
                <button key={g} onClick={() => set('gender', g)}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-semibold capitalize transition-all active:scale-95"
                  style={profile.gender === g
                    ? { background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: 'white', boxShadow: '0 0 12px rgba(249,115,22,0.3)' }
                    : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={save}
          className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 glow-brand-sm transition-all active:scale-95"
          style={{ background: saved ? 'linear-gradient(135deg, #22c55e, #10b981)' : 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
          <Save size={15} /> {saved ? 'Saved ✓' : 'Save & Recalculate'}
        </button>
      </div>

      {/* Calculated targets */}
      <div className="glass rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
            <Target size={12} className="text-white" strokeWidth={2.5} />
          </div>
          <p className="text-sm font-bold text-white">Calculated Targets</p>
        </div>
        {[
          { label: 'TDEE (maintenance)', value: `${tdee.toLocaleString()} kcal` },
          { label: 'Daily food target',  value: `${macros.calories.toLocaleString()} kcal`, highlight: true },
          { label: 'Protein',            value: `${macros.protein_g}g` },
          { label: 'Carbs',              value: `${macros.carbs_g}g` },
          { label: 'Fat',                value: `${macros.fat_g}g` },
        ].map(({ label, value, highlight }) => (
          <div key={label} className="flex justify-between text-sm items-baseline">
            <span className="text-white/40">{label}</span>
            <span className={highlight ? 'font-black gradient-text' : 'text-white font-medium'}>{value}</span>
          </div>
        ))}
        <div className="pt-3 border-t border-white/5">
          <p className="text-xs text-white/25">Goal: 85 kg · Upper/Lower 5-day split · Long femur form cues active</p>
        </div>
      </div>

      {/* Alcohol strategy */}
      <div className="glass rounded-3xl p-5 space-y-3"
        style={{ borderColor: 'rgba(245,158,11,0.15)', background: 'rgba(245,158,11,0.03)' }}>
        <div className="flex items-center gap-2">
          <Wine size={16} className="text-amber-400" />
          <p className="text-sm font-bold text-white">Alcohol Strategy</p>
        </div>
        <div className="space-y-2">
          {[
            { text: 'Max 3 drinks per session', sub: 'spirits + soda water only' },
            { text: 'Rest days only', sub: 'never within 24h of HIIT' },
            { text: '~1,000 kcal/week saved', sub: 'vs your current intake — approx 0.13 kg fat/week' },
          ].map(({ text, sub }) => (
            <div key={text} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">{text}</p>
                <p className="text-xs text-white/35">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Supplement protocol */}
      <div className="glass rounded-3xl overflow-hidden">
        <button
          className="w-full flex items-center justify-between p-5 active:bg-white/5 transition-all"
          onClick={() => setShowSupplements(!showSupplements)}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(168,85,247,0.15)' }}>
              <Pill size={15} className="text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white text-left">Supplement Protocol</p>
              <p className="text-xs text-white/30">8 supplements · smoker-adjusted</p>
            </div>
          </div>
          <ChevronRight size={16} className={`text-white/20 transition-transform ${showSupplements ? 'rotate-90' : ''}`} />
        </button>

        {showSupplements && (
          <div className="px-5 pb-5 space-y-3">
            <div className="h-px bg-white/5 mb-1" />
            {SUPPLEMENTS.map((s) => (
              <div key={s.name} className="flex items-start gap-3 py-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white">{s.name}</p>
                    <span className="text-xs font-bold" style={{ color: '#4ade80' }}>{s.dose}</span>
                  </div>
                  <p className="text-xs text-white/30 mt-0.5">{s.why}</p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-1 rounded-full shrink-0"
                  style={{
                    background: TIMING_COLORS[s.timing] ?? 'rgba(255,255,255,0.06)',
                    color: TIMING_TEXT[s.timing] ?? 'rgba(255,255,255,0.5)',
                  }}>
                  {s.timing}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Smoking note */}
      <div className="glass rounded-3xl p-5 flex items-start gap-3"
        style={{ borderColor: 'rgba(249,115,22,0.15)', background: 'rgba(249,115,22,0.03)' }}>
        <Flame size={18} className="text-orange-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-white">Smoking adaptation</p>
          <p className="text-xs text-white/35 mt-1 leading-relaxed">
            Zone 2 only for weeks 1–4. HIIT unlocks at week 5 when your aerobic base rebuilds.
            Morning gym before the first cigarette — lungs are clearest then.
          </p>
        </div>
      </div>
    </div>
  )
}
