import type { Static } from '@sinclair/typebox'
import { isoWithoutTimezonePattern } from '@amard/validation'
import { Type } from '@sinclair/typebox'

/**
 * اسکیم tain helper
 */
export const PlanTrainHelperSchema = Type.Object({
  // ستون‌های اصلی
  id: Type.String({ format: 'uuid' }),
  planId: Type.String({ format: 'uuid' }),
  teacherId: Type.Union([Type.Literal('-'), Type.String({ format: 'uuid' })]),
  studentLevel: Type.Enum({
    novice: 'novice',
    beginner: 'beginner',
    intermediate: 'intermediate',
    advanced: 'advanced',
    expert: 'expert',
  }),
  target: Type.Enum({
    postural: 'postural',
    hypertrophy: 'hypertrophy',
    strength: 'strength',
    endurance: 'endurance',
    balance: 'balance',
    mobility: 'mobility',
  }),
  gender: Type.Union([Type.Literal('m'), Type.Literal('f')]),
  exerciseNumber: Type.Integer(),
  createdAt: Type.String({ pattern: isoWithoutTimezonePattern }),
  updatedAt: Type.String({ pattern: isoWithoutTimezonePattern }),
})
export type PlanTrainHelperType = Static<typeof PlanTrainHelperSchema>
