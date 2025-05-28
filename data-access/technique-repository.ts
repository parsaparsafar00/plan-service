import type { Knex } from 'knex'
import type { AutoQueryData } from '@amard/auto-query'
import { attachAutoQuery } from '@amard/auto-query'
import type { TechniqueType, UpdateTechniqueRequestType } from '../domain/schemas/technique-schema.js'
import { AppError } from '@amard/error-handling'

let knexInstance: Knex

export function setKnexInstanceForTechniqueRepo(instance: Knex) {
  knexInstance = instance
}

/**
 * مدل داده برای سطرهای جدول تکنیک‌ها در دیتابیس
 */
export interface TechniqueEntity {
  number: number
  methodNumber: number
}

/**
 * کمک به درج شماره تکنیک به‌صورت ترتیبی
 */
export async function getNextTechniqueNumber(): Promise<number> {
  try {
    const [row] = await knexInstance('plan_technique_number_helper').increment('latestTechniqueNumber', 1).returning('latestTechniqueNumber')
    return typeof row === 'object' ? Number(row.latestTechniqueNumber) : Number(row)
  } catch (error) {
    throw new AppError('PLAN_TECHNIQUE_DB_ERROR', 'Database getNextTechniqueNumber error', 500, error)
  }
}

/**
 * تولید تکنیک جدید در جدول تکنیک‌ها
 */
export async function insertTechnique(techniqueData: TechniqueType, trx?: Knex.Transaction): Promise<TechniqueType> {
  const query = knexInstance('plan_techniques')
  try {
    const [inserted] = await (trx ? query.transacting(trx) : query).insert(techniqueData).returning('*')
    return inserted
  } catch (error) {
    throw new AppError('PLAN_TECHNIQUE_DB_ERROR', 'Database insertTechnique error', 500, error)
  }
}

/**
 * دریافت تکنیک با استفاده از نام اختصاری
 */
export async function getTechniqueByAbbrName(abbrName: string, teacherId: string): Promise<TechniqueType | undefined> {
  try {
    return await knexInstance('plan_techniques')
      .where(function () {
        this.where('isGlobal', true).orWhere('teacherId', teacherId)
      })
      .andWhere('abbrName', abbrName)
      .first()
  } catch (error) {
    throw new AppError('PLAN_TECHNIQUE_DB_ERROR', 'Database getTechniqueByAbbrName error', 500, error)
  }
}

/**
 * دریافت تمام تکنیک‌های مربی
 */
export async function getTechniquesByTeacherId(teacherId: string, autoQueryData: AutoQueryData): Promise<TechniqueType[]> {
  try {
    return await knexInstance('plan_techniques')
      .where({ teacherId })
      .orWhere({ isGlobal: true })
      .modify(qb => {
        attachAutoQuery(qb, autoQueryData)
      })
  } catch (error) {
    throw new AppError('PLAN_TECHNIQUE_DB_ERROR', 'Database getTechniquesByTeacherId error', 500, error)
  }
}

/**
 * دریافت اطلاعات تکنیک‌های تمرینی با لیستی از آیدی‌ها
 */
export async function getTechniquesByNumberList(numberList: number[]): Promise<Pick<TechniqueType, 'id' | 'number' | 'methodNumber' | 'name' | 'description' | 'descIsVisible'>[]> {
  try {
    return await knexInstance('plan_techniques').whereIn('number', numberList)
  } catch (error) {
    throw new AppError('PLAN_TECHNIQUE_DB_ERROR', 'Database getTechniquesByNumberList error', 500, error)
  }
}

/**
 * دریافت تکنیک با آیدی
 */
export async function getTechniqueById(techniqueId: string): Promise<TechniqueType | undefined> {
  try {
    return await knexInstance('plan_techniques').where({ id: techniqueId }).first()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('PLAN_TECHNIQUE_DB_ERROR', 'Database getTechniqueById error', 500, error)
  }
}

/**
 * دریافت تکنیک با استفاده از شماره تکنیک
 */
export async function getTechniqueByNumber(number: number): Promise<TechniqueType | undefined> {
  try {
    return await knexInstance('plan_techniques').where({ number }).first()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('PLAN_TECHNIQUE_DB_ERROR', 'Database getTechniqueByNumber error', 500, error)
  }
}

/**
 * برای ادمین در موارد خاص که می‌خواهد کل تکنیک‌ها را ببیند
 */
export async function getAllTechniques(autoQueryData: AutoQueryData): Promise<TechniqueType[]> {
  try {
    return await knexInstance('plan_techniques').modify(qb => {
      attachAutoQuery(qb, autoQueryData)
    })
  } catch (error) {
    throw new AppError('PLAN_TECHNIQUE_DB_ERROR', 'Database getAllTechniques error', 500, error)
  }
}

/**
 * ویرایش تکنیک تمرینی
 */
export async function updateTechnique(id: string, updates: UpdateTechniqueRequestType): Promise<TechniqueType | undefined> {
  try {
    const [updated] = await knexInstance('plan_techniques').where({ id }).update(updates).returning('*')
    return updated
  } catch (error) {
    throw new AppError('PLAN_TECHNIQUE_DB_ERROR', 'Database updateTechnique error', 500, error)
  }
}

/**
 * حذف تکنیک تمرینی
 */
export async function deleteTechnique(id: string): Promise<void> {
  try {
    await knexInstance('plan_techniques').where({ id }).del()
  } catch (error) {
    throw new AppError('PLAN_TECHNIQUE_DB_ERROR', 'Database deleteTechnique error', 500, error)
  }
}

/**
 * آرایه‌ای گلوبال از همه تکنیک‌ها جهت جستجو و فیلتر در مموری
 */
let inMemoryTechniques: TechniqueEntity[] = []

/**
 * یک‌بار از دیتابیس همه تکنیک‌ها را می‌خوانیم و در حافظه ذخیره می‌کنیم
 */
export async function loadAllTechniques(): Promise<void> {
  if (!knexInstance) throw new AppError('PLAN_TECHNIQUE_DB_ERROR', 'Database loadAllTechniques error', 500)
  try {
    inMemoryTechniques = await knexInstance<TechniqueEntity>('plan_techniques').select('number', 'methodNumber')
  } catch (error) {
    throw new AppError('PLAN_TECHNIQUE_DB_ERROR', 'Database loadAllTechniques error', 500, error)
  }
}

/**
 * برگرداندن لیست تکنیک‌ها (آرایه) از درون حافظه
 */
export function getAllTechniquesArray(): TechniqueEntity[] {
  return inMemoryTechniques
}
