import { useState } from 'react'

interface Food {
  name: string
  serving: string
  grams: number
  cal: number
  protein: number
  carbs: number
  fat: number
  note: string
}

interface Category {
  id: string
  label: string
  accent: string
  foods: Food[]
}

const CATEGORIES: Category[] = [
  {
    id: 'protein',
    label: 'Protein',
    accent: '#22c55e',
    foods: [
      { name: 'Chicken Breast', serving: '1 large breast', grams: 200, cal: 330, protein: 62, carbs: 0, fat: 7, note: 'Grilled or boiled. Best protein-to-calorie ratio in your budget.' },
      { name: 'Tuna (tin, drained)', serving: '1 tin', grams: 130, cal: 151, protein: 34, carbs: 0, fat: 1, note: 'Best gram-for-gram protein source. Keep 4 tins a week.' },
      { name: 'Eggs', serving: '2 whole', grams: 120, cal: 186, protein: 16, carbs: 1, fat: 13, note: 'Complete amino acid profile. Add a third if still hungry.' },
      { name: 'Lamb / Mutton (karahi)', serving: '1 cup', grams: 150, cal: 387, protein: 39, carbs: 0, fat: 26, note: 'High fat from cooking oil adds extra. Limit to 2–3×/week.' },
      { name: 'Daal Masoor (cooked)', serving: '1 bowl', grams: 250, cal: 290, protein: 23, carbs: 50, fat: 1, note: 'Great fibre + protein. Counts toward carbs too.' },
      { name: 'Greek Yogurt (full fat)', serving: '1 cup', grams: 200, cal: 194, protein: 18, carbs: 8, fat: 10, note: 'Use as raita. 18g protein per cup.' },
      { name: 'Whey Protein (1 scoop)', serving: '1 scoop', grams: 35, cal: 130, protein: 25, carbs: 5, fat: 2, note: 'Post-workout. Fastest way to hit 180g daily protein.' },
    ],
  },
  {
    id: 'carbs',
    label: 'Carbs',
    accent: '#3b82f6',
    foods: [
      { name: 'Basmati Rice (cooked)', serving: '1 cup', grams: 180, cal: 234, protein: 5, carbs: 50, fat: 1, note: 'Daily max ≈ 1–1.5 cups. 1 cup uses a quarter of your carb budget.' },
      { name: 'Whole Wheat Roti', serving: '1 medium', grams: 40, cal: 106, protein: 3, carbs: 21, fat: 1, note: 'Max 2 rotis/day. Not both roti AND rice.' },
      { name: 'Oats (dry)', serving: '½ cup', grams: 50, cal: 195, protein: 9, carbs: 33, fat: 4, note: 'Slow-digesting. Best pre-gym carb if you eat before training.' },
      { name: 'Chickpeas / Chana (cooked)', serving: '1 cup', grams: 200, cal: 328, protein: 18, carbs: 54, fat: 5, note: 'High fibre — keeps you full. Counts as protein too.' },
      { name: 'Sweet Potato (baked)', serving: '1 medium', grams: 150, cal: 129, protein: 3, carbs: 30, fat: 0, note: 'Cleaner carb than white rice. Great with karahi.' },
    ],
  },
  {
    id: 'fats',
    label: 'Fats',
    accent: '#f59e0b',
    foods: [
      { name: 'Olive Oil', serving: '1 tablespoon', grams: 14, cal: 124, protein: 0, carbs: 0, fat: 14, note: 'Use ½ tbsp per dish. 1 tbsp = 124 kcal — adds up fast.' },
      { name: 'Ghee / Butter', serving: '1 teaspoon', grams: 5, cal: 45, protein: 0, carbs: 0, fat: 5, note: 'Daal with 1 tsp ghee is fine. No ladlefuls.' },
      { name: 'Cooking Oil (any)', serving: '1 tablespoon', grams: 14, cal: 124, protein: 0, carbs: 0, fat: 14, note: 'The silent budget killer. Restaurant meals use 3–5 tbsp invisibly.' },
      { name: 'Almonds', serving: '1 small handful', grams: 28, cal: 164, protein: 6, carbs: 6, fat: 14, note: 'Good snack. Don\'t eat by the bag — 164 kcal for 28g.' },
    ],
  },
  {
    id: 'free',
    label: 'Eat free',
    accent: '#a855f7',
    foods: [
      { name: 'Broccoli (steamed)', serving: 'Large plate', grams: 300, cal: 105, protein: 7, carbs: 21, fat: 1, note: 'Only 105 kcal for a massive plate. Eat as much as you want.' },
      { name: 'Spinach / Saag (cooked)', serving: 'Full bowl', grams: 300, cal: 69, protein: 9, carbs: 11, fat: 1, note: '69 kcal for 300g. Iron + magnesium + basically free.' },
      { name: 'Salad (mixed greens)', serving: 'Large bowl', grams: 200, cal: 34, protein: 3, carbs: 6, fat: 0, note: 'Zero impact on your calorie budget. Fill half the plate.' },
      { name: 'Tomatoes', serving: '2 medium', grams: 250, cal: 45, protein: 2, carbs: 10, fat: 0, note: 'Use in curries freely. Lycopene is anti-inflammatory.' },
      { name: 'Cucumber', serving: '1 whole', grams: 300, cal: 48, protein: 2, carbs: 11, fat: 0, note: 'Almost zero. Great volume food.' },
      { name: 'Raita (plain yogurt)', serving: '½ cup', grams: 120, cal: 72, protein: 5, carbs: 5, fat: 4, note: 'Have with every desi meal. Protein + probiotics.' },
    ],
  },
]

export default function Nutrition() {
  const [activeId, setActiveId] = useState('protein')
  const [expandedFood, setExpandedFood] = useState<string | null>(null)

  const category = CATEGORIES.find((c) => c.id === activeId)!

  return (
    <div className="pb-page max-w-md mx-auto">

      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/25">Reference</p>
        <h1 className="text-4xl font-black text-white tracking-tight mt-2">Eat</h1>
        <p className="text-sm text-white/35 mt-1">2,400 kcal · 180g protein · your daily targets</p>
      </div>

      {/* Daily rules — always visible, always relevant */}
      <div className="px-5 mb-6">
        <div className="rounded-[20px] p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { rule: 'Protein first.', detail: 'Hit 180g before worrying about anything else.' },
            { rule: 'Max 2 rotis or 1.5 cups rice.', detail: 'Not both in the same day.' },
            { rule: 'Half oil.', detail: 'Ask for it. Restaurant dishes use 3–5 tbsp invisibly.' },
            { rule: 'Pile the vegetables.', detail: 'They cost almost nothing calorically.' },
          ].map(({ rule, detail }) => (
            <div key={rule} className="flex items-start gap-3">
              <div className="w-1 h-1 rounded-full bg-amber-500 mt-2 shrink-0" />
              <p className="text-sm text-white/55 leading-relaxed">
                <span className="text-white font-semibold">{rule}</span>{' '}{detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Category tabs */}
      <div className="px-5 mb-4">
        <div className="flex gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setActiveId(cat.id); setExpandedFood(null) }}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
              style={{
                background: activeId === cat.id ? cat.accent : 'rgba(255,255,255,0.04)',
                color: activeId === cat.id ? 'white' : 'rgba(255,255,255,0.35)',
                border: activeId === cat.id ? 'none' : '1px solid rgba(255,255,255,0.07)',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Food list — macros always visible */}
      <div className="px-5 space-y-2">
        {category.foods.map((food) => {
          const isOpen = expandedFood === food.name
          return (
            <button
              key={food.name}
              onClick={() => setExpandedFood(isOpen ? null : food.name)}
              className="w-full text-left rounded-[18px] overflow-hidden transition-all active:scale-[0.99]"
              style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${isOpen ? `${category.accent}30` : 'rgba(255,255,255,0.06)'}` }}
            >
              {/* Always visible row */}
              <div className="px-4 py-3.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white leading-snug">{food.name}</p>
                  <p className="text-xs text-white/30 mt-0.5">{food.serving} · {food.grams}g</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-black text-white tabular-nums">{food.cal}</p>
                    <p className="text-[10px] text-white/25">kcal</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black tabular-nums" style={{ color: category.accent }}>{food.protein}g</p>
                    <p className="text-[10px] text-white/25">protein</p>
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              {isOpen && (
                <div className="px-4 pb-4 pt-0 space-y-3 border-t border-white/5">
                  {/* Macro grid */}
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {[
                      { label: 'Carbs', value: `${food.carbs}g`, color: '#3b82f6' },
                      { label: 'Fat',   value: `${food.fat}g`,   color: '#f59e0b' },
                      { label: 'Per',   value: `${food.grams}g`, color: 'rgba(255,255,255,0.4)' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <p className="text-sm font-black" style={{ color }}>{value}</p>
                        <p className="text-[10px] text-white/25 mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                  {/* Budget vs daily target */}
                  <div className="space-y-1.5">
                    {[
                      { label: 'Cals', used: food.cal,     of: 2400, color: 'rgba(255,255,255,0.5)' },
                      { label: 'Protein', used: food.protein, of: 180, color: '#22c55e' },
                      { label: 'Carbs', used: food.carbs,  of: 195, color: '#3b82f6' },
                    ].filter(item => item.used > 0).map(({ label, used, of, color }) => (
                      <div key={label} className="flex items-center gap-2">
                        <span className="text-[10px] text-white/25 w-12">{label}</span>
                        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <div className="h-full rounded-full" style={{ width: `${Math.min((used / of) * 100, 100)}%`, background: color }} />
                        </div>
                        <span className="text-[10px] font-bold w-8 text-right" style={{ color }}>
                          {Math.round((used / of) * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-white/35 leading-relaxed">{food.note}</p>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Alcohol note */}
      <div className="px-5 mt-6">
        <div
          className="rounded-[20px] p-4"
          style={{ background: 'rgba(249,115,22,0.04)', border: '1px solid rgba(249,115,22,0.12)' }}
        >
          <p className="text-xs font-bold text-amber-400/80 uppercase tracking-wider mb-2">Alcohol</p>
          <p className="text-sm text-white/45 leading-relaxed">
            6 cans = <span className="text-white font-semibold">735 kcal</span>. Three spirits + soda = <span className="text-white font-semibold">210 kcal</span>. That one switch saves ~0.13 kg/week without any other change.
          </p>
        </div>
      </div>

    </div>
  )
}
