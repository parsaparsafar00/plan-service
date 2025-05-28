import type { Knex } from 'knex'
import type { AutoQueryData } from '@amard/auto-query'
import { attachAutoQuery } from '@amard/auto-query'
import type { SystemType, UpdateSystemRequestType } from '../domain/schemas/system-schema.js'
import { AppError } from '@amard/error-handling'

let knexInstance: Knex

export function setKnexInstanceForSystemRepo(instance: Knex) {
  knexInstance = instance
}

/**
 * مدل داده برای سطرهای جدول سیستم ها در دیتابیس
 */
export interface SystemEntity {
  number: number
  methodNumber: number
  repeat1: number
  repeat2: number
  repeat3: number
  repeat4: number
  repeat5: number
  repeat6: number
  repeat7: number
  repeat8: number
  description: string
}

/**
 * کمک به درج شماره سیستم تکرار به بصورت ترتیبی
 */
export async function getNextSystemNumber(): Promise<number> {
  try {
    const [row] = await knexInstance('plan_system_number_helper').increment('latestSystemNumber', 1).returning('latestSystemNumber')
    // معمولا دیتابیس آبجکتی از فیلدها رو پس میده
    return typeof row === 'object' ? Number(row.latestSystemNumber) : Number(row)
  } catch (error) {
    throw new AppError('PLAN_SYSTEMS_DB_ERROR', 'Database getNextSystemNumber error', 500, error)
  }
}

/**
 * تولید سیستم برنامه تمرینی جدید در جدول سیستم ها
 */
export async function insertPlanSystem(systemData: SystemType, trx?: Knex.Transaction): Promise<SystemType> {
  // ساخت کوئری بیس
  const query = knexInstance('plan_systems')

  try {
    // درج سیستم جدید (با استفاده از تراکنش اگر وجود داشت)
    const [inserted] = await (trx ? query.transacting(trx) : query).insert(systemData).returning('*')

    return inserted
  } catch (error) {
    throw new AppError('PLAN_SYSTEMS_DB_ERROR', 'Database insertPlanSystem query error', 400, error)
  }
}

/**
 * دریافت سیستم با استفاده از نام اختصاری
 */
export async function getSystemByAbbrName(abbrName: string, teacherId: string): Promise<SystemType | undefined> {
  try {
    return await knexInstance('plan_systems')
      .where(function () {
        this.where('isGlobal', true).orWhere('teacherId', teacherId)
      })
      .andWhere('abbrName', abbrName)
      .first()
  } catch (error) {
    throw new AppError('PLAN_SYSTEMS_DB_ERROR', 'Database getSystemByAbbrName query error', 400, error)
  }
}

/**
 * دریافت تمام سیستم های مربی
 */
export async function getAllSystemsByTeacherId(teacherId: string, autoQueryData: AutoQueryData): Promise<SystemType[]> {
  try {
    return await knexInstance('plan_systems')
      .where({ teacherId: teacherId })
      .orWhere({ isGlobal: true })
      .modify(qb => {
        attachAutoQuery(qb, autoQueryData)
      })
  } catch (error) {
    throw new AppError('PLAN_SYSTEMS_DB_ERROR', 'Database getAllSystemsByTeacherId query error', 400, error)
  }
}

/**
 * دریافت اطلاعات کامل سیستم های تمرینی با لیستی از آیدی سیستم ها
 */
export async function getSystemsByNumberList(numberList: number[]): Promise<Pick<SystemType, 'id' | 'number' | 'description' | 'descIsVisible' | 'methodNumber' | 'repeat1' | 'repeat2' | 'repeat3' | 'repeat4' | 'repeat5' | 'repeat6' | 'repeat7' | 'repeat8' | 'abbrName'>[]> {
  try {
    return await knexInstance('plan_systems').whereIn('number', numberList)
  } catch (error) {
    throw new AppError('PLAN_SYSTEMS_DB_ERROR', 'Database getSystemsByNumberList query error', 400, error)
  }
}

/**
 * دریافت سیستم با آیدی
 */
export async function getSystemById(id: string): Promise<SystemType | undefined> {
  try {
    return await knexInstance('plan_systems').where({ id }).first()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('PLAN_SYSTEMS_DB_ERROR', 'Database getSystemById query error', 400, error)
  }
}

/**
 * دریافت سیستم با استفاده از شماره سیستم
 */
export async function getSystemByNumber(number: number): Promise<SystemType | undefined> {
  try {
    return await knexInstance('plan_systems').where({ number }).first()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('PLAN_SYSTEMS_DB_ERROR', 'Database getSystemByNumber query error', 400, error)
  }
}

/**
 * برای ادمین در موارد خاص که میخواد کل سیستم ها رو ببینه
 */
export async function getAllSystems(autoQueryData: AutoQueryData): Promise<SystemType[]> {
  try {
    return await knexInstance('plan_systems').modify(qb => {
      attachAutoQuery(qb, autoQueryData)
    })
  } catch (error) {
    throw new AppError('PLAN_SYSTEMS_DB_ERROR', 'Database getAllSystems error', 500, error)
  }
}

/**
 * ویرایش سیستم تمرینی
 */
export async function updateSystem(id: string, updates: UpdateSystemRequestType): Promise<SystemType> {
  try {
    const [updated] = await knexInstance('plan_systems').where({ id }).update(updates).returning('*')
    return updated
  } catch (error) {
    throw new AppError('PLAN_SYSTEMS_DB_ERROR', 'Database updateSystem query error', 400, error)
  }
}

/**
 * حذف سیستم تمرینی
 */
export async function deleteSystem(id: string): Promise<void> {
  try {
    await knexInstance('plan_systems').where({ id }).del()
  } catch (error) {
    throw new AppError('PLAN_SYSTEMS_DB_ERROR', 'Database deleteSystem query error', 400, error)
  }
}
/**
 * آرایه‌ای گلوبال از همه سیستم های تکرار جهت جستجو و فیلتر در مموری
 */
let inMemorySystems: SystemEntity[] = []

/**
 * یکبار از دیتابیس همه‌ی سیستم ها را می‌خوانیم و در حافظه ذخیره می‌کنیم
 */
export async function loadAllSystems(): Promise<void> {
  if (!knexInstance) throw new AppError('PLAN_SYSTEM_ERROR', 'Knex instance not set in SystemRepo', 400)

  try {
    inMemorySystems = await knexInstance<SystemEntity>('plan_systems').select('*')
  } catch (error) {
    throw new AppError('PLAN_SYSTEM_ERROR', 'Database loadAllSystems query error', 400, error)
  }
}

/**
 * برگرداندن لیست سیستم های تکرار (آرایه) از درون حافظه
 */
export function getAllSystemsArray(): SystemEntity[] {
  return inMemorySystems
}
