import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import BottomNav from '@/components/ui/BottomNav'
import Auth from '@/pages/Auth'
import Onboarding from '@/pages/Onboarding'
import Dashboard from '@/pages/Dashboard'
import Workout from '@/pages/Workout'
import Cardio from '@/pages/Cardio'
import Nutrition from '@/pages/Nutrition'
import Progress from '@/pages/Progress'
import Profile from '@/pages/Profile'
import Setup from '@/pages/Setup'

function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) { setSession(null); return }
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) { setHasProfile(null); return }
    supabase.from('profiles').select('id').eq('user_id', session.user.id).maybeSingle()
      .then(({ data }) => setHasProfile(!!data))
  }, [session])

  // Show setup guide when Supabase isn't connected yet
  if (!isSupabaseConfigured) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Setup />} />
        </Routes>
      </BrowserRouter>
    )
  }

  const previewBypass = import.meta.env.VITE_PREVIEW_BYPASS === 'true'

  if (!previewBypass && (session === undefined || (session && hasProfile === null))) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
            <span className="text-2xl font-black text-white">F</span>
          </div>
          <p className="text-white/30 text-sm">Loading FitOS…</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {!previewBypass && !session ? (
          <Route path="*" element={<Auth />} />
        ) : !previewBypass && hasProfile === false ? (
          <>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="*" element={<Navigate to="/onboarding" replace />} />
          </>
        ) : (
          <>
            <Route path="/"           element={<><Dashboard /><BottomNav /></>} />
            <Route path="/workout"    element={<><Workout /><BottomNav /></>} />
            <Route path="/cardio"     element={<><Cardio /><BottomNav /></>} />
            <Route path="/nutrition"  element={<><Nutrition /><BottomNav /></>} />
            <Route path="/progress"   element={<><Progress /><BottomNav /></>} />
            <Route path="/profile"    element={<><Profile /><BottomNav /></>} />
            <Route path="*"           element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  )
}

export default App
