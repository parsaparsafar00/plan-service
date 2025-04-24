import type { Static } from '@sinclair/typebox'
import { Type } from '@sinclair/typebox'

/**
 * ساختار خروجی یک حرکت تولید شده در جدول برنامه ها
*/
export const exerciseOutputInPlanSchema = Type.Object({
  number: Type.Number(),
  restBetweenSets: Type.Number(),
  weightPercentage: Type.String(),
  system: Type.Array(Type.Number()),
  systemMethod: Type.String(),
})
export type exerciseOutputInPlanType = Static<typeof exerciseOutputInPlanSchema>

/**
 * ساختار خروجی یک حرکت تولید شده در لیست حرکات مشخص شده برای مربی
*/
export const exerciseOutputInListSchema = Type.Object({
  number: Type.Number(),
  name:  Type.String(),
  nameFa:  Type.String(),
  difficultyLevel: Type.Union([Type.String(), Type.Null()]),
  shortYoutubeDemonstration:  Type.String(),
})
export type exerciseOutputInListType = Static<typeof exerciseOutputInListSchema>

/**
 * ساختار حرکت در هنگام گرفتن اطلاعات بر اساس شماره
*/
export const getExerciseSchema = Type.Object({
  number: Type.Number(),
  print: Type.Boolean()
})
export type getExerciseType = Static<typeof getExerciseSchema>

/**
 * ورودی درخواست گرفتن حرکات بر اساس عضلات هدف
*/
export const GetExerciseByMuscleRequest = Type.Object({
  targetMuscles: Type.String(), // آرایه استرینگ شده هست (به این دلیل که درون لینک درخواست هست)
})
export type GetExerciseByMuscleType = Static<typeof GetExerciseByMuscleRequest>

/**
 * ساختار خروجی یک حرکت تولید شده توسط سرویس
*/
export const exerciseOutputSchema = Type.Object({
  number: Type.Number(),
  id: Type.String(),
  name: Type.String(),
  nameFa: Type.String(),
  mechanics: Type.Union([Type.String(), Type.Null()]),
  difficultyLevel: Type.Union([Type.String(), Type.Null()]),
  bodyRegion: Type.Union([Type.String(), Type.Null()]),
  shortYoutubeDemonstration: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  restBetweenSets: Type.Number(),
  weightPercentage: Type.String(),
  system: Type.Array(Type.Number()),
  systemMethod: Type.String(),
})
export type exerciseOutputType = Static<typeof exerciseOutputSchema>

/**
 * ساختار ورودی یک حرکت تمرینی که صرفا شامل شماره حرکت و اطلاعات اضافی هست
*/
export const exerciseInputSchema = Type.Object({
  number: Type.Number(),
  restBetweenSets: Type.Number(),
  weightPercentage: Type.String(),
  system: Type.Array(Type.Number()),
  systemMethod: Type.String(),
})
export type exerciseInputType = Static<typeof exerciseInputSchema>

/**
 * ساختار خروجی یک حرکت تولید شده توسط سرویس (مخصوص پرینت گرفتن)
*/
export const printingExerciseOutputSchema = Type.Object({
  name: Type.String(),
  nameFa: Type.String(),
  restBetweenSets: Type.Number(),
  weightPercentage: Type.String(),
  system: Type.Array(Type.Number()),
  systemMethod: Type.String(),
})
export type printingExerciseOutputType = Static<typeof printingExerciseOutputSchema>

// -------------------------------------- ساختار پاسخ ها --------------------------------------

// پاسخ موفق چند حرکت تمرینی
export const MultipleExerciseResponse = Type.Object({
  data: Type.Object({
    exercises: Type.Array(exerciseOutputInListSchema),
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})
