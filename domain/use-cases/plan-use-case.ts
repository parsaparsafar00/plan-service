import type { FastifyRequest } from 'fastify'
import type { AutoQueryData } from '@amard/auto-query'
import * as generalSchema from '../schemas/plan-general-schema.js'
import type * as planSchema from '../schemas/plan-schema.js'
import type * as trainHelperSchema from '../schemas/plan-helper-schema.js'
import * as exerciseSchema from '../schemas/exercise-schema.js'
import { checkWithACL } from '@amard/access-control'
import { AppError } from '@amard/error-handling'
import { auditLogger, setAuditRequest } from '@amard/logger'
import { DateTime } from 'luxon'
import { validate as isValidUuid, v4 as uuidv4 } from 'uuid'
import * as exerciseRepo from '../../data-access/exercise-repository.js'
import * as helperRepo from '../../data-access/plan-helper-repository.js'
import * as planRepo from '../../data-access/plan-repository.js'
import * as systemRepo from '../../data-access/system-repository.js'
import * as systemMethodRepo from '../../data-access/system-method-repository.js'
import * as techniqueMethodRepo from '../../data-access/technique-method-repository.js'
import * as techniqueRepo from '../../data-access/technique-repository.js'
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
 * تولید جلسه ای برنامه تمرینی با استفاده از هوش مصنوعی
 */
export async function generateSessionAI(request: FastifyRequest<{ Body: planSchema.GenerateSessionByAIRequestType }>): Promise<planSchema.sessionOutputType> {
  // تولید برنامه تمرینی و ذخیره آن بصورت جیسان در جدول برنامه ها
  const workout_session = await AISessionGenerator(request.body)

  // بازگشت خروجی
  auditLogger.create('', { request: setAuditRequest(request), oldData: null, newData: workout_session })
  return workout_session
}

/**
 * (با استفاده از هوش مصنوعی یا بصورت دستی توسط مربی) تولید برنامه تمرینی با استفاده از جلسات از قبل تولید شده
 */
export async function createPlan(request: FastifyRequest<{ Body: planSchema.CreatePlanRequestType }>): Promise<planSchema.planOutputType | undefined> {
  const { role, userId } = extractSenderData(request)
  if (role !== 'teacher') throw new AppError('PLAN_PLAN_ACTION_IS_FORBIDDEN', 'Only teachers can create plans', 403)

  const nowStr = DateTime.now().toFormat('yyyy-LL-dd HH:mm:ss') // useTz=false در migration
  const newPlan: planSchema.PlanType = {
    id: uuidv4(),
    title: request.body.title,
    description: request.body.description,
    studentId: request.body.studentId,
    status: request.body.status,
    teacherId: userId,
    studentLevel: request.body.studentLevel,
    target: request.body.target,
    studentWeight: request.body.studentWeight,
    studentGender: request.body.studentGender,
    studentAge: request.body.studentAge,
    workoutPlan: { sessions: request.body.workoutPlan.sessions },
    createdAt: nowStr,
    updatedAt: nowStr,
  }

  // شروع تراکنش
  const trx = await planRepo.getKnexInstanceForPlanRepo().transaction()

  try {
    await Promise.all(
      request.body.workoutPlan.sessions.flatMap(session =>
        session.exercises?.map(async exercise => {
          // چه سیستم توسط هوش مصنوعی تولید شده باشه چه توسط مربی وارد شده باشد، لزوما شمارش باید وجود داشته باشه چون مربی اجازه ورود سیستم تولید نشده رو نداره و هوش مصنوعی هم بین سیستم های موجود انتخاب میکنه و تولید سیستم جدید نداریم
          if (!exercise.systemNumber) throw new AppError('PLAN_SYSTEM_NOT_FOUND', 'System not found', 404)

          // بررسی وجود متد سیستم
          const systemMethod = await systemMethodRepo.getSystemMethodByMethodNumber(exercise.systemMethodNumber)
          if (!systemMethod) throw new AppError('PLAN_SYSTEM_METHOD_NOT_FOUND', 'System method not found', 404)

          // تکنیک ها لزوما از قبل بایستی تولید شده باشند پس نیازی به ذخیره آنها نیست

          // ایجاد ابجکت خروجی فقط با پارامتر های مورد نیاز برای ذخیره در جدول برنامه ها
          const exerciseOutput: exerciseSchema.exerciseOutputInPlanType = {
            number: exercise.number,
            restBetweenSets: exercise.restBetweenSets,
            weightPercentage: exercise.weightPercentage,
            systemNumber: exercise.systemNumber!, // مطمئن هستیم که این مقدار وجود دارد
            techniqueNumber: exercise.techniqueNumber!, // طبق توضیحات شما، این مقدار باید وجود داشته باشد
          }

          // جایگزینی حرکت با نسخه پالایش شده برای ثبت در جدول برنامه های تمرینی
          Object.assign(exercise, exerciseOutput)
        }),
      ),
    )

    // همینطور اگر مشکلی در ذخیره برنامه بوجود آمد، سیستم های اینسرت شده رو پاک میکنیم از جدول سیستم ها
    const inserted = await planRepo.insertPlan(newPlan, trx)

    // ذخیره رکورد های جدول کمکی باید بعد از ذخیره برنامه باشد چون آیدی برنامه رو توش استفاده میکنیم
    await Promise.all(
      request.body.workoutPlan.sessions.flatMap(session =>
        session.exercises?.map(async exercise => {
          // اینسرت کردن تمام حرکات موجود در برنامه تمرینی به جدول کمکی مربوط به ترین، به انضمام سیستم ها و تکنیک ها و پارامتر های دیگر تولید شده توسط دستور العمل ها
          // ورودی تابع ذخیره اطلاعات مربوط به جدول ترین
          const planTrainInput: trainHelperSchema.PlanTrainHelperType = {
            id: uuidv4(),
            teacherId: userId,
            systemNumber: exercise.systemNumber,
            systemMethodNumber: exercise.systemMethodNumber,
            techniqueNumber: exercise.techniqueNumber || null, // قابل نال بودن هست
            techniqueMethodNumber: exercise.techniqueMethodNumber || null, // قابل نال بودن هست
            target: request.body.target,
            studentLevel: request.body.studentLevel,
            gender: request.body.studentGender,
            planId: inserted.id,
            score: 0,
            exerciseNumber: exercise.number,
            createdAt: nowStr,
            updatedAt: nowStr,
          }

          // ایجاد رکورد جدید برای جدول کمکی
          await helperRepo.insertPlanTrainHelper(planTrainInput, trx)
        }),
      ),
    )

    // انجام تراکنش و بازگشت برنامه تولید شده
    await trx.commit()

    auditLogger.update('', { request: setAuditRequest(request), oldData: {}, newData: inserted })

    const planRequest = { params: { id: inserted.id } } as FastifyRequest<{ Params: generalSchema.IdParamType }>
    const planInserted = await getPlanById(planRequest) // فراخوانی تابع گرفتن برنامه تمرینی با آیدی برای اینکه بتونه خروجی مارو به خوبی تعیین بکنه

    return planInserted
  } catch (error) {
    // برگردادن تراکنش به حالت قبلی
    await trx.rollback()
    console.error(error)
    throw new AppError('PLAN_PLAN_ACTION_FAILED', 'ارور در تولید برنامه تمرینی', 403)
  }
}

/**
 * دریافت برنامه تمرینی با آیدی
 */
export async function getPlanById(request: FastifyRequest<{ Params: generalSchema.IdParamType }>): Promise<planSchema.PlanOutputType | undefined> {
  const plan = await planRepo.getPlanById(request.params.id)
  if (!plan) return undefined

  let outputPlan: planSchema.PlanOutputType | undefined = undefined // مقدار دهی اولیه متغیر برنامه جدید

  const { userId: receiverId, role: getterRole } = extractSenderData(request)
  let aclResult = { isOkay: false, reason: '' }

  if (getterRole === 'teacher') {
    aclResult = await checkWithACL(request, {
      own: plan.teacherId === receiverId,
    })
    if (!aclResult.isOkay) throw new AppError('PLAN_PLAN_ACTION_IS_FORBIDDEN', aclResult.reason, 403)
  }

  try {
    // استخراج شماره حرکات و سیستم ها و تکنیک ها از برنامه تمرینی
    const exerciseNumbers: number[] = []
    const systemNumbers: number[] = []
    const techniqueNumbers: number[] = []

    Object.values(plan.workoutPlan.sessions).forEach((session: planSchema.sessionInplanType) => {
      Object.values(session.exercises).forEach((exercise: exerciseSchema.exerciseOutputInPlanType) => {
        exerciseNumbers.push(exercise.number)
        systemNumbers.push(exercise.systemNumber!) // اینجا شماره سیستم لزوما وجود داره، چون توی قالب فقط نال میزدیمش
        if (exercise.techniqueNumber) techniqueNumbers.push(exercise.techniqueNumber)
      })
    })

    // حال بایستی شماره ه را به توابع گرفتن اطلاعات بدهیم
    const uniqueExerciseNumbers = [...new Set(exerciseNumbers)]
    const uniqueSystemNumbers = [...new Set(systemNumbers)]
    const uniqueTechniqueNumbers = [...new Set(techniqueNumbers)]

    const exercisesInfo = await exerciseRepo.getExercisesByNumberList(uniqueExerciseNumbers)
    const systemsInfo = await systemRepo.getSystemsByNumberList(uniqueSystemNumbers)
    const techniquesInfo = await techniqueRepo.getTechniquesByNumberList(techniqueNumbers)

    // بررسی خالی بودن آرایه های سیستم ها، تکنیک ها، و حرکات
    if (exercisesInfo.length === 0) {
      throw new AppError('PLAN_EXERCISE_NOT_FOUND', 'No exercises found', 404)
    }

    if (systemsInfo.length === 0) {
      throw new AppError('PLAN_SYSTEM_NOT_FOUND', 'No systems found', 404)
    }

    if (techniquesInfo.length === 0 && uniqueTechniqueNumbers.length !== 0) {
      // یعنی اگر تکنیک در برنامه وجود داشت ولی اطلاعاتی ازش پیدا نشد، باید ارور داده بشه
      throw new AppError('PLAN_TECHNIQUE_NOT_FOUND', 'No techniques found', 404)
    }

    // در بحش از کد، اینکه آیا سیستم ها، تکنیک ها، و حرکت هایی که رفتیم بر حسب آیدی اطلاعاتشون رو بدست بیاریم، بررسی میشه که اطلاعات خالی هم پیدا میشه؟ اگه شد ارور داده بشه
    exercisesInfo.find(info => {
      if (!info) throw new AppError('PLAN_EXERCISE_NOT_FOUND', 'Exercise not found', 404)
    })

    systemsInfo.find(sysInfo => {
      if (!sysInfo) throw new AppError('PLAN_SYSTEM_NOT_FOUND', 'System not found', 404)
    })

    techniquesInfo.find(techInfo => {
      if (!techInfo) throw new AppError('PLAN_TECHNIQUE_NOT_FOUND', 'Technique not found', 404)
    })

    // به‌روزرسانی حرکات هر جلسه با اطلاعات اضافی
    const outputSessions: planSchema.sessionOutputType[] = []
    await Promise.all(
      Object.values(plan.workoutPlan.sessions).map(async (session: planSchema.sessionInplanType) => {
        const outputExercisesInSession: exerciseSchema.exerciseOutputType[] = []
        for (const exercise of Object.values(session.exercises)) {
          // یافتن حرکتی که اطلاعاتش رفته پیدا شده
          const exerciseInfo = exercisesInfo.find(info => info.number === exercise.number)

          // یافتن سیستمی که اطلاعاتش رفته پیدا شده
          const systemInfo = systemsInfo.find(sysInfo => sysInfo.number === exercise.systemNumber)

          // یافتن تکنیکی که اطلاعاتش رفته پیدا شده
          const techniqueInfo = techniquesInfo.find(techInfo => techInfo.number === exercise.techniqueNumber)

          // ایجاد خروجی نهایی هر حرکت در جلسات
          const inputRepeats = [systemInfo!.repeat1, systemInfo!.repeat2, systemInfo!.repeat3, systemInfo!.repeat4, systemInfo!.repeat5, systemInfo!.repeat6, systemInfo!.repeat7, systemInfo!.repeat8]

          // ترتیب را تغییر می‌دهیم تا تمام صفرها در انتها قرار گیرند و ترتیب عناصر غیر صفر حفظ شود
          const nonZeroRepeats = inputRepeats.filter(x => x !== 0)
          const zeroCount = inputRepeats.length - nonZeroRepeats.length
          const repeatPattern = nonZeroRepeats.concat(Array(zeroCount).fill(0))

          const systemDescription = systemInfo!.description
          const systemDescIsVisible = systemInfo!.descIsVisible

          const systemMethod = await systemMethodRepo.getSystemMethodByMethodNumber(systemInfo!.methodNumber)

          if (!systemMethod) throw new AppError('PLAN_SYSTEM_METHOD_NOT_FOUND', 'System method not found', 404)
          const systemMethodName = systemMethod.name
          const systemMethodNumber = systemMethod.number

          // آماده کردن اطلاعات مربوط به تکنیک در حرکت
          const techniqueMethod = techniqueInfo?.methodNumber ? await techniqueMethodRepo.getTechniqueMethodByMethodNumber(techniqueInfo.methodNumber) : null
          if (techniqueInfo && !techniqueMethod) {
            // اگر اطلاعات تکنیک وجود داشت، بایستی اطلاعات متد تکنیک هم وجود داشته باشه
            throw new AppError('PLAN_TECHNIQUE_METHOD_NOT_FOUND', 'Technique method not found', 404)
          }

          const outputExercise: exerciseSchema.exerciseOutputType = {
            ...exerciseInfo!,
            ...exercise,
            systemMethodName,
            systemMethodNumber,
            systemDescIsVisible,
            systemDescription,
            repeatPattern,
            techniqueMethodNumber: techniqueMethod?.number,
            techniqueMethodName: techniqueMethod?.name,
            techniqueName: techniqueInfo?.name,
            techniqueDescription: techniqueInfo?.description,
            techniqueDescIsVisible: techniqueInfo?.descIsVisible,
          }

          outputExercisesInSession.push(outputExercise)
        }

        console.log(outputExercisesInSession)
        // ساخت آرایه‌ی جلسات برای یک برنامه
        const { exercises, ...sessionWithoutExercises } = session
        outputSessions.push({ ...sessionWithoutExercises, exercises: outputExercisesInSession })
      }),
    )

    // ساخت آبجکت برنامه با استفاده از جلسات

    const { workoutPlan, ...planWithoutSessions } = plan
    outputPlan = { ...planWithoutSessions, workoutPlan: { sessions: outputSessions } }
  } catch (error) {
    console.error(error)
    if (error instanceof AppError) throw error
  }
  return outputPlan
}

/**
 * دریافت برنامه پرینتی با آیدی
 */
export async function getPrintPlanById(request: FastifyRequest<{ Params: generalSchema.IdParamType }>): Promise<planSchema.PrintPlanType | undefined> {
  const plan = await planRepo.getPlanById(request.params.id)
  if (!plan) return undefined

  let printPlan: planSchema.PrintPlanType | undefined = undefined // مقدار دهی اولیه متغیر برنامه جدید

  const { userId: receiverId, role: getterRole } = extractSenderData(request)
  let aclResult = { isOkay: false, reason: '' }

  if (getterRole === 'teacher') {
    aclResult = await checkWithACL(request, {
      own: plan.teacherId === receiverId,
    })
    if (!aclResult.isOkay) throw new AppError('PLAN_PLAN_ACTION_IS_FORBIDDEN', aclResult.reason, 403)
  }

  try {
    // استخراج شماره حرکات و سیستم ها و تکنیک ها از برنامه تمرینی
    // استخراج شماره حرکات و سیستم ها و تکنیک ها از برنامه تمرینی
    const exerciseNumbers: number[] = []
    const systemNumbers: number[] = []
    const techniqueNumbers: number[] = []

    Object.values(plan.workoutPlan.sessions).forEach((session: planSchema.sessionInplanType) => {
      Object.values(session.exercises).forEach((exercise: exerciseSchema.exerciseOutputInPlanType) => {
        exerciseNumbers.push(exercise.number)
        systemNumbers.push(exercise.systemNumber!) // اینجا شماره سیستم لزوما وجود داره، چون توی قالب فقط نال میزدیمش
        if (exercise.techniqueNumber) techniqueNumbers.push(exercise.techniqueNumber)
      })
    })

    // حال بایستی شماره ه را به توابع گرفتن اطلاعات بدهیم
    const uniqueExerciseNumbers = [...new Set(exerciseNumbers)]
    const uniqueSystemNumbers = [...new Set(systemNumbers)]
    const uniqueTechniqueNumbers = [...new Set(techniqueNumbers)]

    const exercisesInfo = await exerciseRepo.getExercisesByNumberListPrint(uniqueExerciseNumbers)
    const systemsInfo = await systemRepo.getSystemsByNumberList(uniqueSystemNumbers)
    const techniquesInfo = await techniqueRepo.getTechniquesByNumberList(techniqueNumbers)

    // بررسی خالی بودن آرایه های سیستم ها، تکنیک ها، و حرکات
    if (exercisesInfo.length === 0) {
      throw new AppError('PLAN_EXERCISE_NOT_FOUND', 'No exercises found', 404)
    }

    if (systemsInfo.length === 0) {
      throw new AppError('PLAN_SYSTEM_NOT_FOUND', 'No systems found', 404)
    }

    if (techniquesInfo.length === 0 && uniqueTechniqueNumbers.length !== 0) {
      // یعنی اگر تکنیک در برنامه وجود داشت ولی اطلاعاتی ازش پیدا نشد، باید ارور داده بشه
      throw new AppError('PLAN_TECHNIQUE_NOT_FOUND', 'No techniques found', 404)
    }

    // در بحش از کد، اینکه آیا سیستم ها، تکنیک ها، و حرکت هایی که رفتیم بر حسب آیدی اطلاعاتشون رو بدست بیاریم، بررسی میشه که اطلاعات خالی هم پیدا میشه؟ اگه شد ارور داده بشه
    exercisesInfo.find(info => {
      if (!info) throw new AppError('PLAN_EXERCISE_NOT_FOUND', 'Exercise not found', 404)
    })

    systemsInfo.find(sysInfo => {
      if (!sysInfo) throw new AppError('PLAN_SYSTEM_NOT_FOUND', 'System not found', 404)
    })

    techniquesInfo.find(techInfo => {
      if (!techInfo) throw new AppError('PLAN_TECHNIQUE_NOT_FOUND', 'Technique not found', 404)
    })

    // به‌روزرسانی حرکات هر جلسه با اطلاعات اضافی
    const printOutputSessions: planSchema.printSessionOutputType[] = []
    await Promise.all(
      Object.values(plan.workoutPlan.sessions).map(async (session: planSchema.sessionInplanType) => {
        const printingExercises: exerciseSchema.printingExerciseOutputType[] = []
        Object.values(session.exercises).forEach((exercise: exerciseSchema.exerciseOutputInPlanType) => {
          // یافتن حرکتی که اطلاعاتش رفته پیدا شده
          const exerciseInfo = exercisesInfo.find(info => {
            return info.number === exercise.number
          })

          // یافتن سیستمی که اطلاعاتش رفته پیدا شده
          const systemInfo = systemsInfo.find(sysInfo => {
            return sysInfo.number === exercise.systemNumber
          })

          // یافتن تکنیکی که اطلاعاتش رفته پیدا شده
          const techniqueInfo = techniquesInfo.find(techInfo => {
            return techInfo.number === exercise.techniqueNumber
          })

          const inputRepeats = [systemInfo!.repeat1, systemInfo!.repeat2, systemInfo!.repeat3, systemInfo!.repeat4, systemInfo!.repeat5, systemInfo!.repeat6, systemInfo!.repeat7, systemInfo!.repeat8]

          // ترتیب را تغییر میدیم تا تمام صفرها در انتها قرار گیرند و ترتیب عناصر غیر صفر حفظ شود
          const nonZeroRepeats = inputRepeats.filter(x => x !== 0)
          const zeroCount = inputRepeats.length - nonZeroRepeats.length
          const repeatPattern = nonZeroRepeats.concat(Array(zeroCount).fill(0))

          const techniqueName = techniqueInfo ? techniqueInfo.name : undefined
          const techniqueDescription = techniqueInfo ? techniqueInfo.description : undefined

          const outputExercise: exerciseSchema.printingExerciseOutputType = {
            ...exercise,
            ...exerciseInfo!,
            techniqueName,
            repeatPattern,
            techniqueDescription,
          }

          // ساخت آرایه ی حرکات برای یک جلسه
          printingExercises.push(outputExercise)
        })

        // ساخت آرایه ی جلسات برای یک برنامه
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { exercises, ...sessionWithoutExercises } = session
        printOutputSessions.push({ ...sessionWithoutExercises, exercises: printingExercises })
      }),
    )

    // ساخت آبجکت ی برنامه با استفاده از جلسات
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { workoutPlan, ...planWithoutSessions } = plan
    printPlan = {
      ...planWithoutSessions,
      workoutPlan: { sessions: printOutputSessions },
    }
  } catch (error) {
    if (error instanceof AppError) throw error
  }

  return printPlan
}

/**
 * گرفتن همه برنامه های تمرینی یک مربی
 */
export async function getAllPlansByTeacherId(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  const { userId: tokenUserId, role: tokenUserRole } = extractSenderData(request)
  let teacherId = tokenUserId
  if (tokenUserRole === 'admin') {
    teacherId = request.params.id // اگر ادمین خواسته که برنامه های یک مربی رو بگیره، قطعا باید در پارامتر ورودی، یک آیدی مربی معتبر را وارد کرده باشه
    if (!isValidUuid(teacherId)) throw new AppError('PLAN_SYSTEM_TEACHER_ID_INVALID', 'Teacher ID is invalid', 400)
  }
  return await planRepo.getPlansByTeacherId(request.params.id, request.autoQueryData as AutoQueryData)
}

/**
 * ویرایش برنامه تمرینی
 */
export async function updatePlan(request: FastifyRequest<{ Params: generalSchema.IdParamType; Body: planSchema.UpdatePlanRequestType }>) {
  const currentPlan = await planRepo.getPlanById(request.params.id)
  if (!currentPlan) throw new AppError('PLAN_PLAN_NOT_FOUND', 'Plan not found', 404)
  const updates = request.body

  const { userId: updaterId, role: updaterRole } = extractSenderData(request)
  let aclResult = { isOkay: false, reason: '' }
  if (updaterRole === 'teacher') {
    aclResult = await checkWithACL(request, {
      own: updaterId === currentPlan.teacherId,
      ...request.body,
    })
    if (!aclResult.isOkay) throw new AppError('PLAN_PLAN_ACTION_IS_FORBIDDEN', aclResult.reason, 403)
  }

  updates.updatedAt = DateTime.now().setZone('Asia/Tehran').toFormat('yyyy-LL-dd HH:mm:ss')

  // const trx = await planRepo.getKnexInstanceForPlanRepo().transaction(); // اپدیت رو هم میتونیم بصورت تراکنشی بزنیم که یا باهم انجام بشن یا نشن

  const updated = await planRepo.updatePlan(currentPlan.id, updates)
  auditLogger.update('', { request: setAuditRequest(request), oldData: currentPlan, newData: updated })

  if (updates.workoutPlan) {
    // اگر برنامه تمرینی تغییر کرده است، بایستی حرکاتی که در جدول کمکی ذخیره شده بودند پاک شده، و حرکات جدید جایگزین شوند

    await helperRepo.deleteAllExercisesOfPlan(currentPlan.id) // حذف همه حرکات کمکی که وارد شده بودند

    await Promise.all(
      updated.workoutPlan.sessions.flatMap(session =>
        session.exercises?.map(async exercise => {
          const system = await systemRepo.getSystemByNumber(exercise.systemNumber!) // اطلاعات سیستم رو بر اساس شمارش میگیریم که بتونیم شماره متد رو هم ازش بگیریم
          if (!system) throw new AppError('PLAN_SYSTEM_NOT_FOUND', 'Plan system not found', 404)

          let techniqueMethodNumber = null // تعریف اولیه شماره متد تکنیک برای اینکه ممکنه تکنیکی برای حرکت موجود نباشه
          if (exercise.techniqueNumber) {
            const technique = await techniqueRepo.getTechniqueByNumber(exercise.techniqueNumber) // اطلاعات تکنیک رو بر اساس شمارش میگیریم که بتونیم شماره متد رو هم ازش بگیریم
            if (!technique) throw new AppError('PLAN_TECHNIQUE_NOT_FOUND', 'Plan technique not found', 404)
            techniqueMethodNumber = technique.number
          }
          // ورودی تابع ذخیره اطلاعات مربوط به جدول ترین
          const nowStr = DateTime.now().toFormat('yyyy-LL-dd HH:mm:ss')
          const planTrainInput: trainHelperSchema.PlanTrainHelperType = {
            id: uuidv4(),
            teacherId: updaterId,
            target: updated.target,
            studentLevel: updated.studentLevel,
            gender: updated.studentGender,
            planId: updated.id,
            exerciseNumber: exercise.number,
            techniqueMethodNumber: techniqueMethodNumber,
            techniqueNumber: exercise.techniqueNumber || null,
            systemNumber: exercise.systemNumber!, // شماره سیستم رو اینجا داریم لزوما چون فقط توی قالب نداشتیمش
            systemMethodNumber: system.methodNumber,
            score: 0, // بایستی امتیاز دهی بشه به حرکات استفاده شده در برنامه (فعلا یک امتیاز اضافه میکنیم)
            createdAt: nowStr,
            updatedAt: nowStr,
          }

          // ایجاد رکورد جدید برای جدول کمکی
          await helperRepo.insertPlanTrainHelper(planTrainInput)
        }),
      ),
    )
  }

  if (updates.status && updates.status === 'paid') {
    const nowStr = DateTime.now().toFormat('yyyy-LL-dd HH:mm:ss')
    const planTrainUpdateInput: Partial<trainHelperSchema.PlanTrainHelperType> = {
      score: 1, // بایستی امتیاز دهی بشه به حرکات استفاده شده در برنامه (فعلا یک امتیاز اضافه میکنیم)
      updatedAt: nowStr,
    }
    helperRepo.updatePlanTrainHelper(updated.id, planTrainUpdateInput)
  }

  return updated
}

/**
 * حذف برنامه
 */
export async function deletePlan(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  const existing = await planRepo.getPlanById(request.params.id)
  if (!existing) throw new AppError('PLAN_PLAN_NOT_FOUND', 'Plan not found', 404)
  if (existing.status === 'paid') throw new AppError('PLAN_PLAN_ACTION_IS_FORBIDDEN', 'Yhis plan has been paid by the student and it is not possible to be removed', 400)
  const { role, userId } = extractSenderData(request)
  if (role === 'teacher') {
    const aclResult = await checkWithACL(request, {
      own: existing.teacherId === userId,
    })
    if (!aclResult.isOkay) throw new AppError('PLAN_PLAN_ACTION_IS_FORBIDDEN', aclResult.reason, 403)
  }

  const deletedPlan = await planRepo.deletePlan(existing.id)
  auditLogger.delete('', {
    request: setAuditRequest(request),
    oldData: existing,
    newData: deletedPlan,
  })
}
