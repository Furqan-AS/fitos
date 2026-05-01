import { useState, useCallback } from 'react'
import { Search, X, Plus, Loader2 } from 'lucide-react'
interface FoodResult {
  id: string
  name: string
  calories_100g: number
  protein_100g: number
  carbs_100g: number
  fat_100g: number
  serving_g: number
}

interface FoodSearchProps {
  onSelect: (food: FoodResult, qty: number) => void
}

// Quick-add Pakistani / common foods
const QUICK_ADDS: FoodResult[] = [
  { id: 'tuna-185',    name: 'Tuna tin (185g)',         calories_100g: 116, protein_100g: 25.5, carbs_100g: 0,   fat_100g: 0.8,  serving_g: 185 },
  { id: 'chicken-b',   name: 'Chicken breast (cooked)', calories_100g: 165, protein_100g: 31,   carbs_100g: 0,   fat_100g: 3.6,  serving_g: 200 },
  { id: 'broccoli',    name: 'Steamed broccoli',        calories_100g: 34,  protein_100g: 2.8,  carbs_100g: 7,   fat_100g: 0.4,  serving_g: 150 },
  { id: 'roti',        name: 'Roti (1 medium, 80g)',    calories_100g: 297, protein_100g: 9,    carbs_100g: 58,  fat_100g: 3.5,  serving_g: 80  },
  { id: 'daal',        name: 'Daal (1 bowl, 240g)',     calories_100g: 116, protein_100g: 9,    carbs_100g: 20,  fat_100g: 0.4,  serving_g: 240 },
  { id: 'karahi-ch',   name: 'Chicken karahi (1 cup)',  calories_100g: 180, protein_100g: 20,   carbs_100g: 5,   fat_100g: 9,    serving_g: 200 },
  { id: 'rice',        name: 'Rice, cooked (1 cup)',    calories_100g: 130, protein_100g: 2.7,  carbs_100g: 28,  fat_100g: 0.3,  serving_g: 186 },
  { id: 'whey',        name: 'Whey protein shake',      calories_100g: 370, protein_100g: 75,   carbs_100g: 8,   fat_100g: 4,    serving_g: 35  },
  { id: 'eggs',        name: 'Eggs (2 whole)',          calories_100g: 155, protein_100g: 13,   carbs_100g: 1.1, fat_100g: 11,   serving_g: 100 },
]

async function searchOpenFoodFacts(query: string): Promise<FoodResult[]> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10&fields=id,product_name,nutriments`
    )
    const data = await res.json()
    return (data.products ?? [])
      .filter((p: Record<string, unknown>) => p.product_name && (p.nutriments as Record<string, unknown>)?.['energy-kcal_100g'])
      .slice(0, 8)
      .map((p: Record<string, unknown>) => {
        const n = p.nutriments as Record<string, number>
        return {
          id: String(p.id ?? p.code ?? Math.random()),
          name: String(p.product_name),
          calories_100g: Math.round(n['energy-kcal_100g'] ?? 0),
          protein_100g: Math.round((n['proteins_100g'] ?? 0) * 10) / 10,
          carbs_100g: Math.round((n['carbohydrates_100g'] ?? 0) * 10) / 10,
          fat_100g: Math.round((n['fat_100g'] ?? 0) * 10) / 10,
          serving_g: 100,
        }
      })
  } catch {
    return []
  }
}

export default function FoodSearch({ onSelect }: FoodSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<FoodResult | null>(null)
  const [qty, setQty] = useState(100)

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    const r = await searchOpenFoodFacts(q)
    setResults(r)
    setLoading(false)
  }, [])

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') search(query)
  }

  function pick(food: FoodResult) {
    setSelected(food)
    setQty(food.serving_g)
    setResults([])
    setQuery(food.name)
  }

  function confirm() {
    if (selected) {
      onSelect(selected, qty)
      setSelected(null)
      setQuery('')
      setQty(100)
    }
  }

  const calcNutrients = (food: FoodResult, g: number) => ({
    calories: Math.round((food.calories_100g * g) / 100),
    protein: Math.round((food.protein_100g * g) / 100 * 10) / 10,
    carbs: Math.round((food.carbs_100g * g) / 100 * 10) / 10,
    fat: Math.round((food.fat_100g * g) / 100 * 10) / 10,
  })

  return (
    <div className="space-y-4">
      {/* Quick adds */}
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Quick Add</p>
        <div className="flex gap-2 flex-wrap">
          {QUICK_ADDS.slice(0, 5).map((f) => (
            <button
              key={f.id}
              onClick={() => { pick(f); }}
              className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700/50 transition-colors"
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          className="w-full bg-slate-800 border border-slate-600 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30"
          placeholder="Search food database..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKey}
        />
        {loading && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />}
        {query && !loading && (
          <button onClick={() => { setQuery(''); setResults([]); setSelected(null); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Search results */}
      {results.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          {results.map((food) => (
            <button key={food.id} onClick={() => pick(food)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-700/60 border-b border-slate-700/50 last:border-0 transition-colors">
              <div>
                <p className="text-sm text-white font-medium line-clamp-1">{food.name}</p>
                <p className="text-xs text-slate-500">{food.calories_100g} kcal · {food.protein_100g}g protein per 100g</p>
              </div>
              <Plus size={14} className="text-green-400 shrink-0 ml-2" />
            </button>
          ))}
        </div>
      )}

      {/* Selected food qty picker */}
      {selected && (
        <div className="p-4 bg-slate-800/80 border border-green-500/20 rounded-xl space-y-3">
          <p className="text-sm font-semibold text-white line-clamp-1">{selected.name}</p>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">Quantity</span>
            <input
              type="number"
              value={qty}
              min={1}
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-24 bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white text-center focus:outline-none focus:border-green-500"
            />
            <span className="text-slate-400 text-sm">g</span>
          </div>
          {(() => {
            const n = calcNutrients(selected, qty)
            return (
              <div className="flex gap-4 text-xs">
                <span className="text-white font-medium">{n.calories} kcal</span>
                <span className="text-green-400">{n.protein}g P</span>
                <span className="text-blue-400">{n.carbs}g C</span>
                <span className="text-amber-400">{n.fat}g F</span>
              </div>
            )
          })()}
          <button onClick={confirm}
            className="w-full py-2 bg-green-500 hover:bg-green-400 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
            <Plus size={14} /> Add to log
          </button>
        </div>
      )}
    </div>
  )
}
