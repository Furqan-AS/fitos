import type { ExerciseLog, WeightRecommendation } from '@/types'

const UPPER_INCREMENT = 2.5
const LOWER_INCREMENT = 5
const ISOLATION_INCREMENT = 1.25
const DELOAD_FACTOR = 0.9
const MAX_FAILURES_BEFORE_DELOAD = 3

type ExerciseType = 'lower_compound' | 'upper_compound' | 'isolation'

function getIncrement(type: ExerciseType): number {
  if (type === 'lower_compound') return LOWER_INCREMENT
  if (type === 'upper_compound') return UPPER_INCREMENT
  return ISOLATION_INCREMENT
}

export function calcE1RM(weight: number, reps: number): number {
  return Math.round(weight * (1 + reps / 30) * 10) / 10
}

export function getWeightRecommendation(
  history: ExerciseLog[][],
  targetSets: number,
  targetRepsMin: number,
  exerciseType: ExerciseType
): WeightRecommendation | null {
  if (history.length === 0) return null

  const lastSession = history[history.length - 1]
  const lastWeight = lastSession[0]?.weight_kg ?? 0
  const increment = getIncrement(exerciseType)

  const consecutiveFailures = countConsecutiveFailures(history, targetSets, targetRepsMin)

  if (consecutiveFailures >= MAX_FAILURES_BEFORE_DELOAD) {
    const deloadWeight = Math.round((lastWeight * DELOAD_FACTOR) / 1.25) * 1.25
    return {
      exercise_id: '',
      recommended_weight_kg: deloadWeight,
      last_weight_kg: lastWeight,
      direction: 'deload',
      reason: `Deload after ${consecutiveFailures} consecutive missed sessions`,
    }
  }

  const lastCompleted = didCompleteSession(lastSession, targetSets, targetRepsMin)

  if (lastCompleted) {
    return {
      exercise_id: '',
      recommended_weight_kg: lastWeight + increment,
      last_weight_kg: lastWeight,
      direction: 'increase',
      reason: `All sets completed — add ${increment}kg`,
    }
  }

  return {
    exercise_id: '',
    recommended_weight_kg: lastWeight,
    last_weight_kg: lastWeight,
    direction: 'maintain',
    reason: 'Hit target reps before increasing weight',
  }
}

function didCompleteSession(logs: ExerciseLog[], targetSets: number, targetRepsMin: number): boolean {
  const completed = logs.filter((l) => !l.skipped && l.reps_completed >= targetRepsMin)
  return completed.length >= targetSets
}

function countConsecutiveFailures(history: ExerciseLog[][], targetSets: number, targetRepsMin: number): number {
  let count = 0
  for (let i = history.length - 1; i >= 0; i--) {
    if (!didCompleteSession(history[i], targetSets, targetRepsMin)) {
      count++
    } else {
      break
    }
  }
  return count
}
