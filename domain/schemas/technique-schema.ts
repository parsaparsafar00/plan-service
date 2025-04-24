import type { Static } from '@sinclair/typebox'
import { isoWithoutTimezonePattern } from '@amard/validation'
import { Type } from '@sinclair/typebox'

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

export const TechniqueListSchema = Type.Array(TechniqueSchema)
export type TechniqueListType = Static<typeof TechniqueListSchema>

/**
 * ساختار ورودی تولید تکنیک برنامه تمرینی
 */
export const CreateTechniqueRequest = Type.Object({
  teacherId: Type.String({ format: 'uuid' }),
  description: Type.String(),
  name: Type.String({ maxLength: 255 }),
  descIsVisible: Type.Boolean(),
  method: Type.String({ maxLength: 255 }),
})
export type CreateTechniqueRequestType = Static<typeof CreateTechniqueRequest>

/**
 * ساختار درخواست آپدیت تکنیک
 */
export const UpdateTechniqueRequest = Type.Partial(TechniqueSchema)
export type UpdateTechniqueRequestType = Static<typeof UpdateTechniqueRequest>

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
