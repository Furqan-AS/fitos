export type Gender = 'male' | 'female'
export type Goal = 'athletic_performance' | 'muscle_gain' | 'fat_loss' | 'recomp'
export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'core' | 'cardio'
export type ExerciseCategory = 'compound' | 'isolation' | 'cardio'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type CardioType = 'zone2' | 'hiit' | 'other'

export interface Profile {
  id: string
  user_id: string
  name: string
  age: number
  gender: Gender
  weight_kg: number
  height_cm: number
  goal: Goal
  activity_level: number
  created_at: string
  updated_at: string
}

export interface Exercise {
  id: string
  name: string
  primary_muscle: MuscleGroup
  secondary_muscles: MuscleGroup[]
  equipment: string
  category: ExerciseCategory
  instructions: string
  tips: string
  isAssisted?: boolean  // weight logged is machine assistance; lower = harder
}

export interface ProgramDay {
  id: string
  program_id: string
  day_number: number
  day_label: string
  focus_label: string
}

export interface ProgramExercise {
  id: string
  program_day_id: string
  exercise_id: string
  sets: number
  target_reps_min: number
  target_reps_max: number
  rest_seconds: number
  sort_order: number
  exercise?: Exercise
}

export interface WorkoutSession {
  id: string
  user_id: string
  program_day_id: string
  date: string
  started_at: string
  ended_at: string | null
  notes: string
  completed: boolean
  program_day?: ProgramDay
}

export interface ExerciseLog {
  id: string
  session_id: string
  exercise_id: string
  set_number: number
  weight_kg: number
  reps_completed: number
  rpe: number | null
  skipped: boolean
  exercise?: Exercise
}

export interface CardioSession {
  id: string
  user_id: string
  type: CardioType
  duration_min: number
  distance_km: number | null
  avg_hr: number | null
  calories: number | null
  date: string
  notes: string
}

export interface BodyMetric {
  id: string
  user_id: string
  date: string
  weight_kg: number
  body_fat_pct: number | null
}

export interface NutritionTarget {
  id: string
  user_id: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

export interface NutritionLog {
  id: string
  user_id: string
  date: string
  meal_type: MealType
  food_name: string
  quantity_g: number
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  source: string
}

export interface MacroTotals {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

export interface WeightRecommendation {
  exercise_id: string
  recommended_weight_kg: number
  last_weight_kg: number
  direction: 'increase' | 'maintain' | 'deload'
  reason: string
}
