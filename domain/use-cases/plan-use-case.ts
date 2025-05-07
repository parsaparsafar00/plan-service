import type { FastifyRequest } from 'fastify'
import * as generalSchema from '../schemas/plan-general-schema.js'
import type * as planSchema from '../schemas/plan-schema.js'
import type * as systemSchema from '../schemas/system-schema.js'
import type * as techniqueSchema from '../schemas/technique-schema.js'
import type * as trainHelperSchema from '../schemas/train-helper-schema.js'
import * as exerciseSchema from '../schemas/exercise-schema.js'
import { checkWithACL } from '@amard/access-control'
import { AppError } from '@amard/error-handling'
import { auditLogger, setAuditRequest } from '@amard/logger'
import { DateTime } from 'luxon'
import { validate as isValidUuid, v4 as uuidv4 } from 'uuid'
import * as exerciseRepo from '../../data-access/exercise-repository.js'
import * as helperRepo from '../../data-access/migrations/repos/plan-helper-repository.js'
import * as planRepo from '../../data-access/migrations/repos/plan-repository.js'
import * as systemRepo from '../../data-access/migrations/repos/system-repository.js'
import * as techniqueRepo from '../../data-access/migrations/repos/technique-repository.js'
import { AISessionGenerator } from '../../instructions/plan_generator.js'
import { Value } from '@sinclair/typebox/value';

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
 * تولید جلسه ای برنامه تمرینی با استفاده از هوش مصنوعی
 */
export async function generateSessionAI(request: FastifyRequest<{ Body: planSchema.GenerateSessionByAIRequestType }>) : Promise<planSchema.sessionOutputType>  {

  // تولید برنامه تمرینی و ذخیره آن بصورت جیسان در جدول برنامه ها
  const workout_session = AISessionGenerator(request.body)
  
  // بازگشت خروجی
  auditLogger.create('', { request: setAuditRequest(request), oldData: null, newData: workout_session })
  return workout_session
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
      sessions: request.body.workoutPlan.sessions,
    },
    createdAt: nowStr,
    updatedAt: nowStr,
  }

  // شروع تراکنش
  const trx = await planRepo.transactionGenerator();
  const systemObject : systemSchema.UpdateSystemsByIdListType = {
    idList: [],
    countList: []
  };
  const techniqueObject : techniqueSchema.UpdateTechniquesByIdListType = {
    idList: [],
    countList: []
  };
  try {
    await Promise.all(
      request.body.workoutPlan.sessions.flatMap(session =>
        session.exercises?.map(async (exercise) => {

          if (!exercise.systemId) {  // صرفاً زمانی سیستم را ذخیره می‌کنیم که آِیدی سیستم در ورودی وجود نداشته باشد، یعنی سیستم توسط هوش مصنوعی تولید شده
            const systemInput: systemSchema.SystemType = {
              id: uuidv4(),
              abbrName: `سیستم ${exercise.systemMethod} ${exercise.repeatPattern.toString()}`,
              teacherId: request.body.teacherId,
              description: '',
              usageTimes: 0,
              isGlobal: exercise.systemIsGlobal || false,
              descIsVisible: false,
              method: detectSystemMethod(exercise.repeatPattern),
              repeatPattern: exercise.repeatPattern,
              status: 'active',
              createdAt: nowStr,
              updatedAt: nowStr,
            };
            const system = await systemRepo.insertPlanSystem(systemInput, trx); // صرفا در صورتی ذخیره سیستم انجام میشه که سیستم در دیتابیس موجود نباشه - اگر هم موجود باشه، اروری نمیده چون توسط هوش مصنوعی تولید شده
            const systemId = system.id
            // آیدی تکنیک ها و آیدی سیستم های مورد استفاده در برنامه رو برای آپدیت تراکنشی تعداد دفعات استفاده هر کدام، نگهداری میکنیم

            // بررسی اینکه آیدی سیستم در ابجکت سیستم ها موجود است یا خیر
            const index = systemObject.idList.indexOf(systemId);
          
            if (index !== -1) {
              // اگر وجود داشت، به تعدادش یکی اضافه میکنیم
              systemObject.countList[index]++;
            } else {
              // اگر نبود براش 1 میذاریم
              systemObject.idList.push(systemId);
              systemObject.countList.push(1);
            }
          
            // همین کار رو برای تکنیک ها میکنیم
            if (exercise.techniqueId) {
              const techniqueId = exercise.techniqueId;
              const techniqueIndex = techniqueObject.idList.indexOf(techniqueId);
          
              if (techniqueIndex !== -1) {
                techniqueObject.countList[techniqueIndex]++;
              } else {
                techniqueObject.idList.push(techniqueId);
                techniqueObject.countList.push(1);
              }
            }

            // تنظیم آیدی سیستم پس از ایجاد سیستم
            exercise.systemId = systemInput.id;
          }

          // تکنیک ها لزوما از قبل بایستی تولید شده باشند پس نیازی به ذخیره آنها نیست (چون فعلا توسط هوش مصنوعی تکنیک جدید تولید نمیشود)
    
          // ایجاد ابجکت خروجی فقط با پارامتر های مورد نیاز برای ذخیره در جدول برنامه ها
          const exerciseOutput: exerciseSchema.exerciseOutputInPlanType = {
            number: exercise.number,
            restBetweenSets: exercise.restBetweenSets,
            weightPercentage: exercise.weightPercentage,
            systemId: exercise.systemId!, // مطمئن هستیم که این مقدار وجود دارد
            techniqueId: exercise.techniqueId!, // طبق توضیحات شما، این مقدار باید وجود داشته باشد
          };
    
          // جایگزینی شیء تمرین با نسخه پالایش شده
          Object.assign(exercise, exerciseOutput);
        }),
      )
    )
    
    // همینطور اگر مشکلی در ذخیره برنامه بوجود آمد، سیستم های اینسرت شده رو پاک میکنیم از جدول سیستم ها
    const inserted = await planRepo.insertPlan(newPlan, trx)

    // آپدیت تراکنشی تعداد دفعات استفاده از سیستم ها و تکنیک ها
    await systemRepo.updateSystemUsageTimesByIdList(systemObject, trx)
    await techniqueRepo.updateTechniqueUsageTimesByIdList(techniqueObject, trx)

    // اینسرت کردن تمام حرکات موجود در برنامه تمرینی به جدول کمکی مربوط به ترین، به انضمام سیستم ها و تکنیک ها و پارامتر های دیگر تولید شده توسط دستور العمل ها
    await Promise.all(
      request.body.workoutPlan.sessions.flatMap(session =>
        session.exercises?.map(async (exercise) => {

          // ورودی تابع ذخیره اطلاعات مربوط به جدول ترین
          const planTrainInput: trainHelperSchema.PlanTrainHelperType = {
            id: uuidv4(),
            planId: inserted.id,
            exerciseNumber: exercise.number,
            createdAt: nowStr,
            updatedAt: nowStr,
          }

          // ایجاد رکورد جدید برای جدول کمکی
          await helperRepo.insertPlanTrainHelper(planTrainInput, trx)

        }) ?? [],
      ),
    )

    // انجام تراکنش و بازگشت برنامه تولید شده
    await trx.commit();
    
    // auditLogger.update('', { request: setAuditRequest(request), oldData: {}, newData: inserted })
    return inserted

  } catch (error) {

    // برگردادن تراکنش به حالت قبلی
    await trx.rollback();
    console.error(error)
    throw new AppError('PLAN_ACTION_FAILED', 'ارور در تولید برنامه تمرینی', 403)
  }
}

/**
 * دریافت برنامه تمرینی با آیدی
 */
export async function getPlanById(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  const plan = await planRepo.getPlanById(request.params)

  const { role, userId } = extractSenderData(request)
  if (role === 'teacher' || role === 'student') {
    const aclResult = await checkWithACL(request, { own: (plan.teacherId === userId) })
    if (!aclResult.isOkay)
      throw new AppError('PLAN_ACTION_FORBIDDEN', aclResult.reason, 403)
  }

  try {
    // دریافت شماره حرکات از برنامه تمرینی
    const exerciseNumbers: exerciseSchema.GetExerciseByNumberListRequestType = [];
    const systemIds: systemSchema.GetSystemByIdListRequestType = [];
    const techniqueIds: techniqueSchema.GetTechniqueByIdListRequestType = [];

    Object.values(plan.workoutPlan.sessions).forEach((session: any) => {
      Object.values(session.exercises).forEach((exercise: any) => {
        exerciseNumbers.push({number: exercise.number})
        systemIds.push({id: exercise.systemId})
        if (exercise.techniqueId && exercise.techniqueId !== '') techniqueIds.push({id: exercise.techniqueId})
      })
    })
    
    // حال بایستی شماره ها و آیدی ها را به توابع گرفتن اطلاعات بدهیم 
    const uniqueExerciseNumbers = [...new Set(exerciseNumbers)]
    const uniqueSystemIds = [...new Set(systemIds)]
    const uniqueTechniqueIds = [...new Set(techniqueIds)]

    const exercisesInfo = await exerciseRepo.getExercisesByNumberList(uniqueExerciseNumbers)
    const systemsInfo = await systemRepo.getSystemsByIdList(uniqueSystemIds)
    const techniquesInfo = await techniqueRepo.getTechniquesByIdList(uniqueTechniqueIds)


    // به‌روزرسانی حرکات هر جلسه با اطلاعات اضافی
    Object.entries(plan.workoutPlan.sessions).forEach((session: any) => {
      Object.entries(session.exercises).forEach(exercise => {

        // بررسی اسکیم حرکت که در دیتابیس ذخیره شده است

        if (!exercise) throw new Error(`Exercise is invalid`);

        if (!Value.Check(exerciseSchema.exerciseOutputInPlanSchema, exercise)) throw new AppError('INVALID_EXERCISE_SCHEMA', 'Exercise data is invalid', 400);

        const exerciseInfo = exercisesInfo.find((info) => {
          if (!info) throw new AppError('EXERCISE_NOT_FOUND', 'Exercise not found', 404)
          return info.number === exercise.number
        });

        const systemInfo = systemsInfo.find((sysInfo) => {
          if (!sysInfo) throw new AppError('SYSTEM_NOT_FOUND', 'System not found', 404)
          return sysInfo.id === exercise.systemId
        });

        const modifiedSystemInfo = systemInfo ? {
          ...systemInfo, systemId: systemInfo.id, 
          systemMethod: systemInfo.method,
          systemName: systemInfo.abbrName,
          systemDescription: systemInfo.description,
          systemDescIsVisible: systemInfo.descIsVisible
        } : null;

        let outputExercise = {}
        if (techniquesInfo) { // ممکنه تکنیکی وجود نداشته باشه توی یک برنامه
          const techniqueInfo = techniquesInfo.find((techInfo) => {
            if (!techInfo) throw new AppError('TECHNIQUE_NOT_FOUND', 'Technique not found', 404)
            return techInfo.id === exercise.techniqueId
          });
          // اسم پارامتر ها رو در ابجکت های تولید سیستم ها و تکنیک ها عوض میکنیم به صورتی که مناسب خروجی نهایی برای کاربر باشه
          const modifiedTechniqueInfo = techniqueInfo ? {
            ...techniqueInfo, techniqueId: techniqueInfo.id,
            techniqueMethod: techniqueInfo.method, 
            techniqueName: techniqueInfo.name, 
            techniqueDescription: techniqueInfo.description,
            techniqueDescIsVisible: techniqueInfo.descIsVisible
          } : null

          if (modifiedTechniqueInfo) outputExercise = {...modifiedTechniqueInfo}
      }

        outputExercise = { ...outputExercise, ...exercise, ...exerciseInfo, ...modifiedSystemInfo } // یکجا کردن اطلاعات اضافه شده از دیتابیس و اطلاعات موجود در برنامه برای حرکات، سیستم ها و تکنیک ها
        session.exercises.exercise = outputExercise
      })
    })

    // به‌روزرسانی حرکات هر جلسه با اطلاعات اضافی
    Object.entries(plan.workoutPlan.sessions).forEach(([sessionKey, session]: [string, any]) => {
      Object.entries(session.exercises).forEach(([exerciseKey, exercise]: [string, any]) => {
        const exerciseInfo = exercisesInfo.find((info) => {
          if (!info) return false
          return info.number === exercise.number
        })

        if (!exerciseInfo) throw new AppError('EXERCISE_NOT_FOUND', 'Exercise not found', 404)

        // پارامتر شماره رو نگهداری میکنیم
        plan.workoutPlan.sessions[Number.parseInt(sessionKey)].exercises[Number.parseInt(exerciseKey)] = { ...exercise, ...exerciseInfo }
      })
    })
  } catch (error) {
    console.error(error)
  }
  return plan
}

/**
 * دریافت برنامه پرینتی با آیدی
 */
export async function getPrintPlan(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  const plan = await planRepo.getPlanById(request.params)

  const { role, userId } = extractSenderData(request)
  if (role === 'teacher' || role === 'student') {
    const aclResult = await checkWithACL(request, { own: (plan.teacherId === userId) })
    if (!aclResult.isOkay)
      throw new AppError('PLAN_ACTION_FORBIDDEN', aclResult.reason, 403)
  }

  try {
    // دریافت شماره حرکات از برنامه تمرینی
    const exerciseNumbers: exerciseSchema.GetExerciseByNumberListRequestType = [];
    const systemIds: systemSchema.GetSystemByIdListRequestType = [];
    const techniqueIds: techniqueSchema.GetTechniqueByIdListRequestType = [];

    Object.values(plan.workoutPlan.sessions).forEach((session: any) => {
      Object.values(session.exercises).forEach((exercise: any) => {
        exerciseNumbers.push({number: exercise.number})
        systemIds.push({id: exercise.systemId})
        if (exercise.techniqueId && exercise.techniqueId !== '') techniqueIds.push({id: exercise.techniqueId})
      })
    })
    
    // حال بایستی شماره ها و آیدی ها را به توابع گرفتن اطلاعات بدهیم 
    const uniqueExerciseNumbers = [...new Set(exerciseNumbers)]
    const uniqueSystemIds = [...new Set(systemIds)]
    const uniqueTechniqueIds = [...new Set(techniqueIds)]

    const exercisesInfo = await exerciseRepo.getExercisesByNumberListPrint(uniqueExerciseNumbers)
    const systemsInfo = await systemRepo.getSystemsByIdList(uniqueSystemIds)
    const techniquesInfo = await techniqueRepo.getTechniquesByIdList(uniqueTechniqueIds)


    // به‌روزرسانی حرکات هر جلسه با اطلاعات اضافی
    Object.entries(plan.workoutPlan.sessions).forEach((session: any) => {
      Object.entries(session.exercises).forEach(exercise => {

        // بررسی اسکیم حرکت که در دیتابیس ذخیره شده است

        if (!exercise) throw new Error(`Exercise is invalid`);

        if (!Value.Check(exerciseSchema.exerciseOutputInPlanSchema, exercise)) throw new AppError('INVALID_EXERCISE_SCHEMA', 'Exercise data is invalid', 400);

        const exerciseInfo = exercisesInfo.find((info) => {
          if (!info) throw new AppError('EXERCISE_NOT_FOUND', 'Exercise not found', 404)
          return info.number === exercise.number
        });

        const systemInfo = systemsInfo.find((sysInfo) => {
          if (!sysInfo) throw new AppError('SYSTEM_NOT_FOUND', 'System not found', 404)
          return sysInfo.id === exercise.systemId
        });

        const modifiedSystemInfo = systemInfo ? {
          ...systemInfo, systemId: systemInfo.id, 
          systemMethod: systemInfo.method,
          systemName: systemInfo.abbrName,
          systemDescription: systemInfo.description,
          systemDescIsVisible: systemInfo.descIsVisible
        } : null;

        let outputExercise = {}
        if (techniquesInfo) { // ممکنه تکنیکی وجود نداشته باشه توی یک برنامه
          const techniqueInfo = techniquesInfo.find((techInfo) => {
            if (!techInfo) throw new AppError('TECHNIQUE_NOT_FOUND', 'Technique not found', 404)
            return techInfo.id === exercise.techniqueId
          });
          // اسم پارامتر ها رو در ابجکت های تولید سیستم ها و تکنیک ها عوض میکنیم به صورتی که مناسب خروجی نهایی برای کاربر باشه
          const modifiedTechniqueInfo = techniqueInfo ? {
            ...techniqueInfo, techniqueId: techniqueInfo.id,
            techniqueMethod: techniqueInfo.method, 
            techniqueName: techniqueInfo.name, 
            techniqueDescription: techniqueInfo.description,
            techniqueDescIsVisible: techniqueInfo.descIsVisible
          } : null

          if (modifiedTechniqueInfo) outputExercise = {...modifiedTechniqueInfo}
      }

        outputExercise = { ...outputExercise, ...exercise, ...exerciseInfo, ...modifiedSystemInfo } // یکجا کردن اطلاعات اضافه شده از دیتابیس و اطلاعات موجود در برنامه برای حرکات، سیستم ها و تکنیک ها
        session.exercises.exercise = outputExercise
      })
    })

    // به‌روزرسانی حرکات هر جلسه با اطلاعات اضافی
    Object.entries(plan.workoutPlan.sessions).forEach(([sessionKey, session]: [string, any]) => {
      Object.entries(session.exercises).forEach(([exerciseKey, exercise]: [string, any]) => {
        const exerciseInfo = exercisesInfo.find((info) => {
          if (!info) return false
          return info.number === exercise.number
        })

        if (!exerciseInfo) throw new AppError('EXERCISE_NOT_FOUND', 'Exercise not found', 404)

        // پارامتر شماره رو نگهداری میکنیم
        plan.workoutPlan.sessions[Number.parseInt(sessionKey)].exercises[Number.parseInt(exerciseKey)] = { ...exercise, ...exerciseInfo }
      })
    })
  } catch (error) {
    console.error(error)
  }
  return plan
}

/**
 * گرفتن همه برنامه های تمرینی یک مربی
 */
export async function getAllPlansByTeacherId(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  if (!isValidUuid(request.params.id))
    throw new AppError('PLAN_OWNER_ID_INVALID', 'Teacher ID is invalid', 400)
  return await planRepo.getPlansByTeacherId(request.params)
}

/**
 * ویرایش برنامه تمرینی
 */
export async function updatePlan(request: FastifyRequest<{ Params: generalSchema.IdParamType, Body: planSchema.UpdatePlanRequestType }>) {

  const { userId: updaterId, role: updaterRole } = extractSenderData(request)
  const currentPlan = await planRepo.getPlanById(request.params)
  if (!currentPlan) throw new AppError('PLAN_NOT_FOUND', 'Plan not found', 404)
  const updates = request.body //  (به این شرط که در ACL ذکر شده باشه) هر چیزی که به عنوان ورودی وارد شده است، بایستی در جدول برنامه ها آپدیت شود

  let aclResult = {isOkay: false, reason: ''}
  if (updaterRole === 'teacher') aclResult = await checkWithACL(request, { own: (updaterId === currentPlan.teacherId), ...updates })
  else aclResult = await checkWithACL(request, updates)

  if (!aclResult.isOkay) throw new AppError('PLAN_ACTION_IS_FORBIDDEN', aclResult.reason, 403)
                                  
  updates.updatedAt = DateTime.now().setZone('Asia/Tehran').toFormat('yyyy-LL-dd HH:mm:ss')

  const updated = await planRepo.updatePlan(currentPlan.id, updates)

  auditLogger.update('', { request: setAuditRequest(request), oldData: currentPlan, newData: updated })

  return updated
}

/**
 * حذف برنامه
 */
export async function deletePlan(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  const existing = await planRepo.getPlanById(request.params)
  if (!existing) throw new AppError('PLAN_NOT_FOUND', 'Plan not found', 404)
  if (existing.status === "paid") throw new AppError('PLANS_ACTION_IS_FORBIDDEN', 'برنامه توسط دانش آموز خریداری شده است و قابل حذف شدن نیست', 400)
  const { role, userId } = extractSenderData(request)
  if (role === 'teacher' || role === 'admin') {
    const aclResult = await checkWithACL(request, { own: (existing.teacherId === userId) })
    if (!aclResult.isOkay) throw new AppError('PLANS_ACTION_IS_FORBIDDEN', aclResult.reason, 403)
  }

  await planRepo.deletePlan(existing.id)
  auditLogger.delete('', { request: setAuditRequest(request), oldData: existing, newData: null })
}

/**
 * توابع کمکی برای تشخیص متد یک سیستم تکرار
 */

function detectSystemMethod(pattern: number[]):  "descending" | "ascending" | "custom" | "sinusoidal" | "pyramidUp" | "pyramidDown" | "singleSet" {
  if (pattern.length < 2) return 'singleSet'

  const isSymmetric = pattern.join() === [...pattern].reverse().join()
  const isSameStartEnd = pattern[0] === pattern[pattern.length - 1]

  if (isSameStartEnd && isSymmetric && pattern.length >= 3 && pattern[1] > pattern[0]) {
    return 'sinusoidal'
  }

  let peakIndex = pattern.indexOf(Math.max(...pattern))
  if (
    peakIndex > 0 &&
    peakIndex < pattern.length - 1 &&
    isStrictlyIncreasing(pattern.slice(0, peakIndex + 1)) &&
    isStrictlyDecreasing(pattern.slice(peakIndex)) &&
    !isSameStartEnd
  ) {
    return 'pyramidUp'
  }

  let valleyIndex = pattern.indexOf(Math.min(...pattern))
  if (
    valleyIndex > 0 &&
    valleyIndex < pattern.length - 1 &&
    isStrictlyDecreasing(pattern.slice(0, valleyIndex + 1)) &&
    isStrictlyIncreasing(pattern.slice(valleyIndex)) &&
    !isSameStartEnd
  ) {
    return 'pyramidDown'
  }

  const isAscending = pattern.every((v, i, a) => i === 0 || v >= a[i - 1]) && pattern.some((v, i, a) => i !== 0 && v > a[i - 1])
  const isDescending = pattern.every((v, i, a) => i === 0 || v <= a[i - 1]) && pattern.some((v, i, a) => i !== 0 && v < a[i - 1])

  if (isAscending) return 'ascending'
  if (isDescending) return 'descending'

  return 'custom'
}

function isStrictlyIncreasing(arr: number[]) {
  return arr.every((v, i) => i === 0 || v > arr[i - 1])
}

function isStrictlyDecreasing(arr: number[]) {
  return arr.every((v, i) => i === 0 || v < arr[i - 1])
}