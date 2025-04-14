import type { Static } from '@sinclair/typebox'
import { getCodesByServiceAndStatus } from '@amard/message-manager'
import { isoWithoutTimezonePattern } from '@amard/validation'
import { Type } from '@sinclair/typebox'

// -------------------------------------- اسکیم های مرتبط با برنامه تمرینی --------------------------------------

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
  nWeeks: Type.Optional(Type.Number()),
  workoutPlan: Type.Optional(Type.Any()),
  createdAt: Type.String({ pattern: isoWithoutTimezonePattern }),
  updatedAt: Type.String({ pattern: isoWithoutTimezonePattern }),
})
export type PlanType = Static<typeof PlanSchema>

/**
 * اسکیم tain helper 
 */
export const PlanTrainHelperSchema = Type.Object({
  // ستون‌های اصلی
  id: Type.String({ format: 'uuid' }),
  planId: Type.String({ format: 'uuid' }),
  exerciseNumber: Type.Integer(),
  createdAt: Type.String({ pattern: isoWithoutTimezonePattern }),
  updatedAt: Type.String({ pattern: isoWithoutTimezonePattern }),
})
export type PlanTrainHelperType = Static<typeof PlanTrainHelperSchema>

/**
 * اسکیم یک سیستم در برنامه تمرینی
 */
export const SystemSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  abbrName: Type.String({ maxLength: 511 }),
  teacherId: Type.String({ format: 'uuid' }),
  description: Type.String(),
  descIsVisible: Type.Boolean(),
  method: Type.String(),
  repeatPattern: Type.Array(Type.Number(), { maxItems: 6 }), // ماکسیمم تعداد ست برابر با 6 است
  status: Type.Optional(Type.String({ maxLength: 30 })), // مثل 'active', 'done'
  createdAt: Type.String({ pattern: isoWithoutTimezonePattern }),
  updatedAt: Type.String({ pattern: isoWithoutTimezonePattern }),
})
export type SystemType = Static<typeof SystemSchema>

/**
 * اسکیم یک تکنیک در برنامه تمرینی
 */
export const TechniqueSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  abbrName: Type.String({ maxLength: 511 }),
  name: Type.String({ maxLength: 255 }),
  teacherId: Type.String({ format: 'uuid' }),
  description: Type.String(),
  descIsVisible: Type.Boolean(),
  method: Type.String(),
  status: Type.Optional(Type.String({ maxLength: 30 })), // مثل 'active', 'done'
  createdAt: Type.String({ pattern: isoWithoutTimezonePattern }),
  updatedAt: Type.String({ pattern: isoWithoutTimezonePattern }),
})
export type TechniqueType = Static<typeof TechniqueSchema>


// -------------------------------------- ساختار ورودی تولید سیستم --------------------------------------

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


// -------------------------------------- ساختار ورودی تولید تکنیک  --------------------------------------

/**
 * ساختار ورودی تولید تکنیک برنامه تمرینی
 */
export const CreateTechniqueRequest = Type.Object({
  teacherId: Type.String({ format: 'uuid' }),
  description: Type.String(),
  name: Type.String({maxLength: 255}),
  descIsVisible: Type.Boolean(),
  method: Type.String({maxLength: 255}),
});
export type CreateTechniqueRequestType = Static<typeof CreateTechniqueRequest>


// -------------------------------------- ساختار ورودی های تولید برنامه تمرینی --------------------------------------

/**
 * ورودی تولید برنامه تمرینی 
 */
export const CreatePlanRequest = Type.Object({
  studentId: Type.String({ format: 'uuid' }),
  teacherId: Type.String({ format: 'uuid' }),
  description: Type.String(),
  title: Type.String({ minLength: 2, maxLength: 255 }),
  exerciseType: Type.String({ minLength: 2, maxLength: 255 }),
  target: Type.String(),
  injuries: Type.Array(Type.String()),
  weeks: Type.Array(
    Type.Object({
      number: Type.Array(Type.Number()),
      sessions: Type.Array(
        Type.Object({
          session: Type.Number(),
          targetMuscles: Type.Array(Type.String()),
        }),
      ),
    }),
  ),

  traineeInfo: Type.Object({
    level: Type.String({ maxLength: 255 }),
    age: Type.Number(),
    weight: Type.Number(),
    gender: Type.Union([Type.Literal(0), Type.Literal(1)]),
  }),
})
export type CreatePlanRequestType = Static<typeof CreatePlanRequest>

export interface weekInputSchema {
  number: number[]
  sessions: {
    session: number
    targetMuscles: string[]
  }[]
}

/**
 * ساختار ورودی یک برنامه تمرینی 
 */
export interface planInputSchema {
  target: string
  level: string
  age: number
  weight: number
  gender: number
  printingPlan: boolean
  weeks: weekInputSchema[]
}

// -------------------------------------- ساختار خروجی های یک برنامه تمرینی --------------------------------------

/**
 * ساختار خروجی یک حرکت تولید شده توسط سرویس
 */
export const exerciseOutputSchema = Type.Object({
  number: Type.Number(),
  id: Type.String(),
  name: Type.String(),
  nameFa: Type.String(),
  mechanics: Type.Union([Type.String(), Type.Null()]),
  difficultyLevel: Type.Union([Type.String(), Type.Null()]),
  bodyRegion: Type.Union([Type.String(), Type.Null()]),
  inDepthYoutubeExplanation: Type.Union([Type.String(), Type.Null()]),
  restBetweenSets: Type.Number(),
  weightPercentage: Type.String(),
  system: Type.Array(Type.Number())
})
export type exerciseOutputType = Static<typeof exerciseOutputSchema>

/**
 * ساختار خروجی یک حرکت تولید شده توسط سرویس (مخصوص پرینت گرفتن)
 */
export const printingExerciseOutputSchema = Type.Object({
  number: Type.Number(),
  name: Type.String(),
  nameFa: Type.String(),
  restBetweenSets: Type.Number(),
  weightPercentage: Type.String(),
  system: Type.Array(Type.Number()),
})
export type printingExerciseOutputType = Static<typeof printingExerciseOutputSchema>

/**
 * ساختار خروجی یک جلسه تمرینی
 */
export const sessionOutputSchema = Type.Object({
  index: Type.Number(),
  targetMuscles: Type.Array(Type.String()),
  cooldownActivities: Type.Array(Type.String()),
  warmupActivities: Type.Array(Type.String()),
  cooldownDuration: Type.String(),
  warmupDuration: Type.String(),
  recoveryTime: Type.String(),
  sessionDuration: Type.String(),
  exercises: Type.Array(exerciseOutputSchema),
})
export type sessionOutputType = Static<typeof sessionOutputSchema>

/**
 * ساختار خروجی یک جلسه تمرینی (مخصوص پرینت گرفتن)
 */
export const printingSessionOutputSchema = Type.Object({
  index: Type.Number(),
  targetMuscles: Type.Array(Type.String()),
  cooldownActivities: Type.Array(Type.String()),
  warmupActivities: Type.Array(Type.String()),
  cooldownDuration: Type.String(),
  warmupDuration: Type.String(),
  recoveryTime: Type.String(),
  sessionDuration: Type.String(),
  exercises: Type.Array(printingExerciseOutputSchema),
})
export type printingSessionOutputType = Static<typeof printingSessionOutputSchema>

/**
 * ساختار هفته ها در خروجی
 */
export const weekOutputSchema = Type.Object({
  number: Type.Array(Type.Number()),
  sessions: Type.Array(sessionOutputSchema),
});
export type weekOutputType = Static<typeof weekOutputSchema>

/**
 * ساختار خروجی یک برنامه تمرینی 
 */
export const planOutputSchema = Type.Object({
  load: Type.String(),
  deload: Type.String(),
  weeks: Type.Array(weekOutputSchema),
});
export type planOutputType = Static<typeof planOutputSchema>

/**
 * برای آپدیت
 */
export const UpdatePlanRequest = Type.Partial(PlanSchema)
export type UpdatePlanRequestType = Static<typeof UpdatePlanRequest>

/**
 * پارامتر آیدی برنامه در درخواست
 */
export const IdParam = Type.Object({
  id: Type.String({ format: 'uuid' }),
})
export type IdParamType = Static<typeof IdParam>

// -------------------------------------- ساختار پاسخ ها --------------------------------------

/**
 * پاسخ موفق خالی
 */
export const EmptySuccessResponse = Type.Object({
  data: Type.Object({}),
  msgCode: Type.String(),
  msgType: Type.Literal('success'),
})

/**
 * پاسخ موفق با برگرداندن یک برنامه
 */
export const SinglePlanResponse = Type.Object({
  data: Type.Object({
    plan: PlanSchema,
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})

/**
 * پاسخ موفق با برگرداندن یک سیستم
 */
export const SingleSystemResponse = Type.Object({
  data: Type.Object({
    system: SystemSchema,
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})

// پاسخ موفق چند سیستم
export const MultipleSystemResponse = Type.Object({
  data: Type.Object({
    systems: Type.Array(SystemSchema),
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})

/**
 * پاسخ موفق با برگرداندن یک تکنیک
 */
export const SingleTechniqueResponse = Type.Object({
  data: Type.Object({
    technique: TechniqueSchema,
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})

// پاسخ موفق چند تکنیک
export const MultipleTechniqueResponse = Type.Object({
  data: Type.Object({
    techniques: Type.Array(TechniqueSchema),
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})

/**
 * پاسخ خطا
 */
export const ErrorResponse = Type.Object({
  data: Type.Object({ message: Type.String() }),
  msgCode: Type.String(),
  msgType: Type.Literal('error'),
})

function generateDescriptionForStatus(title: string, status: number) {
  const codes = getCodesByServiceAndStatus('plans', status)
  const lines = codes.map(item => `- **${item.code}**: ${item.message}`)
  return `${title}${lines.join('\n')}`
}

export const SuccessResponseDes = {
  description: `### عملیات موفق با کد 200 گزارش میشود. مدل خروجی در اسکیما.`,
}
export const BadRequestError = {
  description: generateDescriptionForStatus(`
  ### هرگونه مشکلی در ورودی اطلاعات با خطای 400 گزارش میشود
  `, 400),
  content: {
    'application/json': {
      schema: ErrorResponse,
    },
  },
}
export const ForbiddenError = {
  description: generateDescriptionForStatus(`
  ### خطاهای سطح دسترسی با کد 403 گزارش میشوند
  `, 403),
  content: {
    'application/json': {
      schema: ErrorResponse,
    },
  },
}
export const InternalServerError = {
  description: generateDescriptionForStatus(`
  ### خطاهای داخلی با کد 500 گزارش میشوند
  `, 500),
  content: {
    'application/json': {
      schema: ErrorResponse,
    },
  },
}
