import { useState } from 'react'
import { Mail, Loader2, CheckCircle, Dumbbell, Zap, TrendingUp, Scale } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    if (err) setError(err.message)
    else setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-6 max-w-sm mx-auto">
        <div className="w-24 h-24 rounded-full flex items-center justify-center animate-pulse-glow"
          style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.18) 0%, rgba(249,115,22,0.04) 70%)', border: '1px solid rgba(249,115,22,0.2)' }}>
          <CheckCircle size={44} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Check your inbox</h1>
          <p className="text-white/50 mt-2 text-sm leading-relaxed">
            Magic link sent to<br /><span className="text-amber-400 font-medium">{email}</span>
          </p>
        </div>
        <button onClick={() => setSent(false)} className="text-sm text-white/30 hover:text-white/60 transition-colors">
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col justify-between px-6 py-12 max-w-sm mx-auto">
      <div className="flex-1 flex flex-col items-center justify-center gap-8 pt-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center animate-float glow-brand"
            style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' }}>
            <Dumbbell size={36} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-black tracking-tight gradient-text">FitOS</h1>
            <p className="text-white/40 text-sm mt-1">Your personal training OS</p>
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex flex-col gap-3 w-full">
          {[
            { icon: <Dumbbell size={14} />, text: '5-day Upper/Lower — exercises tuned to your long-femur anatomy' },
            { icon: <TrendingUp size={14} />, text: 'Auto progressive overload — the app increases weight every session' },
            { icon: <Zap size={14} />, text: 'Norwegian 4×4 VO₂ max training unlocks at week 5' },
            { icon: <Scale size={14} />, text: '100 → 85 kg in 24 weeks — calorie & macro tracking included' },
          ].map(({ icon, text }) => (
            <div key={text} className="glass flex items-center gap-3 px-4 py-3 rounded-xl">
              <span className="text-amber-400 shrink-0">{icon}</span>
              <span className="text-sm text-white/70">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sign in form */}
      <div className="space-y-4 pt-8">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Email address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full glass-bright rounded-2xl px-4 py-4 text-white placeholder-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={loading || !email}
            className="w-full py-4 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40 glow-brand-sm"
            style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' }}
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : <><Mail size={16} /> Send magic link</>}
          </button>
        </form>
        <p className="text-center text-xs text-white/20">One-time sign in. No password ever. Session stays active.</p>
      </div>
    </div>
  )
}
