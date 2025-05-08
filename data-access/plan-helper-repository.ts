import type { Knex } from 'knex'
import type { PlanTrainHelperType } from '../domain/schemas/train-helper-schema.js'
import { AppError } from '@amard/error-handling'

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
    const query = knexInstance('plan_train_helper');
    
    // اجرای کوئری با تراکنش اگر وجود داشت
    const [inserted] = await (trx ? query.transacting(trx) : query).insert(data).returning('*');
    
    return inserted;
  } catch (error) {
    throw new AppError('PLAN_PLAN_TRAIN_HELPER_ERROR', 'Database insertPlanTrainHelper query error', 500, error instanceof Error ? error.message : String(error));
  }
}

/**
 * حذف یک رکورد کمکی فقط برای ادمین در موارد خاص که بعیده استفاده بشه در حالت عادی
 */
export async function deleteHelperById(id: string): Promise<void> {
  try {
    await knexInstance('plan_train_helper').where({ id }).del()
  }
  catch (error) {
    throw new AppError('PLAN_PLAN_TRAIN_HELPER_ERROR', 'Database deleteHelperById query error', 500, error)
  }
}

