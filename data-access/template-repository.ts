import type { Knex } from 'knex'
import type * as generalPlanSchema from '../domain/schemas/plan-general-schema.js'
import type * as templateSchema from '../domain/schemas/template-schema.js'
import { AppError } from '@amard/error-handling'

let knexInstance: Knex

export function setKnexInstanceForTemplateRepo(instance: Knex) {
  knexInstance = instance
}

/**
 * تولید قالب برنامه تمرینی جدید در جدول قالب ها
 */
export async function insertTemplate(data: templateSchema.TemplateType): Promise<templateSchema.TemplateType> {
  try {
    // اطمینان از اینکه فیلد muscles به‌درستی به رشته جیسان تبدیل شود
    if (Array.isArray(data.muscles)) data.muscles = JSON.stringify(data.muscles)

    const [inserted] = await knexInstance('plan_templates').insert(data).returning('*')
    if (typeof inserted.muscles === 'string')
      inserted.muscles = JSON.parse(inserted.muscles)

    return inserted
  }
  catch (error) {
    throw new AppError('PLAN_TEMPLATES_DB_INSERT_ERROR', 'Database insertTemplate query error', 500, error)
  }
}

/**
 * دریافت اطلاعات یک قالب بر اساس آیدی قالب
 */
export async function getTemplateById(id: generalPlanSchema.IdParamType): Promise<templateSchema.TemplateType | undefined> {
  try {
    const templateId = id.id
    const template = await knexInstance('plan_templates').where({ id: templateId }).first()
    
    if (!template) return undefined;
    if (typeof template.muscles === 'string')
      template.muscles = JSON.parse(template.muscles)
    return template
  }
  catch (error) {
    throw new AppError('PLAN_TEMPLATES_DB_QUERY_ERROR', 'Database getTemplateById query error', 500, error)
  }
}

/**
 * دریافت تمام قالب ها بر اساس آیدی مربی
 */
export async function getAllTemplatesByTeacherId(id: generalPlanSchema.IdParamType): Promise<templateSchema.TemplateListType | undefined> {
  try {
    const teacherId = id.id
    return await knexInstance('plan_templates').where({ teacherId })
  }
  catch (error) {
    throw new AppError('PLAN_TEMPLATES_DB_QUERY_ERROR', 'Database getAllTemplatesByTeacherId query error', 500, error)
  }
}

/**
 * ویرایش قالب
 */
export async function updateTemplate(id: generalPlanSchema.IdParamType, updates: templateSchema.UpdateTemplateRequestType): Promise<templateSchema.TemplateType> {
  try {
    const templateId = id.id
    if (Array.isArray(updates.muscles)) updates.muscles = JSON.stringify(updates.muscles)
    const [updated] = await knexInstance('plan_templates').where({ id: templateId }).update(updates).returning('*')
    if (typeof updated.muscles === 'string')
      updated.muscles = JSON.parse(updated.muscles)
    return updated
  }
  catch (error) {
    throw new AppError('PLAN_TEMPLATES_DB_ACTION_ERROR', 'Database updateTemplate query error', 500, error)
  }
}

/**
 * حذف قالب تمرینی
 */
export async function deleteTemplate(id: generalPlanSchema.IdParamType): Promise<void> {
  try {
    const templateId = id.id
    await knexInstance('plan_templates').where({ id: templateId }).del()
  }
  catch (error) {
    throw new AppError('PLAN_TEMPLATES_DB_QUERY_ERROR', 'Database deletetemplate query error', 500, error)
  }
}
