import type { Static } from '@sinclair/typebox'
import { Type } from '@sinclair/typebox'

/**
 * ساختار خروجی یک حرکت تولید شده در لیست حرکات مشخص شده برای مربی
 */
export const exerciseOutputInListSchema = Type.Object({
  number: Type.Number(),
  name: Type.String(),
  nameFa: Type.String(),
  difficultyLevel: Type.Union([
    Type.Enum({
      novice: 'novice',
      beginner: 'beginner',
      intermediate: 'intermediate',
      advanced: 'advanced',
      expert: 'expert',
    }),
    Type.Null(),
  ]),
  shortYoutubeDemonstration: Type.String(),
})
export type exerciseOutputInListType = Static<typeof exerciseOutputInListSchema>

/**
 * ورودی درخواست گرفتن حرکات بر اساس عضلات هدف
 */
export const GetExerciseByMuscleRequest = Type.Object({
  targetMuscles: Type.String(), // آرایه استرینگ شده هست (به این دلیل که به عنوان پارامتر هست نه داخل بادی درخواست)
})
export type GetExerciseByMuscleType = Static<typeof GetExerciseByMuscleRequest>

/**
 * ساختار خروجی اطلاعات اضافی یک حرکت وارد شده توسط مربی یا تولید شده توسط هوش مصنوعی
 */
export const exerciseAugmentedOuputSchema = Type.Object({
  restBetweenSets: Type.Number(),
  weightPercentage: Type.String(),
  systemId: Type.Union([
    Type.String({ format: 'uuid' }),
    Type.String({ minLength: 0, maxLength: 0 })
  ]),
  systemDescription: Type.String(),
  repeatPattern: Type.Array(Type.Number()),
  systemMethod: Type.String(),
  systemDescIsVisible: Type.Boolean(),
  systemName: Type.String(),
  techniqueId: Type.Union([
    Type.String({ format: 'uuid' }),
    Type.String({ minLength: 0, maxLength: 0 })
  ]),
  techniqueName: Type.Optional(Type.String()),
  techniqueMethod: Type.Optional(Type.Enum({
    superset: 'superset',
    giantset: 'giantset',
    dropset: 'dropset',
    custom: 'custom'
  })),
  techniqueDescription: Type.Optional(Type.String()),
  techniqueDescIsVisible: Type.Optional(Type.Boolean())
})
export type exerciseAugmentedOutputSchemaType = Static<typeof exerciseAugmentedOuputSchema>

/**
 * ساختار خروجی اطلاعات اولیه یک حرکت تولید شده توسط سرویس
 */
export const exerciseRawOutputSchema = Type.Object({
  number: Type.Number(),
  id: Type.String({ format: 'uuid' }),
  name: Type.String(),
  nameFa: Type.String(),
  mechanics: Type.Union([Type.String(), Type.Null()]),
  difficultyLevel: Type.Union([
    Type.Enum({
      novice: 'novice',
      beginner: 'beginner',
      intermediate: 'intermediate',
      advanced: 'advanced',
      expert: 'expert',
    }),
    Type.Null(),
  ]),
  shortYoutubeDemonstration: Type.Union([Type.String(), Type.Null()]),
})
export type exerciseRawOutputType = Static<typeof exerciseRawOutputSchema>

/**
 * ساختار خروجی یک حرکت تولید شده توسط سرویس
 */
export const exerciseOutputSchema = Type.Intersect([
  exerciseRawOutputSchema,
  exerciseAugmentedOuputSchema
]);
export type exerciseOutputType = Static<typeof exerciseOutputSchema>;

/**
 * ساختار اطلاعات اولیه حرکت تولید شده توسط سرویس از جدول حرکات (مخصوص پرینت گرفتن)
 */
export const printingRawExerciseSchema = Type.Object({
  name: Type.String(),
  nameFa: Type.String(),
  number: Type.Number()
})
export type printingRawExerciseType = Static<typeof printingRawExerciseSchema>

/**
 * ساختار خروجی یک حرکت تولید شده توسط سرویس (مخصوص پرینت گرفتن)
 */
export const printingExerciseOutputSchema = Type.Object({
  name: Type.String(),
  nameFa: Type.String(),
  restBetweenSets: Type.Number(),
  weightPercentage: Type.String(),
  repeatPattern: Type.Array(Type.Number()),
  techniqueName: Type.Optional(Type.String())
})
export type printingExerciseOutputType = Static<typeof printingExerciseOutputSchema>

/**
 * ساختار یک حرکت تولید شده در جدول برنامه ها
 */
export const exerciseOutputInPlanSchema = Type.Object({
  number: Type.Number(),
  restBetweenSets: Type.Number(),
  weightPercentage: Type.String(),
  systemId: Type.Union([
    Type.String({ format: 'uuid' }),
    Type.String({ minLength: 0, maxLength: 0 })
  ]),
  techniqueId: Type.Union([
    Type.String({ format: 'uuid' }),
    Type.String({ minLength: 0, maxLength: 0 })
  ]),
})
export type exerciseOutputInPlanType = Static<typeof exerciseOutputInPlanSchema>

/**
 * ساختار یک حرکت تولید شده در جدول برنامه ها
 */
export const exerciseOutputInPlanWithoutMandatoryIdsSchema = Type.Object({
  number: Type.Number(),
  restBetweenSets: Type.Number(),
  weightPercentage: Type.String(),
  systemId: Type.Union([
    Type.String({ format: 'uuid' }),
    Type.String({ minLength: 0, maxLength: 0 }) 
  ]),
  techniqueId: Type.Union([
    Type.String({ format: 'uuid' }),
    Type.String({ minLength: 0, maxLength: 0 }) 
  ]),
})
export type exerciseOutputInPlanWithoutMandatoryIdsSchemaType = Static<typeof exerciseOutputInPlanWithoutMandatoryIdsSchema>

/**
 * ساختار ورودی یک حرکت تمرینی در تولید برنامه که صرفا شامل شماره حرکت و اطلاعات اضافی هست
 */
export const exerciseInputSchema = Type.Object({
  number: Type.Number(),
  restBetweenSets: Type.Number(),
  weightPercentage: Type.String(),
  repeatPattern: Type.Array(Type.Number()),
  systemMethod: Type.Optional(Type.String()),
  systemId: Type.Union([
    Type.String({ format: 'uuid' }),
    Type.String({ minLength: 0, maxLength: 0 })
  ]),
  systemIsGlobal: Type.Optional(Type.Boolean()),
  techniqueName: Type.Optional(Type.String()),
  techniqueDescription: Type.Optional(Type.String()),
  techniqueMethod: Type.Optional(Type.Enum({
    superset: 'superset',
    giantset: 'giantset',
    dropset: 'dropset',
    custom: 'custom'
  })),
  techniqueId: Type.Union([
    Type.String({ format: 'uuid' }),
    Type.String({ minLength: 0, maxLength: 0 })
  ]),
  techniqueIsGlobal: Type.Optional(Type.Boolean()),
})
export type exerciseInputType = Static<typeof exerciseInputSchema>

export const GetExerciseByNumberRequest = Type.Object({
  number: Type.Number()
})
export type GetExerciseByNumberRequestType = Static<typeof GetExerciseByNumberRequest>

// -------------------------------------- ساختار پاسخ ها --------------------------------------

// پاسخ موفق به یک حرکت تمرینی
export const SingleExerciseResponse = Type.Object({
  data: Type.Object({
    exercise: exerciseOutputSchema,
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})

// پاسخ موفق به یک حرکت تمرینی
export const SingleRawExerciseResponse = Type.Object({
  data: Type.Object({
    exercise: exerciseRawOutputSchema,
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})


// پاسخ موفق چند حرکت تمرینی
export const MultipleExerciseResponse = Type.Object({
  data: Type.Object({
    exercises: Type.Array(exerciseOutputInListSchema),
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})
