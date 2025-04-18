import type { Static } from '@sinclair/typebox'
import { isoWithoutTimezonePattern } from '@amard/validation'
import { Type } from '@sinclair/typebox'

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
});
export type SystemType = Static<typeof SystemSchema>

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
