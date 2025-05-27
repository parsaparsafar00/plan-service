import type { FastifyRequest } from 'fastify'
import type { AutoQueryData } from '@amard/auto-query'
import type * as techniqueSchema from '../schemas/technique-schema.js'
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
export async function createTechnique(request: FastifyRequest<{ Body: techniqueSchema.CreateTechniqueRequestType; Querystring: { id?: string } }>) {
  const { userId: creatorId, role: creatorRole } = extractSenderData(request)

  let isGlobal = false
  if (creatorRole === 'admin') {
    const teacherId = request.query.id
    isGlobal = request.body.isGlobal || false

    if (!isGlobal) {
      if (!isValidUuid(teacherId)) throw new AppError('PLAN_TECHNIQUE_TEACHER_ID_INVALID', 'شناسه مربی نامعتبر است', 400)
    }
  }

  // بررسی تکراری بودن
  const existing = await techniqueRepo.getTechniqueByName(request.body.name)
  if (existing) throw new AppError('PLAN_TECHNIQUE_ALREADY_EXISTS', 'تکنیک قبلاً وجود دارد', 400)

  // گرفتن شماره تکنیک جدید
  const nextTechniqueNumber = await techniqueRepo.getNextTechniqueNumber()

  const nowStr = DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss')
  const newTechnique: techniqueSchema.TechniqueType = {
    id: uuidv4(),
    number: nextTechniqueNumber,
    methodNumber: request.body.methodNumber,
    abbrName: request.body.abbrName,
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
  return inserted
}

/**
 * گرفتن اطلاعات یک تکنیک
 */
export async function getTechniqueById(request: FastifyRequest<{ Params: { id: string } }>) {
  const existing = await techniqueRepo.getTechniqueById(request.params.id)
  if (!existing) throw new AppError('PLAN_TECHNIQUE_NOT_FOUND', 'تکنیک پیدا نشد', 404)

  const { userId: receiverId, role: getterRole } = extractSenderData(request)
  let aclResult = { isOkay: false, reason: '' }

  if (getterRole === 'admin') {
    aclResult = await checkWithACL(request, { own: existing.teacherId === receiverId, isGlobal: existing.isGlobal })
    if (!aclResult.isOkay) throw new AppError('PLAN_TECHNIQUE_ACTION_FORBIDDEN', aclResult.reason, 403)
  }
  return existing
}

/**
 * گرفتن همه تکنیک‌های یک مربی
 */
export async function getAllTechniquesByTeacherId(request: FastifyRequest<{ Params: { id: string } }>) {
  const { userId: tokenUserId, role: tokenUserRole } = extractSenderData(request)
  let teacherId = tokenUserId
  if (tokenUserRole === 'admin') {
    teacherId = request.params.id
    if (!isValidUuid(teacherId)) throw new AppError('PLAN_TECHNIQUE_TEACHER_ID_INVALID', 'شناسه مربی نامعتبر است', 400)
  }

  return await techniqueRepo.getTechniquesByTeacherId(teacherId, request.autoQueryData as AutoQueryData)
}

/**
 * ویرایش تکنیک تمرینی
 */
export async function updateTechnique(request: FastifyRequest<{ Params: { id: string }; Body: techniqueSchema.UpdateTechniqueRequestType }>) {
  const { userId: updaterId, role: updaterRole } = extractSenderData(request)

  const currentTechnique = await techniqueRepo.getTechniqueById(request.params.id)
  if (!currentTechnique) throw new AppError('PLAN_TECHNIQUE_NOT_FOUND', 'تکنیک پیدا نشد', 404)

  const updates = request.body

  let aclResult = { isOkay: false, reason: '' }
  if (updaterRole === 'teacher') {
    aclResult = await checkWithACL(request, { own: updaterId === currentTechnique.teacherId, isGlobal: currentTechnique.isGlobal, ...request.body })
    if (!aclResult.isOkay) throw new AppError('PLAN_TECHNIQUE_ACTION_FORBIDDEN', aclResult.reason, 403)
  }

  updates.updatedAt = DateTime.now().setZone('Asia/Tehran').toFormat('yyyy-MM-dd HH:mm:ss')

  const techniqueName = updates.name || currentTechnique.name
  const techniqueMethodNumber = updates.methodNumber || currentTechnique.methodNumber
  updates.abbrName = `تکنیک ${techniqueMethodNumber} ${techniqueName}`

  const updated = await techniqueRepo.updateTechnique(currentTechnique.id, updates)

  auditLogger.update('', { request: setAuditRequest(request), oldData: currentTechnique ?? null, newData: updated ?? null })
  return updated
}

/**
 * حذف تکنیک
 */
export async function deleteTechnique(request: FastifyRequest<{ Params: { id: string } }>) {
  const existing = await techniqueRepo.getTechniqueById(request.params.id)
  if (!existing) throw new AppError('PLAN_TECHNIQUE_NOT_FOUND', 'تکنیک پیدا نشد', 404)

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
          throw new AppError('PLAN_TECHNIQUE_ACTION_FORBIDDEN', 'این تکنیک قبلاً در برنامه‌های این مربی استفاده شده است', 403)
        }
      }
    }
  }

  await techniqueRepo.deleteTechnique(existing.id)
  auditLogger.delete('', { request: setAuditRequest(request), oldData: existing, newData: null })
}
