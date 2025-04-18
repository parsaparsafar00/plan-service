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

/** ------------------------------------------------------- Plans ------------------------------------------------------- */

/**
 * ایجاد برنامه تمرینی با استفاده از آرایه موجود در حافظه
 */
export async function createPlan(request: FastifyRequest<{ Body: planSchema.CreatePlanRequestType }>) {
  if (!isValidUuid(request.body.teacherId))
    throw new AppError('PLAN_OWNER_ID_INVALID', 'Teacher ID is invalid', 400)

  // جمع آوری مجموعه هفته های انتخاب شده توسط مربی
  const weeks: number[] = []
  // چک اولیه برای وجود آرایه هفته ها
  if (request.body.weeks && Array.isArray(request.body.weeks)) {
    request.body.weeks.forEach((weekArr) => {
      // بررسی اینکه weeks آرایه هست یا خیر
      if (Array.isArray(weekArr)) {
        weekArr.forEach((weekNum) => {
          if (!weeks.includes(weekNum))
            weeks.push(weekNum)
        })
      }
    })
  }
  else {
    throw new AppError('PLAN_WEEK_INPUT_INVALID', 'Invalid or missing weeks data in request', 400)
  }

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
    nWeeks: weeks.length,
    workoutPlan: {},
    createdAt: nowStr,
    updatedAt: nowStr,
  }

  // ورودی تابع تولید کننده برنامه تمرینی
  const generatePlanInput = {
    target: request.body.target,
    level: request.body.traineeInfo.level,
    age: request.body.traineeInfo.age,
    weight: request.body.traineeInfo.weight,
    gender: request.body.traineeInfo.gender,
    weeks: request.body.weeks.map(w => ({
      number: w.number,
      sessions: w.sessions.map(s => ({
        session: s.session,
        targetMuscles: s.targetMuscles,
      })),
    })),
    printingPlan: request.raw.url?.includes('print'), // آیا برنامه برای مخصوص پرینت است یا خیر
  }

  // تولید برنامه تمرینی و ذخیره آن بصورت جیسان در جدول برنامه ها
  const workout = generatePlan(generatePlanInput)
  newPlan.workoutPlan = workout
  const inserted = await planRepo.insertPlan(newPlan)

  // اینسرت کردن تمام حرکات موجود در برنامه تمرینی به جدول کمکی مربوط به ترین، به انضمام سیستم های تولید شده توسط دستور العمل ها
  await Promise.all(
    workout.weeks.flatMap(week =>
      week.sessions.flatMap(session =>
        session.exercises?.map(async (ex) => {
          // ورودی تابع ذخیره اطلاعات مربوط به جدول ترین
          const generatePlanTrainInput = {
            id: uuidv4(),
            planId: inserted.id,
            exerciseNumber: ex.number,
            createdAt: nowStr,
            updatedAt: nowStr,
          }
          // ورودی تابع ذخیره اطلاعات مربوط به جدول سیستم ها
          const systemMethod = 'دلخواه'
          const systemInput: planSchema.SystemType = {
            id: uuidv4(),
            abbrName: `سیستم ${systemMethod} ${ex.system.toString()}`,
            teacherId: request.body.teacherId,
            description: '',
            descIsVisible: false,
            method: systemMethod,
            repeatPattern: ex.system,
            status: 'active',
            createdAt: nowStr,
            updatedAt: nowStr,
          }

          await planRepo.insertPlanTrainHelper(generatePlanTrainInput)
          await planRepo.insertPlanSystem(systemInput)
        }) ?? [],
      ),
    ),
  )
  // بازگشت خروجی
  auditLogger.create('', { request: setAuditRequest(request), oldData: null, newData: inserted })
  return inserted
}

/**
 * دریافت برنامه تمرینی با آیدی
 */
export async function getPlan(request: FastifyRequest<{ Params: planSchema.IdParamType }>) {
  const plan = await planRepo.getPlanById(request.params.id)
  if (!plan)
    throw new AppError('PLAN_NOT_FOUND', 'Plan not found', 400)

  const { role, userId } = extractSenderData(request)
  if (role === 'teacher' || role === 'student') {
    const aclResult = await checkWithACL(request, { own: (plan.teacherId === userId) })
    if (!aclResult.isOkay)
      throw new AppError('PLAN_ACTION_FORBIDDEN', aclResult.reason, 403)
  }

  return plan
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

/** ------------------------------------------------------- Systems ------------------------------------------------------- */

/**
 * تولید سیستم برنامه تمرینی
 */
export async function createPlanSystem(request: FastifyRequest<{ Body: planSchema.CreatePlanSystemRequestType }>) {
  if (!isValidUuid(request.body.teacherId))
    throw new AppError('PLAN_OWNER_ID_INVALID', 'Teacher ID is invalid', 400)

  const nowStr = DateTime.now().toFormat('yyyy-LL-dd HH:mm:ss') // useTz=false در migration
  const newSystem: planSchema.SystemType = {
    id: uuidv4(),
    abbrName: `سیستم ${request.body.method} ${request.body.repeatPattern.toString()}`,
    teacherId: request.body.teacherId,
    description: request.body.description,
    descIsVisible: request.body.descIsVisible,
    method: request.body.method,
    repeatPattern: request.body.repeatPattern,
    status: 'active',
    createdAt: nowStr,
    updatedAt: nowStr,
  }

  const inserted = await planRepo.insertPlanSystem(newSystem)
  auditLogger.create('', { request: setAuditRequest(request), oldData: null, newData: inserted })
  return inserted
}

/**
 * گرفتن همه سیستم های برنامه تمرینی
 */
export async function getAllSystemsByTeacherId(request: FastifyRequest<{ Params: planSchema.IdParamType }>) {
  if (!isValidUuid(request.params.id))
    throw new AppError('SYSTEM_OWNER_ID_INVALID', 'Teacher ID is invalid', 400)

  const systems = await planRepo.getAllSystemsByTeacherId(request.params.id)

  return systems
}

/** ------------------------------------------------------- Techniques ------------------------------------------------------- */

/**
 * تولید تکنیک
 */
export async function createTechnique(request: FastifyRequest<{ Body: planSchema.CreateTechniqueRequestType }>) {
  if (!isValidUuid(request.body.teacherId))
    throw new AppError('PLAN_OWNER_ID_INVALID', 'Teacher ID is invalid', 400)

  const nowStr = DateTime.now().toFormat('yyyy-LL-dd HH:mm:ss') // useTz=false در migration
  const newTechnique: planSchema.TechniqueType = {
    id: uuidv4(),
    abbrName: `تکنیک ${request.body.method} ${request.body.name}`,
    name: request.body.name,
    teacherId: request.body.teacherId,
    description: request.body.description,
    descIsVisible: request.body.descIsVisible,
    method: request.body.method,
    status: 'active',
    createdAt: nowStr,
    updatedAt: nowStr,
  }

  const inserted = await planRepo.insertTechnique(newTechnique)
  auditLogger.create('', { request: setAuditRequest(request), oldData: null, newData: inserted })
  return inserted
}

/**
 * گرفتن همه سیستم های برنامه تمرینی
 */
export async function getAllTechniquesByTeacherId(request: FastifyRequest<{ Params: planSchema.IdParamType }>) {
  if (!isValidUuid(request.params.id))
    throw new AppError('TECHNIQUE_OWNER_ID_INVALID', 'Teacher ID is invalid', 400)

  const techniques = await planRepo.getTechniquesByTeacherId(request.params.id)
  return techniques
}
