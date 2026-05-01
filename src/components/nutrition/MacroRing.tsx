import ProgressRing from '@/components/ui/ProgressRing'
import type { MacroTotals } from '@/types'

interface MacroRingProps {
  consumed: MacroTotals
  targets: MacroTotals
}

const macros = [
  { key: 'protein_g' as const, label: 'Protein', color: '#22c55e' },
  { key: 'carbs_g' as const, label: 'Carbs', color: '#3b82f6' },
  { key: 'fat_g' as const, label: 'Fat', color: '#f59e0b' },
]

export default function MacroRing({ consumed, targets }: MacroRingProps) {
  const calPct = Math.min((consumed.calories / targets.calories) * 100, 100)

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Main calorie ring */}
      <div className="relative">
        <ProgressRing
          value={consumed.calories}
          max={targets.calories}
          size={160}
          strokeWidth={14}
          color={calPct > 100 ? '#ef4444' : '#22c55e'}
        >
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{consumed.calories.toLocaleString()}</p>
            <p className="text-xs text-slate-400">of {targets.calories.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-0.5">kcal</p>
          </div>
        </ProgressRing>
      </div>

      {/* Macro bars */}
      <div className="w-full grid grid-cols-3 gap-4">
        {macros.map(({ key, label, color }) => {
          const val = consumed[key]
          const target = targets[key]
          const pct = Math.min((val / target) * 100, 100)
          return (
            <div key={key} className="flex flex-col items-center gap-2">
              <ProgressRing value={val} max={target} size={64} strokeWidth={6} color={color}>
                <span className="text-xs font-bold text-white">{val}g</span>
              </ProgressRing>
              <div className="text-center">
                <p className="text-xs font-semibold" style={{ color }}>{label}</p>
                <p className="text-xs text-slate-500">{Math.round(pct)}%</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Remaining */}
      <div className="flex items-center gap-1 text-sm text-slate-400">
        <span className="text-white font-semibold">{Math.max(0, targets.calories - consumed.calories)}</span>
        <span>kcal remaining</span>
      </div>
    </div>
  )
}
