import type { Static } from '@sinclair/typebox'
import { Type } from '@sinclair/typebox'
import { isoWithoutTimezonePattern } from '@amard/validation'
import { sessionOutputSchema } from '../schemas/plan-schema.js'

/**
 * ساختار ورودی تولید یک قالب برای برنامه تمرینی
*/
export const CreateTemplateRequest = Type.Object({
  teacherId: Type.String({ format: 'uuid' }),
  name: Type.String({maxLength: 255}),
  target: Type.String({maxLength: 255}),
  level: Type.String({maxLength: 255}),
  muscles: Type.Array(Type.String()),
  description: Type.String(),
});
export type CreateTemplateRequestType = Static<typeof CreateTemplateRequest>

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
  muscles: Type.Array(Type.String()),
  createdAt: Type.String({ pattern: isoWithoutTimezonePattern }),
  updatedAt: Type.String({ pattern: isoWithoutTimezonePattern }),
})
export type TemplateType = Static<typeof templateSchema>

/**
 * پاسخ موفق با برگرداندن یک قالب
*/
export const SingleTemplateResponse = Type.Object({
  data: Type.Object({
    system: sessionOutputSchema,
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})

// پاسخ موفق با برگرداندن چند قالب
export const MultipleTemplateResponse = Type.Object({
  data: Type.Object({
    sessions: Type.Array(sessionOutputSchema),
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})
