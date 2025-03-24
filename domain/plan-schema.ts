import type { Static } from '@sinclair/typebox'
import { getCodesByServiceAndStatus } from '@amard/message-manager'
import { isoWithoutTimezonePattern } from '@amard/validation'
import { Type } from '@sinclair/typebox'

// اسکیم یک برنامه تمرینی
export const PlanSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  student_id: Type.String({ format: 'uuid' }),
  teacher_id: Type.String({ format: 'uuid' }),
  title: Type.String({ minLength: 2, maxLength: 255 }),
  target: Type.String({ minLength: 2, maxLength: 255 }),
  description: Type.String(),
  student_level: Type.String({ maxLength: 255 }),
  student_weight: Type.Number(),
  student_age: Type.Number(),
  status: Type.String({ maxLength: 30 }), // active، done و ...
  n_weeks : Type.Number(),
  workout_plan: Type.String(),
  createdAt: Type.String({ pattern: isoWithoutTimezonePattern }),
  updatedAt: Type.String({ pattern: isoWithoutTimezonePattern }),
})
export type PlanType = Static<typeof PlanSchema>

// // اسکیم حرکات بدنسازی
// export const ExerciseSchema = Type.Object({
//   id: Type.String({ format: 'uuid' }),
//   mechanics: Type.String(),
//   name : Type.String(),
//   difficulty_level : Type.String(),
//   body_region : Type.String(),
//   prime_mover_muscle: Type.String(),
//   combo_exercises: Type.String(),
//   target_muscle_group : Type.String(),
//   short_youtube_demonstration : Type.String(),
//   in_depth_youtube_explanation: Type.String(),
// })
// export type ExerciseSchema = Static<typeof ExerciseSchema>

// برای ایجاد برنامه تمرینی
export const CreatePlanRequest = Type.Object({
  student_id: Type.String({ format: 'uuid' }),
  teacher_id: Type.String({ format: 'uuid' }),
  description: Type.String(),
  title: Type.String({ minLength: 2, maxLength: 255 }),
  exerciseType: Type.String({ minLength: 2, maxLength: 255 }),
  target: Type.String(),
  injuries: Type.Array(Type.String()), // Array of strings
  weeks: Type.Array(
    Type.Object({
      week: Type.Number(), // Week number as a number
      sessionsPerWeek: Type.Number(), // Number of sessions per week as a number
      sessions: Type.Array(
        Type.Object({
            session: Type.Number(), // Session number as a number
            segmentation: Type.String(), // Segmentation type as a string
            targetMuscles: Type.Array(Type.String()) // Array of strings for target muscles in the session
        })
      )
    })
  ),
  traineeInfo: Type.Object({
      level : Type.String({ maxLength: 255 }),
      age:  Type.Number(),
      weight:  Type.Number(),
      gender: Type.Union([Type.Literal(0), Type.Literal(1)])
    })
})
export type CreatePlanRequestType = Static<typeof CreatePlanRequest>

// برای آپدیت
export const UpdatePlanRequest = Type.Partial(PlanSchema)
export type UpdatePlanRequestType = Static<typeof UpdatePlanRequest>

// پارامتر آیدی برنامه در درخواست
export const IdParam = Type.Object({
  id: Type.String({ format: 'uuid' }),
})
export type IdParamType = Static<typeof IdParam>

// پاسخ موفق خالی
export const EmptySuccessResponse = Type.Object({
  data: Type.Object({}),
  msgCode: Type.String(),
  msgType: Type.Literal('success'),
})

// پاسخ موفق با برگرداندن یک برنامه
export const SinglePlanResponse = Type.Object({
  data: Type.Object({
    plan: PlanSchema,
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})

// پاسخ خطا
export const ErrorResponse = Type.Object({
  data: Type.Object({ message: Type.String() }),
  msgCode: Type.String(),
  msgType: Type.Literal('error'),
})

// تابع کمکی تولید توضیحات
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
