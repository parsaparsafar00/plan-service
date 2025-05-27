import type { FastifyRequest } from 'fastify'
// import type { AutoQueryData } from '@amard/auto-query'
import type * as generalSchema from '../schemas/plan-general-schema.js'
import { AppError } from '@amard/error-handling'
import { validate as isValidUuid } from 'uuid'
import * as helperRepo from '../../data-access/plan-helper-repository.js'
import { SystemMethodsAndUsageTimesType } from '../schemas/system-method-schema.js'
import { SystemsAndUsageTimesType } from '../schemas/system-schema.js'
import { ExercisesAndUsageTimesType } from '../schemas/exercise-schema.js'
import { TechniquesAndUsageTimesType } from '../schemas/technique-schema.js'
import { TechniqueMethodsAndUsageTimesType } from '../schemas/technique-method-schema.js'

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
 * گرفتن سیستم تکرار به همراه تعداد استفادشون توسط مربی
 */
export async function getSystemsAndTheirUsageTimes(request: FastifyRequest<{ Params: generalSchema.IdQueryTeacherType }>): Promise<SystemsAndUsageTimesType[]> {
  const { userId: creatorId, role: creatorRole } = extractSenderData(request)

  if (creatorRole === 'admin') {
    const teacherId = request.params.id
    if (!isValidUuid(teacherId)) throw new AppError('PLAN_SYSTEM_TEACHER_ID_INVALID', 'Teacher ID is invalid', 400)
  }

  return await helperRepo.getSystemsAndTheirUsageTimes(creatorId)
}

/**
 * گرفتن متد سیستم تکرار به همراه تعداد استفادشون توسط مربی
 */
export async function getSystemMethodsAndTheirUsageTimes(request: FastifyRequest<{ Params: generalSchema.IdQueryTeacherType }>): Promise<SystemMethodsAndUsageTimesType[]> {
  const { userId: userId, role: creatorRole } = extractSenderData(request)

  if (creatorRole === 'admin') {
    const teacherId = request.params.id
    if (!isValidUuid(teacherId)) throw new AppError('PLAN_SYSTEM_METHOD_TEACHER_ID_INVALID', 'Teacher ID is invalid', 400)
  }
  return await helperRepo.getSystemMethodsAndTheirUsageTimes(userId)
}

/**
 * گرفتن تکنیک‌ها به همراه تعداد استفاده‌شان توسط مربی
 */
export async function getTechniquesAndTheirUsageTimes(request: FastifyRequest<{ Params: generalSchema.IdQueryTeacherType }>): Promise<TechniquesAndUsageTimesType[]> {
  const { userId: creatorId, role: creatorRole } = extractSenderData(request)

  let teacherId = creatorId
  if (creatorRole === 'admin') {
    teacherId = request.params.id
    if (!isValidUuid(teacherId)) throw new AppError('PLAN_TECHNIQUE_TEACHER_ID_INVALID', 'شناسه مربی نامعتبر است', 400)
  }

  return await helperRepo.getTechniquesAndTheirUsageTimes(teacherId)
}

/**
 * گرفتن متدهای تکنیکی به همراه تعداد استفاده‌شان توسط مربی
 */
export async function getTechniqueMethodsAndTheirUsageTimes(request: FastifyRequest<{ Params: generalSchema.IdQueryTeacherType }>): Promise<TechniqueMethodsAndUsageTimesType[]> {
  const { userId: creatorId, role: creatorRole } = extractSenderData(request)

  let teacherId = creatorId
  if (creatorRole === 'admin') {
    teacherId = request.params.id
    if (!isValidUuid(teacherId)) throw new AppError('PLAN_TECHNIQUE_METHOD_TEACHER_ID_INVALID', 'شناسه مربی نامعتبر است', 400)
  }

  return await helperRepo.getTechniqueMethodsAndTheirUsageTimes(teacherId)
}

/**
 * گرفتن حرکات به همراه تعداد استفادشون توسط مربی
 */
export async function getExercisesAndTheirUsageTimes(request: FastifyRequest<{ Params: generalSchema.IdQueryTeacherType }>): Promise<ExercisesAndUsageTimesType[]> {
  const { userId: creatorId, role: creatorRole } = extractSenderData(request)

  if (creatorRole === 'admin') {
    const teacherId = request.params.id
    if (!isValidUuid(teacherId)) throw new AppError('PLAN_EXERCISE_TEACHER_ID_INVALID', 'Teacher ID is invalid', 400)
  }

  return await helperRepo.getExercisesAndTheirUsageTimes(creatorId)
}
