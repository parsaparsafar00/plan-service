import type { FastifyRequest } from 'fastify'
import type * as systemSchema from '../schemas/system-schema.js'
import type * as generalSchema from '../schemas/plan-general-schema.js'
import { AppError } from '@amard/error-handling'
import { auditLogger, setAuditRequest } from '@amard/logger'
import { DateTime } from 'luxon'
import { validate as isValidUuid, v4 as uuidv4 } from 'uuid'
import * as systemRepo from '../../data-access/migrations/repos/system-repository.js'

/**
 * تولید سیستم برنامه تمرینی
*/
export async function createPlanSystem(request: FastifyRequest<{ Body: systemSchema.CreatePlanSystemRequestType }>) {
  if (!isValidUuid(request.body.teacherId)) throw new AppError('SYSTEM_OWNER_ID_INVALID', 'Teacher ID is invalid', 400)
    
  const nowStr = DateTime.now().toFormat('yyyy-LL-dd HH:mm:ss')
  const newSystem: systemSchema.SystemType = {
    id: uuidv4(),
    abbrName: "سیستم " + request.body.method + " " + request.body.repeatPattern,
    teacherId: request.body.teacherId,
    description: request.body.description,
    descIsVisible: request.body.descIsVisible,
    method: request.body.method,
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
  if (!isValidUuid(request.params.id)) throw new AppError('SYSTEM_OWNER_ID_INVALID', 'Teacher ID is invalid', 400)
  const systems = await systemRepo.getAllSystemsByTeacherId(request.params)
  return systems
}

/**
 * گرفتن اطلاعات یک سیستم
*/
export async function getSystemById(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  const existing = await systemRepo.getSystemById(request.params)
  if (!existing) throw new AppError('SYSTEM_NOT_FOUND', 'System not found', 400)
  return existing
}

/**
 * ویرایش سیستم تمرینی
*/
export async function updateSystem(request: FastifyRequest<{ Params: generalSchema.IdParamType, Body: systemSchema.UpdateSystemRequestType }>) {
  // const { userId: updaterId, role: updaterRole } = extractSenderData(request)

  const currentSystem = await systemRepo.getSystemById(request.params)
  if (!currentSystem) throw new AppError('SYSTEM_NOT_FOUND', 'System not found', 400)
  const updates = request.body // هر چیزی که به عنوان ورودی وارد شده است، بایستی در جدول سیستم ها آپدیت شود

  // let aclResult = {isOkay: false, reason: ''}
  // if (updaterRole === 'teacher' || updaterRole === 'admin') aclResult = await checkWithACL(request, { own: (updaterId === currentSystem.teacherId), ...updates })
  // else aclResult = await checkWithACL(request, updates)

  // if (!aclResult.isOkay) throw new AppError('SYSTEM_UPDATE_IS_FORBIDDEN', aclResult.reason, 403)

  updates.updatedAt = DateTime.now().setZone('Asia/Tehran').toFormat('yyyy-LL-dd HH:mm:ss')
  updates.abbrName = "سیستم " + updates.method + " " + updates.repeatPattern; // نام اختصاری بایستی آپدیت بشه چون ممکنه سیستم تکرار آپدیت شده باشه

  const updated = await systemRepo.updateSystem(currentSystem.id, updates)

  auditLogger.update('', { request: setAuditRequest(request), oldData: currentSystem, newData: updated })

  return updated
}

/**
 * حذف سیستم
*/
export async function deleteSystem(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  const existing = await systemRepo.getSystemById(request.params)
  if (!existing) throw new AppError('PLAN_NOT_FOUND', 'Plan not found', 400)

  // const { role, userId } = extractSenderData(request)
  // if (role === 'teacher' || role === 'admin') {
  //   const aclResult = await checkWithACL(request, { own: (existing.teacherId === userId) })
  //   if (!aclResult.isOkay)
  //     throw new AppError('PLAN_SYSTEM_ACTION_IS_FORBIDDEN', aclResult.reason, 403)
  // }

  await systemRepo.deleteSystem(existing.id)
  auditLogger.delete('', { request: setAuditRequest(request), oldData: existing, newData: null })
}
