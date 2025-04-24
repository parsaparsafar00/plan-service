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
  exerciseNumber: Type.Integer(),
  createdAt: Type.String({ pattern: isoWithoutTimezonePattern }),
  updatedAt: Type.String({ pattern: isoWithoutTimezonePattern }),
})
export type PlanTrainHelperType = Static<typeof PlanTrainHelperSchema>
