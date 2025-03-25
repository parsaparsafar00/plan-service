import type { FastifyRequest } from 'fastify'
import type * as planSchema from './plan-schema.js'
import { checkWithACL } from '@amard/access-control'
import { AppError } from '@amard/error-handling'
import { auditLogger, setAuditRequest } from '@amard/logger'
import { DateTime } from 'luxon'
import { validate as isValidUuid, v4 as uuidv4 } from 'uuid'
import * as planRepo from '../data-access/plan-repository.js'
import { generatePlan } from '../instructions/plan_generator.js'

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
 * ایجاد برنامه تمرینی با استفاده از آرایه موجود در حافظه
 */
export async function createPlan(request: FastifyRequest<{ Body: planSchema.CreatePlanRequestType }>) {
  if (!isValidUuid(request.body.teacherId))
    throw new AppError('PLAN_OWNER_ID_INVALID', 'Teacher ID is invalid', 400)

  const nowStr = DateTime.now().toFormat('yyyy-LL-dd HH:mm:ss') // useTz=false در migration
  const newPlan: planSchema.PlanType = {
    id: uuidv4(),
    title: request.body.title,
    description: request.body.description,
    studentId: request.body.studentId,
    status: 'active',
    teacherId: request.body.teacherId,
    studentLevel: request.body.traineeInfo.level,
    target: request.body.target,
    studentWeight: request.body.traineeInfo.weight,
    studentAge: request.body.traineeInfo.age,
    nWeeks: request.body.weeks.length,
    workoutPlan: '',
    createdAt: nowStr,
    updatedAt: nowStr,
  }

  // inMemory plan generator
  const workout = generatePlan({
    target: request.body.target,
    level: request.body.traineeInfo.level,
    age: request.body.traineeInfo.age,
    weight: request.body.traineeInfo.weight,
    gender: request.body.traineeInfo.gender,
    weeks: request.body.weeks.map(w => ({
      week: w.week,
      sessionsPerWeek: w.sessionsPerWeek,
      sessions: w.sessions.map(s => ({
        session: s.session,
        segmentation: s.segmentation,
        targetMuscles: s.targetMuscles,
      })),
    })),
  })

  newPlan.workoutPlan = JSON.stringify(workout, null, 2)

  const inserted = await planRepo.insertPlan(newPlan)
  auditLogger.create('', { request: setAuditRequest(request), oldData: null, newData: inserted })

  return inserted
}

/**
 * دریافت برنامه با آیدی
 */
export async function getPlan(request: FastifyRequest<{ Params: planSchema.IdParamType }>) {
  const plan = await planRepo.getPlanById(request.params.id)
  if (!plan)
    throw new AppError('PLAN_NOT_FOUND', 'Plan not found', 400)

  const { role, userId } = extractSenderData(request)
  if (role === 'teacher' || role === 'student') {
    const aclResult = await checkWithACL(request, { own: (plan.teacherId === userId) })
    if (!aclResult.isOkay)
      throw new AppError('PLANS_ACTION_FORBIDDEN', aclResult.reason, 403)
  }

  return plan
}

/**
 * ویرایش برنامه
 */
export async function updatePlan(request: FastifyRequest<{ Params: planSchema.IdParamType, Body: planSchema.UpdatePlanRequestType }>) {
  const { userId: updaterId, role: updaterRole } = extractSenderData(request)
  const currentPlan = await planRepo.getPlanById(request.params.id)
  if (!currentPlan)
    throw new AppError('PLAN_NOT_FOUND', 'Plan not found', 400)

  const updates = request.body

  let aclResult = { isOkay: false, reason: '' }
  if (updaterRole === 'teacher' || updaterRole === 'admin')
    aclResult = await checkWithACL(request, { own: (updaterId === currentPlan.teacherId), ...updates })
  else
    aclResult = await checkWithACL(request, updates)

  if (!aclResult.isOkay)
    throw new AppError('PLAN_ACTION_IS_FORBIDDEN', aclResult.reason, 403)

  updates.updatedAt = DateTime.now().toFormat('yyyy-LL-dd HH:mm:ss')

  const updated = await planRepo.updatePlan(currentPlan.id, updates)
  auditLogger.update('', { request: setAuditRequest(request), oldData: currentPlan, newData: updated })

  return updated
}

/**
 * حذف برنامه
 */
export async function deletePlan(request: FastifyRequest<{ Params: planSchema.IdParamType }>) {
  const existing = await planRepo.getPlanById(request.params.id)
  if (!existing)
    throw new AppError('PLAN_NOT_FOUND', 'Plan not found', 400)

  const { role, userId } = extractSenderData(request)
  if (role === 'teacher' || role === 'admin') {
    const aclResult = await checkWithACL(request, { own: (existing.teacherId === userId) })
    if (!aclResult.isOkay)
      throw new AppError('PLANS_ACTION_IS_FORBIDDEN', aclResult.reason, 403)
  }

  await planRepo.deletePlan(existing.id)
  auditLogger.delete('', { request: setAuditRequest(request), oldData: existing, newData: null })
}
