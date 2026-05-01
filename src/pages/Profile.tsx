import { useEffect, useState } from 'react'
import { Save, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { calcBMR, calcTDEE, calcMacroTargets } from '@/lib/nutrition'
import type { Profile as ProfileType } from '@/types'

const SUPPLEMENTS = [
  { name: 'Vitamin C',           dose: '1,000 mg',   timing: 'Morning',      color: '#f59e0b' },
  { name: 'NAC',                 dose: '600 mg',     timing: 'Morning',      color: '#f59e0b' },
  { name: 'Creatine',            dose: '5g',         timing: 'Post-workout', color: '#22c55e' },
  { name: 'Whey Protein',        dose: '30–40g',     timing: 'Post-workout', color: '#22c55e' },
  { name: 'Omega-3 Fish Oil',    dose: '3g EPA+DHA', timing: 'With dinner',  color: '#3b82f6' },
  { name: 'Vitamin D3',          dose: '4,000 IU',   timing: 'With dinner',  color: '#3b82f6' },
  { name: 'Zinc',                dose: '20 mg',      timing: 'Evening',      color: '#a855f7' },
  { name: 'Magnesium Glycinate', dose: '400 mg',     timing: 'Before bed',   color: '#6366f1' },
]

function Field({
  label, value, unit, onChange, type = 'text',
}: {
  label: string; value: string; unit?: string; onChange: (v: string) => void; type?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold uppercase tracking-widest text-white/25">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 placeholder-white/20"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        />
        {unit && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-xs font-medium">{unit}</span>
        )}
      </div>
    </div>
  )
}

export default function Profile() {
  const [profile, setProfile]           = useState<Partial<ProfileType>>({})
  const [saved, setSaved]               = useState(false)
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
    const age    = Number(profile.age    ?? 37)
    const weight = Number(profile.weight_kg ?? 100)
    const height = Number(profile.height_cm ?? 180)
    const gender = profile.gender ?? 'male'

    await supabase.from('profiles').upsert({ ...profile, user_id: user.id, updated_at: new Date().toISOString() })

    const bmr    = calcBMR(weight, height, age, gender)
    const tdee   = calcTDEE(bmr, 1.65)
    const macros = calcMacroTargets(weight, tdee)
    await supabase.from('nutrition_targets').upsert({ user_id: user.id, ...macros })

    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function set(field: keyof ProfileType, value: string | number) {
    setProfile((p) => ({ ...p, [field]: value }))
  }

  const age    = Number(profile.age    ?? 37)
  const weight = Number(profile.weight_kg ?? 100)
  const height = Number(profile.height_cm ?? 180)
  const gender = profile.gender ?? 'male'
  const bmr    = calcBMR(weight, height, age, gender)
  const tdee   = calcTDEE(bmr, 1.65)
  const macros = calcMacroTargets(weight, tdee)

  return (
    <div className="px-5 pt-12 pb-page max-w-md mx-auto space-y-8">

      {/* Header */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/25">Account</p>
        <h1 className="text-4xl font-black text-white tracking-tight mt-2">{profile.name ?? 'Furqan'}</h1>
        <p className="text-sm text-white/30 mt-1">Melbourne, Victoria · Fat loss phase</p>
      </div>

      {/* Stats editor */}
      <div className="space-y-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/25">Your stats</p>
        <Field
          label="Name" value={profile.name ?? ''}
          onChange={(v) => set('name', v)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Age"    value={String(profile.age    ?? '')} unit="yrs" type="number" onChange={(v) => set('age', v)} />
          <Field label="Weight" value={String(profile.weight_kg ?? '')} unit="kg"  type="number" onChange={(v) => set('weight_kg', v)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Height" value={String(profile.height_cm ?? '')} unit="cm" type="number" onChange={(v) => set('height_cm', v)} />
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-white/25">Gender</label>
            <div className="flex gap-2">
              {(['male', 'female'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => set('gender', g)}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-semibold capitalize transition-all active:scale-95"
                  style={
                    gender === g
                      ? { background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: 'white' }
                      : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }
                  }
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={save}
          className="w-full py-4 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
          style={{ background: saved ? 'linear-gradient(135deg, #22c55e, #10b981)' : 'linear-gradient(135deg, #f59e0b, #f97316)' }}
        >
          <Save size={15} />
          {saved ? 'Saved ✓' : 'Save & recalculate'}
        </button>
      </div>

      {/* Calculated targets */}
      <div className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/25">Calculated targets</p>
        <div
          className="rounded-[20px] p-5 space-y-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {[
            { label: 'TDEE (maintenance)', value: `${tdee.toLocaleString()} kcal`, muted: true },
            { label: 'Daily food target',  value: `${macros.calories.toLocaleString()} kcal`, highlight: true },
            { label: 'Protein',            value: `${macros.protein_g}g` },
            { label: 'Carbs',              value: `${macros.carbs_g}g` },
            { label: 'Fat',                value: `${macros.fat_g}g` },
          ].map(({ label, value, highlight, muted }) => (
            <div key={label} className="flex justify-between items-baseline">
              <span className="text-sm text-white/40">{label}</span>
              <span className={`font-bold text-sm ${highlight ? 'text-amber-400' : muted ? 'text-white/30' : 'text-white'}`}>
                {value}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-white/20 px-1">Goal: 85 kg · Long femur form cues active · Smoker-adjusted cardio progression</p>
      </div>

      {/* Supplement protocol — collapsed by default */}
      <div className="space-y-3">
        <button
          className="w-full flex items-center justify-between transition-all"
          onClick={() => setShowSupplements(!showSupplements)}
        >
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/25">Supplement protocol</p>
          <ChevronDown
            size={14}
            className={`text-white/25 transition-transform duration-200 ${showSupplements ? 'rotate-180' : ''}`}
          />
        </button>

        {showSupplements && (
          <div
            className="rounded-[20px] overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {SUPPLEMENTS.map((s, i) => (
              <div
                key={s.name}
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: i < SUPPLEMENTS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
              >
                <div>
                  <p className="text-sm font-semibold text-white">{s.name}</p>
                  <p className="text-xs text-white/30 mt-0.5">{s.timing}</p>
                </div>
                <span className="text-sm font-black tabular-nums" style={{ color: s.color }}>
                  {s.dose}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Smoking note */}
      <div
        className="rounded-[20px] p-4"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <p className="text-xs text-white/25 leading-relaxed">
          Zone 2 only for weeks 1–4. HIIT unlocks at week 5. Morning gym before first cigarette — lungs are clearest then.
        </p>
      </div>

    </div>
  )
}
