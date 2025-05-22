import type { Static } from '@sinclair/typebox'
import { isoWithoutTimezonePattern } from '@amard/validation'
import { Type } from '@sinclair/typebox'

/**
 * اسکیم یک سیستم تکرار
 */
export const SystemSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  number: Type.Number(),
  methodNumber: Type.Number(),
  abbrName: Type.String({ maxLength: 511 }), // نام مختصر سیستم
  teacherId: Type.Union([Type.Literal('-'), Type.String({ format: 'uuid' })]),
  description: Type.String(),
  descIsVisible: Type.Boolean(),
  repeat1: Type.Number(),
  repeat2: Type.Number(),
  repeat3: Type.Number(),
  repeat4: Type.Number(),
  repeat5: Type.Number(),
  repeat6: Type.Number(),
  repeat7: Type.Number(),
  repeat8: Type.Number(),
  isGlobal: Type.Boolean(),
  status: Type.Optional(
    Type.Enum({
      published: 'published',
      draft: 'draft',
    }),
  ),
  createdAt: Type.String({ pattern: isoWithoutTimezonePattern }),
  updatedAt: Type.String({ pattern: isoWithoutTimezonePattern }),
})

export type SystemType = Static<typeof SystemSchema>

/**
 * اسکیم سیستم های تکرار در لیستی که مربی میخواد سیستم تکرار مورد نظرش رو براساس تعداد دفعات استفاده خودش به راحتی پیدا بکنه
 */
export const SystemsAndUsageTimesSchema = Type.Object({
  systemNumber: Type.Number(),
  usageCount: Type.Number(),
})

export type SystemsAndUsageTimesType = Static<typeof SystemsAndUsageTimesSchema>

/**
 * ساختار ورودی تولید سیستم برنامه تمرینی
 */
export const CreatePlanSystemRequest = Type.Object({
  description: Type.String(),
  descIsVisible: Type.Boolean(),
  methodNumber: Type.Number(),
  isGlobal: Type.Boolean(),
  repeatPattern: Type.Object({
    repeat1: Type.Number(),
    repeat2: Type.Number(),
    repeat3: Type.Number(),
    repeat4: Type.Number(),
    repeat5: Type.Number(),
    repeat6: Type.Number(),
    repeat7: Type.Number(),
    repeat8: Type.Number(),
  }),
})
export type CreatePlanSystemRequestType = Static<typeof CreatePlanSystemRequest>

/**
 * ساختار درخواست آپدیت سیستم برنامه تمرینی که توش پارشال نزدیم
 * چون میخوایم که سیستم تکرار رو به صورت یک آبجکت کلی
 * (شامل تکرار های 1 الی 8) دریافت بکنیم تا کارمون راحت تر باشه
 */
export const UpdateSystemRequestSchema = Type.Partial(
  Type.Object({
    methodNumber: Type.Number(),
    description: Type.String(),
    descIsVisible: Type.Boolean(),
    repeatPattern: Type.Object({
      repeat1: Type.Number(),
      repeat2: Type.Number(),
      repeat3: Type.Number(),
      repeat4: Type.Number(),
      repeat5: Type.Number(),
      repeat6: Type.Number(),
      repeat7: Type.Number(),
      repeat8: Type.Number(),
    }),
    isGlobal: Type.Boolean(),
    status: Type.Optional(
      Type.Enum({
        published: 'published',
        draft: 'draft',
      }),
    ),
    updatedAt: Type.String({ pattern: isoWithoutTimezonePattern }),
  }),
)

export type UpdateSystemRequestType = Static<typeof UpdateSystemRequestSchema>

/**
 * اسکیم ورودی آپدیت کردن تعداد دفعات استفاده از سیستم ها
 */
export const UpdateSystemsByIdListSchema = Type.Object({
  idList: Type.Array(Type.String({ format: 'uuid' })),
  countList: Type.Array(Type.Number()),
})
export type UpdateSystemsByIdListType = Static<typeof UpdateSystemsByIdListSchema>

/**
 * اسکیم خروجی یک سیستم تکرار که علاوه بر پارامتر های سسیتم تکرار، نام و توضیحات متد سسیستم رو هم داره
 */
export const SystemOutputSchema = Type.Intersect([
  SystemSchema,
  Type.Object({
    methodName: Type.String(),
    methodDescription: Type.String(),
  }),
])

export type SystemOutputType = Static<typeof SystemOutputSchema>

/**
 * پاسخ موفق با برگرداندن یک سیستم
 */
export const SingleSystemResponse = Type.Object({
  data: Type.Object({
    system: SystemOutputSchema,
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})

// پاسخ موفق به یک درخواست دریافت سیستم تکرار و تعداد استفادشون
export const ExercisesAndUsageTimesResponseSchema = Type.Object({
  data: Type.Object({
    systems: Type.Array(SystemsAndUsageTimesSchema),
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})

/**
 * پاسخ موفق چند سیستم
 */
export const MultipleSystemResponse = Type.Object({
  data: Type.Object({
    systems: Type.Array(SystemOutputSchema),
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})
