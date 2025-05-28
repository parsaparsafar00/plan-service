import type { FastifyRequest } from 'fastify'
import type { AutoQueryData } from '@amard/auto-query'
import type * as generalSchema from '../schemas/plan-general-schema.js'
import type * as planSchema from '../schemas/plan-schema.js'
import type * as templateSchema from '../schemas/template-schema.js'
import { checkWithACL } from '@amard/access-control'
import { AppError } from '@amard/error-handling'
import { auditLogger, setAuditRequest } from '@amard/logger'
import { DateTime } from 'luxon'
import { validate as isValidUuid, v4 as uuidv4 } from 'uuid'
import * as templateRepo from '../../data-access/template-repository.js'
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
  const { userId: creatorId, role: creatorRole } = extractSenderData(request)
  if (creatorRole === 'admin') {
    if (!isValidUuid(creatorId)) throw new AppError('PLAN_PLAN_TEACHER_ID_INVALID', 'Teacher ID is invalid', 400)
  }

  const generateSessionByAIInput: planSchema.GenerateSessionByAIRequestType = {
    teacherId: creatorId,
    description: request.body.description,
    exerciseType: 'body building',
    target: request.body.target,
    weeks: [],
    injuries: [],
    targetMuscles: request.body.muscles,
    traineeInfo: {
      level: request.body.level,
      age: undefined, // پارامتر سن تاثیری در تولید قالب ندارد
      weight: undefined, // پارامتر وزن تاثیری در تولید قالب ندارد
      gender: request.body.gender,
    },
  }

  const sessionOutput: planSchema.sessionOutputType = await AISessionGenerator(generateSessionByAIInput) // تولید جلسه تمرینی توسط هوش مصنوعی

  const exercisesInPlan = Object.values(sessionOutput.exercises).map(exercise => ({
    number: exercise.number,
    restBetweenSets: exercise.restBetweenSets,
    weightPercentage: exercise.weightPercentage,
    systemNumber: exercise.systemNumber,
    techniqueNumber: null, // هوش مصنوعی فعلا تکنیکی تولید نمیکنه برامون
  }))

  // آماده سازی ورودی تابع ذخیره کننده قالب در دیتابیس
  const adaptedSession = {
    ...sessionOutput,
    exercises: exercisesInPlan.map(ex => ({
      ...ex,
      techniqueNumber: ex.techniqueNumber || undefined,
    })),
  }

  const nowStr = DateTime.now().toFormat('yyyy-LL-dd HH:mm:ss')
  const newTemplate: templateSchema.TemplateType = {
    id: uuidv4(),
    name: request.body.name,
    teacherId: creatorId,
    description: request.body.description,
    level: request.body.level,
    target: request.body.target,
    muscles: JSON.stringify(request.body.muscles),
    gender: request.body.gender,
    session: adaptedSession,
    categoryId: null,
    createdAt: nowStr,
    updatedAt: nowStr,
  }

  const inserted = await templateRepo.insertTemplate(newTemplate)
  if (inserted) {
    inserted.muscles = JSON.parse(inserted.muscles) // برگشت عضله ها به فرمت آرایه
    auditLogger.create('', { request: setAuditRequest(request), oldData: null, newData: inserted })
  }
  return inserted
}

/**
 * تولید قالب بصورت دستی
 */
export async function createTemplateManual(request: FastifyRequest<{ Body: templateSchema.CreateTemplateManualRequestType }>) {
  const { userId: creatorId, role: creatorRole } = extractSenderData(request)
  if (creatorRole === 'admin') {
    if (!isValidUuid(creatorId)) throw new AppError('PLAN_PLAN_TEACHER_ID_INVALID', 'Teacher ID is invalid', 400)
  }

  const nowStr = DateTime.now().toFormat('yyyy-LL-dd HH:mm:ss')
  const newTemplate: templateSchema.TemplateType = {
    id: uuidv4(),
    name: request.body.name,
    teacherId: creatorId,
    description: request.body.description,
    level: request.body.level,
    target: request.body.target,
    muscles: JSON.stringify(request.body.muscles),
    gender: request.body.gender,
    session: request.body.session,
    categoryId: request.body.categoryId,
    createdAt: nowStr,
    updatedAt: nowStr,
  }

  const inserted = await templateRepo.insertTemplate(newTemplate)
  auditLogger.create('', { request: setAuditRequest(request), oldData: null, newData: inserted || null })
  return inserted
}

/**
 * گرفتن همه قالب های مربی
 */
export async function getAllTemplatesByTeacherId(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  if (!isValidUuid(request.params.id)) throw new AppError('PLAN_TEMPLATE_OWNER_ID_INVALID', 'Teacher ID is invalid', 400)
  return await templateRepo.getAllTemplatesByTeacherId(request.params.id, request.autoQueryData as AutoQueryData)
}

/**
 * گرفتن همه قالب های موجود توسط ادمین
 */
export async function getAllTemplates(request: FastifyRequest): Promise<templateSchema.TemplateType[]> {
  return await templateRepo.getAllTemplates(request.autoQueryData as AutoQueryData)
}

/**
 * گرفتن اطلاعات یک قالب بر اساس آیدی قالب
 */
export async function getTemplateById(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  if (!isValidUuid(request.params.id)) throw new AppError('PLAN_TEMPLATE_OWNER_ID_INVALID', 'Teacher ID is invalid', 400)
  const template = await templateRepo.getTemplateById(request.params.id)
  if (template) {
    template.muscles = JSON.parse(template.muscles) // ارایه کردن ستون عضلات
  }
  return template
}

/**
 * ویرایش قالب تمرینی
 */
export async function updateTemplate(request: FastifyRequest<{ Params: generalSchema.IdParamType; Body: templateSchema.UpdateTemplateRequestType }>) {
  const existingTemplate = await templateRepo.getTemplateById(request.params.id)
  if (!existingTemplate) throw new AppError('PLAN_TEMPLATE_NOT_FOUND', 'Template not found', 404)

  const { userId: updaterId, role: updaterRole } = extractSenderData(request)
  const updates = request.body

  let aclResult = { isOkay: false, reason: '' }
  if (updaterRole === 'teacher') {
    aclResult = await checkWithACL(request, { own: updaterId === existingTemplate.teacherId, ...updates })
    if (!aclResult.isOkay) throw new AppError('PLAN_TEMPLATE_ACTION_IS_FORBIDDEN', aclResult.reason, 403)
  }

  // ورودی آپدیت قالب رو میسازیم
  updates.updatedAt = DateTime.now().setZone('Asia/Tehran').toFormat('yyyy-LL-dd HH:mm:ss')

  const updated = await templateRepo.updateTemplate(request.params.id, updates)
  auditLogger.update('', { request: setAuditRequest(request), oldData: existingTemplate, newData: updated || null })

  return updated
}

/**
 * حذف قالب
 */
export async function deleteTemplate(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  const existing = await templateRepo.getTemplateById(request.params.id)
  if (!existing) throw new AppError('PLAN_TEMPLATE_NOT_FOUND', 'Template not found', 404)

  const { role, userId } = extractSenderData(request)
  if (role === 'teacher' || role === 'admin') {
    const aclResult = await checkWithACL(request, { own: existing.teacherId === userId })
    if (!aclResult.isOkay) throw new AppError('PLAN_TEMPLATE_ACTION_IS_FORBIDDEN', aclResult.reason, 403)
  }

  await templateRepo.deleteTemplate(request.params.id)
  auditLogger.delete('', { request: setAuditRequest(request), oldData: existing, newData: null })
}
