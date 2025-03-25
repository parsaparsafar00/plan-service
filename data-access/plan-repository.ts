import type { Knex } from 'knex'
import type { PlanType } from '../domain/plan-schema.js'
import { AppError } from '@amard/error-handling'

let knexInstance: Knex

export function setKnexInstanceForPlanRepo(instance: Knex) {
  knexInstance = instance
}

/**
 * تولید برنامه تمرینی جدید در جدول plan_records
 */
export async function insertPlan(data: PlanType): Promise<PlanType> {
  try {
    // ایجاد سطر جدید
    const [inserted] = await knexInstance<PlanType>('plan_records')
      .insert(data)
      .returning('*')
    return inserted
  }
  catch (error) {
    throw new AppError('PLAN_DB_INSERT_ERROR', 'Database insertPlan query error', 500, error)
  }
}

/**
 * دریافت برنامه تمرینی با آیدی
 */
export async function getPlanById(id: string): Promise<PlanType | undefined> {
  try {
    return await knexInstance<PlanType>('plan_records')
      .where({ id })
      .first()
  }
  catch (error) {
    throw new AppError('PLAN_DB_QUERY_ERROR', 'Database getPlanById query error', 500, error)
  }
}

/**
 * ویرایش برنامه تمرینی
 */
export async function updatePlan(id: string, updates: Partial<PlanType>): Promise<PlanType> {
  try {
    const [updated] = await knexInstance<PlanType>('plan_records')
      .where({ id })
      .update(updates)
      .returning('*')
    return updated
  }
  catch (error) {
    throw new AppError('PLAN_DB_UPDATE_ERROR', 'Database updatePlan query error', 500, error)
  }
}

/**
 * حذف برنامه تمرینی
 */
export async function deletePlan(id: string): Promise<void> {
  try {
    await knexInstance('plan_records').where({ id }).del()
  }
  catch (error) {
    throw new AppError('PLAN_DB_DELETE_ERROR', 'Database deletePlan query error', 500, error)
  }
}
