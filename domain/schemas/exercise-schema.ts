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
 * ساختار حرکت در هنگام گرفتن اطلاعات بر اساس شماره
*/
export const getExerciseSchema = Type.Object({
  number: Type.Number(),
  print: Type.Boolean()
})
export type getExerciseType = Static<typeof getExerciseSchema>


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
  shortYoutubeDemonstration: Type.Union([Type.String(), Type.Null()]),
  restBetweenSets: Type.Number(),
  weightPercentage: Type.String(),
  system: Type.Array(Type.Number()),
  systemMethod: Type.String(),
})
export type exerciseOutputType = Static<typeof exerciseOutputSchema>

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

