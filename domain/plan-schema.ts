import type { Static } from '@sinclair/typebox'
import { getCodesByServiceAndStatus } from '@amard/message-manager'
import { isoWithoutTimezonePattern } from '@amard/validation'
import { Type } from '@sinclair/typebox'


/**
 * اسکیم یک برنامه تمرینی (Plan) در جدول plan_records (اما ستون‌ها camelCase)
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
 * برای ایجاد برنامه تمرینی
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
      week: Type.Number(),
      sessionsPerWeek: Type.Number(),
      sessions: Type.Array(
        Type.Object({
          session: Type.Number(),
          segmentation: Type.String(),
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


/**
 *
 * ساختار ورودی ها و خروجی های یک برنامه تمرینی
 *    
 */

export interface weekInputSchema {
  week: number
  sessionsPerWeek: number
  sessions: {
    session: number
    segmentation: string
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
  weeks: weekInputSchema[]
}

/**
 * ساختار خروجی یک حرکت تولید شده توسط سرویس
 */
export const exerciseOutputSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  nameFa: Type.String(),
  mechanics: Type.Union([Type.String(), Type.Null()]),
  difficultyLevel: Type.Union([Type.String(), Type.Null()]),
  bodyRegion: Type.Union([Type.String(), Type.Null()]),
  inDepthYoutubeExplanation: Type.Union([Type.String(), Type.Null()]),
  restBetweenSetsCeiling: Type.Number(),
  restBetweenSetsGround: Type.Number(),
  weightCeilingPercentage: Type.Number(),
  weightGroundPercentage: Type.Number(),
  numberOfSets: Type.Number(),
  repeatsPerSets: Type.Number()
})
export type exerciseOutputType = Static<typeof exerciseOutputSchema>

/**
 * ساختار خروجی یک حرکت تولید شده توسط سرویس (مخصوص پرینت گرفتن)
 */
export const printingExerciseOutputSchema = Type.Object({
  name: Type.String(),
  nameFa: Type.String(),
  restBetweenSetsCeiling: Type.Number(),
  restBetweenSetsGround: Type.Number(),
})
export type printingExerciseOutputType = Static<typeof printingExerciseOutputSchema>

/**
 * ساختار خروجی یک جلسه تمرینی
 */
export const sessionOutputSchema = Type.Object({
  index: Type.Number(),
  targetMuscles: Type.Array(Type.String()),
  number_of_exercises_per_muscle_set: Type.Array(Type.Number()),
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
  name: Type.String(),
  system: Type.String(),
  weightCeiling: Type.Number(),
  weightGround: Type.Number(),
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
