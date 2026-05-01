import { Dumbbell, ExternalLink, Copy, Check } from 'lucide-react'
import { useState } from 'react'

export default function Setup() {
  const [copied, setCopied] = useState(false)

  function copy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const steps = [
    {
      num: '1',
      title: 'Create a free Supabase project',
      desc: 'Go to supabase.com → New project. Free tier is plenty.',
      action: { label: 'Open Supabase', href: 'https://supabase.com/dashboard' },
    },
    {
      num: '2',
      title: 'Run the database migration',
      desc: 'In your Supabase dashboard → SQL Editor, paste and run the contents of fitos/supabase/migrations/001_init.sql',
      action: null,
    },
    {
      num: '3',
      title: 'Copy your project credentials',
      desc: 'Project Settings → API → copy Project URL and anon/public key.',
      action: null,
    },
    {
      num: '4',
      title: 'Create fitos/.env.local',
      desc: 'Paste your credentials into a new file called .env.local in the fitos folder.',
      action: null,
    },
    {
      num: '5',
      title: 'Restart the dev server',
      desc: 'Stop and restart npm run dev — the app will load with your Supabase connection.',
      action: null,
    },
  ]

  const envContent = `VITE_SUPABASE_URL=https://your-project-id.supabase.co\nVITE_SUPABASE_ANON_KEY=your-anon-key-here`

  return (
    <div className="min-h-screen px-5 py-10 max-w-md mx-auto">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
          <Dumbbell size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">FitOS</h1>
          <p className="text-xs text-slate-500">Personal Training OS</p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-bold text-white">One-time setup</h2>
        <p className="text-slate-400 text-sm mt-1">
          Connect your free Supabase database to store your workouts, nutrition, and progress.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-4 mb-8">
        {steps.map((step) => (
          <div key={step.num} className="flex gap-4 p-4 bg-slate-800/60 border border-slate-700/50 rounded-2xl">
            <div className="w-8 h-8 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-sm font-bold text-green-400">{step.num}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{step.title}</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{step.desc}</p>
              {step.action && (
                <a
                  href={step.action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 text-xs text-green-400 hover:text-green-300 font-medium transition-colors"
                >
                  {step.action.label} <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* .env.local template */}
      <div className="space-y-2 mb-8">
        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">fitos/.env.local template</p>
        <div className="relative p-4 bg-slate-900 border border-slate-700 rounded-xl font-mono text-xs text-slate-300 leading-relaxed">
          <pre>{envContent}</pre>
          <button
            onClick={() => copy(envContent)}
            className="absolute top-3 right-3 p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
          </button>
        </div>
      </div>

      {/* What you get */}
      <div className="p-4 bg-green-500/8 border border-green-500/20 rounded-2xl">
        <p className="text-sm font-semibold text-green-400 mb-3">What's waiting for you:</p>
        <ul className="space-y-1.5 text-xs text-slate-300">
          <li>🏋️ 5-day Upper/Lower program — Mon/Wed/Fri/Sat/Sun</li>
          <li>📈 Progressive overload with automatic weight recommendations</li>
          <li>💨 VO₂ max training — Zone 2 + Norwegian 4×4 HIIT</li>
          <li>🥗 Calorie & macro tracking with Pakistani food shortcuts</li>
          <li>📊 Strength, weight, and cardio progress charts</li>
          <li>💊 Supplement protocol personalised for your profile</li>
        </ul>
      </div>
    </div>
  )
}
