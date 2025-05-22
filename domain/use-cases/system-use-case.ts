import type { FastifyRequest } from 'fastify'
import type { AutoQueryData } from '@amard/auto-query'
import type * as generalSchema from '../schemas/plan-general-schema.js'
import * as systemSchema from '../schemas/system-schema.js'
import * as exerciseSchema from '../schemas/exercise-schema.js'
import * as systemMethodUseCase from '../use-cases/system-method-use-case.js'
import * as planSchema from '../schemas/plan-schema.js'
import { AppError } from '@amard/error-handling'
import { auditLogger, setAuditRequest } from '@amard/logger'
import { checkWithACL } from '@amard/access-control'
import { DateTime } from 'luxon'
import { validate as isValidUuid, v4 as uuidv4 } from 'uuid'
import * as systemRepo from '../../data-access/system-repository.js'
import * as systemMethodRepo from '../../data-access/system-method-repository.js'
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
export async function createPlanSystem(request: FastifyRequest<{ Body: systemSchema.CreatePlanSystemRequestType; Querystring: generalSchema.IdQueryTeacherType }>): Promise<systemSchema.SystemOutputType> {
  const { userId: creatorId, role: creatorRole } = extractSenderData(request)

  let isGlobal = false
  if (creatorRole === 'admin') {
    const teacherId = request.query.id
    isGlobal = request.body.isGlobal || false

    if (!isGlobal) {
      if (!isValidUuid(teacherId)) throw new AppError('PLAN_SYSTEM_TEACHER_ID_INVALID', 'Teacher ID is invalid', 400)
    }
  }

  // تبدیل تکرار ها به یک آرایه کلی برای استفاده در نقاط مختلف کد
  const repeatPattern = Object.values(request.body.repeatPattern).filter(value => value !== 0)
  if (!repeatPattern) throw new AppError('PLAN_SYSTEM_INVALID_SYSTEM', 'System is invalid', 400)

  // (به این دلیل که در فرانت، شماره متد ها رو داریم) متد رو بر اساس شمارش پیدا میکنیم
  const method = await systemMethodRepo.getSystemMethodByMethodNumber(request.body.methodNumber)
  if (!method) throw new AppError('PLAN_SYSTEM_METHOD_NOT_FOUND', 'System method not found', 404)

  // بررسی اینکه آیا متدی که کاربر برای سیستم تکرارش انتخاب کرده با متد واقعی سیستم تکرارش تطابق داره یا ن
  const realMethodName = await systemMethodUseCase.detectSystemMethodName(repeatPattern)
  const newMethod = await systemMethodRepo.getSystemMethodByMethodNumber(method.number)
  if (!newMethod) throw new AppError('PLAN_SYSTEM_METHOD_NOT_FOUND', 'System method not found', 404)
  if (realMethodName !== newMethod.name) throw new AppError('PLAN_SYSTEM_METHOD_INVALID', 'System method specified is not correct', 400)

  // بررسی تکراری بودن
  const abbrName = `سیستم ${method.name} ${repeatPattern}`
  const existing = await systemRepo.getSystemByAbbrName(request.query.id, abbrName) // آیدی مربی از داخل کوئری گرفته میشه
  if (existing) throw new AppError('PLAN_SYSTEM_ALREADY_EXISTS', 'System already exists', 400)

  // گرفتن شماره سیستمی که قراره برای سیستم فعلی در نظر گرفته بشه
  const nextSystemNumber = await systemRepo.getNextSystemNumber()

  // آماده سازی ورودی تولید سیستم تکرار جدید
  const nowStr = DateTime.now().toFormat('yyyy-LL-dd HH:mm:ss')
  const newSystem: systemSchema.SystemType = {
    id: uuidv4(),
    number: nextSystemNumber,
    abbrName,
    teacherId: creatorId,
    description: request.body.description,
    isGlobal, // اگر مربی، این پارامتر رو در ورودی مقدار "صحیح" هم تنظیم بکنه، سیستم بصورت عمومی ذخیره نخواهد شد چون ما همیشه متغیرش رو "غلط" میزنیم توی این کد
    descIsVisible: request.body.descIsVisible,
    methodNumber: method.number,
    status: 'published',
    createdAt: nowStr,
    updatedAt: nowStr,
    repeat1: request.body.repeatPattern.repeat1,
    repeat2: request.body.repeatPattern.repeat2,
    repeat3: request.body.repeatPattern.repeat3,
    repeat4: request.body.repeatPattern.repeat4,
    repeat5: request.body.repeatPattern.repeat5,
    repeat6: request.body.repeatPattern.repeat6,
    repeat7: request.body.repeatPattern.repeat7,
    repeat8: request.body.repeatPattern.repeat8,
  }

  const inserted = await systemRepo.insertPlanSystem(newSystem)
  auditLogger.create('', { request: setAuditRequest(request), oldData: existing || null, newData: inserted })

  const systemOutput: systemSchema.SystemOutputType = {
    ...inserted,
    methodDescription: newMethod.description,
    methodName: newMethod.name,
  }

  return systemOutput
}

/**
 * گرفتن همه سیستم های برنامه تمرینی یک مربی
 */
export async function getAllSystemsByTeacherId(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  const { userId: tokenUserId, role: tokenUserRole } = extractSenderData(request)
  let teacherId = tokenUserId
  if (tokenUserRole === 'admin') {
    teacherId = request.params.id // اگر ادمین خواسته که سیستم های یک مربی رو بگیره، قطعا باید در پارامتر ورودی، یک آیدی مربی معتبر را وارد کرده باشه
    if (!isValidUuid(teacherId)) throw new AppError('PLAN_SYSTEM_TEACHER_ID_INVALID', 'Teacher ID is invalid', 400)
  }

  const systems = await systemRepo.getAllSystemsByTeacherId(request.params.id, request.autoQueryData as AutoQueryData)
  return systems
}

/**
 * گرفتن اطلاعات یک سیستم
 */
export async function getSystemById(request: FastifyRequest<{ Params: generalSchema.IdParamType }>): Promise<systemSchema.SystemOutputType> {
  const system = await systemRepo.getSystemById(request.params.id)
  if (!system) throw new AppError('PLAN_SYSTEM_NOT_FOUND', 'System not found', 404)

  const { userId: receiverId, role: getterRole } = extractSenderData(request)
  let aclResult = { isOkay: false, reason: '' }

  if (getterRole === 'teacher') {
    aclResult = await checkWithACL(request, { own: system.teacherId === receiverId, isGlobal: system.isGlobal })
    if (!aclResult.isOkay) throw new AppError('PLAN_SYSTEM_ACTION_IS_FORBIDDEN', aclResult.reason, 403)
  }

  // تکمیل خروجی سیستم با اضافه کردن اطلاعات متد
  const systemMethod = await systemMethodRepo.getSystemMethodByMethodNumber(system.methodNumber)
  if (!systemMethod) throw new AppError('PLAN_SYSTEM_METHOD_NOT_FOUND', 'System method not found', 404)

  const systemOutput: systemSchema.SystemOutputType = {
    ...system,
    methodDescription: systemMethod.description,
    methodName: systemMethod.name,
  }

  return systemOutput
}

/**
 * گرفتن اطلاعات یک سیستم
 */
export async function getSystemByNumber(request: FastifyRequest<{ Params: generalSchema.numberParamType }>): Promise<systemSchema.SystemOutputType> {
  const system = await systemRepo.getSystemByNumber(request.params.number)
  if (!system) throw new AppError('PLAN_SYSTEM_NOT_FOUND', 'System not found', 404)

  const { userId: receiverId, role: getterRole } = extractSenderData(request)
  let aclResult = { isOkay: false, reason: '' }

  if (getterRole === 'teacher') {
    aclResult = await checkWithACL(request, { own: system.teacherId === receiverId, isGlobal: system.isGlobal })
    if (!aclResult.isOkay) throw new AppError('PLAN_SYSTEM_ACTION_IS_FORBIDDEN', aclResult.reason, 403)
  }

  // تکمیل خروجی سیستم با اضافه کردن اطلاعات متد
  const systemMethod = await systemMethodRepo.getSystemMethodByMethodNumber(system.methodNumber)
  if (!systemMethod) throw new AppError('PLAN_SYSTEM_METHOD_NOT_FOUND', 'System method not found', 404)

  const systemOutput: systemSchema.SystemOutputType = {
    ...system,
    methodDescription: systemMethod.description,
    methodName: systemMethod.name,
  }

  return systemOutput
}

/**
 * ویرایش سیستم تمرینی
 */
export async function updateSystem(request: FastifyRequest<{ Params: generalSchema.IdParamType; Body: systemSchema.UpdateSystemRequestType }>): Promise<systemSchema.SystemOutputType> {
  const { userId: updaterId, role: updaterRole } = extractSenderData(request)
  const currentSystem = await systemRepo.getSystemById(request.params.id)
  if (!currentSystem) throw new AppError('PLAN_SYSTEM_NOT_FOUND', 'System not found', 404)

  let aclResult = { isOkay: false, reason: '' }
  if (updaterRole === 'teacher') {
    aclResult = await checkWithACL(request, { own: updaterId === currentSystem.teacherId, isGlobal: currentSystem.isGlobal, ...request.body })
    if (!aclResult.isOkay) throw new AppError('PLAN_SYSTEM_ACTION_IS_FORBIDDEN', aclResult.reason, 403)
  }

  const updates = request.body
  const methodNumber = updates.methodNumber ? updates.methodNumber : currentSystem.methodNumber

  if (!methodNumber) throw new AppError('PLAN_SYSTEM_METHOD_NOT_FOUND', 'System method not found', 404)

  // ورودی آپدیت سیستم تکرار رو میسازیم
  const updateInput: Partial<systemSchema.SystemType> = updates

  const currentRepeatPattern = [currentSystem.repeat1, currentSystem.repeat2, currentSystem.repeat3, currentSystem.repeat4, currentSystem.repeat5, currentSystem.repeat6, currentSystem.repeat7, currentSystem.repeat8].filter(value => value !== 0) // نال بیخود نمیزنیم که در نام اختصاری دچار مشکل نشیم

  const correctedRepeats: number[] = []

  if (request.body.repeatPattern) {
    // اگر سیستم تکرار تعریف شده بود، بایستی روی دیتای آن یکسری پراسس ها انجام بدیم

    // تکرارها را در یک آرایه ذخیره میکنیم
    const inputRepeats = [request.body.repeatPattern.repeat1, request.body.repeatPattern.repeat2, request.body.repeatPattern.repeat3, request.body.repeatPattern.repeat4, request.body.repeatPattern.repeat5, request.body.repeatPattern.repeat6, request.body.repeatPattern.repeat7, request.body.repeatPattern.repeat8]

    // ترتیب را تغییر میدیم تا تمام صفرها در انتها قرار گیرند و ترتیب عناصر غیر صفر حفظ شود
    const nonZeroRepeats = inputRepeats.filter(x => x !== 0)
    const zeroCount = inputRepeats.length - nonZeroRepeats.length
    const correctedRepeats = nonZeroRepeats.concat(Array(zeroCount).fill(0))

    // حال که کاربر سیستم جدیدی را وارد کرده است، بایستی در جدول سیستم ها، سیستمش رو اپدیت کنیم
    updateInput.repeat1 = correctedRepeats[0]
    updateInput.repeat2 = correctedRepeats[1]
    updateInput.repeat3 = correctedRepeats[2]
    updateInput.repeat4 = correctedRepeats[3]
    updateInput.repeat5 = correctedRepeats[4]
    updateInput.repeat6 = correctedRepeats[5]
    updateInput.repeat7 = correctedRepeats[6]
    updateInput.repeat8 = correctedRepeats[7]

    // تولید سیستم تکرار ارایه ای
    correctedRepeats.filter(value => value !== 0) // صفر بیخود نمیزنیم که در نام اختصاری دچار مشکل نشیم
  }

  // تکراری که برای تولید نام اختصاری نیاز هست رو پیدا میکنیم (یا کاربر سیستم تکرار جدید رو وارد نکرده و باید از دیتابیس بگیریم، یا تکراری هست که الان کاربر وارد کرده)
  const repeatPattern = correctedRepeats ? correctedRepeats : currentRepeatPattern

  // بررسی اینکه آیا متدی که کاربر برای سیستم تکرارش انتخاب کرده با متد واقعی سیستم تکرارش تطابق داره یا ن
  const realMethodName = await systemMethodUseCase.detectSystemMethodName(correctedRepeats)
  const newMethod = await systemMethodRepo.getSystemMethodByMethodNumber(methodNumber)
  if (!newMethod) throw new AppError('PLAN_SYSTEM_METHOD_NOT_FOUND', 'System method not found', 404)
  if (realMethodName !== newMethod.name) throw new AppError('PLAN_SYSTEM_METHOD_INVALID', 'System method specified is not correct', 400)

  updateInput.abbrName = `سیستم ${methodNumber} ${repeatPattern}` // نام اختصاری بایستی آپدیت بشه چون ممکنه سیستم تکرار و یا نام متد سیستم آپدیت شده باشند
  updateInput.methodNumber = methodNumber
  updateInput.updatedAt = DateTime.now().setZone('Asia/Tehran').toFormat('yyyy-LL-dd HH:mm:ss')

  const updated = await systemRepo.updateSystem(currentSystem.id, updateInput)
  auditLogger.update('', { request: setAuditRequest(request), oldData: currentSystem ?? null, newData: updated ?? null })

  const systemOutput: systemSchema.SystemOutputType = {
    ...updated,
    methodDescription: newMethod.description,
    methodName: newMethod.name,
  }

  return systemOutput
}

/**
 * حذف سیستم
 */
export async function deleteSystem(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  const existingSystem = await systemRepo.getSystemById(request.params.id)
  if (!existingSystem) throw new AppError('PLAN_SYSTEM_NOT_FOUND', 'System not found', 404)

  const { userId: removerId, role: removerRole } = extractSenderData(request)
  let aclResult = { isOkay: false, reason: '' }
  if (removerRole === 'teacher') {
    aclResult = await checkWithACL(request, { own: removerId === existingSystem.teacherId, isGlobal: existingSystem.isGlobal })
    if (!aclResult.isOkay) throw new AppError('PLAN_SYSTEM_ACTION_IS_FORBIDDEN', aclResult.reason, 403)
  }

  // ابتدا باید چک کنیم که آیا سیستم در هیچ برنامه ای از مربی فعلی تا بحال استفاده شده است یا خیر
  const autoQueryData: AutoQueryData = { sorting: { createdAt: 'desc' }, paging: {} } // مقدار دهی الکی اتوکوئری برای اینکه بتونیم از تابع زیر استفاده کنیم
  const plans = await planRepo.getPlansByTeacherId(existingSystem.teacherId, autoQueryData)

  plans.forEach(plan => {
    plan.workoutPlan.sessions.forEach((session: planSchema.sessionInplanType) => {
      Object.values(session.exercises).forEach((exercise: exerciseSchema.exerciseOutputInPlanType) => {
        if (exercise.systemNumber === existingSystem.number) throw new AppError('PLAN_SYSTEM_ACTION_IS_FORBIDDEN', 'This system has been used by this teacher in plans previously', 403)
      })
    })
  })

  await systemRepo.deleteSystem(existingSystem.id)
  auditLogger.delete('', { request: setAuditRequest(request), oldData: existingSystem, newData: null })
}
