import type { Knex } from 'knex'
import type { AutoQueryData } from '@amard/auto-query'
import { attachAutoQuery } from '@amard/auto-query'
import type { TechniqueType } from '../domain/schemas/technique-schema.js'
import { AppError } from '@amard/error-handling'

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