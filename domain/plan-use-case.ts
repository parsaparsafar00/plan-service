import type { AutoQueryData } from '@amard/auto-query'
import type { FastifyRequest } from 'fastify'
import type * as planSchema from './plan-schema.js'
import { checkWithACL } from '@amard/access-control'
import { AppError } from '@amard/error-handling'
import { auditLogger, setAuditRequest } from '@amard/logger'
import { DateTime } from 'luxon'
import { validate as isValidUuid, v4 as uuidv4 } from 'uuid'
import * as planRepo from '../data-access/plan-repository.js'
import { getExerciseInstructions } from '../instructions/exercise_instructions.js'
import { getPlanInstructions } from '../instructions/plan_instructions.js'
import { getSessionInstructions } from '../instructions/session_instructions.js'

// تابع کمکی برای استخراج نقش/شناسه کاربر از request
function extractSenderData(request: FastifyRequest) {
  const underJwt = (request.underJwt === 'true')
  let role = 'internal-service-user-role'
  let userId = 'internal-service-user-id'
  if (underJwt) {
    role = request.user!.role
    userId = request.user!.id
  }
  return { role, userId }
}

/**
 * ایجاد برنامه تمرینی
 */
export async function createPlan(request: FastifyRequest<{ Body: planSchema.CreatePlanRequestType }>) {
  const { userId: tokenUserId, role: tokenUserRole } = extractSenderData(request)
  let userId = tokenUserId
  if (tokenUserRole === 'admin' || tokenUserRole === 'teacher') {
    if (!isValidUuid(request.body.teacher_id))
      throw new AppError('PLAN_OWNER_ID_INVALID', 'User ID is invalid', 400)
    else
      userId = request.body.teacher_id
  }

  const traineeInfo = request.body.traineeInfo
  const nowStr = DateTime.now().setZone('Asia/Tehran').toFormat('yyyy-LL-dd HH:mm:ss')
  const newPlan: planSchema.PlanType = {
    id: uuidv4(),
    title: request.body.title,
    description: request.body.description,
    student_id: request.body.student_id,
    status: 'active',
    teacher_id: request.body.teacher_id,
    student_level: request.body.traineeInfo.level,
    target: request.body.target,
    student_weight: request.body.traineeInfo.weight,
    student_age: request.body.traineeInfo.age,
    n_weeks: (request.body.weeks).length,
    workout_plan: '',
    createdAt: nowStr,
    updatedAt: nowStr,
  }
  const workoutPlan = []
  const weeks = request.body.weeks
  const age = traineeInfo.age
  const weight = traineeInfo.weight
  const gender = traineeInfo.gender
  const target = request.body.target
  const level = traineeInfo.level
  const levels = ['novice', 'beginner', 'intermediate', 'advanced', 'expert']

  const workout_plan_info = getPlanInstructions(level)

  for (const [weekIndex, week] of weeks.entries()) {
    const { sessions } = week
    const weekData = {
      index: weekIndex + 1,
      ...workout_plan_info,
      sessions: [],
    }

    for (const [sessionIndex, session] of sessions.entries()) {
      const { segmentation, targetMuscles: sessionTargetMuscles } = session
      const muscleValues = sessionTargetMuscles.filter(muscle => muscle.trim() !== '')

      const session_info = getSessionInstructions({
        age,
        gender,
        target,
        level,
        target_muscle_groups: muscleValues,
      })

      const { recoveryTime, number_of_exercises_per_muscle, sessionDuration, cooldownActivities, warmupActivities, cooldownDuration_ground, cooldownDuration_ceiling, warmupDuration_ground, warmupDuration_ceiling } = session_info

      // Generate query conditions for generating the dedicated plan
      const levelIndex = levels.indexOf(level)
      const difficultyCondition = levels.slice(0, levelIndex + 1).map(() => '?').join(', ')
      const muscleCondition = muscleValues.length > 0
        ? `AND (target_muscle_group IN (${muscleValues.map(() => '?').join(', ')}) OR target_muscle_group IS NULL)`
        : ''

      // Query string with ? placeholders
      const plan_generator_query = `
            SELECT id, name, short_youtube_demonstration, in_depth_youtube_explanation,
                difficulty_level, primary_equipment, body_region, mechanics
            FROM exercises
            WHERE (age_ground <= ? AND age_ceiling >= ?)
            AND (weight_ground <= ? AND weight_ceiling >= ?)
            AND (gender = ? OR gender IS NULL)
            AND (target = ? OR target IS NULL)
            ${difficultyCondition ? `AND difficulty_level IN (${difficultyCondition})` : ''}
            ${muscleCondition}
            ORDER BY RANDOM()
            LIMIT ?
          `

      // Values to replace placeholders
      const values = [
        age, // Replaces the first ? (age_ground <= ?)
        age, // Replaces the second ? (age_ceiling >= ?)
        weight, // Replaces the third ? (weight_ground <= ?)
        weight, // Replaces the fourth ? (weight_ceiling >= ?)
        gender, // Replaces the fifth ? (gender = ?)
        target, // Replaces the sixth ? (target = ?)
        ...levels.slice(0, levelIndex + 1), // Replaces difficulty_level IN (?, ?, ...)
        ...muscleValues, // Replaces target_muscle_group IN (?, ?, ...)
        muscleValues.length * number_of_exercises_per_muscle, // Replaces LIMIT ?
      ]

      const exercises = await planRepo.generatePlan(plan_generator_query, values)

      const sessionData = {
        index: sessionIndex + 1,
        split: segmentation,
        targetMuscles: muscleValues,
        cooldownActivities,
        warmupActivities,
        cooldownDuration_ground,
        cooldownDuration_ceiling,
        warmupDuration_ground,
        recoveryTime,
        warmupDuration_ceiling,
        sessionDuration,
        exercises: [],
      }
      if (!exercises) {
        throw new AppError('PLAN_NOT_FOUND', 'No related plan was found', 400)
      }
      else {
        console.log(exercises)
        for (const exercise of exercises) {
          const mechanics = exercise.mechanics
          const exercise_info = getExerciseInstructions({
            age,
            gender,
            target,
            level,
            mechanics,
            target_muscle_groups: muscleValues,
          })

          const { restBetweenSets, exercise_weight, number_of_sets, repsPerSet } = exercise_info

          sessionData.exercises.push({
            ...exercise,
            restBetweenSets,
            exercise_weight,
            number_of_sets,
            repsPerSet,
          })
        }
      }
      weekData.sessions.push(sessionData)
    }

    workoutPlan.push(weekData)
  }

  const workoutPlan_json = JSON.stringify(workoutPlan, null, 2)
  newPlan.workout_plan = workoutPlan_json
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
    const aclResult = await checkWithACL(request, { own: (plan.teacher_id === userId) })
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

  let aclResult = {
    isOkay: false,
    reason: '',
  }

  if (updaterRole === 'teacher' || updaterRole === 'admin')
    aclResult = await checkWithACL(request, { own: (updaterId === currentPlan.teacher_id), ...updates })
  else
    aclResult = await checkWithACL(request, updates)

  if (!aclResult.isOkay)
    throw new AppError('PLAN_ACTION_IS_FORBIDDEN', aclResult.reason, 403)

  updates.updatedAt = DateTime.now().setZone('Asia/Tehran').toFormat('yyyy-LL-dd HH:mm:ss')

  const updated = await planRepo.updatePlan(currentPlan.id, updates)

  auditLogger.update('', { request: setAuditRequest(request), oldData: currentPlan, newData: updated })

  return updated
}

/**
 * حذف برنامه تمرینی
 */
export async function deletePlan(request: FastifyRequest<{ Params: planSchema.IdParamType }>) {
  const existing = await planRepo.getPlanById(request.params.id)
  if (!existing)
    throw new AppError('PLAN_NOT_FOUND', 'Plan not found', 400)

  const { role, userId } = extractSenderData(request)
  if (role === 'teacher' || role === 'admin') {
    const aclResult = await checkWithACL(request, { own: (existing.teacher_id === userId) })
    if (!aclResult.isOkay)
      throw new AppError('PLANS_ACTION_FORBIDDEN', aclResult.reason, 403)
  }

  await planRepo.deletePlan(existing.id)

  auditLogger.delete('', { request: setAuditRequest(request), oldData: existing, newData: null })
}
