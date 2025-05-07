import type { Static } from '@sinclair/typebox'
import { isoWithoutTimezonePattern } from '@amard/validation'
import { Type } from '@sinclair/typebox'

/**
 * اسکیم یک سیستم
 */
export const SystemSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  abbrName: Type.String({ maxLength: 511 }),
  teacherId: Type.String({ format: 'uuid' }),
  description: Type.String(),
  descIsVisible: Type.Boolean(),
  method: Type.Enum({
    descending: 'descending',
    ascending: 'ascending',
    custom: 'custom',
    sinusoidal: 'sinusoidal',
    pyramidUp: 'pyramidUp',
    pyramidDown: 'pyramidDown',
    singleSet: 'singleSet',
  }),
  usageTimes: Type.Number() || 0,
  isGlobal: Type.Boolean(),
  repeatPattern: Type.Array(Type.Number()),
  status: Type.Optional(Type.String({ maxLength: 30 })), // مثل 'active', 'done'
  createdAt: Type.String({ pattern: isoWithoutTimezonePattern }),
  updatedAt: Type.String({ pattern: isoWithoutTimezonePattern }),
})
export type SystemType = Static<typeof SystemSchema>

export const SystemListSchema = Type.Array(SystemSchema)
export type SystemListType = Static<typeof SystemListSchema>

/**
 * اسکیم ورودی آپدیت کردن تعداد دفعات استفاده از سیستم ها
 */
export const UpdateSystemsByIdListSchema = Type.Object({
  idList: Type.Array(Type.String({ format: 'uuid' })),
  countList: Type.Array(Type.Number())
})
export type UpdateSystemsByIdListType = Static<typeof UpdateSystemsByIdListSchema>

/**
 * اسکیم دریافت اطلاعات سیستم ها از طریق آیدی در یک برنامه
 */
export const GetSystemByIdRequest = Type.Object({
  id: Type.String({ format: 'uuid' }),
})

export const GetSystemByIdListRequest = Type.Array(GetSystemByIdRequest)
export type GetSystemByIdListRequestType = Static<typeof GetSystemByIdListRequest>

/**
 * ساختار ورودی تولید سیستم برنامه تمرینی
 */
export const CreatePlanSystemRequest = Type.Object({
  teacherId: Type.String({ format: 'uuid' }),
  description: Type.String(),
  descIsVisible: Type.Boolean(),
  method: Type.Enum({
    descending: 'descending',
    ascending: 'ascending',
    custom: 'custom',
    sinusoidal: 'sinusoidal',
    pyramidUp: 'pyramidUp',
    pyramidDown: 'pyramidDown',
    singleSet: 'singleSet',
  }),
  repeatPattern: Type.Array(Type.Number()),
})
export type CreatePlanSystemRequestType = Static<typeof CreatePlanSystemRequest>

/**
 * اسکیم سیستم در خروجی یک برنامه تمرینی
 */
export const systemInPlanOutputSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  description: Type.String(),
  descIsVisible: Type.Boolean(),
  method: Type.Enum({
    descending: 'descending',
    ascending: 'ascending',
    custom: 'custom',
    sinusoidal: 'sinusoidal',
    pyramidUp: 'pyramidUp',
    pyramidDown: 'pyramidDown',
    singleSet: 'singleSet',
  }),
  repeatPattern: Type.Array(Type.Number()),
  abbrName: Type.String({ maxLength: 511 }),
})
export type systemInPlanOutputSchemaType = Static<typeof systemInPlanOutputSchema>

export const systemInPlanListSchema = Type.Array(systemInPlanOutputSchema)
export type SystemInPlanListSchemaType = Static<typeof systemInPlanListSchema>

/**
 * ساختار درخواست آپدیت برنامه تمرینی
 */
export const UpdateSystemRequestSchema = Type.Partial(SystemSchema)
export type UpdateSystemRequestType = Static<typeof UpdateSystemRequestSchema>

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
