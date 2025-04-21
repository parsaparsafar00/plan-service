import type { Knex } from 'knex'
import type { TechniqueType } from '../../../domain/schemas/technique-schema.js'
import { AppError } from '@amard/error-handling'

let knexInstance: Knex

export function setKnexInstanceForTechniqueRepo(instance: Knex) {
  knexInstance = instance
}

/**
 * تولید تکنیک جدید در جدول plan_techniques
 */
export async function insertTechnique(data: TechniqueType): Promise<TechniqueType> {
  try {
    // بررسی اینکه آیا نام اختصاری در دیتابیس موجود است یا خیر
    const existingRecord = await knexInstance<TechniqueType>('plan_techniques').where('abbrName', data.abbrName).first();
    if (!existingRecord) {
      
      // ایجاد سطر جدید
      const [inserted] = await knexInstance<TechniqueType>('plan_techniques').insert(data).returning('*');
      return inserted; // برگرداندن رکورد ذخیره شده

    } else {
      return existingRecord; // برگرداندن رکورد موجود اگر پیدا شود
    }
  } catch (error) {
    throw new AppError('PLAN_TECHNIQUES_DB_INSERT_ERROR', 'خطا در دیتابیس insertTechnique', 500, error);
  }
}

/**
 * دریافت تمام تکنیک ها
 */
export async function getTechniquesByTeacherId(teacherId: string): Promise<TechniqueType | undefined> {
  try {
    return await knexInstance<TechniqueType>('plan_techniques').where({ teacherId });
  } catch (error) {
    throw new AppError('PLAN_TECHNIQUES_DB_QUERY_ERROR', 'Database getTechniquesByTeacherId query error', 500, error);
  }
}
