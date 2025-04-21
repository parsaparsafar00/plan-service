import type { Knex } from 'knex'
import * as templateSchema  from '../../../domain/schemas/template-schema.js'
import { AppError } from '@amard/error-handling'

let knexInstance: Knex

export function setKnexInstanceForTemplateRepo(instance: Knex) {
  knexInstance = instance
}

/**
 * تولید قالب برنامه تمرینی جدید در جدول plan_templates
 */
export async function insertTemplate(data: templateSchema.CreateTemplateRequestType): Promise<templateSchema.TemplateType> {
  try {
    // ایجاد قالب جدید جدید
    const [inserted] = await knexInstance('plan_templates').insert(data).returning('*')
    return inserted
  }
  catch (error) {
    throw new AppError('PLAN_TEMPLATES_DB_INSERT_ERROR', 'Database insertTemplate query error', 500, error)
  }
}

/**
 * دریافت اطلاعات یک قالب بر اساس آیدی قالب
 */
export async function getTemplateById(id: string): Promise<templateSchema.TemplateType | undefined> {
  try {
    return await knexInstance('plan_techniques').where({ id });
  } catch (error) {
    throw new AppError('PLAN_TEMPLATES_DB_QUERY_ERROR', 'Database getTemplateById query error', 500, error);
  }
}

/**
 * دریافت تمام قالب ها بر اساس آیدی مربی
 */
export async function getAllTemplatesByTeacherId(teacherId: string): Promise<templateSchema.TemplateType | undefined> {
  try {
    return await knexInstance('plan_techniques').where({ teacherId });
  } catch (error) {
    throw new AppError('PLAN_TEMPLATES_DB_QUERY_ERROR', 'Database getAllTemplatesByTeacherId query error', 500, error);
  }
}

