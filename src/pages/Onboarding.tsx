import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { calcBMR, calcTDEE, calcMacroTargets } from '@/lib/nutrition'
import { supabase } from '@/lib/supabase'
import type { Gender } from '@/types'

export default function Onboarding() {
  const navigate = useNavigate()
  const [name,   setName]   = useState('')
  const [age,    setAge]    = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [gender, setGender] = useState<Gender>('male')
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  async function handleStart() {
    if (!name.trim()) { setError('Enter your name to continue.'); return }
    setSaving(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Auth error — try refreshing.'); setSaving(false); return }

      const ageN    = Number(age)    || 30
      const weightN = Number(weight) || 80
      const heightN = Number(height) || 175

      await supabase.from('profiles').upsert({
        user_id:        user.id,
        name:           name.trim(),
        age:            ageN,
        weight_kg:      weightN,
        height_cm:      heightN,
        gender,
        goal:           'fat_loss',
        activity_level: 1.65,
        updated_at:     new Date().toISOString(),
      })

      const bmr    = calcBMR(weightN, heightN, ageN, gender)
      const tdee   = calcTDEE(bmr, 1.65)
      const macros = calcMacroTargets(weightN, tdee)
      await supabase.from('nutrition_targets').upsert({ user_id: user.id, ...macros })

      localStorage.setItem('fitos_onboarded', '1')
      navigate('/', { replace: true })
    } catch {
      setError('Something went wrong. Try again.')
      setSaving(false)
    }
  }

  return (
    <div style={{
      minHeight: '100svh', display: 'flex', flexDirection: 'column', justifyContent: 'center',
      padding: '48px 28px', maxWidth: 400, margin: '0 auto',
    }}>

      {/* Logo */}
      <div style={{ marginBottom: 44 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16,
          background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28,
        }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#000' }}>F</span>
        </div>
        <h1 style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1.1, marginBottom: 10 }}>
          Create your<br />profile.
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.6 }}>
          Each person who opens this app gets their own profile and training history.
        </p>
      </div>

      {/* Form fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>

        {/* Name */}
        <div>
          <p className="label" style={{ marginBottom: 8 }}>Your name</p>
          <input
            type="text"
            placeholder="e.g. Furqan"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleStart()}
            autoFocus
            style={{
              width: '100%', padding: '15px 18px',
              background: 'var(--surface-hi)', border: '1px solid var(--border-hi)',
              borderRadius: 14, color: 'var(--text)', fontSize: 16, fontWeight: 500, outline: 'none',
            }}
          />
        </div>

        {/* Age + Weight */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {([
            { label: 'Age',    value: age,    setter: setAge,    unit: 'yrs', placeholder: '30' },
            { label: 'Weight', value: weight, setter: setWeight, unit: 'kg',  placeholder: '80' },
          ] as const).map(({ label, value, setter, unit, placeholder }) => (
            <div key={label}>
              <p className="label" style={{ marginBottom: 8 }}>{label}</p>
              <div style={{ position: 'relative' }}>
                <input
                  type="number" inputMode="decimal"
                  placeholder={placeholder}
                  value={value}
                  onChange={e => setter(e.target.value)}
                  style={{
                    width: '100%', padding: '15px 42px 15px 18px', minWidth: 0,
                    background: 'var(--surface-hi)', border: '1px solid var(--border-hi)',
                    borderRadius: 14, color: 'var(--text)', fontSize: 16, fontWeight: 500, outline: 'none',
                  }}
                />
                <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--text-3)', pointerEvents: 'none' }}>{unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Height + Gender */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <p className="label" style={{ marginBottom: 8 }}>Height</p>
            <div style={{ position: 'relative' }}>
              <input
                type="number" inputMode="numeric"
                placeholder="175"
                value={height}
                onChange={e => setHeight(e.target.value)}
                style={{
                  width: '100%', padding: '15px 42px 15px 18px', minWidth: 0,
                  background: 'var(--surface-hi)', border: '1px solid var(--border-hi)',
                  borderRadius: 14, color: 'var(--text)', fontSize: 16, fontWeight: 500, outline: 'none',
                }}
              />
              <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--text-3)', pointerEvents: 'none' }}>cm</span>
            </div>
          </div>
          <div>
            <p className="label" style={{ marginBottom: 8 }}>Gender</p>
            <div style={{ display: 'flex', gap: 8, height: 52 }}>
              {(['male', 'female'] as Gender[]).map(g => (
                <button key={g} onClick={() => setGender(g)}
                  style={{
                    flex: 1, borderRadius: 14, fontSize: 13, fontWeight: 700,
                    textTransform: 'capitalize', cursor: 'pointer', transition: 'all 0.15s',
                    background: gender === g ? 'var(--accent)' : 'var(--surface-hi)',
                    color: gender === g ? '#000' : 'var(--text-2)',
                    border: gender === g ? 'none' : '1px solid var(--border-hi)',
                  }}
                >{g}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p style={{ fontSize: 13, color: 'var(--red)', marginBottom: 14 }}>{error}</p>
      )}

      <button
        onClick={handleStart}
        disabled={saving}
        className="btn-primary"
        style={{
          width: '100%', height: 56, fontSize: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          opacity: saving ? 0.6 : 1,
        }}
      >
        {saving ? 'Saving…' : 'Start my program'}
        {!saving && <ArrowRight size={18} strokeWidth={2.5} />}
      </button>

      <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 20, textAlign: 'center', lineHeight: 1.6 }}>
        You can update everything later in your profile.
      </p>
    </div>
  )
}
