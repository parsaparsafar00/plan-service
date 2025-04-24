import type { FastifyRequest } from 'fastify'
import type * as generalSchema from '../schemas/plan-general-schema.js'
import type * as planSchema from '../schemas/plan-schema.js'
import type * as templateSchema from '../schemas/template-schema.js'
import { checkWithACL } from '@amard/access-control'
import { AppError } from '@amard/error-handling'
import { auditLogger, setAuditRequest } from '@amard/logger'
import { DateTime } from 'luxon'
import { validate as isValidUuid, v4 as uuidv4 } from 'uuid'
import * as templateRepo from '../../data-access/migrations/repos/template-repository.js'
import { AISessionGenerator } from '../../instructions/plan_generator.js'

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
 * تولید قالب توسط هوش مصنوعی
 */
export async function createTemplateByAI(request: FastifyRequest<{ Body: templateSchema.CreateTemplateByAIRequestType }>) {
  if (!isValidUuid(request.body.teacherId))
    throw new AppError('TEMPLATE_OWNER_ID_INVALID', 'Teacher ID is invalid', 400)

  const generateSessionByAIInput: planSchema.GeneratePlanRequestType = {
    teacherId: request.body.teacherId,
    description: request.body.description,
    exerciseType: 'body building',
    target: request.body.target,
    status: 'published',
    injuries: [],
    targetMuscles: request.body.muscles, // تبدیل به جیسان
    traineeInfo: {
      level: request.body.level,
      age: undefined, // پارامتر سن تاثیری در تولید قالب ندارد
      weight: undefined, // پارامتر وزن تاثیری در تولید قالب ندارد
      gender: request.body.gender,
    },
  }

  const workout_session = AISessionGenerator(generateSessionByAIInput) // تولید جلسه تمرینی توسط هوش مصنوعی

  const nowStr = DateTime.now().toFormat('yyyy-LL-dd HH:mm:ss') // useTz=false در migration
  const newTemplate: templateSchema.TemplateType = {
    id: uuidv4(),
    name: request.body.name,
    teacherId: request.body.teacherId,
    description: request.body.description,
    level: request.body.level,
    target: request.body.target,
    muscles: request.body.muscles,
    gender: request.body.gender,
    session: workout_session,
    createdAt: nowStr,
    updatedAt: nowStr,
  }

  const inserted = await templateRepo.insertTemplate(newTemplate)
  auditLogger.create('', { request: setAuditRequest(request), oldData: null, newData: inserted })
  return inserted
}

/**
 * تولید قالب بصورت دستی
 */
export async function createTemplateManual(request: FastifyRequest<{ Body: templateSchema.CreateTemplateManualRequestType }>) {
  if (!isValidUuid(request.body.teacherId))
    throw new AppError('TEMPLATE_OWNER_ID_INVALID', 'Teacher ID is invalid', 400)

  const nowStr = DateTime.now().toFormat('yyyy-LL-dd HH:mm:ss') // useTz=false در migration
  const newTemplate: templateSchema.TemplateType = {
    id: uuidv4(),
    name: request.body.name,
    teacherId: request.body.teacherId,
    description: request.body.description,
    level: request.body.level,
    target: request.body.target,
    muscles: request.body.muscles,
    gender: request.body.gender,
    session: request.body.session,
    createdAt: nowStr,
    updatedAt: nowStr,
  }

  const inserted = await templateRepo.insertTemplate(newTemplate)
  auditLogger.create('', { request: setAuditRequest(request), oldData: null, newData: inserted })
  return inserted
}

/**
 * گرفتن همه قالب های مربی
 */
export async function getAllTemplatesByTeacherId(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  if (!isValidUuid(request.params.id))
    throw new AppError('TEMPLATE_OWNER_ID_INVALID', 'Teacher ID is invalid', 400)
  return await templateRepo.getAllTemplatesByTeacherId(request.params)
}

/**
 * گرفتن اطلاعات یک قالب بر اساس آیدی قالب
 */
export async function getTemplateById(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  if (!isValidUuid(request.params.id))
    throw new AppError('TEMPLATE_OWNER_ID_INVALID', 'Teacher ID is invalid', 400)
  return await templateRepo.getTemplateById(request.params)
}

/**
 * ویرایش قالب تمرینی
 */
export async function updateTemplate(request: FastifyRequest<{ Params: generalSchema.IdParamType, Body: templateSchema.UpdateTemplateRequestType }>) {
  const { userId: updaterId, role: updaterRole } = extractSenderData(request)

  const currentTemplate = await templateRepo.getTemplateById(request.params)
  if (!currentTemplate)
    throw new AppError('TEMPLATE_NOT_FOUND', 'Template not found', 400)
  const updates = request.body // هر چیزی که به عنوان ورودی وارد شده است، بایستی در جدول قالب ها آپدیت شود

  let aclResult = { isOkay: false, reason: '' }
  if (updaterRole === 'teacher') {
    aclResult = await checkWithACL(request, { own: (updaterId === currentTemplate.teacherId), ...updates })
  }
  else {
    aclResult = await checkWithACL(request, updates)
  }
  if (!aclResult.isOkay)
    throw new AppError('TEMPLATE_ACTION_IS_FORBIDDEN', aclResult.reason, 403)

  updates.updatedAt = DateTime.now().setZone('Asia/Tehran').toFormat('yyyy-LL-dd HH:mm:ss')

  const updated = await templateRepo.updateTemplate(request.params, updates)

  auditLogger.update('', { request: setAuditRequest(request), oldData: currentTemplate, newData: updated })

  return updated
}

/**
 * حذف قالب
 */
export async function deleteTemplate(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  const existing = await templateRepo.getTemplateById(request.params)
  if (!existing)
    throw new AppError('TEMPLATE_NOT_FOUND', 'Template not found', 400)

  // const { role, userId } = extractSenderData(request)
  // if (role === 'teacher' || role === 'admin') {
  //   const aclResult = await checkWithACL(request, { own: (existing.teacherId === userId) })
  //   if (!aclResult.isOkay)
  //     throw new AppError('PLAN_TEMPLATE_ACTION_IS_FORBIDDEN', aclResult.reason, 403)
  // }

  await templateRepo.deleteTemplate(request.params)
  auditLogger.delete('', { request: setAuditRequest(request), oldData: existing, newData: null })
}
