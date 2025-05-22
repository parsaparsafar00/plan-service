import type { FastifyRequest } from 'fastify'
import type { AutoQueryData } from '@amard/auto-query'
import type * as generalSchema from '../schemas/plan-general-schema.js'
import type * as planSchema from '../schemas/plan-schema.js'
import type * as techniqueSchema from '../schemas/technique-schema.js'
import type * as exerciseSchema from '../schemas/exercise-schema.js'
import { AppError } from '@amard/error-handling'
import { auditLogger, setAuditRequest } from '@amard/logger'
import { checkWithACL } from '@amard/access-control'
import { DateTime } from 'luxon'
import { validate as isValidUuid, v4 as uuidv4 } from 'uuid'
import * as techniqueRepo from '../../data-access/technique-repository.js'
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
 * تولید تکنیک
 */
export async function createTechnique(request: FastifyRequest<{ Body: techniqueSchema.CreateTechniqueRequestType, Querystring: generalSchema.IdQueryTeacherType }>) {
  const { userId: creatorId, role: creatorRole } = extractSenderData(request)

  let isGlobal = false
  if (creatorRole === 'admin') {
    const teacherId = request.query.id
    isGlobal = request.body.isGlobal || false

    if (!isGlobal) {
      if (!isValidUuid(teacherId))
        throw new AppError('PLAN_TECHNIQUE_TEACHER_ID_INVALID', 'Teacher ID is invalid', 400)
    }
  }

  // بررسی تکراری بودن
  const abbrName = `تکنیک ${request.body.method} ${request.body.name}`
  const existing = await techniqueRepo.getTechniqueByAbbrName(request.query.id, abbrName) // آیدی مربی از داخل کوئری گرفته میشه
  if (existing)
    throw new AppError('PLAN_TECHNIQUE_ALREADY_EXISTS', 'Technique already exists', 400)

  const nowStr = DateTime.now().toFormat('yyyy-LL-dd HH:mm:ss') // useTz=false در migration
  const newTechnique: techniqueSchema.TechniqueType = {
    id: uuidv4(),
    abbrName: abbrName,
    name: request.body.name,
    isGlobal: isGlobal,  // اگر مربی، این پارامتر رو روی صحیح هم تنظیم بکنه، تکنیک بصورت عمومی ذخیره نخواهد شد چون ما همیشه براش فالس میزنیم
    teacherId: creatorId,
    description: request.body.description,
    descIsVisible: request.body.descIsVisible,
    method: request.body.method,
    status: 'published',
    createdAt: nowStr,
    updatedAt: nowStr,
  }
  const inserted = await techniqueRepo.insertTechnique(newTechnique)
  auditLogger.create('', { request: setAuditRequest(request), oldData: null, newData: inserted })
  return inserted
}

/**
 * گرفتن اطلاعات یک تکنیک
 */
export async function getTechniqueById(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  const existing = await techniqueRepo.getTechniqueById(request.params.id)
  if (!existing)  throw new AppError('PLAN_TECHNIQUE_NOT_FOUND', 'Technique not found', 404)
  const { userId: receiverId, role: getterRole } = extractSenderData(request)
  let aclResult = { isOkay: false, reason: '' }

  if (getterRole === 'teacher') {
    aclResult = await checkWithACL(request, { own: (existing.teacherId === receiverId), isGlobal: (existing.isGlobal) })
    if (!aclResult.isOkay) throw new AppError('PLAN_TECHNIQUE_ACTION_IS_FORBIDDEN', aclResult.reason, 403)
  }
  return existing
}

/**
 * گرفتن همه سیستم های برنامه تمرینی
 */
export async function getAllTechniquesByTeacherId(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  const { userId: tokenUserId, role: tokenUserRole } = extractSenderData(request)
  let teacherId = tokenUserId
  if (tokenUserRole === 'admin') {
    teacherId = request.params.id // اگر ادمین خواسته که تکنیک های یک مربی رو بگیره، قطعا باید در پارامتر ورودی، یک آیدی مربی معتبر را وارد کرده باشه
    if (!isValidUuid(teacherId))
      throw new AppError('PLAN_TECHNIQUE_TEACHER_ID_INVALID', 'Teacher ID is invalid', 400)
  }

  return await techniqueRepo.getTechniquesByTeacherId(request.params.id, request.autoQueryData as AutoQueryData)
}

/**
 * ویرایش تکنیک تمرینی
 */
export async function updateTechnique(request: FastifyRequest<{ Params: generalSchema.IdParamType, Body: techniqueSchema.UpdateTechniqueRequestType }>) {
  const { userId: updaterId, role: updaterRole } = extractSenderData(request)

  const currentTechnique = await techniqueRepo.getTechniqueById(request.params.id)
  if (!currentTechnique) throw new AppError('PLAN_TECHNIQUE_ACTION_IS_FORBIDDEN', 'Technique not found', 404)
    
  const updates = request.body //  (به این شرط که در ACL ذکر شده باشه) هر چیزی که به عنوان ورودی وارد شده است، بایستی در جدول تکنیک ها آپدیت شود

  let aclResult = { isOkay: false, reason: ''}
  if (updaterRole === 'teacher') {
    aclResult = await checkWithACL(request, { own: (updaterId === currentTechnique.teacherId), isGlobal: (currentTechnique.isGlobal), ...request.body })
    if (!aclResult.isOkay) throw new AppError('PLAN_TECHNIQUE_ACTION_IS_FORBIDDEN', aclResult.reason, 403)
  }

  updates.updatedAt = DateTime.now().setZone('Asia/Tehran').toFormat('yyyy-LL-dd HH:mm:ss')

  let techniqueName: string;
  if (updates.name) techniqueName = updates.name
  else techniqueName = currentTechnique.name

  let techniqueMethod: string;
  if (updates.method) techniqueMethod = updates.method
  else techniqueMethod = currentTechnique.method

  updates.abbrName = `تکنیک ${techniqueMethod} ${techniqueName}` // نام اختصاری بایستی آپدیت بشه چون ممکنه تکنیک تکرار آپدیت شده باشه

  const updated = await techniqueRepo.updateTechnique(currentTechnique.id, updates)

  auditLogger.update('', { request: setAuditRequest(request), oldData: currentTechnique ?? null, newData: updated ?? null })
  return updated
}

/**
 * حذف تکنیک
 */
export async function deleteTechnique(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  const existing = await techniqueRepo.getTechniqueById(request.params.id)
  if (!existing)
    throw new AppError('PLAN_TECHNIQUE_NOT_FOUND', 'Technique not found', 404)

  const { userId: removerId, role: removerRole } = extractSenderData(request)
  let aclResult = {isOkay: false, reason: ''}
  if (removerRole === 'teacher') {
    aclResult = await checkWithACL(request, { own: (removerId === existing.teacherId), isGlobal: existing.isGlobal })
    if (!aclResult.isOkay) throw new AppError('PLAN_TECHNIQUE_ACTION_IS_FORBIDDEN', aclResult.reason, 403)
  }
  // ابتدا باید چک کنیم که آیا تکنیک در هیچ برنامه ای از مربی فعلی تا بحال استفاده شده است یا خیر
  const autoQueryData: AutoQueryData  = {sorting: { createdAt: 'desc' },paging: {}} // مقدار دهی الکی اتوکوئری برای اینکه بتونیم از تابع زیر استفاده کنیم
  const plans = await planRepo.getPlansByTeacherId(existing.teacherId, autoQueryData); 
  
  plans.forEach((plan: planSchema.PlanType) => {
    plan.workoutPlan.sessions.forEach((session: planSchema.sessionInplanType) => {
      Object.values(session.exercises).forEach((exercise: exerciseSchema.exerciseOutputInPlanType) => {
        if (exercise.techniqueId && exercise.techniqueId === request.params.id) {
          throw new AppError('PLAN_TECHNIQUE_ACTION_IS_FORBIDDEN', 'This technique has been used by this teacher in plans previously', 403);
        }
      });
    });
  });

  await techniqueRepo.deleteTechnique(existing.id)
  auditLogger.delete('', { request: setAuditRequest(request), oldData: existing, newData: null })
}
