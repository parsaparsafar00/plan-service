import type { Static } from '@sinclair/typebox'
import { isoWithoutTimezonePattern } from '@amard/validation'
import { Type } from '@sinclair/typebox'
import * as exerciseSchema from '../schemas/exercise-schema.js'
import * as generalSchema from '../schemas/plan-general-schema.js'

// -------------------------------------- اسکیم های مرتبط با برنامه تمرینی --------------------------------------

/**
 * ساختار پارامتر های غیر ضروری برای کی جلسه تمرینی
 */
export const optionalSessionParameters = Type.Object({
  cooldownActivities: Type.Optional(Type.Array(Type.String())),
  warmupActivities: Type.Optional(Type.Array(Type.String())),
  cooldownDuration: Type.Optional(Type.String()),
  warmupDuration: Type.Optional(Type.String()),
  recoveryTime: Type.Optional(Type.String()),
  sessionDuration: Type.Optional(Type.String()),
})

/**
 * ساختار ورودی های الزامی برای تولید برنامه تمرینی
 */
export const coreSessionInputParameters = Type.Object({
  weeks: Type.Array(Type.Number()),
  description: Type.String(),
  targetMuscles: Type.Array(Type.Enum({
    fullBody: 'full body',
    biceps: 'biceps',
    triceps: 'triceps',
    lat: 'back and lat',
    legs: 'legs',
    abdominals: 'abdominals',
    trap: 'trap',
    shoulders: 'shoulders',
    forearms: 'forearms',
    chest: 'chest',
  })),
  exercises: Type.Array(exerciseSchema.exerciseInputSchema),
})

/**
 * ساختار ورودی یک جلسه تمرینی در تولید برنامه تمرینی
 */
export const sessionInputSchema = Type.Intersect([
  coreSessionInputParameters,
  optionalSessionParameters
]);

export type sessionInputType = Static<typeof sessionInputSchema>

/**
 * ساختار ورودی های الزامی در یک برنامه تمرینی
 */
export const coreSessionInPlanParameters = Type.Object({
  weeks: Type.Array(Type.Number()),
  description: Type.String(),
  targetMuscles: Type.Array(Type.Enum({
    fullBody: 'full body',
    biceps: 'biceps',
    triceps: 'triceps',
    lat: 'back and lat',
    legs: 'legs',
    abdominals: 'abdominals',
    trap: 'trap',
    shoulders: 'shoulders',
    forearms: 'forearms',
    chest: 'chest',
  })),
  exercises: Type.Array(exerciseSchema.exerciseOutputInPlanSchema),
})

/**
 * ساختار یک جلسه تمرینی در برنامه تمرینی
 */
export const sessionInPlanSchema = Type.Intersect([
  coreSessionInPlanParameters,
  optionalSessionParameters
]);
export type sessionInplanType = Static<typeof sessionInPlanSchema>

/**
 * پارامتر های الزامی یک جلسه تمرینی در خروجی که کاربر مشاهده میکند
 */
export const coreSessionOutputParameters = Type.Object({
  weeks: Type.Array(Type.Number()),
  description: Type.String(),
  targetMuscles: Type.Array(Type.Enum({
    fullBody: 'full body',
    biceps: 'biceps',
    triceps: 'triceps',
    lat: 'back and lat',
    legs: 'legs',
    abdominals: 'abdominals',
    trap: 'trap',
    shoulders: 'shoulders',
    forearms: 'forearms',
    chest: 'chest',
  })),
  exercises: Type.Array(exerciseSchema.exerciseOutputSchema),
})

/**
 * ساختار یک جلسه تمرینی در خروجی که کاربر مشاهده میکند
 */
export const sessionOutputSchema = Type.Intersect([
  coreSessionOutputParameters,
  optionalSessionParameters
]);
export type sessionOutputType = Static<typeof sessionOutputSchema>

/**
 * ساختار خروجی یک جلسه تمرینی پرینتی
 */
export const printSessionOutputSchema = Type.Object({
  weeks: Type.Array(Type.Number()),
  description: Type.String(),
  targetMuscles: Type.Array(Type.Enum({
    fullBody: 'full body',
    biceps: 'biceps',
    triceps: 'triceps',
    lat: 'back and lat',
    legs: 'legs',
    abdominals: 'abdominals',
    trap: 'trap',
    shoulders: 'shoulders',
    forearms: 'forearms',
    chest: 'chest',
  })),
  // optionalSessionParameters, // فعلا اطلاعات اضافه جلسه رو توی برنامه پرینتی نمیزنیم
  exercises: Type.Array(exerciseSchema.printingExerciseOutputSchema),
})
export type printSessionOutputType = Static<typeof printSessionOutputSchema>

/**
 * اسکیم یک برنامه تمرینی
 */
export const PlanSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  studentId: Type.String({ format: 'uuid' }),
  teacherId: Type.Union([Type.Literal('-'), Type.String({ format: 'uuid' })]),
  title: Type.Optional(Type.String({ minLength: 2, maxLength: 255 })),
  target: Type.Enum({
    postural: 'postural',
    hypertrophy: 'hypertrophy',
    strength: 'strength',
    endurance: 'endurance',
    balance: 'balance',
    mobility: 'mobility',
  }),
  description: Type.Optional(Type.String()),
  studentLevel: Type.Enum({
    novice: 'novice',
    beginner: 'beginner',
    intermediate: 'intermediate',
    advanced: 'advanced',
    expert: 'expert',
  }),
  studentWeight: Type.Number(), // اگر nullable است، می‌توانی Type.Optional(Type.Number()) بگذاری
  studentAge: Type.Number(),
  status: Type.Enum({
    published: 'published',
    draft: 'draft',
    paid: 'paid',
    deleted: 'deleted'
  }),
  workoutPlan: Type.Object({
    sessions: Type.Array(sessionInPlanSchema),
  }),
  createdAt: Type.String({ pattern: isoWithoutTimezonePattern }),
  updatedAt: Type.String({ pattern: isoWithoutTimezonePattern }),
})
export type PlanType = Static<typeof PlanSchema>

/**
 *  اسکیم یک برنامه تمرینی پرینتی
 */
export const PrintPlanSchema = Type.Object({
  // ستون‌های اصلی
  id: Type.String({ format: 'uuid' }),
  studentId: Type.String({ format: 'uuid' }),
  teacherId: Type.Union([Type.Literal('-'), Type.String({ format: 'uuid' })]),
  title: Type.Optional(Type.String({ minLength: 2, maxLength: 255 })),
  target: Type.Enum({
    postural: 'postural',
    hypertrophy: 'hypertrophy',
    strength: 'strength',
    endurance: 'endurance',
    balance: 'balance',
    mobility: 'mobility',
  }),
  description: Type.Optional(Type.String()),
  studentLevel: Type.Enum({
    novice: 'novice',
    beginner: 'beginner',
    intermediate: 'intermediate',
    advanced: 'advanced',
    expert: 'expert',
  }),
  studentWeight: Type.Number(), // اگر nullable است، می‌توانی Type.Optional(Type.Number()) بگذاری
  studentAge: Type.Number(),
  status: Type.Enum({
    published: 'published',
    draft: 'draft',
    paid: 'paid',
    deleted: 'deleted'
  }),
  workoutPlan: Type.Object({
    sessions: Type.Array(printSessionOutputSchema),
  }),
  createdAt: Type.String({ pattern: isoWithoutTimezonePattern }),
  updatedAt: Type.String({ pattern: isoWithoutTimezonePattern }),
})
export type PrintPlanType = Static<typeof PrintPlanSchema>

// -------------------------------------- ساختار ورودی های تولید برنامه تمرینی --------------------------------------

/**
 * ساختار درخواست آپدیت برنامه تمرینی
 */
export const UpdatePlanRequest = Type.Partial(PlanSchema)

export type UpdatePlanRequestType = Static<typeof UpdatePlanRequest>

/**
 * ساختار ورودی دریافت یک برنامه تمرینی
 */
export const getPlanSchema = Type.Object({
  id: generalSchema.IdParam,
  print: Type.Boolean(),
})
export type getPlanType = Static<typeof getPlanSchema>

/**
 * ساختار ورودی تولید سیستم برنامه تمرینی
 */
export const CreatePlanSystemRequest = Type.Object({
  teacherId: Type.Union([Type.Literal('-'), Type.String({ format: 'uuid' })]),
  description: Type.String(),
  descIsVisible: Type.Boolean(),
  method: Type.String({ maxLength: 255 }),
  repeatPattern: Type.Array(Type.Number()),
})
export type CreatePlanSystemRequestType = Static<typeof CreatePlanSystemRequest>

/**
 * ورودی تولید جلسه تمرینی توسط هوش مصنوعی
 */
export const GenerateSessionByAIRequest = Type.Object({
  teacherId: Type.Union([Type.Literal('-'), Type.String({ format: 'uuid' })]),
  description: Type.String(),
  weeks: Type.Array(Type.Number()),
  exerciseType: Type.String({ minLength: 2, maxLength: 255 }),
  target: Type.Enum({
    postural: 'postural',
    hypertrophy: 'hypertrophy',
    strength: 'strength',
    endurance: 'endurance',
    balance: 'balance',
    mobility: 'mobility',
  }),
  injuries: Type.Array(Type.String()),
  targetMuscles: Type.Array(Type.Enum({
    fullBody: 'full body',
    biceps: 'biceps',
    triceps: 'triceps',
    lat: 'back and lat',
    legs: 'legs',
    abdominals: 'abdominals',
    trap: 'trap',
    shoulders: 'shoulders',
    forearms: 'forearms',
    chest: 'chest',
  })),
  traineeInfo: Type.Object({
    level: Type.Enum({
      novice: 'novice',
      beginner: 'beginner',
      intermediate: 'intermediate',
      advanced: 'advanced',
      expert: 'expert',
    }),
    age: Type.Optional(Type.Number()),
    weight: Type.Optional(Type.Number()),
    gender: Type.Union([Type.Literal('m'), Type.Literal('f')]),
  }),
})
export type GenerateSessionByAIRequestType = Static<typeof GenerateSessionByAIRequest>

/**
 * ورودی تولید برنامه تمرینی بر اساس جلسات تولید شده
 */
export const CreatePlanRequest = Type.Object({
  workoutPlan: Type.Object({
    sessions: Type.Array(sessionInputSchema),
  }),
  title: Type.String(),
  description: Type.String(),
  studentId: Type.String({ format: 'uuid' }),
  teacherId: Type.Union([Type.Literal('-'), Type.String({ format: 'uuid' })]),
  status: Type.Enum({
    published: 'published',
    draft: 'draft'
  }),
  studentGender: Type.Union([Type.Literal('m'), Type.Literal('f')]),
  studentLevel: Type.Enum({
    novice: 'novice',
    beginner: 'beginner',
    intermediate: 'intermediate',
    advanced: 'advanced',
    expert: 'expert',
  }),
  target: Type.Enum({
    postural: 'postural',
    hypertrophy: 'hypertrophy',
    strength: 'strength',
    endurance: 'endurance',
    balance: 'balance',
    mobility: 'mobility',
  }),
  studentWeight: Type.Number(),
  studentAge: Type.Number(),
})
export type CreatePlanRequestType = Static<typeof CreatePlanRequest>

// -------------------------------------- ساختار خروجی های یک برنامه تمرینی --------------------------------------

/**
 * ساختار خروجی یک برنامه تمرینی
 */
export const planOutputSchema = Type.Object({
  // load: Type.String(),
  // deload: Type.String(),
  workoutPlan: Type.Object({
    sessions: Type.Array(sessionOutputSchema),
  }),
})
export type planOutputType = Static<typeof planOutputSchema>

// -------------------------------------- ساختار پاسخ ها --------------------------------------

/**
 * پاسخ موفق یک برنامه
 */
export const SinglePlanResponse = Type.Object({
  data: Type.Object({
    plan: PlanSchema,
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})

/**
 * پاسخ موفق چند برنامه
 */
export const MultiplePlanResponse = Type.Object({
  data: Type.Object({
    plans: Type.Array(PlanSchema),
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})

/**
 * پاسخ موفق یک برنامه تمرینی پرینتی
 */
export const SinglePrintPlanResponse = Type.Object({
  data: Type.Object({
    plan: PrintPlanSchema,
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})

/**
 * پاسخ موفق یک جلسه تمرینی تولید شده
 */
export const SingleSessionResponse = Type.Object({
  data: Type.Object({
    session: sessionOutputSchema,
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})
