import type { FastifyRequest } from 'fastify'
import type * as planSchema from '../schemas/plan-schema.js'
import type * as systemSchema from '../schemas/system-schema.js'
import type * as exerciseSchema from '../schemas/exercise-schema.js'
import type * as trainHelperSchema from '../schemas/train-helper-schema.js'
import type * as generalSchema from '../schemas/plan-general-schema.js'
import { getExercise } from '../use-cases/exercise-use-case.js'
import { checkWithACL } from '@amard/access-control'
import { AppError } from '@amard/error-handling'
import { auditLogger, setAuditRequest } from '@amard/logger'
import { DateTime } from 'luxon'
import { validate as isValidUuid, v4 as uuidv4 } from 'uuid'
import * as planRepo from '../../data-access/migrations/repos/plan-repository.js'
import * as helperRepo from '../../data-access/migrations/repos/plan-helper-repository.js'
import * as systemRepo from '../../data-access/migrations/repos/system-repository.js'
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
 * تولید جلسه ای برنامه تمرینی 
 */
export async function generateSessionAI(request: FastifyRequest<{ Body: planSchema.GeneratePlanRequestType }>) {
  if (!isValidUuid(request.body.teacherId)) throw new AppError('PLAN_OWNER_ID_INVALID', 'Teacher ID is invalid', 400)

  // تولید برنامه تمرینی و ذخیره آن بصورت جیسان در جدول برنامه ها
  const workout_session = AISessionGenerator(request.body);

  // استخراج شماره‌های حرکات از برنامه
  const exerciseNumbers: number[] = [];
  Object.keys(workout_session.exercises).forEach(exerciseKey => {
    const exercise = workout_session.exercises[parseInt(exerciseKey)];
    exerciseNumbers.push(exercise.number);
  });

  // دریافت اطلاعات هر حرکت بر اساس شماره حرکات
  const exercisesInfo = await Promise.all(
    exerciseNumbers.map(number => {
      const getExerciseInput: exerciseSchema.getExerciseType = {
        number: number,
        print: false
      };
      return getExercise({params: getExerciseInput});
    })
  );

  // به‌روزرسانی برنامه با اطلاعات تمرینات
  const updatedExercises = Object.keys(workout_session.exercises).map(key => {
    const originalExercise = workout_session.exercises[parseInt(key)];
    const exerciseInfo = exercisesInfo.find(info => info.number === originalExercise.number);
    
    // گرفتن همه پارامتر های گرفته شده و همینطور موجود
    return { 
      ...originalExercise,
      ...exerciseInfo 
    };
  });

  // جلسه تمرینی با حضور جزئیات حرکات تمرینی
  workout_session.exercises = updatedExercises;
  
  // بازگشت خروجی
  auditLogger.create('', { request: setAuditRequest(request), oldData: null, newData: workout_session })
  return workout_session;
}

/**
 * (با استفاده از هوش مصنوعی یا بصورت دستی توسط مربی) تولید برنامه تمرینی با استفاده از جلسات از قبل تولید شده
*/
export async function createPlan(request: FastifyRequest<{ Body: planSchema.CreatePlanRequestType }>) {
  
  const nowStr = DateTime.now().toFormat('yyyy-LL-dd HH:mm:ss') // useTz=false در migration
  const newPlan: planSchema.PlanType = {
    id: uuidv4(),
    title: request.body.title,
    description: request.body.description,
    studentId: request.body.studentId,
    status: request.body.status,
    teacherId: request.body.teacherId,
    studentLevel: request.body.studentLevel,
    target: request.body.target,
    studentWeight: request.body.studentWeight,
    studentAge: request.body.studentAge,
    workoutPlan: {
      sessions: request.body.sessions
    },
    createdAt: nowStr,
    updatedAt: nowStr,
  }

  const inserted = await planRepo.insertPlan(newPlan)

  // اینسرت کردن تمام حرکات موجود در برنامه تمرینی به جدول کمکی مربوط به ترین، به انضمام سیستم های تولید شده توسط دستور العمل ها 
  await Promise.all(
    request.body.sessions.flatMap(session =>
      session.exercises?.map(async (ex) => {
      
        // ورودی تابع ذخیره اطلاعات مربوط به جدول ترین
        const planTrainInput: trainHelperSchema.PlanTrainHelperType = {
          id: uuidv4(),
          planId: inserted.id,
          exerciseNumber: ex.number,
          createdAt: nowStr,
          updatedAt: nowStr,
        }
        // ورودی تابع ذخیره اطلاعات مربوط به جدول سیستم ها
        const systemInput: systemSchema.SystemType = {
          id: uuidv4(),
          abbrName: "سیستم " + ex.systemMethod + " " + ex.system.toString(),
          teacherId: request.body.teacherId,
          description: '',
          descIsVisible: false,
          method: ex.systemMethod,
          repeatPattern: ex.system,
          status: 'active',
          createdAt: nowStr,
          updatedAt: nowStr,
        }

        await helperRepo.insertPlanTrainHelper(planTrainInput)
        await systemRepo.insertPlanSystem(systemInput)

      }) ?? []
    )
  );

  return inserted
}

/**
 * دریافت برنامه تمرینی با آیدی
*/
export async function getPlan(request: FastifyRequest<{ Params: planSchema.getPlanType }>) {
  const plan = await planRepo.getPlanById(request.params.id); 

  const { role, userId } = extractSenderData(request);
  if (role === 'teacher' || role === 'student') {
    const aclResult = await checkWithACL(request, { own: (plan.teacherId === userId) });
    if (!aclResult.isOkay) throw new AppError('PLAN_ACTION_FORBIDDEN', aclResult.reason, 403);
  }

  const exerciseNumbers: number[] = [];
  Object.values(plan.workoutPlan.sessions).forEach((session: any) => {
    Object.values(session.exercises).forEach((exercise: any) => {
      exerciseNumbers.push(exercise.number);
    });
  });

  // دریافت اطلاعات حرکات برای شماره‌های منحصر به فرد
  const uniqueExerciseNumbers = [...new Set(exerciseNumbers)];
  const exercisesInfo = await Promise.all(
    uniqueExerciseNumbers.map(number => {
      const getExerciseInput: exerciseSchema.getExerciseType = {
        number: number,
        print: false
      };
      return getExercise({params: getExerciseInput});
    })
  );

  // به‌روزرسانی حرکات هر جلسه با اطلاعات اضافی
  Object.entries(plan.workoutPlan.sessions).forEach(([sessionKey, session]: [string, any]) => {
    Object.entries(session.exercises).forEach(([exerciseKey, exercise]: [string, any]) => {
      const exerciseInfo = exercisesInfo.find(info => info.number === exercise.number);
      if (request.params.print) {
        const { number, ...restOfExercise } = { ...exercise, ...exerciseInfo }; // حذف number از خروجی حرکات
        plan.workoutPlan.sessions[parseInt(sessionKey)].exercises[parseInt(exerciseKey)] = {...restOfExercise };
      } else {
        // اگر پرینتی نبود، پارامتر number رو نگهداری میکنیم
        plan.workoutPlan.sessions[parseInt(sessionKey)].exercises[parseInt(exerciseKey)] = {...exercise, ...exerciseInfo};
      }
    });
  });

  return plan
}

/**
 * حذف برنامه
*/
export async function deletePlan(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  const existing = await planRepo.getPlanById(request.params)
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


