import type { FastifyRequest } from 'fastify'
import type { AutoQueryData } from '@amard/auto-query'
import type * as techniqueMethodSchema from '../schemas/technique-method-schema.js'
import { AppError } from '@amard/error-handling'
import * as path from 'node:path'
import ExcelJS from 'exceljs'
import { auditLogger, setAuditRequest } from '@amard/logger'
import { DateTime } from 'luxon'
import { v4 as uuidv4 } from 'uuid'
import * as techniqueMethodRepo from '../../data-access/technique-method-repository.js'

/**
 * تولید متد تکنیکی
 */
export async function createTechniqueMethod(request: FastifyRequest<{ Body: techniqueMethodSchema.CreatePlanTechniqueMethodRequestType; Querystring: { id?: string } }>) {
  // بررسی تکراری بودن متد تکنیکی
  const methodName = request.body.name
  const existing = await techniqueMethodRepo.getTechniqueMethodByName(methodName)
  if (existing) throw new AppError('PLAN_TECHNIQUE_METHOD_ALREADY_EXISTS', 'Technique method already exists', 400)

  // گرفتن شماره متد تکنیکی که قرار است برای متد فعلی استفاده شود
  const nextTechniqueMethodNumber = await techniqueMethodRepo.getNextTechniqueMethodNumber()

  const nowStr = DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss')
  const newTechniqueMethod: techniqueMethodSchema.TechniqueMethodType = {
    id: uuidv4(),
    number: nextTechniqueMethodNumber,
    name: methodName,
    description: request.body.description,
    status: request.body.status || 'published',
    createdAt: nowStr,
    updatedAt: nowStr,
  }

  const inserted = await techniqueMethodRepo.insertTechniqueMethod(newTechniqueMethod)

  // ========== اضافه کردن رکورد به فایل اکسل ==========
  try {
    const excelFilePath = path.join(process.cwd(), '/data-access/migrations/exercise-data/technique-methods-data.xlsx')
    const workbook = new ExcelJS.Workbook()

    // سعی در خواندن فایل موجود
    try {
      await workbook.xlsx.readFile(excelFilePath)
    } catch (readError) {
      throw new AppError('PLAN_TECHNIQUE_METHOD_ACTION_FORBIDDEN', 'Technique methods excel file is not available', 404, readError)
    }

    // پیدا کردن یا ایجاد شیت مورد نظر
    let worksheet = workbook.getWorksheet('TechniqueMethods')
    if (!worksheet) {
      worksheet = workbook.addWorksheet('TechniqueMethods')
      worksheet.columns = [
        { header: 'methodName', key: 'methodName' },
        { header: 'methodNumber', key: 'methodNumber' },
        { header: 'description', key: 'description' },
      ]
    }

    // اضافه کردن رکورد جدید
    worksheet.addRow({
      methodName: inserted.name,
      methodNumber: inserted.number,
      description: inserted.description,
    })

    // ذخیره فایل اکسل
    await workbook.xlsx.writeFile(excelFilePath)
  } catch (error) {
    await techniqueMethodRepo.deleteTechniqueMethod(inserted.id) // اگر نتوانیم متد را در اکسل ذخیره کنیم، از جدول متدها هم پاکش می‌کنیم
    throw new AppError('PLAN_TECHNIQUE_METHOD_ERROR', 'Technique method insert into excel file issue', 500, error)
  }

  // ========== پایان بخش اکسل ==========

  auditLogger.create('', { request: setAuditRequest(request), oldData: null, newData: inserted })
  return inserted
}

/**
 * گرفتن همه متدهای تکنیکی
 */
export async function getAllTechniqueMethods(request: FastifyRequest): Promise<techniqueMethodSchema.TechniqueMethodType[]> {
  return await techniqueMethodRepo.getAllTechniqueMethods(request.autoQueryData as AutoQueryData)
}

/**
 * گرفتن اطلاعات یک متد تکنیکی با استفاده از آیدی آن
 */
export async function getTechniqueMethodById(request: FastifyRequest<{ Params: { id: string } }>) {
  const techniqueMethod = await techniqueMethodRepo.getTechniqueMethodById(request.params.id)
  if (!techniqueMethod) throw new AppError('PLAN_TECHNIQUE_METHOD_NOT_FOUND', 'Technique method not found', 404)
  return techniqueMethod
}

/**
 * گرفتن اطلاعات یک متد تکنیکی با استفاده از شماره آن
 */
export async function getTechniqueMethodByNumber(request: FastifyRequest<{ Params: { number: number } }>) {
  const techniqueMethod = await techniqueMethodRepo.getTechniqueMethodByNumber(request.params.number)
  if (!techniqueMethod) throw new AppError('PLAN_TECHNIQUE_METHOD_NOT_FOUND', 'Technique method not found', 404)
  return techniqueMethod
}

/**
 * ویرایش متد تکنیکی تمرینی
 */
export async function updateTechniqueMethod(request: FastifyRequest<{ Params: { id: string }; Body: techniqueMethodSchema.UpdateTechniqueMethodRequestType }>) {
  const currentTechniqueMethod = await techniqueMethodRepo.getTechniqueMethodById(request.params.id)
  if (!currentTechniqueMethod) throw new AppError('PLAN_TECHNIQUE_METHOD_NOT_FOUND', 'Technique method not found', 404)

  const updated = await techniqueMethodRepo.updateTechniqueMethod(currentTechniqueMethod.id, request.body)
  auditLogger.update('', { request: setAuditRequest(request), oldData: currentTechniqueMethod ?? null, newData: updated ?? null })

  return updated
}

/**
 * حذف متد تکنیکی
 */
export async function deleteTechniqueMethod(request: FastifyRequest<{ Params: { id: string } }>) {
  const existingTechniqueMethod = await techniqueMethodRepo.getTechniqueMethodById(request.params.id)
  if (!existingTechniqueMethod) throw new AppError('PLAN_TECHNIQUE_METHOD_NOT_FOUND', 'Technique method not found', 404)

  await techniqueMethodRepo.deleteTechniqueMethod(existingTechniqueMethod.id)
  auditLogger.delete('', { request: setAuditRequest(request), oldData: existingTechniqueMethod, newData: null })
}
