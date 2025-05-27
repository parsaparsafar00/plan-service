import type { Static } from '@sinclair/typebox'
import { isoWithoutTimezonePattern } from '@amard/validation'
import { Type } from '@sinclair/typebox'

/**
 * اسکیم یک متد تکنیکی
 */
export const TechniqueMethodSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  number: Type.Number(),
  name: Type.String(),
  description: Type.String(),
  status: Type.Optional(
    Type.Enum({
      published: 'published',
      draft: 'draft',
    }),
  ),
  createdAt: Type.String({ pattern: isoWithoutTimezonePattern }),
  updatedAt: Type.String({ pattern: isoWithoutTimezonePattern }),
})
export type TechniqueMethodType = Static<typeof TechniqueMethodSchema>

/**
 * اسکیم متدهای تکنیکی در لیستی که مربی می‌خواهد متد تکنیکی مورد نظرش را بر اساس تعداد دفعات استفاده خودش به راحتی پیدا کند
 */
export const TechniqueMethodsAndUsageTimesSchema = Type.Object({
  techniqueMethodNumber: Type.Number(),
  usageCount: Type.Number(),
})

export type TechniqueMethodsAndUsageTimesType = Static<typeof TechniqueMethodsAndUsageTimesSchema>

/**
 * ساختار ورودی تولید متد تکنیکی برنامه تمرینی
 */
export const CreatePlanTechniqueMethodRequest = Type.Object({
  description: Type.String(),
  name: Type.String(),
  status: Type.Optional(
    Type.Enum({
      published: 'published',
      draft: 'draft',
    }),
  ),
})
export type CreatePlanTechniqueMethodRequestType = Static<typeof CreatePlanTechniqueMethodRequest>

/**
 * ساختار درخواست آپدیت متد تکنیکی تمرینی که در آن از پارشال استفاده شده است
 */
export const UpdateTechniqueMethodRequestSchema = Type.Partial(TechniqueMethodSchema)
export type UpdateTechniqueMethodRequestType = Static<typeof UpdateTechniqueMethodRequestSchema>

/**
 * پاسخ موفق با برگرداندن یک متد تکنیکی
 */
export const SingleTechniqueMethodResponse = Type.Object({
  data: Type.Object({
    techniqueMethod: TechniqueMethodSchema,
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})

/**
 * پاسخ موفق با برگرداندن متدهای تکنیکی و استفاده‌شان
 */
export const TechniqueMethodsAndUsageTimesResponseSchema = Type.Object({
  data: Type.Object({
    techniqueMethods: Type.Array(TechniqueMethodsAndUsageTimesSchema),
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})

/**
 * پاسخ موفق چند متد تکنیکی
 */
export const MultipleTechniqueMethodResponse = Type.Object({
  data: Type.Object({
    techniqueMethods: Type.Array(TechniqueMethodSchema),
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})
