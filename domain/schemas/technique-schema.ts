import type { Static } from '@sinclair/typebox'
import { isoWithoutTimezonePattern } from '@amard/validation'
import { Type } from '@sinclair/typebox'
import * as generalSchema from '../schemas/plan-general-schema.js'

/**
 * اسکیم یک تکنیک در برنامه تمرینی
 */
export const TechniqueSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  abbrName: Type.String({ maxLength: 511 }),
  name: Type.String({ maxLength: 255 }),
  teacherId: Type.Union([Type.Literal('-'), Type.String({ format: 'uuid' })]),
  description: Type.String(),
  usageTimes: Type.Number() || 0,
  descIsVisible: Type.Boolean(),
  isGlobal: Type.Boolean(),
  method: generalSchema.techniqueMethodEnum,
  status: Type.Enum({
    published: 'published',
    draft: 'draft'
  }),
  createdAt: Type.String({ pattern: isoWithoutTimezonePattern }),
  updatedAt: Type.String({ pattern: isoWithoutTimezonePattern }),
})
export type TechniqueType = Static<typeof TechniqueSchema>

/**
 * ساختار ورودی تولید تکنیک برنامه تمرینی
 */
export const CreateTechniqueRequest = Type.Object({
  teacherId: Type.Union([Type.Literal('-'), Type.String({ format: 'uuid' })]),
  description: Type.String(),
  name: Type.String({ maxLength: 255 }),
  method: generalSchema.techniqueMethodEnum,
  descIsVisible: Type.Boolean(),
  isGlobal: Type.Boolean()
})
export type CreateTechniqueRequestType = Static<typeof CreateTechniqueRequest>

/**
 * ساختار درخواست آپدیت تکنیک
 */
export const UpdateTechniqueRequest = Type.Partial(TechniqueSchema)
export type UpdateTechniqueRequestType = Static<typeof UpdateTechniqueRequest>

/**
 * اسکیم ورودی آپدیت کردن تعداد دفعات استفاده از تکنیک ها
 */
export const UpdateTechniquesByIdListSchema = Type.Object({
  idList: Type.Array(Type.String({ format: 'uuid' }), { minItems: 0 }), // ممکنه لیست آیدی ها خالی باشه، یعنی هیچ تکنیکی استفاده نشده باشه
  countList: Type.Array(Type.Number(), { minItems: 0 })
});
export type UpdateTechniquesByIdListType = Static<typeof UpdateTechniquesByIdListSchema>

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
