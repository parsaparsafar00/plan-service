import type { Knex } from 'knex'
import type { IdParamType } from '../domain/schemas/plan-general-schema.js'
import type { PlanListType, PlanType } from '../domain/schemas/plan-schema.js'
import { AppError } from '@amard/error-handling'

let knexInstance: Knex

export function setKnexInstanceForPlanRepo(instance: Knex) {
  knexInstance = instance
}

export function getKnexInstanceForPlanRepo() {
  return knexInstance
}

/**
 * تولید برنامه تمرینی جدید در جدول plan_records
 */
export async function insertPlan(data: PlanType, trx?: Knex.Transaction): Promise<PlanType> {
  try {
    // ساخت کوئری بیس
    const query = knexInstance<PlanType>('plan_records');
    
    // اجرای کوئری با تراکنش اگر وجود داشت
    const [inserted] = await (trx ? query.transacting(trx) : query).insert(data).returning('*');
    
    return inserted;
  } catch (error) {
    throw new AppError('PLAN_DB_INSERT_ERROR', 'Database insertPlan error', 500, error);
  }
}

/**
 * دریافت تمام برنامه ها بر اساس آیدی مربی
 */
export async function getPlansByTeacherId(id: IdParamType): Promise<PlanListType | undefined> {
  try {
    const teacherId = id.id
    return await knexInstance('plan_records').where({ teacherId })
  }
  catch (error) {
    throw new AppError('PLAN_DB_QUERY_ERROR', 'Database getPlansByTeacherId query error', 500, error)
  }
}

/**
 * دریافت برنامه تمرینی (هم پرینتی و هم عادی) با آیدی
 */
export async function getPlanById(id: IdParamType): Promise<PlanType> {
  try {
    const planId = id.id
    const plan = await knexInstance('plan_records').where({ id: planId }).first()
    if (!plan) throw new AppError('PLAN_NOT_FOUND', `برنامه با شناسه ${planId} یافت نشد`, 404)

    return plan
  }
  catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('PLAN_DB_QUERY_ERROR', 'خطای پایگاه داده در دریافت برنامه', 500, error)
  }
}

/**
 * ویرایش برنامه تمرینی
 */
export async function updatePlan(id: string, updates: Partial<PlanType>): Promise<PlanType> {
  try {
    const [updated] = await knexInstance<PlanType>('plan_records').where({ id }).update(updates).returning('*')
    return updated
  }
  catch (error) {
    throw new AppError('PLAN_DB_ACTION_ERROR', 'Database updatePlan query error', 500, error)
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
    throw new AppError('PLAN_DB_ERROR', 'Database deletePlan error', 500, error)
  }
}
