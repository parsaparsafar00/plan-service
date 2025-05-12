import type { Knex } from 'knex'
import type { AutoQueryData } from '@amard/auto-query'
import { attachAutoQuery } from '@amard/auto-query'
import type { SystemType, systemInPlanOutputType, UpdateSystemsByIdListType } from '../domain/schemas/system-schema.js'
import { AppError } from '@amard/error-handling'
import { DateTime } from 'luxon'

let knexInstance: Knex

export function setKnexInstanceForSystemRepo(instance: Knex) {
  knexInstance = instance
}

/**
 * تولید سیستم برنامه تمرینی جدید در جدول plan_systems
 */
export async function insertPlanSystem(systemData: SystemType, trx?: Knex.Transaction): Promise<SystemType> {

  // ساخت کوئری بیس
  const query = knexInstance('plan_systems')
  
  // بررسی وجود سیستم تکراری (با استفاده از تراکنش اگر وجود داشت)
  const existingRecord = await (trx ? query.transacting(trx) : query).where('abbrName', systemData.abbrName).andWhere({teacherId: systemData.teacherId}).first();

  if (existingRecord) {
    if (!trx) {
      // درصورتی ارور بده که سیستم توسط هوش مصنوعی تولید شده باشه، در غیر این صورت سیستم رو برگردونه
      throw new AppError('PLAN_SYSTEMS_DB_ERROR', 'System already exists', 400);
    } else { 
      return existingRecord
    }
  }

  try {
    // درج سیستم جدید (با استفاده از تراکنش اگر وجود داشت)
    const [inserted] = await (trx ? query.transacting(trx) : query).insert(systemData).returning('*');

    return inserted;
  } catch (error) {
    // فقط خطاهای غیرمنتظره دیتابیس را کچ می‌کنیم
    throw new AppError('PLAN_SYSTEMS_DB_ERROR', 'Database insertPlanSystem query error', 400, error);
  }
}

/**
 * دریافت سیستم با استفاده از نام اختصاری
 */
export async function getSystemByAbbrName(abbrName: string, teacherId: string): Promise<SystemType | undefined> {
  try {
    return await knexInstance('plan_systems').where(function() {
      this.where('isGlobal', true).orWhere('teacherId', teacherId);
    })
    .andWhere('abbrName', abbrName)
    .first();
  }
  catch (error) {
    throw new AppError('PLAN_SYSTEMS_DB_ERROR', 'Database getSystemByAbbrName query error', 400, error)
  }
}

/**
 * دریافت تمام سیستم ها
 */
export async function getAllSystemsByTeacherId(teacherId: string, autoQueryData: AutoQueryData): Promise<SystemType[]> {
  try {
    return await knexInstance('plan_systems').where({teacherId: teacherId}).orWhere({isGlobal: true}).modify((qb) => {
      attachAutoQuery(qb, autoQueryData)
    })
  }
  catch (error) {
    throw new AppError('PLAN_SYSTEMS_DB_ERROR', 'Database getAllSystemsByTeacherId query error', 400, error)
  }
}

/**
 * دریافت اطلاعات کامل سیستم های تمرینی با لیستی از آیدی سیستم ها
 */
export async function getSystemsByIdList(idList: string[]): Promise<systemInPlanOutputType[]> {
  try {
    return await knexInstance('plan_systems').whereIn('id', idList);
  } catch (error) {
    throw new AppError('PLAN_SYSTEMS_DB_ERROR', 'Database getSystemsByIdList query error', 400, error);
  }
}

/**
 * دریافت سیستم تمرینی با آیدی
 */
export async function getSystemById(id: string): Promise<SystemType | undefined> {
  try {
    return await knexInstance('plan_systems').where({ id }).first()
  }
  catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('PLAN_SYSTEMS_DB_ERROR', 'Database getSystemById query error', 400, error)
  }
}

// برای ادمین در موارد خاص که میخواد کل سیستم ها رو ببینه
export async function getAllSystems(autoQueryData: AutoQueryData): Promise<SystemType[]> {
  try {
    const plans = await knexInstance('plan_systems').modify((qb) => {
      attachAutoQuery(qb, autoQueryData)
    })
    return plans
  }
  catch (error) {
    throw new AppError('PLAN_SYSTEMS_DB_ERROR', 'Database getAllSystems error', 500, error)
  }
}

/**
 * ویرایش سیستم تمرینی
 */
export async function updateSystem(id: string, updates: Partial<SystemType>): Promise<SystemType | undefined> {
  try {

    const [updated] = await knexInstance('plan_systems').where({ id }).update(updates).returning('*')
    return updated
  }
  catch (error) {
    throw new AppError('PLAN_SYSTEMS_DB_ERROR', 'Database updateSystem query error', 400, error)
  }
}

/**
 * ویرایش تعداد دفعات استفاده از سیستم تمرینی بر حسب آیدی مربی 
 */
export async function updateSystemUsageTimesByIdList(systemsToUpdate: UpdateSystemsByIdListType, trx?: Knex.Transaction): Promise<SystemType[] | undefined> {
  const { idList, countList } = systemsToUpdate;
  
  if (idList.length === 0 || countList.length === 0 || idList.length !== countList.length) {
    throw new AppError('PLAN_SYSTEMS_DB_ERROR', 'Invalid input for update', 400);
  }

  const query = trx ?? knexInstance;

  const updatedSystems: SystemType[] = [];

  for (let i = 0; i < idList.length; i++) {
    const id = idList[i];
    const count = countList[i];
    const nowStr = DateTime.now().toFormat('yyyy-LL-dd HH:mm:ss')

    const [updated] = await query<SystemType>('plan_systems').where({ id }).increment('usageTimes', count).update('updatedAt', nowStr).returning('*');

    if (!updated) {
      throw new AppError('PLAN_SYSTEMS_DB_ERROR', 'Database updateSystemUsageTimesByIdList query error', 400)
    }
  }

  return updatedSystems.length > 0 ? updatedSystems : undefined;
}

/**
 * حذف سیستم تمرینی
 */
export async function deleteSystem(id: string): Promise<void> {
  try {
    await knexInstance('plan_systems').where({ id }).del()
  }
  catch (error) {
    throw new AppError('PLAN_SYSTEMS_DB_ERROR', 'Database deleteSystem query error', 400, error)
  }
}