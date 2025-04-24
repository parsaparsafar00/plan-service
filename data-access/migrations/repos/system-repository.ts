import type { Knex } from 'knex'
import type { SystemType } from '../../../domain/schemas/system-schema.js'
import * as generalSchema from '../../../domain/schemas/plan-general-schema.js'
import { AppError } from '@amard/error-handling'

let knexInstance: Knex

export function setKnexInstanceForSystemRepo(instance: Knex) {
  knexInstance = instance
}

/**
 * تولید سیستم برنامه تمرینی جدید در جدول plan_systems
 */
export async function insertPlanSystem(data: SystemType): Promise<SystemType> {
  try {
    // بررسی اینکه آیا نام اختصاری در دیتابیس موجود است یا خیر
    const existingRecord = await knexInstance<SystemType>('plan_systems').where('abbrName', data.abbrName).first();
    if (!existingRecord) {

      // اطمینان از اینکه فیلد repeatPattern به‌درستی به رشته جیسان تبدیل شود
      if (Array.isArray(data.repeatPattern)) data.repeatPattern = JSON.stringify(data.repeatPattern);
      
      // ایجاد سطر جدید
      const [inserted] = await knexInstance<SystemType>('plan_systems').insert(data).returning('*');

      // اگر repeatPattern به عنوان رشته JSON ذخیره شده، آن را به آرایه بازگردان
      if (typeof inserted.repeatPattern === 'string') inserted.repeatPattern = JSON.parse(inserted.repeatPattern);

      return inserted; // برگرداندن رکورد ذخیره شده
    } else {
      return existingRecord; // برگرداندن رکورد موجود اگر پیدا شود
    }
  } catch (error) {
    throw new AppError('PLAN_SYSTEMS_DB_INSERT_ERROR', 'خطا در دیتابیس insertPlanSystem', 500, error);
  }
}

/**
 * دریافت تمام سیستم ها
 */
export async function getAllSystemsByTeacherId(id: generalSchema.IdParamType): Promise<SystemType | undefined> {
  try {
    const teacherId = id.id
    return await knexInstance('plan_systems').where({ teacherId: teacherId });
  } catch (error) {
    throw new AppError('PLAN_SYSTEM_DB_QUERY_ERROR', 'Database getAllSystemsByTeacherId query error', 500, error);
  }
}

/**
 * دریافت سیستم تمرینی با آیدی
*/
export async function getSystemById(id: generalSchema.IdParamType): Promise<SystemType | undefined> {
  try {
    const systemId = id.id
    const system = await knexInstance('plan_systems').where({ id: systemId }).first();

     // اگر repeatPattern به عنوان رشته JSON ذخیره شده، آن را به آرایه بازگردان
     if (typeof system.repeatPattern === 'string') system.repeatPattern = JSON.parse(system.repeatPattern);
    return system;

  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('PLAN_SYSTEM_DB_QUERY_ERROR', 'خطای پایگاه داده در دریافت سیستم', 500, error);
  }
}

/**
 * ویرایش سیستم تمرینی
*/
export async function updateSystem(id: string, updates: Partial<SystemType>): Promise<SystemType | undefined> {
  try {

    if (Array.isArray(updates.repeatPattern)) updates.repeatPattern = JSON.stringify(updates.repeatPattern);
    
    const [updated] = await knexInstance('plan_systems').where({ id }).update(updates).returning('*');

    // اگر repeatPattern به عنوان رشته JSON ذخیره شده، آن را به آرایه بازگردان
    if (typeof updated.repeatPattern === 'string') updated.repeatPattern = JSON.parse(updated.repeatPattern);

    return updated
  }
  catch (error) {
    throw new AppError('PLAN_SYSTEMS_DB_UPDATE_ERROR', 'Database updateSystem query error', 500, error)
  }
}

/**
 * حذف سیستم تمرینی
*/
export async function deleteSystem(id: string): Promise<void> {
  try {
    await knexInstance('plan_systems').where({ id }).del()
  }
  catch (error) {
    throw new AppError('PLAN_SYSTEMS_DB_DELETE_ERROR', 'Database deleteSystem query error', 500, error)
  }
}


