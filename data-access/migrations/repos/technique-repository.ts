import type { Knex } from 'knex'
import type * as generalSchema from '../../../domain/schemas/plan-general-schema.js'
import type { TechniqueListType, TechniqueType, GetTechnqiuesByIdListType, techniqueInPlanOutputSchemaType, TechniqueInPlanListSchemaType, UpdateTechniquesByIdListType } from '../../../domain/schemas/technique-schema.js'
import { AppError } from '@amard/error-handling'
import { DateTime } from 'luxon'

let knexInstance: Knex

export function setKnexInstanceForTechniqueRepo(instance: Knex) {
  knexInstance = instance
}

/**
 * تولید تکنیک جدید در جدول plan_techniques
 */
export async function insertTechnique(data: TechniqueType): Promise<TechniqueType> {
  try {
    const existingRecord = await knexInstance('plan_techniques')
      .where(function() {
        this.where('isGlobal', true).orWhere('teacherId', data.teacherId);
      })
      .andWhere('abbrName', data.abbrName)
      .first();

    if (!existingRecord) {
      const [inserted] = await knexInstance('plan_techniques').insert(data).returning('*');
      return inserted;
    }
    
    throw new AppError('TECHNIQUE_ALREADY_EXISTS', 'تکنیک با اطلاعات وارد شده، در سیستم های شما موجود است', 409);
  }
  catch (error) {
    // اگر ارور بالایی هست، صرفا برش
    if (error instanceof AppError) {
      throw error;
    }
    
    console.error('Error in insertTechnique:', error);
    throw new AppError('TECHNIQUES_DB_ACTION_ERROR', 'خطا در دیتابیس insertTechnique', 500, error);
  }
}

/**
 * دریافت تمام تکنیک ها
 */
export async function getTechniquesByTeacherId(teacherId: string): Promise<TechniqueListType> {
  try {

    return await knexInstance('plan_techniques').where(function() {
      this.where('isGlobal', true).orWhere('teacherId', teacherId);
    })
  }
  catch (error) {
    throw new AppError('PLAN_TECHNIQUES_DB_QUERY_ERROR', 'Database getTechniquesByTeacherId query error', 500, error)
  }
}

/**
 * دریافت اطلاعات تکنیک های تمرینی با لیستی از آیدی تکنیک ها
 */
export async function getTechniquesByIdList(input: GetTechnqiuesByIdListType): Promise<TechniqueInPlanListSchemaType | undefined> {
  try {
    // گرفتن لیست آیدی تکنیک ها ها 
    const idList = input.map(item => item.id);

    return await knexInstance<techniqueInPlanOutputSchemaType>('plan_techniques').whereIn('id', idList);

  } catch (error) {
    throw new AppError('TECHNIQUES_DB_QUERY_ERROR', 'Database getTechniquesByIdList query error', 500, error);
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
    throw new AppError('TECHNIQUES_ACTION_ERROR', 'Database updateTechnique query error', 500, error)
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
    throw new AppError('TECHNIQUES_ACTION_ERROR', 'Database deleteTechnique query error', 500, error)
  }
}

/**
 * ویرایش تعداد دفعات استفاده از تکنیک بر حسب آیدی مربی 
 */
export async function updateTechniqueUsageTimesByIdList(techniquesToUpdate: UpdateTechniquesByIdListType, trx?: Knex.Transaction): Promise<TechniqueType[] | undefined> {

  const { idList, countList } = techniquesToUpdate;

  // بررسی اینکه آیا آیدی ای وجود دارد
  if (idList.length === 0 || countList.length === 0) {
    return undefined
  }
  
  if ( idList.length !== countList.length) throw new AppError('INVALID_INPUT', 'Invalid input for update', 500);

  const query = trx ?? knexInstance; // استفاده از تراکنش یا اتصال اصلی

  const updatedTechniques: TechniqueType[] = []; // برای ذخیره رکوردهای بروزرسانی شده

  // تکرار بر روی آیدی ها و بروزرسانی هر رکورد
  for (let i = 0; i < idList.length; i++) {
    const techniqueId = idList[i]; // ID تکنیک
    const count = countList[i]; // تعداد مربوط به ID
    const nowStr = DateTime.now().toFormat('yyyy-LL-dd HH:mm:ss')

    // اجرای بروزرسانی
    const [updated] = await query<TechniqueType>('plan_techniques')
      .where({ id: techniqueId})
      .increment('usageTimes', count)
      .update('updatedAt', nowStr) // بروزرسانی زمان آخرین به‌روزرسانی
      .returning('*');

    if (!updated) {
      throw new AppError('TECHNIQUES_DB_ACTION_ERROR', 'Database updateTechniqueUsageTimesByIdList query error', 500); // مدیریت خطا
    }

    updatedTechniques.push(updated); // ذخیره رکورد بروزرسانی شده
  }

  return updatedTechniques.length > 0 ? updatedTechniques : undefined; // بازگشت رکوردهای بروزرسانی شده
}
