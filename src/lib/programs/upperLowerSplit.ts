export interface ProgramExerciseTemplate {
  exercise_id: string
  sets: number
  target_reps_min: number
  target_reps_max: number
  rest_seconds: number
  sort_order: number
  exercise_type: 'lower_compound' | 'upper_compound' | 'isolation'
}

export interface ProgramDayTemplate {
  day_number: number      // 0=Sun, 1=Mon, 3=Wed, 5=Fri, 6=Sat
  day_label: string
  focus_label: string
  cardio_type: 'zone2' | 'dedicated'
  cardio_duration_min: number
  exercises: ProgramExerciseTemplate[]
}

// Schedule: Mon / Wed / Fri / Sat / Sun
// Tue + Thu = walk-only days (Zone 2 pace, 30–45 min)
// Cardio appended to Mon (Zone 2, 20 min) and Sun (VO₂ Max, 40 min)
export const upperLowerSplit: ProgramDayTemplate[] = [
  {
    day_number: 1,
    day_label: 'Monday',
    focus_label: 'Upper A — Push / Pull',
    cardio_type: 'zone2',
    cardio_duration_min: 20,
    exercises: [
      { exercise_id: 'bench-press',         sets: 3, target_reps_min: 5,  target_reps_max: 5,  rest_seconds: 180, sort_order: 1, exercise_type: 'upper_compound' },
      { exercise_id: 'barbell-row',          sets: 3, target_reps_min: 5,  target_reps_max: 5,  rest_seconds: 180, sort_order: 2, exercise_type: 'upper_compound' },
      { exercise_id: 'db-shoulder-press',    sets: 3, target_reps_min: 10, target_reps_max: 12, rest_seconds: 120, sort_order: 3, exercise_type: 'upper_compound' },
      { exercise_id: 'lat-pulldown',         sets: 3, target_reps_min: 10, target_reps_max: 12, rest_seconds: 120, sort_order: 4, exercise_type: 'upper_compound' },
      { exercise_id: 'tricep-pushdown',      sets: 3, target_reps_min: 12, target_reps_max: 15, rest_seconds: 90,  sort_order: 5, exercise_type: 'isolation' },
      { exercise_id: 'db-curl',              sets: 3, target_reps_min: 12, target_reps_max: 15, rest_seconds: 90,  sort_order: 6, exercise_type: 'isolation' },
    ],
  },
  {
    day_number: 3,
    day_label: 'Wednesday',
    focus_label: 'Lower B — Quad / Posterior',
    cardio_type: 'zone2',
    cardio_duration_min: 20,
    exercises: [
      { exercise_id: 'low-bar-squat',        sets: 3, target_reps_min: 5,  target_reps_max: 5,  rest_seconds: 240, sort_order: 1, exercise_type: 'lower_compound' },
      { exercise_id: 'rdl',                  sets: 3, target_reps_min: 8,  target_reps_max: 10, rest_seconds: 180, sort_order: 2, exercise_type: 'lower_compound' },
      { exercise_id: 'leg-press',            sets: 3, target_reps_min: 10, target_reps_max: 12, rest_seconds: 150, sort_order: 3, exercise_type: 'lower_compound' },
      { exercise_id: 'leg-curl',             sets: 3, target_reps_min: 12, target_reps_max: 15, rest_seconds: 90,  sort_order: 4, exercise_type: 'isolation' },
      { exercise_id: 'calf-raise-standing',  sets: 4, target_reps_min: 15, target_reps_max: 20, rest_seconds: 60,  sort_order: 5, exercise_type: 'isolation' },
    ],
  },
  {
    day_number: 5,
    day_label: 'Friday',
    focus_label: 'Upper D — Pull / Push',
    cardio_type: 'zone2',
    cardio_duration_min: 20,
    exercises: [
      { exercise_id: 'incline-db-press',     sets: 3, target_reps_min: 10, target_reps_max: 12, rest_seconds: 150, sort_order: 1, exercise_type: 'upper_compound' },
      { exercise_id: 'pull-up',              sets: 3, target_reps_min: 6,  target_reps_max: 10, rest_seconds: 180, sort_order: 2, exercise_type: 'upper_compound' },
      { exercise_id: 'cable-row',            sets: 3, target_reps_min: 10, target_reps_max: 12, rest_seconds: 120, sort_order: 3, exercise_type: 'upper_compound' },
      { exercise_id: 'lateral-raise',        sets: 3, target_reps_min: 15, target_reps_max: 20, rest_seconds: 90,  sort_order: 4, exercise_type: 'isolation' },
      { exercise_id: 'close-grip-bench',     sets: 3, target_reps_min: 10, target_reps_max: 12, rest_seconds: 120, sort_order: 5, exercise_type: 'upper_compound' },
      { exercise_id: 'hammer-curl',          sets: 3, target_reps_min: 12, target_reps_max: 15, rest_seconds: 90,  sort_order: 6, exercise_type: 'isolation' },
    ],
  },
  {
    day_number: 6,
    day_label: 'Saturday',
    focus_label: 'Lower E — Hinge / Unilateral',
    cardio_type: 'zone2',
    cardio_duration_min: 20,
    exercises: [
      { exercise_id: 'sumo-deadlift',        sets: 3, target_reps_min: 5,  target_reps_max: 5,  rest_seconds: 240, sort_order: 1, exercise_type: 'lower_compound' },
      { exercise_id: 'bulgarian-split-squat',sets: 3, target_reps_min: 8,  target_reps_max: 10, rest_seconds: 180, sort_order: 2, exercise_type: 'lower_compound' },
      { exercise_id: 'hip-thrust',           sets: 3, target_reps_min: 12, target_reps_max: 15, rest_seconds: 150, sort_order: 3, exercise_type: 'lower_compound' },
      { exercise_id: 'leg-extension',        sets: 3, target_reps_min: 15, target_reps_max: 20, rest_seconds: 90,  sort_order: 4, exercise_type: 'isolation' },
      { exercise_id: 'calf-raise-seated',    sets: 4, target_reps_min: 15, target_reps_max: 20, rest_seconds: 60,  sort_order: 5, exercise_type: 'isolation' },
    ],
  },
  {
    day_number: 0,
    day_label: 'Sunday',
    focus_label: 'Upper C — Shoulders & Arms + VO₂',
    cardio_type: 'dedicated',
    cardio_duration_min: 40,
    exercises: [
      { exercise_id: 'face-pull',            sets: 3, target_reps_min: 15, target_reps_max: 20, rest_seconds: 60,  sort_order: 1, exercise_type: 'isolation' },
      { exercise_id: 'lateral-raise',        sets: 4, target_reps_min: 15, target_reps_max: 20, rest_seconds: 60,  sort_order: 2, exercise_type: 'isolation' },
      { exercise_id: 'overhead-tricep-ext',  sets: 3, target_reps_min: 12, target_reps_max: 15, rest_seconds: 75,  sort_order: 3, exercise_type: 'isolation' },
      { exercise_id: 'tricep-pushdown',      sets: 3, target_reps_min: 15, target_reps_max: 20, rest_seconds: 60,  sort_order: 4, exercise_type: 'isolation' },
      { exercise_id: 'incline-curl',         sets: 3, target_reps_min: 12, target_reps_max: 15, rest_seconds: 75,  sort_order: 5, exercise_type: 'isolation' },
      { exercise_id: 'hammer-curl',          sets: 3, target_reps_min: 12, target_reps_max: 15, rest_seconds: 60,  sort_order: 6, exercise_type: 'isolation' },
    ],
  },
]

import { getDayOfWeek } from '@/lib/utils'

// Maps JS getDay() values to program days (0=Sun, 1=Mon, 3=Wed, 5=Fri, 6=Sat)
const DAY_MAP: Record<number, number> = { 1: 1, 3: 3, 5: 5, 6: 6, 0: 0 }

export function getProgramDayByDOW(dow: number): ProgramDayTemplate | null {
  const mapped = DAY_MAP[dow]
  if (mapped === undefined) return null
  return upperLowerSplit.find((d) => d.day_number === mapped) ?? null
}

export function getTodaysProgramDay(): ProgramDayTemplate | null {
  return getProgramDayByDOW(getDayOfWeek())
}

export function isRestDay(): boolean {
  return DAY_MAP[getDayOfWeek()] === undefined
}
