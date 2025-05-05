import type { FastifyRequest } from 'fastify'
import type * as generalSchema from '../schemas/plan-general-schema.js'
import type * as techniqueSchema from '../schemas/technique-schema.js'
import { AppError } from '@amard/error-handling'
import { auditLogger, setAuditRequest } from '@amard/logger'
import { checkWithACL } from '@amard/access-control'
import { DateTime } from 'luxon'
import { validate as isValidUuid, v4 as uuidv4 } from 'uuid'
import * as techniqueRepo from '../../data-access/migrations/repos/technique-repository.js'
import * as planRepo from '../../data-access/migrations/repos/plan-repository.js'

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
export async function createTechnique(request: FastifyRequest<{ Body: techniqueSchema.CreateTechniqueRequestType }>) {
  if (!isValidUuid(request.body.teacherId)) throw new AppError('TECHNIQUE_OWNER_ID_INVALID', 'Teacher ID is invalid', 400)

  const nowStr = DateTime.now().toFormat('yyyy-LL-dd HH:mm:ss') // useTz=false در migration
  const newTechnique: techniqueSchema.TechniqueType = {
    id: uuidv4(),
    abbrName: `تکنیک ${request.body.method} ${request.body.name}`,
    name: request.body.name,
    usageTimes: 0,
    isGlobal: false,
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
  if (!existing)
    throw new AppError('TECHNIQUE_NOT_FOUND', 'Technique not found', 400)
  return existing
}

/**
 * گرفتن همه سیستم های برنامه تمرینی
 */
export async function getAllTechniquesByTeacherId(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  if (!isValidUuid(request.params.id))
    throw new AppError('TECHNIQUE_OWNER_ID_INVALID', 'Teacher ID is invalid', 400)

  const techniques = await techniqueRepo.getTechniquesByTeacherId(request.params.id)

  return techniques
}

/**
 * ویرایش تکنیک تمرینی
 */
export async function updateTechnique(request: FastifyRequest<{ Params: generalSchema.IdParamType, Body: techniqueSchema.UpdateTechniqueRequestType }>) {
  const { userId: updaterId, role: updaterRole } = extractSenderData(request)

  const currentTechnique = await techniqueRepo.getTechniqueById(request.params)
  if (!currentTechnique) throw new AppError('TECHNIQUE_NOT_FOUND', 'Technique not found', 400)
    
  const updates = request.body //  (به این شرط که در ACL ذکر شده باشه) هر چیزی که به عنوان ورودی وارد شده است، بایستی در جدول تکنیک ها آپدیت شود

  let aclResult = {isOkay: false, reason: ''}
  if (updaterRole === 'teacher') aclResult = await checkWithACL(request, { own: (updaterId === currentTechnique.teacherId), ...updates })
  else aclResult = await checkWithACL(request, updates)

  if (!aclResult.isOkay) throw new AppError('TECHNIQUE_ACTION_IS_FORBIDDEN', aclResult.reason, 403)

  updates.updatedAt = DateTime.now().setZone('Asia/Tehran').toFormat('yyyy-LL-dd HH:mm:ss')

  let techniqueName;
  if (updates.name) techniqueName = updates.name
  else techniqueName = currentTechnique.name

  let techniqueMethod;
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
  const existing = await techniqueRepo.getTechniqueById(request.params)
  if (!existing)
    throw new AppError('TECHNIQUE_NOT_FOUND', 'Technique not found', 400)

  const { role, userId } = extractSenderData(request)
  if (role === 'teacher' || role === 'admin') {
    const aclResult = await checkWithACL(request, { own: (existing.teacherId === userId) })
    if (!aclResult.isOkay) throw new AppError('TECHNIQUE_ACTION_IS_FORBIDDEN', aclResult.reason, 403)
  }

  // ابتدا باید چک کنیم که آیا تکنیک در هیچ برنامه ای از مربی فعلی تا بحال استفاده شده است یا خیر
  const getPlanInput : generalSchema.IdParamType = {id: existing.teacherId}
  const plans = await planRepo.getPlansByTeacherId(getPlanInput); 
  if (!plans) return;
  
  plans.forEach((plan) => {
    plan.workoutPlan.sessions.forEach((session: any) => {
      Object.entries(session.exercises).forEach(([_ , exercise]: [string, any]) => {
        if (exercise.techniqueId && exercise.techniqueId === request.params.id) {
          throw new AppError('TECHNIQUE_ACTION_IS_FORBIDDEN', 'تکنیک مورد نظر، در برنامه های تولید شده توسط شما استفاده شده است', 403);
        }
      });
    });
  });

  await techniqueRepo.deleteTechnique(existing.id)
  auditLogger.delete('', { request: setAuditRequest(request), oldData: existing, newData: null })
}
