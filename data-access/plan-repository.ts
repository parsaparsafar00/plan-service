import type { Knex } from 'knex'
import type { PlanType } from '../domain/plan-schema.ts'
import { AppError } from '@amard/error-handling'

let knexInstance: Knex

export function setKnexInstanceForPlanRepo(instance: Knex) {
  knexInstance = instance
}

/**
 * تولید برنامه تمرینی جدید
 */
export async function insertPlan(data: PlanType): Promise<PlanType> {
  try {
    const [inserted] = await knexInstance('plan_records').insert(data).returning('*')
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
    return await knexInstance('plan_records').where({ id }).first()
  }
  catch (error) {
    throw new AppError('PLAN_DB_QUERY_ERROR', 'Database getPlanById query error', 500, error)
  }
}

/**
 * دریافت برنامه تمرینی با آیدی
 */
export async function generatePlan(query: string, values: any[]): Promise<PlanType[]> {
  try {
    const result = await knexInstance.raw(query, values); // Remove the extra array around `values`
    return result.rows; // Return the array of rows
  } catch (error) {
    throw new AppError('PLAN_DB_QUERY_ERROR', 'Database generatePlan query error', 500, error);
  }
}
/**
 * ویرایش برنامه تمرینی
 */
export async function updatePlan(id: string, updates: Partial<PlanType>): Promise<PlanType> {
  try {
    const [updated] = await knexInstance('plan_records').where({ id }).update(updates).returning('*')
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
