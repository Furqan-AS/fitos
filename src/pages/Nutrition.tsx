import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface Food {
  name: string
  per100: { cal: number; protein: number; carbs: number; fat: number }
  serving: { size: string; grams: number }
  note?: string
}

const TARGETS = { cal: 2400, protein: 180, carbs: 195, fat: 65 }

const CATEGORIES: { label: string; color: string; glow: string; bg: string; dot: string; foods: Food[] }[] = [
  {
    label: 'Proteins',
    color: '#22c55e',
    glow: 'rgba(34,197,94,0.15)',
    bg: 'rgba(34,197,94,0.06)',
    dot: '#22c55e',
    foods: [
      {
        name: 'Chicken Breast',
        per100: { cal: 165, protein: 31, carbs: 0, fat: 3.6 },
        serving: { size: '1 large breast', grams: 200 },
        note: 'Grilled or boiled. Best protein-to-calorie ratio.',
      },
      {
        name: 'Tinned Tuna (in water)',
        per100: { cal: 116, protein: 26, carbs: 0, fat: 1 },
        serving: { size: '1 tin drained', grams: 130 },
        note: 'Best gram-for-gram protein source. Keep 4 tins a week.',
      },
      {
        name: 'Eggs (whole)',
        per100: { cal: 155, protein: 13, carbs: 1, fat: 11 },
        serving: { size: '2 large eggs', grams: 120 },
        note: 'Complete amino acid profile. 2 eggs = 15g protein.',
      },
      {
        name: 'Lamb / Mutton (cooked, lean)',
        per100: { cal: 258, protein: 26, carbs: 0, fat: 17 },
        serving: { size: '1 cup karahi portion', grams: 150 },
        note: 'High fat — the oil in cooking adds extra. Limit to 2–3×/week.',
      },
      {
        name: 'Masoor / Red Lentil Daal (cooked)',
        per100: { cal: 116, protein: 9, carbs: 20, fat: 0.4 },
        serving: { size: '1 bowl', grams: 250 },
        note: 'Also counts toward carbs. Great fibre + protein combo.',
      },
      {
        name: 'Greek Yogurt (full fat)',
        per100: { cal: 97, protein: 9, carbs: 4, fat: 5 },
        serving: { size: '1 cup', grams: 200 },
        note: 'Use as raita or snack. 18g protein per cup.',
      },
    ],
  },
  {
    label: 'Carbs',
    color: '#3b82f6',
    glow: 'rgba(59,130,246,0.15)',
    bg: 'rgba(59,130,246,0.06)',
    dot: '#3b82f6',
    foods: [
      {
        name: 'Basmati Rice (boiled)',
        per100: { cal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
        serving: { size: '1 cup cooked', grams: 180 },
        note: 'Daily max ≈ 1–1.5 cups. 1 cup uses 50g of carb budget.',
      },
      {
        name: 'Whole Wheat Roti',
        per100: { cal: 265, protein: 8, carbs: 53, fat: 3 },
        serving: { size: '1 medium roti', grams: 40 },
        note: '1 roti = 21g carbs. Max 2 rotis/day on this plan.',
      },
      {
        name: 'Chapati / Atta Flour (dry)',
        per100: { cal: 340, protein: 12, carbs: 71, fat: 2 },
        serving: { size: '1 roti worth of flour', grams: 30 },
        note: 'Whole wheat > white. Add bran to reduce glycaemic load.',
      },
      {
        name: 'Chickpeas / Chana (cooked)',
        per100: { cal: 164, protein: 9, carbs: 27, fat: 2.6 },
        serving: { size: '1 cup', grams: 200 },
        note: 'High fibre — keeps you full. Also counts as protein.',
      },
      {
        name: 'Oats (dry)',
        per100: { cal: 389, protein: 17, carbs: 66, fat: 7 },
        serving: { size: '½ cup dry', grams: 50 },
        note: 'Best breakfast carb. Slow-digesting, keeps energy stable.',
      },
    ],
  },
  {
    label: 'Fats & Oils',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.15)',
    bg: 'rgba(245,158,11,0.06)',
    dot: '#f59e0b',
    foods: [
      {
        name: 'Olive Oil',
        per100: { cal: 884, protein: 0, carbs: 0, fat: 100 },
        serving: { size: '1 tablespoon', grams: 14 },
        note: '1 tbsp = 120 kcal, 14g fat. Use ½ tbsp per dish to stay under budget.',
      },
      {
        name: 'Ghee / Butter',
        per100: { cal: 900, protein: 0, carbs: 0, fat: 99 },
        serving: { size: '1 teaspoon', grams: 5 },
        note: '1 tsp = 45 kcal. Daal with 1 tsp ghee is fine. No ladlefuls.',
      },
      {
        name: 'Cooking Oil (sunflower / canola)',
        per100: { cal: 884, protein: 0, carbs: 0, fat: 100 },
        serving: { size: '1 tablespoon', grams: 14 },
        note: 'The silent budget killer. Restaurant meals use 3–5 tbsp per dish invisibly.',
      },
    ],
  },
  {
    label: 'Eat Freely',
    color: '#a855f7',
    glow: 'rgba(168,85,247,0.15)',
    bg: 'rgba(168,85,247,0.06)',
    dot: '#a855f7',
    foods: [
      {
        name: 'Broccoli (steamed)',
        per100: { cal: 35, protein: 2.4, carbs: 7, fat: 0.4 },
        serving: { size: 'Large portion', grams: 300 },
        note: 'Only 105 kcal for a massive 300g plate. Eat as much as you want.',
      },
      {
        name: 'Spinach (cooked)',
        per100: { cal: 23, protein: 2.9, carbs: 3.6, fat: 0.3 },
        serving: { size: 'Full saag bowl', grams: 300 },
        note: '69 kcal for 300g. Iron + magnesium + almost free on your budget.',
      },
      {
        name: 'Tomatoes',
        per100: { cal: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
        serving: { size: '2 medium', grams: 250 },
        note: 'Use in curries freely. Lycopene is anti-inflammatory.',
      },
      {
        name: 'Cucumber',
        per100: { cal: 16, protein: 0.7, carbs: 3.6, fat: 0.1 },
        serving: { size: '1 whole', grams: 300 },
        note: 'Almost zero calories. Great volume food for feeling full.',
      },
      {
        name: 'Onions',
        per100: { cal: 40, protein: 1.1, carbs: 9.3, fat: 0.1 },
        serving: { size: '1 medium', grams: 110 },
        note: 'Base of every curry. Negligible impact on macros.',
      },
    ],
  },
]

function macrosForServing(food: Food) {
  const r = food.serving.grams / 100
  return {
    cal: Math.round(food.per100.cal * r),
    protein: Math.round(food.per100.protein * r * 10) / 10,
    carbs: Math.round(food.per100.carbs * r * 10) / 10,
    fat: Math.round(food.per100.fat * r * 10) / 10,
  }
}

function budgetPct(food: Food) {
  const s = macrosForServing(food)
  return {
    cal: Math.round((s.cal / TARGETS.cal) * 100),
    protein: Math.round((s.protein / TARGETS.protein) * 100),
    carbs: Math.round((s.carbs / TARGETS.carbs) * 100),
  }
}

function FoodCard({ food, color, bg }: { food: Food; color: string; bg: string }) {
  const [open, setOpen] = useState(false)
  const s = macrosForServing(food)
  const pct = budgetPct(food)

  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <button className="w-full p-4 text-left flex items-start gap-3 active:bg-white/5 transition-all"
        onClick={() => setOpen(!open)}>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">{food.name}</p>
          <p className="text-xs text-white/35 mt-0.5">{food.serving.size} ({food.serving.grams}g)</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-sm font-black" style={{ color }}>{s.cal} <span className="text-xs font-normal text-white/30">kcal</span></p>
            <p className="text-xs text-white/40">{s.protein}g P</p>
          </div>
          <ChevronDown size={14} className={`text-white/20 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {/* Per 100g table */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Calories', val: `${food.per100.cal}`, unit: 'kcal', c: 'text-white' },
              { label: 'Protein',  val: `${food.per100.protein}g`, unit: '/100g', c: 'text-green-400' },
              { label: 'Carbs',    val: `${food.per100.carbs}g`,   unit: '/100g', c: 'text-blue-400' },
              { label: 'Fat',      val: `${food.per100.fat}g`,     unit: '/100g', c: 'text-amber-400' },
            ].map(({ label, val, c }) => (
              <div key={label} className="rounded-xl p-2.5 text-center"
                style={{ background: bg }}>
                <p className={`text-sm font-black ${c}`}>{val}</p>
                <p className="text-[10px] text-white/30 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Budget impact */}
          <div className="space-y-1.5">
            <p className="text-[10px] text-white/25 uppercase tracking-wider">Daily budget used — per serving</p>
            {[
              { label: 'Calories', pct: pct.cal,     color: 'rgba(255,255,255,0.5)' },
              { label: 'Protein',  pct: pct.protein, color: '#22c55e' },
              { label: 'Carbs',    pct: pct.carbs,   color: '#3b82f6' },
            ].map(({ label, pct: p, color: c }) => (
              p > 0 ? (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-[10px] text-white/30 w-14">{label}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(p, 100)}%`, background: c }} />
                  </div>
                  <span className="text-[10px] font-bold w-8 text-right" style={{ color: c }}>{p}%</span>
                </div>
              ) : null
            ))}
          </div>

          {food.note && (
            <p className="text-xs text-white/40 leading-relaxed border-t border-white/5 pt-3">
              {food.note}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function Nutrition() {
  const [openCat, setOpenCat] = useState<string | null>('Proteins')

  return (
    <div className="px-4 pt-8 pb-page max-w-md mx-auto space-y-4">
      {/* Header */}
      <div className="mb-2">
        <p className="text-white/30 text-xs uppercase tracking-widest mb-1">Reference Guide</p>
        <h1 className="text-3xl font-black text-white">Nutrition</h1>
        <p className="text-white/40 text-sm mt-1">Your macros · 2,400 kcal/day</p>
      </div>

      {/* Daily targets pill row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Calories', val: '2,400', unit: 'kcal', color: 'text-white',        bg: 'rgba(255,255,255,0.05)' },
          { label: 'Protein',  val: '180g',  unit: '',     color: 'text-green-400',    bg: 'rgba(34,197,94,0.08)' },
          { label: 'Carbs',    val: '195g',  unit: '',     color: 'text-blue-400',     bg: 'rgba(59,130,246,0.08)' },
          { label: 'Fat',      val: '65g',   unit: '',     color: 'text-amber-400',    bg: 'rgba(245,158,11,0.08)' },
        ].map(({ label, val, color, bg }) => (
          <div key={label} className="rounded-2xl p-3 text-center" style={{ background: bg, border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className={`text-sm font-black ${color}`}>{val}</p>
            <p className="text-[10px] text-white/30 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Key rules */}
      <div className="glass rounded-3xl p-4 space-y-2">
        <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Daily non-negotiables</p>
        {[
          { icon: '🥩', text: 'Hit 180g protein first — everything else fills in around it' },
          { icon: '🍚', text: 'Max 2 rotis OR 1.5 cups rice per day — not both' },
          { icon: '🫙', text: 'Ask for half oil when ordering or cooking at home' },
          { icon: '🥦', text: 'Load plate with vegetables — they cost almost nothing calorically' },
        ].map(({ icon, text }) => (
          <div key={text} className="flex items-start gap-3">
            <span className="text-base shrink-0 mt-0.5">{icon}</span>
            <p className="text-sm text-white/60 leading-relaxed">{text}</p>
          </div>
        ))}
      </div>

      {/* Food categories */}
      {CATEGORIES.map((cat) => (
        <div key={cat.label} className="glass rounded-3xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-4 active:bg-white/5 transition-all"
            onClick={() => setOpenCat(openCat === cat.label ? null : cat.label)}>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.color, boxShadow: `0 0 8px ${cat.color}` }} />
              <p className="text-sm font-bold text-white">{cat.label}</p>
              <span className="text-xs text-white/25">{cat.foods.length} foods</span>
            </div>
            <ChevronDown size={15} className={`text-white/20 transition-transform duration-200 ${openCat === cat.label ? 'rotate-180' : ''}`} />
          </button>

          {openCat === cat.label && (
            <div className="px-3 pb-3 space-y-2">
              {cat.foods.map((food) => (
                <FoodCard key={food.name} food={food} color={cat.color} bg={cat.bg} />
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Alcohol note */}
      <div className="glass rounded-3xl p-4 space-y-2"
        style={{ borderColor: 'rgba(249,115,22,0.15)', background: 'rgba(249,115,22,0.03)' }}>
        <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Alcohol reminder</p>
        <p className="text-sm text-white/50 leading-relaxed">
          6 cans = <span className="text-white font-semibold">735 kcal</span> — nearly a third of your daily budget.
          Switch to 3 spirits + soda water = <span className="text-white font-semibold">210 kcal</span>.
          That one change saves ~0.13 kg of fat per week.
        </p>
      </div>
    </div>
  )
}
