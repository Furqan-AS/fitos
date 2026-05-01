import { useState } from 'react'
import { ChevronRight, Dumbbell, Check } from 'lucide-react'
import { calcBMR, calcTDEE, calcMacroTargets } from '@/lib/nutrition'
import { supabase } from '@/lib/supabase'
import type { Gender } from '@/types'

interface FormData {
  name: string
  age: string
  gender: Gender
  weight_kg: string
  height_cm: string
}

export default function Onboarding() {
  const [form, setForm] = useState<FormData>({ name: '', age: '37', gender: 'male', weight_kg: '100', height_cm: '180' })
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)

  function set(field: keyof FormData, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleFinish() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const age = Number(form.age), weight = Number(form.weight_kg), height = Number(form.height_cm)
    const bmr = calcBMR(weight, height, age, form.gender)
    const tdee = calcTDEE(bmr, 1.65)
    const macros = calcMacroTargets(weight, tdee)

    await supabase.from('profiles').upsert({ user_id: user.id, name: form.name, age, gender: form.gender, weight_kg: weight, height_cm: height, goal: 'fat_loss', activity_level: 1.65 })
    await supabase.from('nutrition_targets').upsert({ user_id: user.id, calories: macros.calories, protein_g: macros.protein_g, carbs_g: macros.carbs_g, fat_g: macros.fat_g })

    setLoading(false)
    window.location.href = '/'
  }

  const age = Number(form.age), weight = Number(form.weight_kg), height = Number(form.height_cm)
  const bmr = calcBMR(weight, height, age, form.gender)
  const tdee = calcTDEE(bmr, 1.65)
  const macros = calcMacroTargets(weight, tdee)

  return (
    <div className="min-h-screen flex flex-col px-5 py-10 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
          <Dumbbell size={18} className="text-white" strokeWidth={2.5} />
        </div>
        <span className="text-lg font-black gradient-text">FitOS</span>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2].map(s => (
          <div key={s} className="h-1 flex-1 rounded-full transition-all duration-500"
            style={{ background: s <= step ? 'linear-gradient(90deg, #f59e0b, #f97316)' : 'rgba(255,255,255,0.08)' }} />
        ))}
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-5 flex-1">
          <div>
            <h1 className="text-2xl font-black text-white">Your profile</h1>
            <p className="text-white/40 text-sm mt-1">Pre-filled based on what you told me.</p>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Name</label>
            <input
              placeholder="e.g. Furqan"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className="w-full glass-bright rounded-2xl px-4 py-3.5 text-white placeholder-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          {/* Age + Gender */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Age</label>
              <div className="relative">
                <input type="number" value={form.age} onChange={e => set('age', e.target.value)}
                  className="w-full glass-bright rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 pr-12" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-xs">yrs</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Gender</label>
              <div className="flex gap-2">
                {(['male', 'female'] as Gender[]).map(g => (
                  <button key={g} onClick={() => set('gender', g)}
                    className="flex-1 py-3.5 rounded-2xl text-sm font-semibold capitalize transition-all active:scale-95"
                    style={form.gender === g
                      ? { background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: 'white', boxShadow: '0 0 12px rgba(249,115,22,0.3)' }
                      : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Weight + Height */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Weight', field: 'weight_kg' as const, unit: 'kg' },
              { label: 'Height', field: 'height_cm' as const, unit: 'cm' },
            ].map(({ label, field, unit }) => (
              <div key={field} className="space-y-1.5">
                <label className="text-xs font-medium text-white/40 uppercase tracking-wider">{label}</label>
                <div className="relative">
                  <input type="number" value={form[field]} onChange={e => set(field, e.target.value)}
                    className="w-full glass-bright rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 pr-12" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-xs">{unit}</span>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => setStep(2)}
            className="mt-auto w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 glow-brand-sm transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
            Continue <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5 flex-1">
          <div>
            <h1 className="text-2xl font-black text-white">Your daily targets</h1>
            <p className="text-white/40 text-sm mt-1">Calculated for fat loss + muscle preservation.</p>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Daily calories', value: `${macros.calories.toLocaleString()} kcal`, sub: `TDEE ${tdee.toLocaleString()} − 810 kcal deficit`, highlight: true },
              { label: 'Protein', value: `${macros.protein_g}g`, sub: '1.8g × bodyweight — muscle preservation' },
              { label: 'Carbohydrates', value: `${macros.carbs_g}g`, sub: 'Performance & training fuel' },
              { label: 'Fat', value: `${macros.fat_g}g`, sub: '~25% of calories' },
            ].map(({ label, value, sub, highlight }) => (
              <div key={label} className={`p-4 rounded-2xl flex items-center justify-between ${highlight ? 'glass-bright' : 'glass'}`}>
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs text-white/30 mt-0.5">{sub}</p>
                </div>
                <span className={`text-base font-black ${highlight ? 'gradient-text' : 'text-white'}`}>{value}</span>
              </div>
            ))}
          </div>

          <div className="glass rounded-2xl p-4"
            style={{ borderColor: 'rgba(249,115,22,0.2)', background: 'rgba(249,115,22,0.05)' }}>
            <p className="text-xs text-amber-300/80 leading-relaxed">
              <span className="font-bold text-amber-300">Goal: 85 kg · Aesthetic physique</span> — ~24 weeks at 0.6 kg/week.
              Mon/Wed/Fri/Sat lifting · Sun VO₂ max · Daily walks.
            </p>
          </div>

          <div className="flex gap-3 mt-auto">
            <button onClick={() => setStep(1)}
              className="flex-1 py-4 rounded-2xl font-semibold text-white/60 glass transition-all active:scale-95 text-sm">
              Back
            </button>
            <button onClick={handleFinish} disabled={loading}
              className="flex-2 flex-1 py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 glow-brand-sm transition-all active:scale-95 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
              {loading ? 'Saving…' : <><Check size={16} strokeWidth={3} /> Let's go</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
