import type { FastifyRequest } from 'fastify'
import type * as techniqueSchema from '../schemas/technique-schema.js'
import type * as generalSchema from '../schemas/plan-general-schema.js'
import { AppError } from '@amard/error-handling'
import { auditLogger, setAuditRequest } from '@amard/logger'
import { DateTime } from 'luxon'
import { validate as isValidUuid, v4 as uuidv4 } from 'uuid'
import * as techniqueRepo from '../../data-access/migrations/repos/technique-repository.js'

/**
 * تولید تکنیک
*/
export async function createTechnique(request: FastifyRequest<{ Body: techniqueSchema.CreateTechniqueRequestType }>) {
  if (!isValidUuid(request.body.teacherId)) throw new AppError('PLAN_OWNER_ID_INVALID', 'Teacher ID is invalid', 400)
    
  const nowStr = DateTime.now().toFormat('yyyy-LL-dd HH:mm:ss') // useTz=false در migration
  const newTechnique: techniqueSchema.TechniqueType = {
    id: uuidv4(),
    abbrName: "تکنیک " + request.body.method + " " + request.body.name,
    name: request.body.name,
    teacherId: request.body.teacherId,
    description: request.body.description,
    descIsVisible: request.body.descIsVisible,
    method: request.body.method,
    status: 'active',
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
  const existing = await techniqueRepo.getTechniqueById(request.params)
  if (!existing) throw new AppError('TECHNIQUE_NOT_FOUND', 'Technique not found', 400)
  return existing
}

/**
 * گرفتن همه سیستم های برنامه تمرینی
*/
export async function getAllTechniquesByTeacherId(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  if (!isValidUuid(request.params.id)) throw new AppError('TECHNIQUE_OWNER_ID_INVALID', 'Teacher ID is invalid', 400)

  const techniques = await techniqueRepo.getTechniquesByTeacherId(request.params.id)

  return techniques
}

/**
 * ویرایش تکنیک تمرینی
*/
export async function updateTechnique(request: FastifyRequest<{ Params: generalSchema.IdParamType, Body: techniqueSchema.UpdateTechniqueRequestType }>) {
  // const { userId: updaterId, role: updaterRole } = extractSenderData(request)

  const currentTechnique = await techniqueRepo.getTechniqueById(request.params)
  if (!currentTechnique) throw new AppError('TECHNIQUE_NOT_FOUND', 'Technique not found', 400)
  const updates = request.body // هر چیزی که به عنوان ورودی وارد شده است، بایستی در جدول سیستم ها آپدیت شود

  // let aclResult = {isOkay: false, reason: ''}
  // if (updaterRole === 'teacher' || updaterRole === 'admin') aclResult = await checkWithACL(request, { own: (updaterId === currentTechnique.teacherId), ...updates })
  // else aclResult = await checkWithACL(request, updates)

  // if (!aclResult.isOkay) throw new AppError('TECHNIQUE_UPDATE_IS_FORBIDDEN', aclResult.reason, 403)

  updates.updatedAt = DateTime.now().setZone('Asia/Tehran').toFormat('yyyy-LL-dd HH:mm:ss')

  const updated = await techniqueRepo.updateTechnique(currentTechnique.id, updates)

  auditLogger.update('', { request: setAuditRequest(request), oldData: currentTechnique, newData: updated })
  return updated
}

/**
 * حذف تکنیک
*/
export async function deleteTechnique(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  const existing = await techniqueRepo.getTechniqueById(request.params)
  if (!existing) throw new AppError('PLAN_NOT_FOUND', 'Plan not found', 400)

  // const { role, userId } = extractSenderData(request)
  // if (role === 'teacher' || role === 'admin') {
  //   const aclResult = await checkWithACL(request, { own: (existing.teacherId === userId) })
  //   if (!aclResult.isOkay)
  //     throw new AppError('PLAN_TECHNIQUE_ACTION_IS_FORBIDDEN', aclResult.reason, 403)
  // }

  await techniqueRepo.deleteTechnique(existing.id)
  auditLogger.delete('', { request: setAuditRequest(request), oldData: existing, newData: null })
}



