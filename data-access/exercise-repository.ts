import type { Knex } from 'knex'
import { AppError } from '@amard/error-handling'

let knexInstance: Knex | null = null

export function setKnexInstanceForExerciseRepo(instance: Knex): void {
  knexInstance = instance
}

/**
 * مدل داده برای سطرهای جدول plan_exercises
 */
export interface ExerciseEntity {
  id: string
  name: string
  shortYoutubeDemonstration: string | null
  inDepthYoutubeExplanation: string | null
  difficultyLevel: string | null
  targetMuscleGroup: string | null
  primeMoverMuscle: string | null
  secondaryMuscle: string | null
  tertiaryMuscle: string | null
  primaryEquipment: string | null
  secondaryEquipment: string | null
  numberOfItems: number | null
  posture: string | null
  singleOrDoubleArm: string | null
  grip: string | null
  loadPositionAtTheEnd: string | null
  footElevation: string | null
  comboExercises: string | null
  movementPattern: string | null
  movementPattern2: string | null
  movementPattern3: string | null
  bodyRegion: string | null
  forceType: string | null
  laterality: string | null
  exerciseClassification: string | null
  muscleJointTypes: string | null
  priority: number | null
  gender: number | null
  ageGround: number | null
  ageCeiling: number | null
  weightGround: number | null
  weightCeiling: number | null
  target: string | null
  mechanics: string | null
}

/**
 * آرایه‌ای از همه تمرین‌ها، جهت جستجو و فیلتر در inMemory
 */
let inMemoryExercises: ExerciseEntity[] = []

/**
 * یکبار از دیتابیس همه‌ی تمرین‌ها را می‌خوانیم و در حافظه ذخیره می‌کنیم
 */
export async function loadAllExercises(): Promise<void> {
  if (!knexInstance)
    throw new AppError('EXERCISE_REPO_DB_NOT_READY', 'Knex instance not set in ExerciseRepo', 500)

  try {
    // انتخاب از جدول plan_exercises
    const rows = await knexInstance<ExerciseEntity>('plan_exercises').select('*')
    inMemoryExercises = rows
  }
  catch (error) {
    throw new AppError('PLAN_EXERCISE_DB_ERROR', 'Database loadAllExercises error', 500, error)
  }
}

/**
 * برگرداندن لیست تمرین‌ها (آرایه) از درون حافظه
 */
export function getAllExercisesArray(): ExerciseEntity[] {
  return inMemoryExercises
}
