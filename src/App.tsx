import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import BottomNav from '@/components/ui/BottomNav'
import Dashboard from '@/pages/Dashboard'
import Workout from '@/pages/Workout'
import Cardio from '@/pages/Cardio'
import Nutrition from '@/pages/Nutrition'
import Progress from '@/pages/Progress'
import Profile from '@/pages/Profile'
import Setup from '@/pages/Setup'
import Onboarding from '@/pages/Onboarding'

function Spinner() {
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

function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [ready, setReady] = useState(false)
  const needsOnboarding = ready && !!session && !localStorage.getItem('fitos_onboarded')

  useEffect(() => {
    if (!isSupabaseConfigured) { setSession(null); setReady(true); return }

    async function initAuth() {
      // Try to restore existing session first
      const { data: { session: existing } } = await supabase.auth.getSession()

      if (existing) {
        setSession(existing)
        setReady(true)
        return
      }

      // No session — sign in anonymously so the app works without any login screen.
      // The anonymous session is persisted in localStorage and lasts until cleared.
      const { data, error } = await supabase.auth.signInAnonymously()
      if (error) {
        console.error('Anonymous sign-in failed:', error.message)
        // Fallback: app still renders, just without a user
        setSession(null)
      } else {
        setSession(data.session)
      }
      setReady(true)
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => subscription.unsubscribe()
  }, [])


  if (!isSupabaseConfigured) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Setup />} />
        </Routes>
      </BrowserRouter>
    )
  }

  if (!ready) return <Spinner />

  if (needsOnboarding) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Onboarding />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"           element={<><Dashboard /><BottomNav /></>} />
        <Route path="/workout"    element={<><Workout /><BottomNav /></>} />
        <Route path="/cardio"     element={<><Cardio /><BottomNav /></>} />
        <Route path="/nutrition"  element={<><Nutrition /><BottomNav /></>} />
        <Route path="/progress"   element={<><Progress /><BottomNav /></>} />
        <Route path="/profile"    element={<><Profile /><BottomNav /></>} />
        <Route path="*"           element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
