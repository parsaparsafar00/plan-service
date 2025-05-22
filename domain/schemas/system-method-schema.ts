import type { Static } from '@sinclair/typebox'
import { isoWithoutTimezonePattern } from '@amard/validation'
import { Type } from '@sinclair/typebox'

/**
 * اسکیم یک متد سیستم
 */
export const SystemMethodSchema = Type.Object({
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
export type SystemMethodType = Static<typeof SystemMethodSchema>

/**
 * اسکیم متد ها در لیستی که مربی میخواد متد تکرار مورد نظرش رو براساس تعداد دفعات استفاده خودش به راحتی پیدا بکنه
 */
export const SystemMethodsAndUsageTimesSchema = Type.Object({
  systemMethodNumber: Type.Number(),
  usageCount: Type.Number(),
})

export type SystemMethodsAndUsageTimesType = Static<typeof SystemMethodsAndUsageTimesSchema>

/**
 * ساختار ورودی تولید سیستم متد برنامه تمرینی
 */
export const CreatePlanSystemMethodRequest = Type.Object({
  description: Type.String(),
  name: Type.String(), // اینجا قراره اسم متد جدید وارد بکنه، باید رشته بذاریم
  status: Type.Optional(
    Type.Enum({
      published: 'published',
      draft: 'draft',
    }),
  ),
})
export type CreatePlanSystemMethodRequestType = Static<typeof CreatePlanSystemMethodRequest>

/**
 * ساختار درخواست آپدیت متد سیستم تمرینی که توش پارشال نزدیم
 */
export const UpdateSystemMethodRequestSchema = Type.Partial(SystemMethodSchema)
export type UpdateSystemMethodRequestType = Static<typeof UpdateSystemMethodRequestSchema>

/**
 * پاسخ موفق با برگرداندن یک متد سیستم
 */
export const SingleSystemMethodResponse = Type.Object({
  data: Type.Object({
    systemMethod: SystemMethodSchema,
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})

/**
 * پاسخ موفق با برگرداندن متد سیستم ها و استفادشون
 */
export const SystemMethodsAndUsageTimesResponseSchema = Type.Object({
  data: Type.Object({
    systemMethods: Type.Array(SystemMethodsAndUsageTimesSchema),
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})

/**
 * پاسخ موفق چند متد سیستم
 */
export const MultipleSystemMethodResponse = Type.Object({
  data: Type.Object({
    systemMethods: Type.Array(SystemMethodSchema),
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})
