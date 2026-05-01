import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface Food { name: string; serving: string; grams: number; cal: number; protein: number; carbs: number; fat: number; note: string }
interface Category { id: string; label: string; color: string; foods: Food[] }

const CATEGORIES: Category[] = [
  {
    id: 'protein', label: 'Protein', color: 'var(--green)',
    foods: [
      { name: 'Chicken Breast', serving: '1 large breast', grams: 200, cal: 330, protein: 62, carbs: 0, fat: 7, note: 'Grilled or boiled. Best protein-to-calorie ratio in your budget.' },
      { name: 'Tuna (tin, drained)', serving: '1 tin', grams: 130, cal: 151, protein: 34, carbs: 0, fat: 1, note: 'Best gram-for-gram protein source. Keep 4 tins a week.' },
      { name: 'Eggs', serving: '2 whole', grams: 120, cal: 186, protein: 16, carbs: 1, fat: 13, note: 'Complete amino acids. Add a third egg if still hungry.' },
      { name: 'Lamb / Mutton (karahi)', serving: '1 cup', grams: 150, cal: 387, protein: 39, carbs: 0, fat: 26, note: 'High fat from cooking oil. Limit to 2–3×/week.' },
      { name: 'Daal Masoor (cooked)', serving: '1 bowl', grams: 250, cal: 290, protein: 23, carbs: 50, fat: 1, note: 'Great fibre + protein. Counts toward carbs too.' },
      { name: 'Greek Yogurt (full fat)', serving: '1 cup', grams: 200, cal: 194, protein: 18, carbs: 8, fat: 10, note: 'Use as raita. 18g protein per cup.' },
      { name: 'Whey Protein', serving: '1 scoop', grams: 35, cal: 130, protein: 25, carbs: 5, fat: 2, note: 'Post-workout. Fastest way to hit 180g daily protein.' },
    ],
  },
  {
    id: 'carbs', label: 'Carbs', color: '#5B8AF0',
    foods: [
      { name: 'Basmati Rice (cooked)', serving: '1 cup', grams: 180, cal: 234, protein: 5, carbs: 50, fat: 1, note: 'Daily max ≈ 1–1.5 cups. 1 cup = 50g carbs.' },
      { name: 'Whole Wheat Roti', serving: '1 medium', grams: 40, cal: 106, protein: 3, carbs: 21, fat: 1, note: 'Max 2 rotis/day. Not both roti AND rice.' },
      { name: 'Oats (dry)', serving: '½ cup', grams: 50, cal: 195, protein: 9, carbs: 33, fat: 4, note: 'Slow-digesting. Best pre-gym carb.' },
      { name: 'Chickpeas / Chana (cooked)', serving: '1 cup', grams: 200, cal: 328, protein: 18, carbs: 54, fat: 5, note: 'High fibre. Counts as protein too.' },
      { name: 'Sweet Potato', serving: '1 medium', grams: 150, cal: 129, protein: 3, carbs: 30, fat: 0, note: 'Cleaner carb than white rice. Great with karahi.' },
    ],
  },
  {
    id: 'fats', label: 'Fats', color: 'var(--accent)',
    foods: [
      { name: 'Olive Oil', serving: '1 tablespoon', grams: 14, cal: 124, protein: 0, carbs: 0, fat: 14, note: 'Use ½ tbsp per dish. 1 tbsp = 124 kcal — adds up fast.' },
      { name: 'Ghee', serving: '1 teaspoon', grams: 5, cal: 45, protein: 0, carbs: 0, fat: 5, note: '1 tsp on daal is fine. No ladlefuls.' },
      { name: 'Cooking Oil (any)', serving: '1 tablespoon', grams: 14, cal: 124, protein: 0, carbs: 0, fat: 14, note: 'The silent killer. Restaurant dishes use 3–5 tbsp invisibly.' },
      { name: 'Almonds', serving: '1 small handful', grams: 28, cal: 164, protein: 6, carbs: 6, fat: 14, note: 'Don\'t eat by the bag — 164 kcal for 28g.' },
    ],
  },
  {
    id: 'free', label: 'Eat free', color: '#9B6FE8',
    foods: [
      { name: 'Broccoli (steamed)', serving: 'Large plate', grams: 300, cal: 105, protein: 7, carbs: 21, fat: 1, note: 'Only 105 kcal for a massive plate. Unlimited.' },
      { name: 'Spinach / Saag', serving: 'Full bowl', grams: 300, cal: 69, protein: 9, carbs: 11, fat: 1, note: '69 kcal for 300g. Iron + magnesium + basically free.' },
      { name: 'Salad (mixed)', serving: 'Large bowl', grams: 200, cal: 34, protein: 3, carbs: 6, fat: 0, note: 'Zero impact on calorie budget. Fill half the plate.' },
      { name: 'Tomatoes', serving: '2 medium', grams: 250, cal: 45, protein: 2, carbs: 10, fat: 0, note: 'Use freely in curries.' },
      { name: 'Cucumber', serving: '1 whole', grams: 300, cal: 48, protein: 2, carbs: 11, fat: 0, note: 'Almost zero calories. Great volume food.' },
      { name: 'Raita', serving: '½ cup', grams: 120, cal: 72, protein: 5, carbs: 5, fat: 4, note: 'Have with every desi meal.' },
    ],
  },
]

export default function Nutrition() {
  const [activeId, setActiveId]     = useState('protein')
  const [expanded, setExpanded]     = useState<string | null>(null)
  const category = CATEGORIES.find(c => c.id === activeId)!

  return (
    <div style={{ maxWidth: 448, margin: '0 auto' }} className="pb-page">

      {/* Header */}
      <div style={{ padding: '52px 20px 24px' }}>
        <p className="label" style={{ marginBottom: 8 }}>Reference</p>
        <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 20 }}>Eat</h1>
        {/* Daily targets grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { label: 'Calories', value: '2,400', unit: 'kcal', color: 'var(--accent)' },
            { label: 'Protein',  value: '180',   unit: 'g',    color: 'var(--green)' },
            { label: 'Carbs',    value: '195',   unit: 'g',    color: '#5B8AF0' },
            { label: 'Fat',      value: '65',    unit: 'g',    color: '#C97BFF' },
          ].map(({ label, value, unit, color }) => (
            <div key={label} className="card" style={{ padding: '12px 10px', textAlign: 'center' }}>
              <p style={{ fontSize: 20, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>{unit}</p>
              <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', marginTop: 2, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Rules */}
      <div style={{ padding: '0 20px 28px' }}>
        <div className="card" style={{ padding: '16px 20px' }}>
          {[
            { rule: 'Protein first.', detail: 'Hit 180g before worrying about anything else.' },
            { rule: 'Max 2 rotis or 1.5 cups rice.', detail: 'Not both.' },
            { rule: 'Half oil.', detail: 'Ask every time. Restaurant dishes use 3–5 tbsp invisibly.' },
            { rule: 'Load vegetables.', detail: 'They cost almost nothing calorically.' },
          ].map(({ rule, detail }, i, arr) => (
            <div
              key={rule}
              style={{ display: 'flex', gap: 14, padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', marginTop: 8, flexShrink: 0 }} />
              <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5 }}>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>{rule}</span>{' '}{detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Category tabs */}
      <div style={{ padding: '0 20px 20px', display: 'flex', gap: 8 }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => { setActiveId(cat.id); setExpanded(null) }}
            style={{
              flex: 1, padding: '9px 4px', borderRadius: 12, fontSize: 12, fontWeight: 700,
              background: activeId === cat.id ? cat.color : 'var(--surface)',
              color: activeId === cat.id ? (cat.id === 'fats' ? '#000' : '#000') : 'var(--text-2)',
              border: activeId === cat.id ? 'none' : '1px solid var(--border)',
              transition: 'all 0.15s',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Food rows */}
      <div style={{ padding: '0 20px' }}>
        {category.foods.map((food) => {
          const isOpen = expanded === food.name
          return (
            <div key={food.name}>
              <button
                onClick={() => setExpanded(isOpen ? null : food.name)}
                style={{
                  width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center',
                  padding: '16px 0',
                  background: 'none', border: 'none', borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{food.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-2)' }}>{food.serving} · {food.grams}g</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0, marginRight: 8 }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{food.cal}</p>
                    <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>kcal</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 16, fontWeight: 800, color: category.color, fontVariantNumeric: 'tabular-nums' }}>{food.protein}g</p>
                    <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>protein</p>
                  </div>
                </div>
                <ChevronDown size={15} color="var(--text-3)" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
              </button>

              {isOpen && (
                <div style={{ padding: '12px 0 20px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                    {[
                      { l: 'Carbs', v: `${food.carbs}g`, c: '#5B8AF0' },
                      { l: 'Fat',   v: `${food.fat}g`,   c: 'var(--accent)' },
                      { l: 'Per',   v: `${food.grams}g`, c: 'var(--text-2)' },
                    ].map(({ l, v, c }) => (
                      <div key={l} className="card" style={{ padding: '10px', textAlign: 'center' }}>
                        <p style={{ fontSize: 15, fontWeight: 800, color: c, fontVariantNumeric: 'tabular-nums' }}>{v}</p>
                        <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>{l}</p>
                      </div>
                    ))}
                  </div>
                  {/* % of daily budget bars */}
                  {[
                    { l: 'Calories', used: food.cal,     of: 2400, c: 'rgba(255,255,255,0.4)' },
                    { l: 'Protein',  used: food.protein, of: 180,  c: 'var(--green)' },
                    { l: 'Carbs',    used: food.carbs,   of: 195,  c: '#5B8AF0' },
                  ].filter(x => x.used > 0).map(({ l, used, of, c }) => (
                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', width: 52 }}>{l}</span>
                      <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min((used / of) * 100, 100)}%`, background: c, borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, width: 30, textAlign: 'right', color: c }}>{Math.round((used / of) * 100)}%</span>
                    </div>
                  ))}
                  <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginTop: 10 }}>{food.note}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Alcohol note */}
      <div style={{ padding: '28px 20px 0' }}>
        <div className="card" style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>Alcohol</p>
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>
            6 cans = <span style={{ color: 'var(--text)', fontWeight: 600 }}>735 kcal</span>. Three spirits + soda = <span style={{ color: 'var(--text)', fontWeight: 600 }}>210 kcal</span>. That switch alone saves ~0.13 kg/week.
          </p>
        </div>
      </div>

    </div>
  )
}
