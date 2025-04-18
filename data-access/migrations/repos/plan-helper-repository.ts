import type { Knex } from 'knex'
import type { PlanTrainHelperType } from '../../../domain/schemas/train-helper-schema.js'
import { AppError } from '@amard/error-handling'

let knexInstance: Knex

export function setKnexInstanceForTrainHelperRepo(instance: Knex) {
  knexInstance = instance
}

/**
 * تولید برنامه تمرینی جدید در جدول plan_train_helper
 */
export async function insertPlanTrainHelper(data: PlanTrainHelperType): Promise<PlanTrainHelperType> {
  try {
    // ایجاد سطر جدید
    const [inserted] = await knexInstance('plan_train_helper').insert(data).returning('*')
    return inserted
  }
  catch (error) {
    throw new AppError('PLAN_TRAIN_HELPER_DB_INSERT_ERROR', 'Database insertPlanTrainHelper query error', 500, error)
  }
}
