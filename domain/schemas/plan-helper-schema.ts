import type { Static } from '@sinclair/typebox'
import { isoWithoutTimezonePattern } from '@amard/validation'
import { Type } from '@sinclair/typebox'
import * as generalSchema from './plan-general-schema.js'

/**
 * اسکیم tain helper
 */
export const PlanTrainHelperSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  planId: Type.String({ format: 'uuid' }),
  systemMethodNumber: Type.Number(),
  systemNumber: Type.Number(),
  techniqueMethodNumber: Type.Union([Type.Number(), Type.Null()]),
  techniqueNumber: Type.Union([Type.Number(), Type.Null()]),
  teacherId: Type.Union([Type.Literal('-'), Type.String({ format: 'uuid' })]),
  studentLevel: generalSchema.levelEnum,
  target: generalSchema.targetEnum,
  gender: Type.Union([Type.Literal('m'), Type.Literal('f')]),
  exerciseNumber: Type.Integer(),
  score: Type.Integer(),
  createdAt: Type.String({ pattern: isoWithoutTimezonePattern }),
  updatedAt: Type.String({ pattern: isoWithoutTimezonePattern }),
})

export type PlanTrainHelperType = Static<typeof PlanTrainHelperSchema>
