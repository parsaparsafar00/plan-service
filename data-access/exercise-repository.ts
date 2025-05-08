import type { Knex } from 'knex'
import type { exerciseOutputType, printingRawExerciseType, exerciseRawOutputType } from '../domain/schemas/exercise-schema.js'
import { AppError } from '@amard/error-handling'

let knexInstance: Knex

export function setKnexInstanceForExerciseRepo(instance: Knex) {
  knexInstance = instance
}

/**
 * مدل داده برای سطرهای جدول حرکات در دیتابیس
 */
export interface ExerciseEntity {
  number: number
  id: string
  name: string
  nameFa: string
  shortYoutubeDemonstration: string | null
  inDepthYoutubeExplanation: string | null
  difficultyLevel: 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
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
  gender: 'm' | 'f' | null
  ageGround: number | null
  ageCeiling: number | null
  weightGround: number | null
  weightCeiling: number | null
  target: string | null
  mechanics: string | null
}

/**
 * آرایه‌ای گلوبال از همه تمرین‌ها، جهت جستجو و فیلتر در مموری
 */
let inMemoryExercises: ExerciseEntity[] = []

/**
 * یکبار از دیتابیس همه‌ی تمرین‌ها را می‌خوانیم و در حافظه ذخیره می‌کنیم
 */
export async function loadAllExercises(): Promise<void> {
  if (!knexInstance) throw new AppError('PLAN_EXERCISE_ERROR', 'Knex instance not set in ExerciseRepo', 400)

  try {
    // انتخاب از جدول plan_exercises
    const rows = await knexInstance<ExerciseEntity>('plan_exercises').select('*')
    inMemoryExercises = rows
  }
  catch (error) {
    throw new AppError('PLAN_EXERCISE_ERROR', 'Database loadAllExercises query error', 400, error)
  }
}

/**
 * برگرداندن لیست حرکات (آرایه) از درون حافظه
 */
export function getAllExercisesArray(): ExerciseEntity[] {
  return inMemoryExercises
}

/**
 * دریافت حرکت تمرینی با شماره حرکت
 */
export async function getExerciseByNumber(exerciseNumber: number): Promise<exerciseOutputType | undefined> {
  try {
    return await knexInstance('plan_exercises').where({ number: exerciseNumber }).first()
  }
  catch (error) {
    throw new AppError('PLAN_EXERCISE_ERROR', 'Database getExerciseByNumber query error', 400, error)
  }
}

/**
 * دریافت حرکات تمرینی با لیستی از شماره حرکات
 */
export async function getExercisesByNumberList(numberList: number[]): Promise<exerciseRawOutputType[]> {
  try {

    return await knexInstance('plan_exercises').whereIn('number', numberList);

  } catch (error) {
    throw new AppError('PLAN_EXERCISE_ERROR', 'Database getExercisesByNumberList query error', 400, error);
  }
}

/**
 * دریافت حرکات تمرینی با لیستی از شماره حرکات
 */
export async function getExercisesByNumberListPrint(numberList: number[]): Promise<printingRawExerciseType[]> {
  try {

    return await knexInstance('plan_exercises').whereIn('number', numberList);

  } catch (error) {
    throw new AppError('PLAN_EXERCISE_ERROR', 'Database getExercisesByNumberListPrint query error', 400, error);
  }
}