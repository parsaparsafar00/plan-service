import type { Knex } from 'knex'
import type * as generalSchema from '../../../domain/schemas/plan-general-schema.js'
import type { SystemListType, SystemType, GetSystemByIdListRequestType, SystemInPlanListSchemaType, systemInPlanOutputSchemaType, UpdateSystemsByIdListType } from '../../../domain/schemas/system-schema.js'
import { AppError } from '@amard/error-handling'
import { DateTime } from 'luxon'

let knexInstance: Knex

export function setKnexInstanceForSystemRepo(instance: Knex) {
  knexInstance = instance
}

/**
 * تولید سیستم برنامه تمرینی جدید در جدول plan_systems
 */
export async function insertPlanSystem(data: SystemType, trx?: Knex.Transaction): Promise<SystemType> {
  // تبدیل repeatPattern به رشته JSON در صورت آرایه بودن
  const systemData = {
    ...data,
    repeatPattern: Array.isArray(data.repeatPattern) 
      ? JSON.stringify(data.repeatPattern) 
      : data.repeatPattern
  };

  // ساخت کوئری بیس
  const query = knexInstance<SystemType>('plan_systems')
  
  // بررسی وجود سیستم تکراری (با استفاده از تراکنش اگر وجود داشت)
  const existingRecord = await (trx ? query.transacting(trx) : query)
    .where('abbrName', systemData.abbrName)
    .where({teacherId: systemData.teacherId})
    .first();

  if (existingRecord) {
    if (!trx) {
      // درصورتی ارور بده که سیستم توسط هوش مصنوعی تولید شده باشه، در غیر این صورت سیستم رو برگردونه
      throw new AppError('SYSTEM_ALREADY_EXISTS', 'سیستم با این نام اختصاری از قبل وجود دارد', 409);
    } else { 
      console.log("existing")
      return existingRecord
    }
  }

  try {
    // درج سیستم جدید (با استفاده از تراکنش اگر وجود داشت)
    const [inserted] = await (trx ? query.transacting(trx) : query).insert(systemData).returning('*');

    // تبدیل رشته JSON به آرایه در صورت نیاز
    const result = {
      ...inserted,
      repeatPattern: typeof inserted.repeatPattern === 'string'
        ? JSON.parse(inserted.repeatPattern)
        : inserted.repeatPattern
    };

    return result;
  } catch (error) {
    // فقط خطاهای غیرمنتظره دیتابیس را کچ می‌کنیم
    throw new AppError('SYSTEM_ACTION_ERROR', 'خطا در ذخیره سیستم جدید', 500, error);
  }
}

/**
 * دریافت سیستم با استفاده از نام اختصاری
 */
export async function getSystemByAbbrName(abbrName: string, teacherId: generalSchema.IdParamType): Promise<SystemType | undefined> {
  try {
    return await knexInstance('plan_systems').where(function() {
      this.where('isGlobal', true).orWhere('teacherId', teacherId);
    })
    .andWhere('abbrName', abbrName)
    .first();
  }
  catch (error) {
    throw new AppError('SYSTEMS_DB_ACTION_ERROR', 'Database getSystemByAbbrName query error', 500, error)
  }
}

/**
 * دریافت تمام سیستم ها
 */
export async function getAllSystemsByTeacherId(id: generalSchema.IdParamType): Promise<SystemListType | undefined> {
  try {
    const teacherId = id.id

    return await knexInstance('plan_systems').where(function() {
      this.where('isGlobal', true).orWhere('teacherId', teacherId);
    })
  }
  catch (error) {
    throw new AppError('SYSTEM_DB_QUERY_ERROR', 'Database getAllSystemsByTeacherId query error', 500, error)
  }
}

/**
 * دریافت اطلاعات کامل سیستم های تمرینی با لیستی از آیدی سیستم ها
 */
export async function getSystemsByIdList(input: GetSystemByIdListRequestType): Promise<SystemInPlanListSchemaType> {
  try {
    // گرفتن لیست آیدی سیستم ها 
    const idList = input.map(item => item.id);

    return await knexInstance<systemInPlanOutputSchemaType>('plan_systems').whereIn('id', idList);

  } catch (error) {
    throw new AppError('SYSTEM_DB_QUERY_ERROR', 'Database getSystemsByIdList query error', 500, error);
  }
}

/**
 * دریافت سیستم تمرینی با آیدی
 */
export async function getSystemById(id: generalSchema.IdParamType): Promise<SystemType | undefined> {
  try {
    const systemId = id.id
    const system = await knexInstance('plan_systems').where({ id: systemId }).first()

    // اگر repeatPattern به عنوان رشته JSON ذخیره شده، آن را به آرایه بازگردان
    if (system && typeof system.repeatPattern === 'string') system.repeatPattern = JSON.parse(system.repeatPattern)
    return system
  }
  catch (error) {
    if (error instanceof AppError)
      throw error
    throw new AppError('SYSTEM_DB_QUERY_ERROR', 'خطای پایگاه داده در دریافت سیستم', 500, error)
  }
}

/**
 * ویرایش سیستم تمرینی
 */
export async function updateSystem(id: string, updates: Partial<SystemType>): Promise<SystemType | undefined> {
  try {
    if (Array.isArray(updates.repeatPattern)) updates.repeatPattern = JSON.stringify(updates.repeatPattern)

    const [updated] = await knexInstance('plan_systems').where({ id }).update(updates).returning('*')

    // اگر repeatPattern به عنوان رشته JSON ذخیره شده، آن را به آرایه بازگردان
    if (typeof updated.repeatPattern === 'string')
      updated.repeatPattern = JSON.parse(updated.repeatPattern)

    return updated
  }
  catch (error) {
    throw new AppError('SYSTEMS_DB_ACTION_ERROR', 'Database updateSystem query error', 500, error)
  }
}

/**
 * ویرایش تعداد دفعات استفاده از سیستم تمرینی بر حسب آیدی مربی 
 */
export async function updateSystemUsageTimesByIdList(systemsToUpdate: UpdateSystemsByIdListType, trx?: Knex.Transaction): Promise<SystemType[] | undefined> {
  const { idList, countList } = systemsToUpdate;
  
  if (idList.length === 0 || countList.length === 0 || idList.length !== countList.length) {
    throw new AppError('INVALID_INPUT', 'Invalid input for update', 400);
  }

  const query = trx ?? knexInstance;

  const updatedSystems: SystemType[] = [];

  for (let i = 0; i < idList.length; i++) {
    const id = idList[i];
    const count = countList[i];
    const nowStr = DateTime.now().toFormat('yyyy-LL-dd HH:mm:ss')

    const [updated] = await query<SystemType>('plan_systems').where({ id }).increment('usageTimes', count).update('updatedAt', nowStr).returning('*');

    if (!updated) {
      throw new AppError('SYSTEMS_DB_ACTION_ERROR', 'Database updateSystemUsageTimesByIdList query error', 500)
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
    throw new AppError('SYSTEM_ACTION_ERROR', 'Database deleteSystem query error', 500, error)
  }
}
