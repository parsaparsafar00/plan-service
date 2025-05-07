import type { FastifyRequest } from 'fastify'
import type * as generalSchema from '../schemas/plan-general-schema.js'
import type * as systemSchema from '../schemas/system-schema.js'
import { AppError } from '@amard/error-handling'
import { auditLogger, setAuditRequest } from '@amard/logger'
import { checkWithACL } from '@amard/access-control'
import { DateTime } from 'luxon'
import { validate as isValidUuid, v4 as uuidv4 } from 'uuid'
import * as systemRepo from '../../data-access/migrations/repos/system-repository.js'
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
 * تولید سیستم برنامه تمرینی
 */
export async function createPlanSystem(request: FastifyRequest<{ Body: systemSchema.CreatePlanSystemRequestType }>) {
  if (!isValidUuid(request.body.teacherId))
    throw new AppError('SYSTEM_OWNER_ID_INVALID', 'Teacher ID is invalid', 400)

  const nowStr = DateTime.now().toFormat('yyyy-LL-dd HH:mm:ss')
  const newSystem: systemSchema.SystemType = {
    id: uuidv4(),
    abbrName: `سیستم ${request.body.method} ${request.body.repeatPattern}`,
    teacherId: request.body.teacherId,
    description: request.body.description,
    descIsVisible: request.body.descIsVisible,
    method: request.body.method,
    usageTimes: 0,
    isGlobal: false,
    repeatPattern: request.body.repeatPattern,
    status: 'active',
    createdAt: nowStr,
    updatedAt: nowStr,
  }

  const inserted = await systemRepo.insertPlanSystem(newSystem)
  auditLogger.create('', { request: setAuditRequest(request), oldData: null, newData: inserted })
  return inserted
}

/**
 * گرفتن همه سیستم های برنامه تمرینی
 */
export async function getAllSystemsByTeacherId(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  if (!isValidUuid(request.params.id))
    throw new AppError('SYSTEM_OWNER_ID_INVALID', 'Teacher ID is invalid', 400)
  const systems = await systemRepo.getAllSystemsByTeacherId(request.params)
  return systems
}

/**
 * گرفتن اطلاعات یک سیستم
 */
export async function getSystemById(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  const system = await systemRepo.getSystemById(request.params)
  if (!system) throw new AppError('SYSTEM_NOT_FOUND', 'System not found', 404)
  return system
}

/**
 * ویرایش سیستم تمرینی
 */
export async function updateSystem(request: FastifyRequest<{ Params: generalSchema.IdParamType, Body: systemSchema.UpdateSystemRequestType }>) {
  const { userId: updaterId, role: updaterRole } = extractSenderData(request)

  const currentSystem = await systemRepo.getSystemById(request.params)
  if (!currentSystem) throw new AppError('SYSTEM_NOT_FOUND', 'System not found', 404)
  const updates = request.body //  (به این شرط که در ACL ذکر شده باشه) هر چیزی که به عنوان ورودی وارد شده است، بایستی در جدول سیستم ها آپدیت شود

  let aclResult = {isOkay: false, reason: ''}
  if (updaterRole === 'teacher') aclResult = await checkWithACL(request, { own: (updaterId === currentSystem.teacherId), ...updates })
  else aclResult = await checkWithACL(request, updates)

  if (!aclResult.isOkay) throw new AppError('SYSTEM_ACTION_IS_FORBIDDEN', aclResult.reason, 403)

  updates.updatedAt = DateTime.now().setZone('Asia/Tehran').toFormat('yyyy-LL-dd HH:mm:ss')

  let systemRepeatPattern;
  if (updates.repeatPattern) systemRepeatPattern = updates.repeatPattern
  else systemRepeatPattern = currentSystem.repeatPattern

  let systemMethod;
  if (updates.method) systemMethod = updates.method
  else systemMethod = currentSystem.method

  updates.abbrName = `سیستم ${systemMethod} ${systemRepeatPattern}` // نام اختصاری بایستی آپدیت بشه چون ممکنه سیستم تکرار آپدیت شده باشه

  const updated = await systemRepo.updateSystem(currentSystem.id, updates)

  auditLogger.update('', { request: setAuditRequest(request), oldData: currentSystem ?? null, newData: updated ?? null })

  return updated
}

/**
 * حذف سیستم
 */
export async function deleteSystem(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  const existingSystem = await systemRepo.getSystemById(request.params)
  if (!existingSystem) throw new AppError('SYSTEM_NOT_FOUND', 'System not found', 404)

  const { role, userId } = extractSenderData(request)
  if (role === 'teacher' || role === 'admin') {
    const aclResult = await checkWithACL(request, { own: (existingSystem.teacherId === userId)})
    if (!aclResult.isOkay) throw new AppError('SYSTEM_ACTION_IS_FORBIDDEN', aclResult.reason, 403)
  }

  // ابتدا باید چک کنیم که آیا سیستم در هیچ برنامه ای از مربی فعلی تا بحال استفاده شده است یا خیر
  const getPlanInput : generalSchema.IdParamType = {id: existingSystem.teacherId}
  const plans = await planRepo.getPlansByTeacherId(getPlanInput); 
  if (!plans) return;
  plans.forEach((plan) => {
    plan.workoutPlan.sessions.forEach((session: any) => {
      Object.entries(session.exercises).forEach(([_ , exercise]: [string, any]) => {
        if (exercise.systemId && exercise.systemId === request.params.id) throw new AppError('SYSTEM_ACTION_IS_FORBIDDEN', 'سیستم مورد نظر، در برنامه های تولید شده توسط شما استفاده شده است', 403);
      });
    });
  });

  await systemRepo.deleteSystem(existingSystem.id)
  auditLogger.delete('', { request: setAuditRequest(request), oldData: existingSystem, newData: null })
}

