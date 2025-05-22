import type { Static } from '@sinclair/typebox'
import { getCodesByServiceAndStatus } from '@amard/message-manager'
import { Type } from '@sinclair/typebox'

// -------------------------------------- ساختار پارامتر ها با مقادیر از قبل مشخص شده --------------------------------------

// عضلات مورد استفاده در سرویس
export const targetMusclesEnum = Type.Array(
  Type.Enum({
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
  }),
)

// هدف برنامه و شاگرد ها
export const targetEnum = Type.Enum({
  postural: 'postural',
  hypertrophy: 'hypertrophy',
  strength: 'strength',
  endurance: 'endurance',
  balance: 'balance',
  mobility: 'mobility',
})

// سطح حرکات و شاگرد ها
export const levelEnum = Type.Enum({
  novice: 'novice',
  beginner: 'beginner',
  intermediate: 'intermediate',
  advanced: 'advanced',
  expert: 'expert',
})

// روش های سیستم های تکرار
export const systemMethodEnum = Type.Enum({
  descending: 'descending',
  ascending: 'ascending',
  custom: 'custom',
  sinusoidal: 'sinusoidal',
  pyramidUp: 'pyramidUp',
  pyramidDown: 'pyramidDown',
  fullPyramidDown: 'fullPyramidDown',
  fullPyramidUp: 'fullPyramidUp',
  singleSet: 'singleSet',
  constant: 'constant',
})

// روش های تکنیک ها
export const techniqueMethodEnum = Type.Enum({
  superset: 'superset',
  giantset: 'giantset',
  dropset: 'dropset',
  custom: 'custom',
})

// -------------------------------------- ساختار ورودی ها --------------------------------------

/**
 * پارامتر آیدی برنامه در درخواست
 */
export const IdParam = Type.Object({
  id: Type.String({ format: 'uuid' }),
})
export type IdParamType = Static<typeof IdParam>

/**
 * پارامتر شماره در درخواست
 */
export const numberParam = Type.Object({
  number: Type.Number(),
})
export type numberParamType = Static<typeof numberParam>

/**
 * پارامتر آیدی مربی در درخواست
 */
export const IdQueryTeacher = Type.Object({
  id: Type.Union([Type.Literal('-'), Type.String({ format: 'uuid' })]),
})
export type IdQueryTeacherType = Static<typeof IdQueryTeacher>

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

export const SuccessResponseDes = `### عملیات موفق با کد 200 گزارش میشود. مدل خروجی در اسکیما.`

export const BadRequestError = {
  description: generateDescriptionForStatus(
    `
  ### هرگونه مشکلی در ورودی اطلاعات با خطای 400 گزارش میشود
  `,
    400,
  ),
  content: {
    'application/json': {
      schema: ErrorResponse,
    },
  },
}
export const ForbiddenError = {
  description: generateDescriptionForStatus(
    `
  ### خطاهای سطح دسترسی با کد 403 گزارش میشوند
  `,
    403,
  ),
  content: {
    'application/json': {
      schema: ErrorResponse,
    },
  },
}
export const InternalServerError = {
  description: generateDescriptionForStatus(
    `
  ### خطاهای داخلی با کد 500 گزارش میشوند
  `,
    500,
  ),
  content: {
    'application/json': {
      schema: ErrorResponse,
    },
  },
}
