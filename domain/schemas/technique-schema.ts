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
  usageTimes: Type.Number() || 0,
  descIsVisible: Type.Boolean(),
  isGlobal: Type.Boolean(),
  method: Type.String(),
  status: Type.Optional(Type.String({ maxLength: 30 })), // مثل 'active', 'done'
  createdAt: Type.String({ pattern: isoWithoutTimezonePattern }),
  updatedAt: Type.String({ pattern: isoWithoutTimezonePattern }),
})
export type TechniqueType = Static<typeof TechniqueSchema>

export const TechniqueListSchema = Type.Array(TechniqueSchema)
export type TechniqueListType = Static<typeof TechniqueListSchema>

/**
 * اسکیم تکنیک در خروجی یک برنامه تمرینی
 */
export const techniqueInPlanOutputSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String({ maxLength: 255 }),
  description: Type.String(),
  descIsVisible: Type.Boolean(),
  method: Type.String(),
})
export type techniqueInPlanOutputSchemaType = Static<typeof techniqueInPlanOutputSchema>

export const TechniqueInPlanListSchema = Type.Array(techniqueInPlanOutputSchema)
export type TechniqueInPlanListSchemaType = Static<typeof TechniqueInPlanListSchema>

/**
 * اسکیم دریافت اطلاعات تکنیک ها از طریق آیدی در یک برنامه
 */
export const GetTechnqiueByIdRequest = Type.Object({
  id: Type.String({ format: 'uuid' }),
})

export const GetTechnqiuesByIdListRequest = Type.Array(GetTechnqiueByIdRequest)
export type GetTechnqiuesByIdListType = Static<typeof GetTechnqiuesByIdListRequest>

/**
 * ساختار ورودی تولید تکنیک برنامه تمرینی
 */
export const CreateTechniqueRequest = Type.Object({
  teacherId: Type.String({ format: 'uuid' }),
  description: Type.String(),
  name: Type.String({ maxLength: 255 }),
  method: Type.String({ maxLength: 255 }),
  descIsVisible: Type.Boolean(),
})
export type CreateTechniqueRequestType = Static<typeof CreateTechniqueRequest>

/**
 * اسکیم دریافت اطلاعات تکنیک ها از طریق آیدی در یک برنامه
 */
export const GetTechniqueByIdRequest = Type.Object({
  id: Type.String({ format: 'uuid' }),
})

export const GetTechniqueByIdListRequest = Type.Array(GetTechniqueByIdRequest)
export type GetTechniqueByIdListRequestType = Static<typeof GetTechniqueByIdListRequest>

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
