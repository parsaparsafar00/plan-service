import type { Knex } from 'knex'
import type { PlanType, PlanTrainHelperType, SystemType, TechniqueType } from '../domain/plan-schema.js'
import { AppError } from '@amard/error-handling'

let knexInstance: Knex

export function setKnexInstanceForPlanRepo(instance: Knex) {
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

/**
 * تولید برنامه تمرینی جدید در جدول plan_records
 */
export async function insertPlan(data: PlanType): Promise<PlanType> {
  try {
    // ایجاد سطر جدید
    const [inserted] = await knexInstance<PlanType>('plan_records').insert(data).returning('*')
    return inserted
  }
  catch (error) {
    throw new AppError('PLAN_DB_INSERT_ERROR', 'Database insertPlan query error', 500, error)
  }
}

/**
 * تولید برنامه تمرینی جدید در جدول plan_train_helper
 */
export async function insertPlanTrainHelper(data: PlanTrainHelperType): Promise<PlanTrainHelperType> {
  try {
    // ایجاد سطر جدید
    const [inserted] = await knexInstance<PlanType>('plan_train_helper').insert(data).returning('*')
    return inserted
  }
  catch (error) {
    throw new AppError('PLAN_TRAIN_HELPER_DB_INSERT_ERROR', 'Database insertPlanTrainHelper query error', 500, error)
  }
}

/**
 * دریافت برنامه تمرینی با آیدی
 */
export async function getPlanById(id: string): Promise<PlanType | undefined> {
  try {
    return await knexInstance<PlanType>('plan_records')
      .where({ id })
      .first()
  }
  catch (error) {
    throw new AppError('PLAN_DB_QUERY_ERROR', 'Database getPlanById query error', 500, error)
  }
}

/**
 * ویرایش برنامه تمرینی
 */
export async function updatePlan(id: string, updates: Partial<PlanType>): Promise<PlanType> {
  try {
    const [updated] = await knexInstance<PlanType>('plan_records')
      .where({ id })
      .update(updates)
      .returning('*')
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
