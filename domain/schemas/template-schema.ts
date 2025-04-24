import type { Static } from '@sinclair/typebox'
import { isoWithoutTimezonePattern } from '@amard/validation'
import { Type } from '@sinclair/typebox'
import { sessionInputSchema } from '../schemas/plan-schema.js'

/**
 * ساختار ورودی تولید یک قالب توسط هوش مصنوعی برای برنامه تمرینی
 */
export const CreateTemplateByAIRequest = Type.Object({
  teacherId: Type.String({ format: 'uuid' }),
  name: Type.String({ maxLength: 255 }),
  target: Type.String({ maxLength: 255 }),
  level: Type.String({ maxLength: 255 }),
  muscles: Type.Array(Type.String()),
  description: Type.String(),
  gender: Type.Union([Type.Literal(0), Type.Literal(1)]),
})
export type CreateTemplateByAIRequestType = Static<typeof CreateTemplateByAIRequest>

/**
 * ساختار ورودی تولید یک قالب بصورت دستی مصنوعی برای برنامه تمرینی
 */
export const CreateTemplateManualRequest = Type.Object({
  teacherId: Type.String({ format: 'uuid' }),
  name: Type.String({ maxLength: 255 }),
  target: Type.String({ maxLength: 255 }),
  level: Type.String({ maxLength: 255 }),
  muscles: Type.Array(Type.String()),
  description: Type.String(),
  gender: Type.Union([Type.Literal(0), Type.Literal(1)]),
  session: sessionInputSchema, // بدین معنا که صرفا شماره حرکت و اطلاعات اضافی که مربی در فرم پر میکنه قراره توی یک قالب دستی ذخیره بشه
})
export type CreateTemplateManualRequestType = Static<typeof CreateTemplateManualRequest>

/**
 * اسکیم یک قالب در برنامه تمرینی
 */
export const templateSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String({ maxLength: 255 }),
  teacherId: Type.String({ format: 'uuid' }),
  description: Type.String(),
  level: Type.String({ maxLength: 255 }),
  target: Type.String({ maxLength: 255 }),
  gender: Type.Union([Type.Literal(0), Type.Literal(1)]),
  muscles: Type.Array(Type.String()),
  session: sessionInputSchema,
  createdAt: Type.String({ pattern: isoWithoutTimezonePattern }),
  updatedAt: Type.String({ pattern: isoWithoutTimezonePattern }),
})
export type TemplateType = Static<typeof templateSchema>

export const TemplateListSchema = Type.Array(templateSchema)
export type TemplateListType = Static<typeof TemplateListSchema>

/**
 * ساختار درخواست آپدیت قالب تمرینی
 */
export const UpdateTemplateRequest = Type.Partial(templateSchema)
export type UpdateTemplateRequestType = Static<typeof UpdateTemplateRequest>

/**
 * پاسخ موفق با برگرداندن یک قالب
 */
export const SingleTemplateResponse = Type.Object({
  data: Type.Object({
    template: templateSchema,
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})

/**
 * پاسخ موفق با برگرداندن چند قالب
 */
export const MultipleTemplateResponse = Type.Object({
  data: Type.Object({
    templates: Type.Array(templateSchema),
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})
