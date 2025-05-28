import type { FastifyRequest } from 'fastify'
import type { AutoQueryData } from '@amard/auto-query'
import type * as techniqueSchema from '../schemas/technique-schema.js'
import type * as generalSchema from '../schemas/plan-general-schema.js'
import { AppError } from '@amard/error-handling'
import { auditLogger, setAuditRequest } from '@amard/logger'
import { checkWithACL } from '@amard/access-control'
import { DateTime } from 'luxon'
import { validate as isValidUuid, v4 as uuidv4 } from 'uuid'
import * as techniqueRepo from '../../data-access/technique-repository.js'
import * as planRepo from '../../data-access/plan-repository.js'
import * as technqiueMethodRepo from '../../data-access/technique-method-repository.js'

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
export async function createTechnique(request: FastifyRequest<{ Body: techniqueSchema.CreateTechniqueRequestType; Querystring: { id?: string } }>): Promise<techniqueSchema.TechniqueOutputType> {
  const { userId: creatorId, role: creatorRole } = extractSenderData(request)

  let isGlobal = false
  if (creatorRole === 'admin') {
    const teacherId = request.query.id
    isGlobal = request.body.isGlobal || false

    if (!isGlobal) {
      if (!isValidUuid(teacherId)) throw new AppError('PLAN_TECHNIQUE_TEACHER_ID_INVALID', 'Teacher Id is invalid', 400)
    }
  }

  const techniqueMethod = await technqiueMethodRepo.getTechniqueMethodByMethodNumber(request.body.methodNumber)
  if (!techniqueMethod) throw new AppError('PLAN_TECHNIQUE_METHOD_NOT_FOUND', 'Technique Method not found', 404)

  const abbrName = `تکنیک ${techniqueMethod.name} ${request.body.name}` // تولید نام اختصاری برای چک کردن وجود این تکنیک در دیتابیس

  // بررسی تکراری بودن
  const existing = await techniqueRepo.getTechniqueByAbbrName(abbrName, creatorId)
  if (existing) throw new AppError('PLAN_TECHNIQUE_ALREADY_EXISTS', 'Technique already exists', 400)

  // گرفتن شماره تکنیک جدید
  const nextTechniqueNumber = await techniqueRepo.getNextTechniqueNumber()

  const nowStr = DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss')
  const newTechnique: techniqueSchema.TechniqueType = {
    id: uuidv4(),
    number: nextTechniqueNumber,
    methodNumber: request.body.methodNumber,
    abbrName: abbrName,
    name: request.body.name,
    teacherId: creatorRole === 'admin' ? request.query.id || '-' : creatorId,
    description: request.body.description,
    isGlobal,
    descIsVisible: request.body.descIsVisible,
    status: request.body.status || 'published',
    createdAt: nowStr,
    updatedAt: nowStr,
  }

  const inserted = await techniqueRepo.insertTechnique(newTechnique)
  auditLogger.create('', { request: setAuditRequest(request), oldData: null, newData: inserted })

  const techniqueRequest = { params: { id: inserted.id } } as FastifyRequest<{ Params: generalSchema.IdParamType }>
  return await getTechniqueById(techniqueRequest)
}

/**
 * گرفتن اطلاعات یک تکنیک با استفاده از آیدی
 */
export async function getTechniqueById(request: FastifyRequest<{ Params: { id: string } }>): Promise<techniqueSchema.TechniqueOutputType> {
  const existing = await techniqueRepo.getTechniqueById(request.params.id)
  if (!existing) throw new AppError('PLAN_TECHNIQUE_NOT_FOUND', 'Technique not found', 404)

  const { userId: receiverId, role: getterRole } = extractSenderData(request)
  let aclResult = { isOkay: false, reason: '' }

  if (getterRole === 'teacher') {
    aclResult = await checkWithACL(request, { own: existing.teacherId === receiverId, isGlobal: existing.isGlobal })
    if (!aclResult.isOkay) throw new AppError('PLAN_TECHNIQUE_ACTION_FORBIDDEN', aclResult.reason, 403)
  }
  const techniqueMethod = await technqiueMethodRepo.getTechniqueMethodByMethodNumber(existing.methodNumber)
  if (!techniqueMethod) throw new AppError('PLAN_TECHNIQUE_METHOD_NOT_FOUND', 'Technique Method not found', 404)

  const techniqueOutput: techniqueSchema.TechniqueOutputType = {
    ...existing,
    methodDescription: techniqueMethod.description,
    methodName: techniqueMethod.name,
  }

  return techniqueOutput
}

/**
 * گرفتن اطلاعات یک تکنیک با استفاده از شماره
 */
export async function getTechniqueByNumber(request: FastifyRequest<{ Params: { number: number } }>): Promise<techniqueSchema.TechniqueOutputType> {
  const existing = await techniqueRepo.getTechniqueByNumber(request.params.number)
  if (!existing) throw new AppError('PLAN_TECHNIQUE_NOT_FOUND', 'Technique not found', 404)

  const { userId: receiverId, role: getterRole } = extractSenderData(request)
  let aclResult = { isOkay: false, reason: '' }

  if (getterRole === 'teacher') {
    aclResult = await checkWithACL(request, { own: existing.teacherId === receiverId, isGlobal: existing.isGlobal })
    if (!aclResult.isOkay) throw new AppError('PLAN_TECHNIQUE_ACTION_FORBIDDEN', aclResult.reason, 403)
  }
  const techniqueMethod = await technqiueMethodRepo.getTechniqueMethodByMethodNumber(existing.methodNumber)
  if (!techniqueMethod) throw new AppError('PLAN_TECHNIQUE_METHOD_NOT_FOUND', 'Technique Method not found', 404)

  const techniqueOutput: techniqueSchema.TechniqueOutputType = {
    ...existing,
    methodDescription: techniqueMethod.description,
    methodName: techniqueMethod.name,
  }

  return techniqueOutput
}

/**
 * گرفتن همه تکنیک های موجود مخصوص ادمین
 */
export async function getAllTechniques(request: FastifyRequest): Promise<techniqueSchema.TechniqueOutputType[]> {
  const techniques = await techniqueRepo.getAllTechniques(request.autoQueryData as AutoQueryData)
  // گرفتن اطلاعات متد تکنیک - به این دلیل که هر تکنیک در خروجی اش، اطلاعات متدش رو هم شامل میشه
  const techniquesOutput = await Promise.all(
    techniques.map(async technique => {
      const techniqueMethod = await technqiueMethodRepo.getTechniqueMethodByMethodNumber(technique.methodNumber)
      if (!techniqueMethod) {
        throw new AppError('PLAN_TECHNIQUE_METHOD_NOT_FOUND', `Technique method not found for technique ${technique.methodNumber}`, 404)
      }

      return {
        ...technique,
        methodDescription: techniqueMethod.description,
        methodName: techniqueMethod.name,
      }
    }),
  )
  return techniquesOutput
}

/**
 * گرفتن همه تکنیک‌های یک مربی
 */
export async function getAllTechniquesByTeacherId(request: FastifyRequest<{ Params: { id: string } }>): Promise<techniqueSchema.TechniqueOutputType[]> {
  const { userId: tokenUserId, role: tokenUserRole } = extractSenderData(request)
  let teacherId = tokenUserId
  if (tokenUserRole === 'admin') {
    teacherId = request.params.id
    if (!isValidUuid(teacherId)) throw new AppError('PLAN_TECHNIQUE_TEACHER_ID_INVALID', 'Teacher Id is invalid', 400)
  }

  const techniques = await techniqueRepo.getTechniquesByTeacherId(teacherId, request.autoQueryData as AutoQueryData)
  // گرفتن اطلاعات متد تکنیک - به این دلیل که هر تکنیک در خروجی اش، اطلاعات متدش رو هم شامل میشه
  const techniquesOutput = await Promise.all(
    techniques.map(async technique => {
      const techniqueMethod = await technqiueMethodRepo.getTechniqueMethodByMethodNumber(technique.methodNumber)
      if (!techniqueMethod) {
        throw new AppError('PLAN_TECHNIQUE_METHOD_NOT_FOUND', `Technique method not found for technique ${technique.methodNumber}`, 404)
      }

      return {
        ...technique,
        methodDescription: techniqueMethod.description,
        methodName: techniqueMethod.name,
      }
    }),
  )
  return techniquesOutput
}

/**
 * ویرایش تکنیک تمرینی
 */
export async function updateTechnique(request: FastifyRequest<{ Params: { id: string }; Body: techniqueSchema.UpdateTechniqueRequestType }>): Promise<techniqueSchema.TechniqueOutputType> {
  const { userId: updaterId, role: updaterRole } = extractSenderData(request)

  const currentTechnique = await techniqueRepo.getTechniqueById(request.params.id)
  if (!currentTechnique) throw new AppError('PLAN_TECHNIQUE_NOT_FOUND', 'Technique not found', 404)

  const updates = request.body

  let aclResult = { isOkay: false, reason: '' }
  if (updaterRole === 'teacher') {
    aclResult = await checkWithACL(request, { own: updaterId === currentTechnique.teacherId, isGlobal: currentTechnique.isGlobal, ...request.body })
    if (!aclResult.isOkay) throw new AppError('PLAN_TECHNIQUE_ACTION_FORBIDDEN', aclResult.reason, 403)
  }

  const techniqueName = updates.name || currentTechnique.name
  const techniqueMethodNumber = updates.methodNumber || currentTechnique.methodNumber
  const techniqueMethod = await technqiueMethodRepo.getTechniqueMethodByMethodNumber(techniqueMethodNumber)
  if (!techniqueMethod) throw new AppError('PLAN_TECHNIQUE_METHOD_NOT_FOUND', 'Technique Method not found', 404)

  updates.updatedAt = DateTime.now().setZone('Asia/Tehran').toFormat('yyyy-MM-dd HH:mm:ss')
  updates.abbrName = `تکنیک ${techniqueMethod.name} ${techniqueName}`

  const updated = await techniqueRepo.updateTechnique(currentTechnique.id, updates)

  auditLogger.update('', { request: setAuditRequest(request), oldData: currentTechnique ?? null, newData: updated ?? null })
  const techniqueOutput: techniqueSchema.TechniqueOutputType = {
    ...updated!,
    methodDescription: techniqueMethod.description,
    methodName: techniqueMethod.name,
  }
  return techniqueOutput
}

/**
 * حذف تکنیک
 */
export async function deleteTechnique(request: FastifyRequest<{ Params: { id: string } }>) {
  const existing = await techniqueRepo.getTechniqueById(request.params.id)
  if (!existing) throw new AppError('PLAN_TECHNIQUE_NOT_FOUND', 'Technique not found', 404)

  const { userId: removerId, role: removerRole } = extractSenderData(request)
  let aclResult = { isOkay: false, reason: '' }
  if (removerRole === 'teacher') {
    aclResult = await checkWithACL(request, { own: removerId === existing.teacherId, isGlobal: existing.isGlobal })
    if (!aclResult.isOkay) throw new AppError('PLAN_TECHNIQUE_ACTION_FORBIDDEN', aclResult.reason, 403)
  }

  // بررسی استفاده از تکنیک در برنامه‌های مربی
  const autoQueryData: AutoQueryData = { sorting: { createdAt: 'desc' }, paging: {} }
  const plans = await planRepo.getPlansByTeacherId(existing.teacherId, autoQueryData)

  for (const plan of plans) {
    for (const session of plan.workoutPlan.sessions) {
      for (const exercise of Object.values(session.exercises)) {
        if (exercise.techniqueNumber === existing.number) {
          throw new AppError('PLAN_TECHNIQUE_ACTION_FORBIDDEN', 'This technique has been previously used by this teacher in plans', 403)
        }
      }
    }
  }

  await techniqueRepo.deleteTechnique(existing.id)
  auditLogger.delete('', { request: setAuditRequest(request), oldData: existing, newData: null })
}
