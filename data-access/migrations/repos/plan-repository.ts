import type { Knex } from 'knex'
import type { PlanType } from '../../../domain/schemas/plan-schema.js'
import { AppError } from '@amard/error-handling'
import { IdParamType } from '../../../domain/schemas/plan-general-schema.js'

let knexInstance: Knex

export function setKnexInstanceForPlanRepo(instance: Knex) {
  knexInstance = instance
}

/**
 * تولید برنامه تمرینی جدید در جدول plan_records
*/
export async function insertPlan(data: PlanType): Promise<PlanType> {
  try {
    const [inserted] = await knexInstance<PlanType>('plan_records').insert(data).returning('*')
    return inserted
  }
  catch (error) {
    throw new AppError('PLAN_DB_INSERT_ERROR', 'Database insertPlan query error', 500, error)
  }
}

/**
 * دریافت تمام برنامه ها بر اساس آیدی مربی
*/
export async function getPlansByTeacherId(id: IdParamType): Promise<PlanType | undefined> {
  try {
    const teacherId = id.id
    return await knexInstance('plan_records').where({ teacherId: teacherId });
  } catch (error) {
    throw new AppError('PLAN_DB_QUERY_ERROR', 'Database getPlansByTeacherId query error', 500, error);
  }
}

/**
 * دریافت برنامه تمرینی (هم پرینتی و هم عادی) با آیدی
*/
export async function getPlanById(id: IdParamType): Promise<PlanType> {
  try {
    const planId = id.id
    const plan = await knexInstance('plan_records').where({ id: planId }).first();
    
    if (!plan) throw new AppError('PLAN_NOT_FOUND', `برنامه با شناسه ${id} یافت نشد`, 404);
    return plan;

  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('PLAN_DB_QUERY_ERROR', 'خطای پایگاه داده در دریافت برنامه', 500, error);
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
