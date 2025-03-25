import type { Knex } from 'knex'
import { AppError } from '@amard/error-handling'

let knexInstance: Knex | null = null

export function setKnexInstanceForExerciseRepo(instance: Knex): void {
  knexInstance = instance
}

/**
 * مدل داده برای ردیف‌های جدول حرکات
 * باید مطابق با ستون های واقعی جدول حرکات تنظیم بشه
 */
export interface ExerciseEntity {
  id: string
  name: string
  mechanics: string | null
  difficulty_level: string | null
  body_region: string | null
  prime_mover_muscle: string | null
  combo_exercises: string | null
  target_muscle_group: string | null
  short_youtube_demonstration: string | null
  in_depth_youtube_explanation: string | null
  // ستون‌های دیگر در صورت نیاز
}

// آرایه‌ای از همه تمرین‌ها، جهت جستجو و فیلتر
let inMemoryExercises: ExerciseEntity[] = []

// مپ از شناسه‌ی تمرین به خود تمرین، جهت دسترسی سریع بر اساس شناسه
// const inMemoryExercisesMap = new Map<string, ExerciseEntity>()

/**
 * یکبار از دیتابیس همه‌ی تمرین‌ها را می‌خوانیم و در حافظه ذخیره می‌کنیم
 */
export async function loadAllExercises(): Promise<void> {
  try {
    const rows = await knexInstance<ExerciseEntity>('exercises').select('*')
    inMemoryExercises = rows
    // inMemoryExercisesMap.clear()

    // for (const ex of rows) {
    //   inMemoryExercisesMap.set(ex.id, ex)
    // }
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

// export function getExerciseById(id: string): ExerciseEntity | undefined {
//   return inMemoryExercisesMap.get(id)
// }
