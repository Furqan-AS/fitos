import { useEffect, useState } from 'react'
import { Save, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { calcBMR, calcTDEE, calcMacroTargets } from '@/lib/nutrition'
import type { Profile as ProfileType } from '@/types'

const SUPPLEMENTS = [
  { name: 'Vitamin C',           dose: '1,000 mg', timing: 'Morning'      },
  { name: 'NAC',                 dose: '600 mg',   timing: 'Morning'      },
  { name: 'Creatine',            dose: '5g',       timing: 'Post-workout' },
  { name: 'Whey Protein',        dose: '30–40g',   timing: 'Post-workout' },
  { name: 'Omega-3 Fish Oil',    dose: '3g EPA+DHA', timing: 'With dinner'  },
  { name: 'Vitamin D3',          dose: '4,000 IU', timing: 'With dinner'  },
  { name: 'Zinc',                dose: '20 mg',    timing: 'Evening'      },
  { name: 'Magnesium Glycinate', dose: '400 mg',   timing: 'Before bed'   },
]

function InputField({ label, value, unit, onChange, type = 'text' }: {
  label: string; value: string; unit?: string; onChange: (v: string) => void; type?: string
}) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>{label}</p>
      <div style={{ position: 'relative' }}>
        <input
          type={type} value={value} onChange={e => onChange(e.target.value)}
          style={{ width: '100%', background: 'var(--surface-hi)', border: '1px solid var(--border-hi)', borderRadius: 14, padding: unit ? '14px 44px 14px 16px' : '14px 16px', color: 'var(--text)', fontSize: 16, fontWeight: 500, outline: 'none' }}
        />
        {unit && <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text-2)' }}>{unit}</span>}
      </div>
    </div>
  )
}

export default function Profile() {
  const [profile, setProfile]     = useState<Partial<ProfileType>>({})
  const [saved, setSaved]         = useState(false)
  const [showSupps, setShowSupps] = useState(false)

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
    const age = Number(profile.age ?? 37), weight = Number(profile.weight_kg ?? 100), height = Number(profile.height_cm ?? 180), gender = profile.gender ?? 'male'
    await supabase.from('profiles').upsert({ ...profile, user_id: user.id, updated_at: new Date().toISOString() })
    const bmr = calcBMR(weight, height, age, gender), tdee = calcTDEE(bmr, 1.65), macros = calcMacroTargets(weight, tdee)
    await supabase.from('nutrition_targets').upsert({ user_id: user.id, ...macros })
    setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  function set(field: keyof ProfileType, v: string | number) { setProfile(p => ({ ...p, [field]: v })) }

  const age = Number(profile.age ?? 37), weight = Number(profile.weight_kg ?? 100), height = Number(profile.height_cm ?? 180), gender = profile.gender ?? 'male'
  const bmr = calcBMR(weight, height, age, gender), tdee = calcTDEE(bmr, 1.65), macros = calcMacroTargets(weight, tdee)

  return (
    <div style={{ padding: '52px 20px 0', maxWidth: 448, margin: '0 auto' }} className="pb-page">

      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <p className="label" style={{ marginBottom: 8 }}>Account</p>
        <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 4 }}>{profile.name ?? 'Athlete'}</h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)' }}>Fat loss phase · Upper/Lower split</p>
      </div>

      {/* Stats editor */}
      <div style={{ marginBottom: 36 }}>
        <p className="label" style={{ marginBottom: 20 }}>Your stats</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <InputField label="Name" value={profile.name ?? ''} onChange={v => set('name', v)} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <InputField label="Age"    value={String(profile.age    ?? '')} unit="yrs" type="number" onChange={v => set('age', v)} />
            <InputField label="Weight" value={String(profile.weight_kg ?? '')} unit="kg" type="number" onChange={v => set('weight_kg', v)} />
          </div>
          <InputField label="Goal weight" value={String(profile.goal_weight_kg ?? '')} unit="kg" type="number" onChange={v => set('goal_weight_kg', v)} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <InputField label="Height" value={String(profile.height_cm ?? '')} unit="cm" type="number" onChange={v => set('height_cm', v)} />
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>Gender</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['male', 'female'] as const).map(g => (
                  <button
                    key={g} onClick={() => set('gender', g)}
                    style={{ flex: 1, padding: '14px 8px', borderRadius: 14, fontSize: 14, fontWeight: 600, textTransform: 'capitalize', cursor: 'pointer',
                      background: gender === g ? 'var(--accent)' : 'var(--surface-hi)',
                      color: gender === g ? '#000' : 'var(--text-2)',
                      border: gender === g ? 'none' : '1px solid var(--border-hi)',
                      transition: 'all 0.15s',
                    }}
                  >{g}</button>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={save}
            className="btn-primary"
            style={{
              width: '100%', height: 52, fontSize: 15, marginTop: 4,
              background: saved ? 'var(--green)' : 'var(--accent)',
              transition: 'background 0.3s',
            }}
          >
            <Save size={15} strokeWidth={2.5} />
            {saved ? 'Saved ✓' : 'Save & recalculate'}
          </button>
        </div>
      </div>

      {/* Calculated targets */}
      <div style={{ marginBottom: 36 }}>
        <p className="label" style={{ marginBottom: 16 }}>Calculated targets</p>
        <div className="card" style={{ padding: '4px 0', overflow: 'hidden' }}>
          {[
            { label: 'TDEE (maintenance)', value: `${tdee.toLocaleString()} kcal`, muted: true },
            { label: 'Daily food target',  value: `${macros.calories.toLocaleString()} kcal`, accent: true },
            { label: 'Protein',            value: `${macros.protein_g}g` },
            { label: 'Carbs',              value: `${macros.carbs_g}g` },
            { label: 'Fat',                value: `${macros.fat_g}g` },
          ].map(({ label, value, muted, accent }, i, arr) => (
            <div
              key={label}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 20px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <span style={{ fontSize: 14, color: 'var(--text-2)' }}>{label}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: accent ? 'var(--accent)' : muted ? 'var(--text-3)' : 'var(--text)' }}>{value}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 10 }}>Goal {profile.goal_weight_kg ?? 85} kg · Long femur form cues active</p>
      </div>

      {/* Supplement protocol */}
      <div style={{ marginBottom: 36 }}>
        <button
          onClick={() => setShowSupps(!showSupps)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 16 }}
        >
          <p className="label">Supplement protocol</p>
          <ChevronDown size={14} color="var(--text-3)" style={{ transform: showSupps ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {showSupps && (
          <div className="card" style={{ padding: '4px 0', overflow: 'hidden' }}>
            {SUPPLEMENTS.map((s, i) => (
              <div
                key={s.name}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px', borderBottom: i < SUPPLEMENTS.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{s.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{s.timing}</p>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>{s.dose}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Smoking note */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.65 }}>
          Zone 2 only for weeks 1–4. HIIT unlocks at week 5. Morning gym before first cigarette — lungs are clearest then.
        </p>
      </div>

    </div>
  )
}
