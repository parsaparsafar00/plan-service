import type { Knex } from 'knex'
import type { AutoQueryData } from '@amard/auto-query'
import { attachAutoQuery } from '@amard/auto-query'
import type { TechniqueType, UpdateTechniquesByIdListType } from '../domain/schemas/technique-schema.js'
import { AppError } from '@amard/error-handling'
import { DateTime } from 'luxon'

let knexInstance: Knex

export function setKnexInstanceForTechniqueRepo(instance: Knex) {
  knexInstance = instance
}

/**
 * تولید تکنیک جدید در جدول تکنیک ها
 */
export async function insertTechnique(data: TechniqueType): Promise<TechniqueType> {
  try {
    const [inserted] = await knexInstance('plan_techniques').insert(data).returning('*');
    return inserted;
  }
  catch (error) {  
    throw new AppError('PLAN_TECHNIQUE_DB_ERROR', 'Database insertTechnique query error', 400, error);
  }
}

/**
 * دریافت تکنیک بر اساس نام اختصاری تکنیک
 */
export async function getTechniqueByAbbrName(teacherId: string, abbrName: string): Promise<TechniqueType | undefined> {
  try {
    return await knexInstance('plan_techniques').where(function() {
      this.where('isGlobal', true).orWhere({teacherId});
    })
    .andWhere({abbrName})
    .first();
  }
  catch (error) {
    throw new AppError('PLAN_TECHNIQUE_DB_ERROR', 'Database getTechniqueByAbbrName query error', 400, error)
  }
}

/**
 * دریافت تمام تکنیک های یک مربی
 */
export async function getTechniquesByTeacherId(teacherId: string, autoQueryData: AutoQueryData): Promise<TechniqueType[]> {
  try {
    return await knexInstance('plan_techniques').where({teacherId: teacherId}).orWhere({isGlobal: true}).modify((qb) => {
      attachAutoQuery(qb, autoQueryData)
    })
  }
  catch (error) {
    throw new AppError('PLAN_TECHNIQUE_DB_ERROR', 'Database getTechniquesByTeacherId query error', 400, error)
  }
}

/**
 * دریافت اطلاعات تکنیک های تمرینی با لیستی از آیدی تکنیک ها
 */
export async function getTechniquesByIdList(idList: string[]): Promise<Pick<TechniqueType, 'id'| 'name' | 'description' | 'descIsVisible' | 'method'>[]> {
  try {
    return await knexInstance('plan_techniques').whereIn('id', idList);
  } catch (error) {
    throw new AppError('PLAN_TECHNIQUE_DB_ERROR', 'Database getTechniquesByIdList query error', 400, error);
  }
}

/**
 * دریافت تکنیک با آیدی
 */
export async function getTechniqueById(techniqueId: string): Promise<TechniqueType | undefined> {
  try {
    return await knexInstance('plan_techniques').where({ id: techniqueId }).first()
  }
  catch (error) {
    if (error instanceof AppError)
      throw error
    throw new AppError('PLAN_TECHNIQUE_DB_ERROR', 'Database getTechniqueById query error', 400, error)
  }
}

// برای ادمین در موارد خاص که میخواد کل تکنیک ها رو ببینه
export async function getAllTechniques(autoQueryData: AutoQueryData): Promise<TechniqueType[]> {
  try {
    return await knexInstance('plan_techniques').modify((qb) => {
      attachAutoQuery(qb, autoQueryData)
    })
  }
  catch (error) {
    throw new AppError('PLAN_TECHNIQUE_DB_ERROR', 'Database getAllTechniques error', 500, error)
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
    throw new AppError('PLAN_TECHNIQUE_DB_ERROR', 'Database updateTechnique query error', 400, error)
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
    throw new AppError('PLAN_TECHNIQUE_DB_ERROR', 'Database deleteTechnique query error', 400, error)
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
  
  if (idList.length !== countList.length) throw new AppError('PLAN_TECHNIQUE_ERROR', 'Invalid input for update', 400);

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
      throw new AppError('PLAN_TECHNIQUE_DB_ERROR', 'Database updateTechniqueUsageTimesByIdList query error', 400); // مدیریت خطا
    }

    updatedTechniques.push(updated); // ذخیره رکورد بروزرسانی شده
  }

  return updatedTechniques.length > 0 ? updatedTechniques : undefined; // بازگشت رکوردهای بروزرسانی شده
}