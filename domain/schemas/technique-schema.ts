import type { Static } from '@sinclair/typebox'
import { isoWithoutTimezonePattern } from '@amard/validation'
import { Type } from '@sinclair/typebox'

/**
 * اسکیم یک تکنیک در برنامه تمرینی
 */
export const TechniqueSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  number: Type.Number(),
  methodNumber: Type.Number(),
  abbrName: Type.String({ maxLength: 511 }),
  name: Type.String({ maxLength: 255 }),
  teacherId: Type.Union([Type.Literal('-'), Type.String({ format: 'uuid' })]),
  description: Type.String(),
  isGlobal: Type.Boolean(),
  descIsVisible: Type.Boolean(),
  status: Type.Enum({
    published: 'published',
    draft: 'draft',
  }),
  createdAt: Type.String({ pattern: isoWithoutTimezonePattern }),
  updatedAt: Type.String({ pattern: isoWithoutTimezonePattern }),
})
export type TechniqueType = Static<typeof TechniqueSchema>

/**
 * اسکیم خروجی یک تکنیک که علاوه بر پارامتر های اصلی یک تکنیک، نام و توضیحات متد تکنیک رو هم داره
 */
export const TechniqueOutputSchema = Type.Intersect([
  TechniqueSchema,
  Type.Object({
    methodName: Type.String(),
    methodDescription: Type.String(),
  }),
])
export type TechniqueOutputType = Static<typeof TechniqueOutputSchema>

/**
 * ساختار ورودی تولید تکنیک برنامه تمرینی
 */
export const CreateTechniqueRequest = Type.Object({
  methodNumber: Type.Number(),
  name: Type.String({ maxLength: 255 }),
  teacherId: Type.Union([Type.Literal('-'), Type.String({ format: 'uuid' })]),
  description: Type.String(),
  isGlobal: Type.Boolean(),
  descIsVisible: Type.Boolean(),
  status: Type.Optional(
    Type.Enum({
      published: 'published',
      draft: 'draft',
    }),
  ),
})
export type CreateTechniqueRequestType = Static<typeof CreateTechniqueRequest>

/**
 * ساختار درخواست آپدیت تکنیک
 */
export const UpdateTechniqueRequest = Type.Partial(TechniqueSchema)
export type UpdateTechniqueRequestType = Static<typeof UpdateTechniqueRequest>

/**
 * اسکیم تکنیک‌ها در لیستی که مربی می‌خواهد تکنیک مورد نظرش را بر اساس تعداد دفعات استفاده خودش به راحتی پیدا کند
 */
export const TechniquesAndUsageTimesSchema = Type.Object({
  techniqueNumber: Type.Number(),
  usageCount: Type.Number(),
})

export type TechniquesAndUsageTimesType = Static<typeof TechniquesAndUsageTimesSchema>

/**
 * اسکیم ورودی آپدیت کردن تعداد دفعات استفاده از تکنیک‌ها
 */
export const UpdateTechniquesByIdListSchema = Type.Object({
  idList: Type.Array(Type.String({ format: 'uuid' }), { minItems: 0 }),
  countList: Type.Array(Type.Number(), { minItems: 0 }),
})
export type UpdateTechniquesByIdListType = Static<typeof UpdateTechniquesByIdListSchema>

/**
 * پاسخ موفق به یک درخواست دریافت تکنیک‌ها و تعداد استفاده‌شان
 */
export const TechniquesAndUsageTimesResponseSchema = Type.Object({
  data: Type.Object({
    techniques: Type.Array(TechniquesAndUsageTimesSchema),
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})

/**
 * پاسخ موفق با برگرداندن یک تکنیک
 */
export const SingleTechniqueResponse = Type.Object({
  data: Type.Object({
    technique: TechniqueOutputSchema,
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})

/**
 * پاسخ موفق چند تکنیک
 */
export const MultipleTechniqueResponse = Type.Object({
  data: Type.Object({
    techniques: Type.Array(TechniqueOutputSchema),
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})
