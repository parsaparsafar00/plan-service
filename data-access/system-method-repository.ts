import type { Knex } from 'knex'
import type { AutoQueryData } from '@amard/auto-query'
import { attachAutoQuery } from '@amard/auto-query'
import type { SystemMethodType, UpdateSystemMethodRequestType } from '../domain/schemas/system-method-schema.js'
import { AppError } from '@amard/error-handling'

let knexInstance: Knex

export function setKnexInstanceForSystemMethodRepo(instance: Knex) {
  knexInstance = instance
}

/**
 * کمک به درج شماره متد بصورت ترتیبی
 */
export async function getNextSystemMethodNumber(): Promise<number> {
  try {
    const [row] = await knexInstance('plan_system_method_number_helper').increment('latestSystemMethodNumber', 1).returning('latestSystemMethodNumber')
    // معمولا دیتابیس آبجکتی از فیلدها رو پس میده
    return typeof row === 'object' ? Number(row.latestSystemMethodNumber) : Number(row)
  } catch (error) {
    throw new AppError('PLAN_SYSTEMS_DB_ERROR', 'Database getNextSystemMethodNumber error', 500, error)
  }
}

/**
 * تولید متد سیستم جدید در جدول سیستم ها
 */
export async function insertPlanSystemMethod(systemData: SystemMethodType): Promise<SystemMethodType> {
  try {
    const [inserted] = await knexInstance('plan_system_methods').insert(systemData).returning('*')
    return inserted
  } catch (error) {
    throw new AppError('PLAN_SYSTEM_METHODS_DB_ERROR', 'Database insertPlanSystemMethod query error', 400, error)
  }
}

/**
 * دریافت اطلاعات متد با استفاده از نام متد
 */
export async function getSystemMethodByMethodName(methodName: string): Promise<SystemMethodType | undefined> {
  try {
    return await knexInstance('plan_system_methods').where({ name: methodName }).first()
  } catch (error) {
    throw new AppError('PLAN_SYSTEM_METHODS_DB_ERROR', 'Database getSystemMethodByMethodName query error', 400, error)
  }
}

/**
 * دریافت اطلاعات متد با استفاده از شماره متد
 */
export async function getSystemMethodByMethodNumber(number: number): Promise<SystemMethodType | undefined> {
  try {
    return await knexInstance('plan_system_methods').where({ number }).first()
  } catch (error) {
    throw new AppError('PLAN_SYSTEM_METHODS_DB_ERROR', 'Database getSystemMethodByMethodNumber query error', 400, error)
  }
}

/**
 * دریافت متد سیستم با آیدی
 */
export async function getSystemMethodById(id: string): Promise<SystemMethodType | undefined> {
  try {
    return await knexInstance('plan_system_methods').where({ id }).first()
  } catch (error) {
    throw new AppError('PLAN_SYSTEM_METHODS_DB_ERROR', 'Database getSystemMethodById query error', 400, error)
  }
}

/**
 * دریافت متد سیستم با شماره
 */
export async function getSystemMethodByNumber(number: number): Promise<SystemMethodType | undefined> {
  try {
    return await knexInstance('plan_system_methods').where({ number }).first()
  } catch (error) {
    throw new AppError('PLAN_SYSTEM_METHODS_DB_ERROR', 'Database getSystemMethodByNumber query error', 400, error)
  }
}

/**
 * برای ادمین در موارد خاص که میخواد کل متد ها رو ببینه
 */
export async function getAllSystemMethods(autoQueryData: AutoQueryData): Promise<SystemMethodType[]> {
  try {
    return await knexInstance('plan_system_methods').modify(qb => {
      attachAutoQuery(qb, autoQueryData)
    })
  } catch (error) {
    throw new AppError('PLAN_SYSTEM_METHODS_DB_ERROR', 'Database getAllSystemMethods error', 500, error)
  }
}

/**
 * ویرایش متد سیستم تمرینی
 */
export async function updateSystemMethod(id: string, updates: UpdateSystemMethodRequestType): Promise<SystemMethodType | undefined> {
  try {
    const [updated] = await knexInstance('plan_system_methods').where({ id }).update(updates).returning('*')
    return updated
  } catch (error) {
    throw new AppError('PLAN_SYSTEM_METHODS_DB_ERROR', 'Database updateSystemMethod query error', 400, error)
  }
}

/**
 * حذف متد سیستم تمرینی
 */
export async function deleteSystemMethod(id: string): Promise<void> {
  try {
    await knexInstance('plan_system_methods').where({ id }).del()
  } catch (error) {
    throw new AppError('PLAN_SYSTEM_METHODS_DB_ERROR', 'Database deleteSystemMethod query error', 400, error)
  }
}
