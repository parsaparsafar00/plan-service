import type { Knex } from 'knex'
import type { AutoQueryData } from '@amard/auto-query'
import { attachAutoQuery } from '@amard/auto-query'
import type { TemplateType, UpdateTemplateRequestType } from '../domain/schemas/template-schema.js'
import { AppError } from '@amard/error-handling'

let knexInstance: Knex

export function setKnexInstanceForTemplateRepo(instance: Knex) {
  knexInstance = instance
}

/**
 * تولید قالب برنامه تمرینی جدید در جدول قالب ها
 */
export async function insertTemplate(data: TemplateType): Promise<TemplateType> {
  try {
    const [inserted] = await knexInstance('plan_templates').insert(data).returning('*')
    return inserted
  } catch (error) {
    throw new AppError('PLAN_TEMPLATE_DB_ERROR', 'Database insertTemplate query error', 400, error)
  }
}

/**
 * دریافت اطلاعات یک قالب بر اساس آیدی قالب
 */
export async function getTemplateById(templateId: string): Promise<TemplateType | undefined> {
  try {
    return await knexInstance('plan_templates').where({ id: templateId }).first()
  } catch (error) {
    throw new AppError('PLAN_TEMPLATE_DB_ERROR', 'Database getTemplateById query error', 400, error)
  }
}

/**
 * دریافت تمام قالب ها بر اساس آیدی مربی
 */
export async function getAllTemplatesByTeacherId(teacherId: string, autoQueryData: AutoQueryData): Promise<TemplateType[]> {
  try {
    return await knexInstance('plan_templates')
      .where({ teacherId })
      .modify(qb => {
        attachAutoQuery(qb, autoQueryData)
      })
  } catch (error) {
    throw new AppError('PLAN_TEMPLATE_DB_ERROR', 'Database getAllTemplatesByTeacherId query error', 400, error)
  }
}

// برای ادمین در موارد خاص که میخواد کل قالب ها رو ببینه
export async function getAllTechniques(autoQueryData: AutoQueryData): Promise<TemplateType[]> {
  try {
    const plans = await knexInstance('plan_templates').modify(qb => {
      attachAutoQuery(qb, autoQueryData)
    })
    return plans
  } catch (error) {
    throw new AppError('PLAN_TEMPLATE_DB_ERROR', 'Database getAllTechniques error', 500, error)
  }
}

/**
 * ویرایش قالب
 */
export async function updateTemplate(id: string, updates: UpdateTemplateRequestType): Promise<TemplateType | undefined> {
  try {
    const [updated] = await knexInstance('plan_templates').where({ id }).update(updates).returning('*')
    return updated
  } catch (error) {
    throw new AppError('PLAN_TEMPLATE_DB_ERROR', 'Database updateTemplate query error', 400, error)
  }
}

/**
 * حذف قالب تمرینی
 */
export async function deleteTemplate(templateId: string): Promise<void> {
  try {
    await knexInstance('plan_templates').where({ id: templateId }).del()
  } catch (error) {
    throw new AppError('PLAN_TEMPLATE_DB_ERROR', 'Database deleteTemplate query error', 400, error)
  }
}
