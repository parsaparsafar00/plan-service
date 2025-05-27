import type { FastifyRequest } from 'fastify'
import type { AutoQueryData } from '@amard/auto-query'
import type * as generalSchema from '../schemas/plan-general-schema.js'
import * as systemMethodSchema from '../schemas/system-method-schema.js'
import { AppError } from '@amard/error-handling'
import * as path from 'node:path'
import ExcelJS from 'exceljs'
import { auditLogger, setAuditRequest } from '@amard/logger'
import { DateTime } from 'luxon'
import { v4 as uuidv4 } from 'uuid'
import * as systemMethodRepo from '../../data-access/system-method-repository.js'

/**
 * تولید متد سیستم
 */
export async function createPlanSystemMethod(request: FastifyRequest<{ Body: systemMethodSchema.CreatePlanSystemMethodRequestType; Querystring: generalSchema.IdQueryTeacherType }>) {
  // بررسی تکراری بودن متد سیستم
  const methodName = request.body.name
  const existing = await systemMethodRepo.getSystemMethodByMethodName(methodName)
  if (existing) throw new AppError('PLAN_SYSTEM_METHOD_ALREADY_EXISTS', 'System method already exists', 400)

  // گرفتن شماره سیستمی که قراره برای سیستم فعلی در نظر گرفته بشه
  const nextSystemMethodNumber: number = await systemMethodRepo.getNextSystemMethodNumber()

  const nowStr = DateTime.now().toFormat('yyyy-LL-dd HH:mm:ss')
  const newSystemMethod: systemMethodSchema.SystemMethodType = {
    id: uuidv4(),
    number: nextSystemMethodNumber,
    name: methodName,
    description: request.body.description,
    status: 'published',
    createdAt: nowStr,
    updatedAt: nowStr,
  }

  const inserted = await systemMethodRepo.insertPlanSystemMethod(newSystemMethod)

  // ========== اضافه کردن رکورد به فایل اکسل ==========
  try {
    const excelFilePath = path.join(process.cwd(), '/data-access/migrations/exercise-data/system-methods-data.xlsx')
    const workbook = new ExcelJS.Workbook()

    // سعی در خواندن فایل موجود
    try {
      await workbook.xlsx.readFile(excelFilePath)
    } catch (readError) {
      throw new AppError('PLAN_SYSTEM_METHOD_ACTION_FORBIDDEN', 'System methods excel file is not available', 404, readError)
    }

    // پیدا کردن یا ایجاد شیت مورد نظر
    let worksheet = workbook.getWorksheet('SystemMethods')
    if (!worksheet) {
      worksheet = workbook.addWorksheet('SystemMethods')
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
    systemMethodRepo.deleteSystemMethod(inserted.id) // اگه نتونیم متد رو توی اکسل ذخیره کنیم، از جدول متد ها هم پاکش میکنیم
    throw new AppError('PLAN_SYSTEM_METHOD_ERROR', 'System method insert into excel file issue', 500, error)
  }

  // ========== پایان بخش اکسل ==========

  auditLogger.create('', { request: setAuditRequest(request), oldData: null, newData: inserted })
  return inserted
}

/**
 * گرفتن همه متد ها
 */
export async function getAllSystemMethods(request: FastifyRequest): Promise<systemMethodSchema.SystemMethodType[]> {
  return await systemMethodRepo.getAllSystemMethods(request.autoQueryData as AutoQueryData)
}

/**
 * گرفتن اطلاعات یک متد سیتم با استفاده از آیدی آن
 */
export async function getSystemMethodById(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  const system = await systemMethodRepo.getSystemMethodById(request.params.id)
  if (!system) throw new AppError('PLAN_SYSTEM_METHOD_NOT_FOUND', 'System method not found', 404)
  return system
}

/**
 * گرفتن اطلاعات یک متد سیستم با استفاده از شماره آن
 */
export async function getSystemMethodByNumber(request: FastifyRequest<{ Params: generalSchema.numberParamType }>) {
  const system = await systemMethodRepo.getSystemMethodByNumber(request.params.number)
  if (!system) throw new AppError('PLAN_SYSTEM_METHOD_NOT_FOUND', 'System method not found', 404)
  return system
}

/**
 * ویرایش متد سیستم تمرینی
 */
export async function updateSystemMethod(request: FastifyRequest<{ Params: generalSchema.IdParamType; Body: systemMethodSchema.UpdateSystemMethodRequestType }>) {
  const currentSystemMethod = await systemMethodRepo.getSystemMethodById(request.params.id)
  if (!currentSystemMethod) throw new AppError('PLAN_SYSTEM_METHOD_NOT_FOUND', 'System method not found', 404)

  const updated = await systemMethodRepo.updateSystemMethod(currentSystemMethod.id, request.body)
  auditLogger.update('', { request: setAuditRequest(request), oldData: currentSystemMethod ?? null, newData: updated ?? null })

  return updated
}

/**
 * حذف متد سیستم
 */
export async function deleteSystemMethod(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  const existingSystemMethod = await systemMethodRepo.getSystemMethodById(request.params.id)
  if (!existingSystemMethod) throw new AppError('PLAN_SYSTEM_METHOD_NOT_FOUND', 'System method not found', 404)

  // نیازی به چک کردن ACL نیست چون ادمین هر متدی رو میتونه حذف بکنه

  await systemMethodRepo.deleteSystemMethod(existingSystemMethod.id)
  auditLogger.delete('', { request: setAuditRequest(request), oldData: existingSystemMethod, newData: null })
}

// تابع تشخیص متد سیستم تولید
export async function detectSystemMethodName(pattern: number[]): Promise<'constant' | 'descending' | 'ascending' | 'custom' | 'sinusoidal' | 'pyramidUp' | 'pyramidDown' | 'fullPyramidDown' | 'fullPyramidUp' | 'singleSet' | null> {
  const n = pattern.length
  if (n === 0) return null

  if (n === 1) return 'singleSet' // تنها یک عنصر داریم

  // بررسی الگوی ثابت: تمام عناصر برابرند
  if (pattern.every(val => val === pattern[0])) return 'constant'

  // محاسبه تفاضل‌های متوالی و علامت آنها (مثبت یا منفی)
  const diffs = []
  for (let i = 0; i < n - 1; i++) {
    diffs.push(pattern[i + 1] - pattern[i])
  }
  const nonZeroSigns = diffs.filter(d => d !== 0).map(d => (d > 0 ? 1 : -1))

  // توابع کمکی برای تشخیص هرم کامل صعودی/نزولی
  function isFullPyramidUp() {
    // بررسی قرینه بودن کل آرایه
    for (let i = 0; i < n; i++) {
      if (pattern[i] !== pattern[n - 1 - i]) {
        return false
      }
    }
    // بررسی روند صعودی تا وسط
    if (n % 2 === 1) {
      for (let i = 0; i < Math.floor(n / 2); i++) {
        if (pattern[i] >= pattern[i + 1]) {
          return false
        }
      }
    } else {
      for (let i = 0; i < Math.floor(n / 2) - 1; i++) {
        if (pattern[i] >= pattern[i + 1]) {
          return false
        }
      }
      if (pattern[Math.floor(n / 2) - 1] > pattern[Math.floor(n / 2)]) {
        return false
      }
    }
    return true
  }

  function isFullPyramidDown() {
    for (let i = 0; i < n; i++) {
      if (pattern[i] !== pattern[n - 1 - i]) {
        return false
      }
    }
    if (n % 2 === 1) {
      for (let i = 0; i < Math.floor(n / 2); i++) {
        if (pattern[i] <= pattern[i + 1]) {
          return false
        }
      }
    } else {
      for (let i = 0; i < Math.floor(n / 2) - 1; i++) {
        if (pattern[i] <= pattern[i + 1]) {
          return false
        }
      }
      if (pattern[Math.floor(n / 2) - 1] < pattern[Math.floor(n / 2)]) {
        return false
      }
    }
    return true
  }

  if (isFullPyramidUp()) {
    return 'fullPyramidUp'
  }
  if (isFullPyramidDown()) {
    return 'fullPyramidDown'
  }

  // بررسی صعودی/نزولی بودن کامل (strictly)
  let isStrictlyAscending = true
  let isStrictlyDescending = true
  for (let i = 0; i < n - 1; i++) {
    if (pattern[i] >= pattern[i + 1]) {
      isStrictlyAscending = false
    }
    if (pattern[i] <= pattern[i + 1]) {
      isStrictlyDescending = false
    }
  }

  if (isStrictlyAscending) {
    return 'ascending'
  }
  if (isStrictlyDescending) {
    return 'descending'
  }

  // بررسی یکنوایی غیر‌نزولی / غیر‌صعودی
  let isNonDecreasing = true
  let isNonIncreasing = true
  for (let i = 0; i < n - 1; i++) {
    if (pattern[i] > pattern[i + 1]) {
      isNonDecreasing = false
    }
    if (pattern[i] < pattern[i + 1]) {
      isNonIncreasing = false
    }
  }

  if (isNonDecreasing) {
    return 'pyramidUp'
  }
  if (isNonIncreasing) {
    return 'pyramidDown'
  }

  // اگر یک بار جهت تغییر کند (یک اوج ساده یا کف ساده)
  if (nonZeroSigns.length >= 2) {
    let flips = 0
    for (let i = 1; i < nonZeroSigns.length; i++) {
      if (nonZeroSigns[i] !== nonZeroSigns[i - 1]) {
        flips++
      }
    }

    if (flips === 1) {
      // یک‌بار تغییر جهت؛ بر حسب اولین و آخرین علامت
      if (nonZeroSigns[0] > 0 && nonZeroSigns[nonZeroSigns.length - 1] < 0) {
        return 'pyramidUp'
      }
      if (nonZeroSigns[0] < 0 && nonZeroSigns[nonZeroSigns.length - 1] > 0) {
        return 'pyramidDown'
      }
    } else if (flips >= 2) {
      // بیش از یک بار تغییر جهت => سینوسی
      return 'sinusoidal'
    }
  }

  // در سایر موارد
  return 'custom'
}
