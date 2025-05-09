import type { FastifyRequest } from 'fastify'
import type { AutoQueryData } from '@amard/auto-query'
import type * as generalSchema from '../schemas/plan-general-schema.js'
import * as systemSchema from '../schemas/system-schema.js'
import { AppError } from '@amard/error-handling'
import { auditLogger, setAuditRequest } from '@amard/logger'
import { checkWithACL } from '@amard/access-control'
import { DateTime } from 'luxon'
import { validate as isValidUuid, v4 as uuidv4 } from 'uuid'
import * as systemRepo from '../../data-access/system-repository.js'
import * as planRepo from '../../data-access/plan-repository.js'

function extractSenderData(request: FastifyRequest) {
  const underJwt = request.underJwt === 'true'
  let role = 'internal-service-user-role'
  let userId = 'internal-service-user-id'
  if (underJwt) {
    role = request.user!.role
    userId = request.user!.id
  }
  return { role, userId }
}

/**
 * تولید سیستم برنامه تمرینی
 */
export async function createPlanSystem(request: FastifyRequest<{ Body: systemSchema.CreatePlanSystemRequestType, Querystring: generalSchema.IdQueryTeacherType }>) {

  if (!isValidUuid(request.body.teacherId)) throw new AppError('PLAN_SYSTEM_OWNER_ID_INVALID', 'Teacher ID is invalid', 400)
  const { userId: creatorId, role: creatorRole } = extractSenderData(request)

  let isGlobal = false
  if (creatorRole === 'admin') {
    const teacherId = request.query.id
    isGlobal = request.body.isGlobal || false

    if (!isGlobal) {
      if (!isValidUuid(teacherId))
        throw new AppError('PLAN_SYSTEM_TEACHER_ID_INVALID', 'Teacher ID is invalid', 400)
    }
  }

  const nowStr = DateTime.now().toFormat('yyyy-LL-dd HH:mm:ss')
  const newSystem: systemSchema.SystemType = {
    id: uuidv4(),
    abbrName: `سیستم ${request.body.method} ${request.body.repeatPattern}`,
    teacherId: creatorId,
    description: request.body.description,
    isGlobal: isGlobal,  // اگر مربی، این پارامتر رو روی صحیح هم تنظیم بکنه، سیستم بصورت عمومی ذخیره نخواهد شد چون ما همیشه براش فالس میزنیم
    descIsVisible: request.body.descIsVisible,
    method: request.body.method,
    usageTimes: 0,
    repeatPattern: JSON.stringify(request.body.repeatPattern),
    status: 'published',
    createdAt: nowStr,
    updatedAt: nowStr,
  }

  const inserted = await systemRepo.insertPlanSystem(newSystem)
  inserted.repeatPattern = JSON.parse(inserted.repeatPattern)
  auditLogger.create('', { request: setAuditRequest(request), oldData: null, newData: inserted })
  return inserted
}

/**
 * گرفتن همه سیستم های برنامه تمرینی
 */
export async function getAllSystemsByTeacherId(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  const { userId: tokenUserId, role: tokenUserRole } = extractSenderData(request)
  let teacherId = tokenUserId
  if (tokenUserRole === 'admin') {
    teacherId = request.params.id // اگر ادمین خواسته که سیستم های یک مربی رو بگیره، قطعا باید در پارامتر ورودی، یک آیدی مربی معتبر را وارد کرده باشه
    if (!isValidUuid(teacherId))
      throw new AppError('PLAN_SYSTEM_TEACHER_ID_INVALID', 'Teacher ID is invalid', 400)
  }
  const systems = await systemRepo.getAllSystemsByTeacherId(request.params.id, request.autoQueryData as AutoQueryData)
  return systems
}

/**
 * گرفتن اطلاعات یک سیستم
 */
export async function getSystemById(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  const system = await systemRepo.getSystemById(request.params.id)
  if (!system) throw new AppError('PLAN_SYSTEM_NOT_FOUND', 'System not found', 404)

  const { userId: receiverId, role: getterRole } = extractSenderData(request)
  let aclResult = { isOkay: false, reason: '' }

  if (getterRole === 'teacher') {
    aclResult = await checkWithACL(request, { own: (system.teacherId === receiverId), isGlobal: (system.isGlobal) })
    if (!aclResult.isOkay)
      throw new AppError('PLANS_SYSTEM_ACTION_IS_FORBIDDEN', aclResult.reason, 403)
  }
  return system
}

/**
 * ویرایش سیستم تمرینی
 */
export async function updateSystem(request: FastifyRequest<{ Params: generalSchema.IdParamType, Body: systemSchema.UpdateSystemRequestType }>) {
  const { userId: updaterId, role: updaterRole } = extractSenderData(request)

  const currentSystem = await systemRepo.getSystemById(request.params.id)
  if (!currentSystem) throw new AppError('PLAN_SYSTEM_NOT_FOUND', 'System not found', 404)

  let aclResult = { isOkay: false, reason: ''}
  if (updaterRole === 'teacher') {
    aclResult = await checkWithACL(request, { own: (updaterId === currentSystem.teacherId), isGlobal: (currentSystem.isGlobal), ...request.body })
    if (!aclResult.isOkay) throw new AppError('PLAN_SYSTEM_ACTION_IS_FORBIDDEN', aclResult.reason, 403)
  }
  const updates = request.body
  const systemRepeatPattern = updates.repeatPattern ? updates.repeatPattern : JSON.parse(currentSystem.repeatPattern);
  const systemMethod = updates.method ?? detectSystemMethod(systemRepeatPattern); // اگر متد در ورودی مشخص نشده بود، سیستم را به تابع تشخیص دهنده متد می دهیم تا متد رو تولید بکنه

  updates.abbrName = `سیستم ${systemMethod} ${systemRepeatPattern}` // نام اختصاری بایستی آپدیت بشه چون ممکنه سیستم تکرار آپدیت شده باشه

  //  (به این شرط که در ACL ذکر شده باشه) هر چیزی که به عنوان ورودی وارد شده است، بایستی در جدول سیستم ها آپدیت شود
  const updateInput: Partial<systemSchema.SystemType> = { // تغییر تایپ ورودی، به این دلیل که ورودی تابع یوز کیس با ورودی تابع ریپو فرق میکنه (در پارامتر تکرار)
    ...updates,
    repeatPattern: JSON.stringify(systemRepeatPattern),
    method: systemMethod,
    updatedAt: DateTime.now().setZone('Asia/Tehran').toFormat('yyyy-LL-dd HH:mm:ss')
  };
  
  const updated = await systemRepo.updateSystem(currentSystem.id, updateInput)
  if (updated) updated.repeatPattern = JSON.parse(updated.repeatPattern) // بازگردادن تکرار ها به فرمت آرایه ای

  auditLogger.update('', { request: setAuditRequest(request), oldData: currentSystem ?? null, newData: updated ?? null })

  return updated
}

/**
 * حذف سیستم
 */
export async function deleteSystem(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  const existingSystem = await systemRepo.getSystemById(request.params.id)
  if (!existingSystem) throw new AppError('PLAN_SYSTEM_NOT_FOUND', 'System not found', 404)

  const { userId: removerId, role: removerRole } = extractSenderData(request)
  let aclResult = {isOkay: false, reason: ''}
  if (removerRole === 'teacher') {
    aclResult = await checkWithACL(request, { own: (removerId === existingSystem.teacherId), isGlobal: existingSystem.isGlobal })
    if (!aclResult.isOkay) throw new AppError('PLAN_SYSTEM_ACTION_IS_FORBIDDEN', aclResult.reason, 403)
  }

  // ابتدا باید چک کنیم که آیا سیستم در هیچ برنامه ای از مربی فعلی تا بحال استفاده شده است یا خیر
  const autoQueryData: AutoQueryData = {sorting: { createdAt: 'desc' }, paging: {}} // مقدار دهی الکی اتوکوئری برای اینکه بتونیم از تابع زیر استفاده کنیم
  const plans = await planRepo.getPlansByTeacherId(existingSystem.teacherId, autoQueryData) 
  if (!plans) return;
  plans.forEach((plan) => {
    plan.workoutPlan.sessions.forEach((session: any) => {
      Object.entries(session.exercises).forEach(([_ , exercise]: [string, any]) => {
        if (exercise.systemId && exercise.systemId === request.params.id) 
          throw new AppError('PLAN_SYSTEM_ACTION_IS_FORBIDDEN', 'This system has been used by you in plans you have previously created', 403);
      });
    });
  });

  await systemRepo.deleteSystem(existingSystem.id)
  auditLogger.delete('', { request: setAuditRequest(request), oldData: existingSystem, newData: null })
}

// تابع بررسی افزایشی بودن آرایه
function isStrictlyIncreasing(arr: number[]): boolean {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] <= arr[i - 1]) return false
  }
  return true
}

// تابع بررسی کاهشی بودن آرایه
function isStrictlyDecreasing(arr: number[]): boolean {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] >= arr[i - 1]) return false
  }
  return true
}

// تابع تشخیص متد سیستم تولید
function detectSystemMethod(pattern: number[]): "constant" | "descending" | "ascending" | "custom" | "sinusoidal" | "pyramidUp" | "pyramidDown" | "singleSet" {
  // اگر طول آرایه کمتر از 2 باشد، singleSet است
  if (pattern.length < 2) return 'singleSet'
  
  // بررسی الگوی ثابت (تمام مقادیر یکسان باشند)
  const firstValue = pattern[0]
  if (pattern.every(val => val === firstValue)) {
    return 'constant'
  }

  // بررسی الگوهای صعودی و نزولی
  const isAscending = pattern.every((v, i, a) => i === 0 || v >= a[i - 1])
  const isStrictAscending = pattern.every((v, i, a) => i === 0 || v > a[i - 1])
  const isDescending = pattern.every((v, i, a) => i === 0 || v <= a[i - 1])
  const isStrictDescending = pattern.every((v, i, a) => i === 0 || v < a[i - 1])

  // اولویت با الگوهای صعودی/نزولی دقیق است
  if (isStrictAscending) return 'ascending'
  if (isStrictDescending) return 'descending'
  if (isAscending) return 'ascending' // صعودی غیردقیق
  if (isDescending) return 'descending' // نزولی غیردقیق

  // بررسی الگوی سینوسی (افزایش و کاهش متناوب)
  let isSinusoidal = true
  if (pattern.length >= 3) {
    let increasing: boolean | null = null
    for (let i = 1; i < pattern.length; i++) {
      if (pattern[i] === pattern[i - 1]) {
        isSinusoidal = false
        break
      }
      if (increasing === null) {
        increasing = pattern[i] > pattern[i - 1]
      } else {
        const currentDirection = pattern[i] > pattern[i - 1]
        if (currentDirection === increasing) {
          isSinusoidal = false
          break
        }
        increasing = currentDirection
      }
    }
  } else {
    isSinusoidal = false
  }
  if (isSinusoidal) return 'sinusoidal'

  // بررسی الگوی هرمی صعودی (ابتدا افزایش دقیق تا قله سپس کاهش دقیق)
  const peakIndex = pattern.indexOf(Math.max(...pattern))
  if (
    peakIndex > 0 &&
    peakIndex < pattern.length - 1 &&
    isStrictlyIncreasing(pattern.slice(0, peakIndex + 1)) &&
    isStrictlyDecreasing(pattern.slice(peakIndex))
  ) {
    return 'pyramidUp'
  }

  // بررسی الگوی هرمی نزولی (ابتدا کاهش دقیق تا دره سپس افزایش دقیق)
  const valleyIndex = pattern.indexOf(Math.min(...pattern))
  if (
    valleyIndex > 0 &&
    valleyIndex < pattern.length - 1 &&
    isStrictlyDecreasing(pattern.slice(0, valleyIndex + 1)) &&
    isStrictlyIncreasing(pattern.slice(valleyIndex))
  ) {
    return 'pyramidDown'
  }

  // اگر هیچکدام از الگوهای بالا تطابق نداشت، custom است
  return 'custom'
}