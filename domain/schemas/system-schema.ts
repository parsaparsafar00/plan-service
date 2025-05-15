import type { Static } from '@sinclair/typebox'
import { isoWithoutTimezonePattern } from '@amard/validation'
import { Type } from '@sinclair/typebox'
import * as generalSchema from '../schemas/plan-general-schema.js'

/**
 * اسکیم یک سیستم
 */
export const SystemSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  abbrName: Type.String({ maxLength: 511 }),
  teacherId: Type.Union([Type.Literal('-'), Type.String({ format: 'uuid' })]),
  description: Type.String(),
  descIsVisible: Type.Boolean(),
  method: generalSchema.systemMethodEnum,
  usageTimes: Type.Number() || 0,
  isGlobal: Type.Boolean(),
  repeatPattern: Type.String(),
  status: Type.Optional(Type.String({ maxLength: 30 })),
  createdAt: Type.String({ pattern: isoWithoutTimezonePattern }),
  updatedAt: Type.String({ pattern: isoWithoutTimezonePattern }),
})
export type SystemType = Static<typeof SystemSchema>

/**
 * اسکیم ورودی آپدیت کردن تعداد دفعات استفاده از سیستم ها
 */
export const UpdateSystemsByIdListSchema = Type.Object({
  idList: Type.Array(Type.String({ format: 'uuid' })),
  countList: Type.Array(Type.Number())
})
export type UpdateSystemsByIdListType = Static<typeof UpdateSystemsByIdListSchema>

/**
 * ساختار ورودی تولید سیستم برنامه تمرینی
 */
export const CreatePlanSystemRequest = Type.Object({
  teacherId: Type.Union([Type.Literal('-'), Type.String({ format: 'uuid' })]),
  description: Type.String(),
  descIsVisible: Type.Boolean(),
  method: generalSchema.systemMethodEnum,
  isGlobal: Type.Boolean(),
  repeatPattern: Type.Array(Type.Number()),
})
export type CreatePlanSystemRequestType = Static<typeof CreatePlanSystemRequest>

/**
 * ساختار درخواست آپدیت برنامه تمرینی
 */
export const UpdateSystemRequestSchema = Type.Partial(
  Type.Object({
    ...SystemSchema.properties, // صفات اسکیم سیستم رو نگهداری میکنیم
    repeatPattern: Type.Array(Type.Number(), { default: [] })
  })
);
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
