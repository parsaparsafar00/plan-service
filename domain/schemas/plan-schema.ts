import type { Static } from '@sinclair/typebox'
import { isoWithoutTimezonePattern } from '@amard/validation'
import { Type } from '@sinclair/typebox'
import * as exerciseSchema from '../schemas/exercise-schema.js'
import * as generalSchema from '../schemas/plan-general-schema.js'

// -------------------------------------- اسکیم های مرتبط با برنامه تمرینی --------------------------------------

/**
 * ساختار خروجی یک جلسه تمرینی
*/
export const sessionOutputSchema = Type.Object({
  weeks: Type.Array(Type.Number()),
  description: Type.String(),
  targetMuscles: Type.Array(Type.String()),
  cooldownActivities: Type.Array(Type.String()),
  warmupActivities: Type.Array(Type.String()),
  cooldownDuration: Type.String(),
  warmupDuration: Type.String(),
  recoveryTime: Type.String(),
  sessionDuration: Type.String(),
  exercises: Type.Array(exerciseSchema.exerciseOutputSchema),
})
export type sessionOutputType = Static<typeof sessionOutputSchema>

/**
 * ساختار خروجی یک جلسه تمرینی پرینتی
*/
export const printSessionOutputSchema = Type.Object({
  weeks: Type.Array(Type.Number()),
  description: Type.String(),
  targetMuscles: Type.Array(Type.String()),
  cooldownActivities: Type.Array(Type.String()),
  warmupActivities: Type.Array(Type.String()),
  cooldownDuration: Type.String(),
  warmupDuration: Type.String(),
  recoveryTime: Type.String(),
  sessionDuration: Type.String(),
  exercises: Type.Array(exerciseSchema.printingExerciseOutputSchema),
})
export type printSessionOutputType = Static<typeof printSessionOutputSchema>

/**
 * اسکیم یک برنامه تمرینی
*/
export const PlanSchema = Type.Object({
  // ستون‌های اصلی
  id: Type.String({ format: 'uuid' }),
  studentId: Type.String({ format: 'uuid' }),
  teacherId: Type.String({ format: 'uuid' }),
  title: Type.Optional(Type.String({ minLength: 2, maxLength: 255 })),
  target: Type.String({ minLength: 2, maxLength: 255 }),
  description: Type.Optional(Type.String()),
  studentLevel: Type.String({ maxLength: 255 }),
  studentWeight: Type.Number(), // اگر nullable است، می‌توانی Type.Optional(Type.Number()) بگذاری
  studentAge: Type.Number(),
  status: Type.Optional(Type.String({ maxLength: 30 })), // مثل 'active', 'done'
  workoutPlan: Type.Object({
    sessions: Type.Array(sessionOutputSchema)
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
  teacherId: Type.String({ format: 'uuid' }),
  title: Type.Optional(Type.String({ minLength: 2, maxLength: 255 })),
  target: Type.String({ minLength: 2, maxLength: 255 }),
  description: Type.Optional(Type.String()),
  studentLevel: Type.String({ maxLength: 255 }),
  studentWeight: Type.Number(), // اگر nullable است، می‌توانی Type.Optional(Type.Number()) بگذاری
  studentAge: Type.Number(),
  status: Type.Optional(Type.String({ maxLength: 30 })), // مثل 'active', 'done'
  workoutPlan: Type.Object({
    sessions: Type.Array(printSessionOutputSchema)
  }),
  createdAt: Type.String({ pattern: isoWithoutTimezonePattern }),
  updatedAt: Type.String({ pattern: isoWithoutTimezonePattern }),
})
export type PrintPlanType = Static<typeof PrintPlanSchema>

/**
 * ساختار ورودی دریافت یک برنامه تمرینی
*/
export const getPlanSchema = Type.Object({
  id: generalSchema.IdParam,
  print: Type.Boolean()
})
export type getPlanType = Static<typeof getPlanSchema>

/**
 * ساختار ورودی تولید سیستم برنامه تمرینی
*/
export const CreatePlanSystemRequest = Type.Object({
  teacherId: Type.String({ format: 'uuid' }),
  description: Type.String(),
  descIsVisible: Type.Boolean(),
  method: Type.String({maxLength: 255}),
  repeatPattern: Type.Array(Type.Number(), { maxItems: 6 }), // ماکسیمم تعداد ست برابر با 6 است
});
export type CreatePlanSystemRequestType = Static<typeof CreatePlanSystemRequest>

// -------------------------------------- ساختار ورودی های تولید برنامه تمرینی --------------------------------------

/**
 * ورودی تولید جلسه تمرینی توسط هوش مصنوعی 
*/
export const GeneratePlanRequest = Type.Object({
  studentId: Type.String({ format: 'uuid' }),
  teacherId: Type.String({ format: 'uuid' }),
  description: Type.String(),
  title: Type.String({ minLength: 2, maxLength: 255 }),
  exerciseType: Type.String({ minLength: 2, maxLength: 255 }),
  target: Type.String({ maxLength: 255 }),
  status: Type.String({ maxLength: 255 }),
  injuries: Type.Array(Type.String()),
  weeks: Type.Array(Type.Number()),
  targetMuscles: Type.Array(Type.String()),
  traineeInfo: Type.Object({
    level: Type.String({ maxLength: 255 }),
    age: Type.Number(),
    weight: Type.Number(),
    gender: Type.Union([Type.Literal(0), Type.Literal(1)]),
  }),
})
export type GeneratePlanRequestType = Static<typeof GeneratePlanRequest>

/**
 * ورودی تولید برنامه تمرینی بر اساس جلسات تولید شده 
*/
export const CreatePlanRequest = Type.Object({
  sessions: Type.Array(sessionOutputSchema),
  title: Type.String(),
  description: Type.String(),
  studentId: Type.String({ format: 'uuid' }),
  teacherId: Type.String({ format: 'uuid' }),
  status: Type.String(),
  studentLevel: Type.String(),
  target: Type.String(),
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
  sessions: Type.Array(sessionOutputSchema),
});
export type planOutputType = Static<typeof planOutputSchema>

/**
 * آپدیت برنامه تمرینی
 */
export const UpdatePlanRequest = Type.Partial(PlanSchema)
export type UpdatePlanRequestType = Static<typeof UpdatePlanRequest>

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
