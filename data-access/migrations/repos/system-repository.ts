import type { Knex } from 'knex'
import type { SystemType } from '../../../domain/schemas/system-schema.js'
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
      if (typeof inserted.repeatPattern === 'string') {
        inserted.repeatPattern = JSON.parse(inserted.repeatPattern);
      }

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
export async function getAllSystemsByTeacherId(teacherId: string): Promise<SystemType | undefined> {
  try {
    return await knexInstance<SystemType>('plan_systems').where({ teacherId });
  } catch (error) {
    throw new AppError('PLAN_SYSTEM_DB_QUERY_ERROR', 'Database getAllSystemsByTeacherId query error', 500, error);
  }
}
