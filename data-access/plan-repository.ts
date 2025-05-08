import type { Knex } from 'knex'
import type { AutoQueryData } from '@amard/auto-query'
import { attachAutoQuery } from '@amard/auto-query'
import type { PlanType } from '../domain/schemas/plan-schema.js'
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
    const query = knexInstance('plan_records');
    
    // اجرای کوئری با تراکنش اگر وجود داشت
    const [inserted] = await (trx ? query.transacting(trx) : query).insert(data).returning('*');
    return inserted;

  } catch (error) {
    throw new AppError('PLAN_PLAN_ERROR', 'Database insertPlan query error', 400, error);
  }
}

/**
 * دریافت تمام برنامه ها بر اساس آیدی مربی
 */
export async function getPlansByTeacherId(teacherId: string, autoQueryData: AutoQueryData): Promise<PlanType[]> {
  try {
    return await knexInstance('plan_records').where({ teacherId }).modify((qb) => {
      attachAutoQuery(qb, autoQueryData)
    })
  }
  catch (error) {
    throw new AppError('PLAN_PLAN_ERROR', 'Database getPlansByTeacherId query error', 400, error)
  }
}

/**
 * دریافت برنامه تمرینی (هم پرینتی و هم عادی) با آیدی
 */
export async function getPlanById(id: string): Promise<PlanType | undefined> {
  try {
    const plan = await knexInstance('plan_records').where({ id }).first()
    return plan
  }
  catch (error) {
    throw new AppError('PLAN_PLAN_ERROR', 'Database getPlanById query error', 400, error)
  }
}

// برای ادمین در موارد خاص که میخواد کل برنامه ها رو ببینه
export async function getAllPlans(autoQueryData: AutoQueryData): Promise<PlanType[]> {
  try {
    const plans = await knexInstance('plan_records').modify((qb) => {
      attachAutoQuery(qb, autoQueryData)
    })
    return plans
  }
  catch (error) {
    throw new AppError('PLAN_PLAN_DB_ERROR', 'Database getAllPlans error', 500, error)
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
    throw new AppError('PLAN_PLAN_ERROR', 'Database updatePlan query error', 400, error)
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
    throw new AppError('PLAN_PLAN_ERROR', 'Database deletePlan query error', 400, error)
  }
}
