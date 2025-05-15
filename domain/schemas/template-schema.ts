import type { Static } from '@sinclair/typebox'
import { isoWithoutTimezonePattern } from '@amard/validation'
import { Type } from '@sinclair/typebox'
import { sessionInPlanSchema } from '../schemas/plan-schema.js'
import * as generalSchema from '../schemas/plan-general-schema.js'

/**
 * ساختار ورودی تولید یک قالب توسط هوش مصنوعی برای برنامه تمرینی
 */
export const CreateTemplateByAIRequest = Type.Object({
  teacherId: Type.Union([Type.Literal('-'), Type.String({ format: 'uuid' })]),
  name: Type.String({ maxLength: 255 }),
  target: generalSchema.targetEnum,
  level: generalSchema.levelEnum,
  muscles: generalSchema.targetMusclesEnum,
  description: Type.String(),
  gender: Type.Union([Type.Literal('m'), Type.Literal('f')]),
})
export type CreateTemplateByAIRequestType = Static<typeof CreateTemplateByAIRequest>

/**
 * ساختار ورودی تولید یک قالب بصورت دستی مصنوعی برای برنامه تمرینی
 */
export const CreateTemplateManualRequest = Type.Object({
  teacherId: Type.Union([Type.Literal('-'), Type.String({ format: 'uuid' })]),
  name: Type.String({ maxLength: 255 }),
  target: generalSchema.targetEnum,
  level: generalSchema.levelEnum,
  muscles: generalSchema.targetMusclesEnum,
  description: Type.String(),
  gender: Type.Union([Type.Literal('m'), Type.Literal('f')]),
  session: sessionInPlanSchema, // بدین معنا که صرفا شماره حرکت و اطلاعات اضافی که مربی در فرم پر میکنه قراره توی یک قالب دستی ذخیره بشه
  categoryId: Type.Union([ Type.Null(), Type.String({ format: 'uuid' })]) // (بصورت یک رشته خالی پاس داده بشه) یک قالب میتونه دسته بندی نداشته باشه
})
export type CreateTemplateManualRequestType = Static<typeof CreateTemplateManualRequest>

/**
 * اسکیم یک قالب در برنامه تمرینی
 */
export const templateSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String({ maxLength: 255 }),
  teacherId: Type.Union([Type.Literal('-'), Type.String({ format: 'uuid' })]),
  description: Type.String(),
  level: generalSchema.levelEnum,
  target: generalSchema.targetEnum,
  gender: Type.Union([Type.Literal('m'), Type.Literal('f')]),
  muscles: Type.String(),
  session: sessionInPlanSchema,
  categoryId: Type.Union([ Type.Null(), Type.String({ format: 'uuid' })]),
  createdAt: Type.String({ pattern: isoWithoutTimezonePattern }),
  updatedAt: Type.String({ pattern: isoWithoutTimezonePattern }),
})
export type TemplateType = Static<typeof templateSchema>

/**
 * ساختار درخواست آپدیت قالب تمرینی
 */
export const UpdateTemplateRequest = Type.Partial(
  Type.Object({
    ...templateSchema.properties, // صفات اسکیم قالب رو نگهداری میکنیم
    muscles: Type.Array(Type.String())
  })
);
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
