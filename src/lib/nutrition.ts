import type { Gender, MacroTotals } from '@/types'

export function calcBMR(weight_kg: number, height_cm: number, age: number, gender: Gender): number {
  if (gender === 'male') {
    return 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
  }
  return 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
}

export function calcTDEE(bmr: number, activityFactor = 1.55): number {
  return Math.round(bmr * activityFactor)
}

export function calcMacroTargets(weight_kg: number, tdee: number): MacroTotals {
  // ~800 kcal deficit for fat loss (~0.7 kg/week), minimum 1,500 kcal floor
  const calories = Math.max(Math.round(tdee - 800), 1500)
  const protein_g = Math.round(weight_kg * 1.8)
  const fat_g = Math.round((calories * 0.27) / 9)
  const carbs_g = Math.round((calories - protein_g * 4 - fat_g * 9) / 4)
  return { calories, protein_g, carbs_g, fat_g }
}

export function sumMacros(logs: { calories: number; protein_g: number; carbs_g: number; fat_g: number }[]): MacroTotals {
  return logs.reduce(
    (acc, l) => ({
      calories: acc.calories + l.calories,
      protein_g: acc.protein_g + l.protein_g,
      carbs_g: acc.carbs_g + l.carbs_g,
      fat_g: acc.fat_g + l.fat_g,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  )
}
