import type { Knex } from 'knex'
import type * as generalSchema from '../../../domain/schemas/plan-general-schema.js'
import type { TechniqueListType, TechniqueType } from '../../../domain/schemas/technique-schema.js'
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
    const existingRecord = await knexInstance('plan_techniques').where('abbrName', data.abbrName).first()
    if (!existingRecord) {
      // ایجاد سطر جدید
      const [inserted] = await knexInstance<TechniqueType>('plan_techniques').insert(data).returning('*')
      return inserted // برگرداندن رکورد ذخیره شده
    }
    else {
      return existingRecord // برگرداندن رکورد موجود اگر پیدا شود
    }
  }
  catch (error) {
    throw new AppError('PLAN_TECHNIQUES_DB_INSERT_ERROR', 'خطا در دیتابیس insertTechnique', 500, error)
  }
}

/**
 * دریافت تمام تکنیک ها
 */
export async function getTechniquesByTeacherId(teacherId: string): Promise<TechniqueListType | undefined> {
  try {
    return await knexInstance('plan_techniques').where({ teacherId })
  }
  catch (error) {
    throw new AppError('PLAN_TECHNIQUES_DB_QUERY_ERROR', 'Database getTechniquesByTeacherId query error', 500, error)
  }
}

/**
 * دریافت تکنیک با آیدی
 */
export async function getTechniqueById(id: generalSchema.IdParamType): Promise<TechniqueType | undefined> {
  try {
    const techniqueId = id.id
    const technique = await knexInstance('plan_techniques').where({ id: techniqueId }).first()
    return technique
  }
  catch (error) {
    if (error instanceof AppError)
      throw error
    throw new AppError('PLAN_TECHNIQUES_DB_QUERY_ERROR', 'خطای پایگاه داده در دریافت تکنیک', 500, error)
  }
}

/**
 * ویرایش تکنیک
 */
export async function updateTechnique(id: string, updates: Partial<TechniqueType>): Promise<TechniqueType | undefined> {
  try {
    const [updated] = await knexInstance('plan_techniques').where({ id }).update(updates).returning('*')
    return updated
  }
  catch (error) {
    throw new AppError('PLAN_TECHNIQUES_DB_UPDATE_ERROR', 'Database updateTechnique query error', 500, error)
  }
}

/**
 * حذف تکنیک تمرینی
 */
export async function deleteTechnique(id: string): Promise<void> {
  try {
    await knexInstance('plan_techniques').where({ id }).del()
  }
  catch (error) {
    throw new AppError('PLAN_TECHNIQUES_DB_DELETE_ERROR', 'Database deleteTechnique query error', 500, error)
  }
}
