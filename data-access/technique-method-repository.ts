import type { Knex } from 'knex'
import type { AutoQueryData } from '@amard/auto-query'
import { attachAutoQuery } from '@amard/auto-query'
import type { TechniqueMethodType, UpdateTechniqueMethodRequestType } from '../domain/schemas/technique-method-schema.js'
import { AppError } from '@amard/error-handling'

let knexInstance: Knex

export function setKnexInstanceForTechniqueMethodRepo(instance: Knex) {
  knexInstance = instance
}

/**
 * کمک به درج شماره متد تکنیکی به‌صورت ترتیبی
 */
export async function getNextTechniqueMethodNumber(): Promise<number> {
  try {
    const [row] = await knexInstance('plan_technique_method_number_helper').increment('latestTechniqueMethodNumber', 1).returning('latestTechniqueMethodNumber')
    return typeof row === 'object' ? Number(row.latestTechniqueMethodNumber) : Number(row)
  } catch (error) {
    throw new AppError('PLAN_TECHNIQUE_METHODS_DB_ERROR', 'Database getNextTechniqueMethodNumber error', 500, error)
  }
}

/**
 * تولید متد تکنیکی جدید در جدول متدهای تکنیکی
 */
export async function insertTechniqueMethod(methodData: TechniqueMethodType): Promise<TechniqueMethodType> {
  try {
    const [inserted] = await knexInstance('plan_technique_methods').insert(methodData).returning('*')
    return inserted
  } catch (error) {
    throw new AppError('PLAN_TECHNIQUE_METHODS_DB_ERROR', 'Database insertTechniqueMethod error', 500, error)
  }
}

/**
 * دریافت اطلاعات متد تکنیکی با استفاده از نام متد
 */
export async function getTechniqueMethodByName(methodName: string): Promise<TechniqueMethodType | undefined> {
  try {
    return await knexInstance('plan_technique_methods').where({ name: methodName }).first()
  } catch (error) {
    throw new AppError('PLAN_TECHNIQUE_METHODS_DB_ERROR', 'Database getTechniqueMethodByName error', 500, error)
  }
}

/**
 * دریافت اطلاعات متد تکنیکی با استفاده از شماره متد
 */
export async function getTechniqueMethodByMethodNumber(number: number): Promise<TechniqueMethodType | undefined> {
  try {
    return await knexInstance('plan_technique_methods').where({ number }).first()
  } catch (error) {
    throw new AppError('PLAN_TECHNIQUE_METHODS_DB_ERROR', 'Database getTechniqueMethodByMethodNumber error', 500, error)
  }
}

/**
 * دریافت متد تکنیکی با آیدی
 */
export async function getTechniqueMethodById(id: string): Promise<TechniqueMethodType | undefined> {
  try {
    return await knexInstance('plan_technique_methods').where({ id }).first()
  } catch (error) {
    throw new AppError('PLAN_TECHNIQUE_METHODS_DB_ERROR', 'Database getTechniqueMethodById error', 500, error)
  }
}

/**
 * دریافت متد تکنیکی با شماره
 */
export async function getTechniqueMethodByNumber(number: number): Promise<TechniqueMethodType | undefined> {
  try {
    return await knexInstance('plan_technique_methods').where({ number }).first()
  } catch (error) {
    throw new AppError('PLAN_TECHNIQUE_METHODS_DB_ERROR', 'Database getTechniqueMethodByNumber error', 500, error)
  }
}

/**
 * برای ادمین در موارد خاص که می‌خواهد کل متدهای تکنیکی را ببیند
 */
export async function getAllTechniqueMethods(autoQueryData: AutoQueryData): Promise<TechniqueMethodType[]> {
  try {
    return await knexInstance('plan_technique_methods').modify(qb => {
      attachAutoQuery(qb, autoQueryData)
    })
  } catch (error) {
    throw new AppError('PLAN_TECHNIQUE_METHODS_DB_ERROR', 'Database getAllTechniqueMethods error', 500, error)
  }
}

/**
 * ویرایش متد تکنیکی تمرینی
 */
export async function updateTechniqueMethod(id: string, updates: UpdateTechniqueMethodRequestType): Promise<TechniqueMethodType | undefined> {
  try {
    const [updated] = await knexInstance('plan_technique_methods').where({ id }).update(updates).returning('*')
    return updated
  } catch (error) {
    throw new AppError('PLAN_TECHNIQUE_METHODS_DB_ERROR', 'Database updateTechniqueMethod error', 500, error)
  }
}

/**
 * حذف متد تکنیکی تمرینی
 */
export async function deleteTechniqueMethod(id: string): Promise<void> {
  try {
    await knexInstance('plan_technique_methods').where({ id }).del()
  } catch (error) {
    throw new AppError('PLAN_TECHNIQUE_METHODS_DB_ERROR', 'Database deleteTechniqueMethod error', 500, error)
  }
}
