import type { Knex } from 'knex'
import type { PlanTrainHelperType } from '../domain/schemas/plan-helper-schema.js'
import { AppError } from '@amard/error-handling'
import { SystemsAndUsageTimesType } from '../domain/schemas/system-schema.js'
import { ExercisesAndUsageTimesType } from '../domain/schemas/exercise-schema.js'
import type { SystemMethodsAndUsageTimesType } from '../domain/schemas/system-method-schema.js'
import type { TechniquesAndUsageTimesType } from '../domain/schemas/technique-schema.js'
import type { TechniqueMethodsAndUsageTimesType } from '../domain/schemas/technique-method-schema.js'
// import type { AutoQueryData } from '@amard/auto-query'
// import { attachAutoQuery } from '@amard/auto-query'

let knexInstance: Knex

export function setKnexInstanceForTrainHelperRepo(instance: Knex) {
  knexInstance = instance
}

/**
 * تولید برنامه تمرینی جدید در جدول plan_train_helper
 */
export async function insertPlanTrainHelper(data: PlanTrainHelperType, trx?: Knex.Transaction): Promise<PlanTrainHelperType> {
  try {
    // ساخت کوئری بیس
    const query = knexInstance('plan_train_helper')

    // اجرای کوئری با تراکنش اگر وجود داشت
    const [inserted] = await (trx ? query.transacting(trx) : query).insert(data).returning('*')

    return inserted
  } catch (error) {
    throw new AppError('PLAN_PLAN_TRAIN_HELPER_ERROR', 'Database insertPlanTrainHelper query error', 500, error instanceof Error ? error.message : String(error))
  }
}

/**
 * حذف یک رکورد کمکی فقط برای ادمین در موارد خاص که بعیده استفاده بشه در حالت عادی
 */
export async function deleteHelperById(id: string): Promise<void> {
  try {
    await knexInstance('plan_train_helper').where({ id }).del()
  } catch (error) {
    throw new AppError('PLAN_PLAN_TRAIN_HELPER_ERROR', 'Database deleteHelperById query error', 500, error)
  }
}

/**
 * ویرایش رکورد های جدول کمکی
 */
export async function updatePlanTrainHelper(id: string, updates: Partial<PlanTrainHelperType>): Promise<PlanTrainHelperType> {
  try {
    const [updated] = await knexInstance('plan_train_helper').where({ planId: id }).update(updates).returning('*')
    return updated
  } catch (error) {
    throw new AppError('PLAN_PLAN_TRAIN_HELPER_ERROR', 'Database updatePlanTrainHelper query error', 400, error)
  }
}

/**
 * حذف رکورد های کمکی وقتی که یک برنامه اپدیت شده (برای اینکه رکورد های جدید باید اینسرت بشن دوباره)
 */
export async function deleteAllExercisesOfPlan(id: string): Promise<void> {
  try {
    await knexInstance('plan_train_helper').where({ planId: id }).del()
  } catch (error) {
    throw new AppError('PLAN_PLAN_TRAIN_HELPER_ERROR', 'Database deleteAllExercisesOfPlan query error', 500, error)
  }
}

/**
 * دریافت اطلاعات متد سیستم به همراه تعداد استفادشون
 */
export async function getSystemMethodsAndTheirUsageTimes(teacherId: string): Promise<SystemMethodsAndUsageTimesType[]> {
  try {
    const result = await knexInstance('plan_train_helper').select('systemMethodNumber').count('* as usageCount').where({ teacherId }).groupBy('systemMethodNumber').orderBy('usageCount', 'desc')

    // تبدیل خروجی به تایپی که میخوایم
    return result as { systemMethodNumber: number; usageCount: number }[]
  } catch (error) {
    throw new AppError('PLAN_PLAN_TRAIN_HELPER_DB_ERROR', 'Database getSystemMethodsAndTheirUsageTimes query error', 400, error)
  }
}

/**
 * دریافت اطلاعات سیستم تکرار به همراه تعداد استفادشون
 */
export async function getSystemsAndTheirUsageTimes(teacherId: string): Promise<SystemsAndUsageTimesType[]> {
  try {
    const result = await knexInstance('plan_train_helper').select('systemNumber').count('* as usageCount').where({ teacherId }).groupBy('systemNumber').orderBy('usageCount', 'desc')

    // تبدیل خروجی به تایپی که میخوایم
    return result as { systemNumber: number; usageCount: number }[]
  } catch (error) {
    throw new AppError('PLAN_PLAN_TRAIN_HELPER_DB_ERROR', 'Database getSystemsAndTheirUsageTimes query error', 400, error)
  }
}

/**
 * دریافت اطلاعات متد تکنیکی به همراه تعداد استفادشون
 */
export async function getTechniqueMethodsAndTheirUsageTimes(teacherId: string): Promise<TechniqueMethodsAndUsageTimesType[]> {
  try {
    const result = await knexInstance('plan_train_helper').select('techniqueMethodNumber').count('* as usageCount').where({ teacherId }).groupBy('techniqueMethodNumber').orderBy('usageCount', 'desc')

    // تبدیل خروجی به تایپی که می‌خواهیم
    return result as TechniqueMethodsAndUsageTimesType[]
  } catch (error) {
    throw new AppError('PLAN_PLAN_TRAIN_HELPER_DB_ERROR', 'خطا در کوئری دریافت متدهای تکنیکی و تعداد استفاده در دیتابیس', 400, error)
  }
}

/**
 * دریافت اطلاعات تکنیک‌ها به همراه تعداد استفادشون
 */
export async function getTechniquesAndTheirUsageTimes(teacherId: string): Promise<TechniquesAndUsageTimesType[]> {
  try {
    const result = await knexInstance('plan_train_helper').select('techniqueNumber').count('* as usageCount').where({ teacherId }).groupBy('techniqueNumber').orderBy('usageCount', 'desc')

    // تبدیل خروجی به تایپی که می‌خواهیم
    return result as TechniquesAndUsageTimesType[]
  } catch (error) {
    throw new AppError('PLAN_PLAN_TRAIN_HELPER_DB_ERROR', 'خطا در کوئری دریافت تکنیک‌ها و تعداد استفاده در دیتابیس', 400, error)
  }
}

/**
 * دریافت اطلاعات حرکات به همراه تعداد استفادشون
 */
export async function getExercisesAndTheirUsageTimes(teacherId: string): Promise<ExercisesAndUsageTimesType[]> {
  try {
    const result = await knexInstance('plan_train_helper').select('exerciseNumber').count('* as usageCount').where({ teacherId }).groupBy('exerciseNumber').orderBy('usageCount', 'desc')

    // Cast the result to the expected type
    return result as { exerciseNumber: number; usageCount: number }[]
  } catch (error) {
    throw new AppError('PLAN_PLAN_TRAIN_HELPER_DB_ERROR', 'Database getExercisesAndTheirUsageTimes query error', 400, error)
  }
}
