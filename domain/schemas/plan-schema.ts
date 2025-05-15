import type { Static } from '@sinclair/typebox'
import { isoWithoutTimezonePattern } from '@amard/validation'
import { Type } from '@sinclair/typebox'
import * as exerciseSchema from '../schemas/exercise-schema.js'
import * as generalSchema from '../schemas/plan-general-schema.js'

// -------------------------------------- اسکیم های مرتبط با برنامه تمرینی --------------------------------------

/**
 * ساختار پارامتر های غیر ضروری یک جلسه برای تولید جلسه تمرینی
 */
export const optionalSessionParameters = Type.Object({
  cooldownActivities: Type.Optional(Type.Array(Type.String())),
  warmupActivities: Type.Optional(Type.Array(Type.String())),
  cooldownDuration: Type.Optional(Type.String()),
  warmupDuration: Type.Optional(Type.String()),
  recoveryTime: Type.Optional(Type.String()),
  sessionDuration: Type.Optional(Type.String()),
})

// -------------------- پارامترهای مشترک بین تمام ساختارها --------------------
const commonSessionProperties = {
  weeks: Type.Array(Type.Number()),
  description: Type.String(),
  targetMuscles: Type.Array(generalSchema.targetMusclesEnum),
};

/**
 * پارامترهای الزامی ورودی برای تولید برنامه تمرینی
 */
export const coreSessionInputParameters = Type.Object({
  ...commonSessionProperties,
  exercises: Type.Array(exerciseSchema.exerciseInputSchema),
});

/**
 * ساختار کامل ورودی جلسه تمرینی
 */
export const sessionInputSchema = Type.Intersect([
  coreSessionInputParameters,
  optionalSessionParameters
]);
export type sessionInputType = Static<typeof sessionInputSchema>;

/**
 * پارامترهای الزامی جلسه در برنامه نهایی
 */
export const coreSessionInPlanParameters = Type.Object({
  ...commonSessionProperties,
  exercises: Type.Array(exerciseSchema.exerciseOutputInPlanSchema),
});

/**
 * ساختار کامل جلسه در برنامه نهایی
 */
export const sessionInPlanSchema = Type.Intersect([
  coreSessionInPlanParameters,
  optionalSessionParameters
]);
export type sessionInplanType = Static<typeof sessionInPlanSchema>;

/**
 * پارامترهای الزامی خروجی برای نمایش به کاربر
 */
export const coreSessionOutputParameters = Type.Object({
  ...commonSessionProperties,
  exercises: Type.Array(exerciseSchema.exerciseOutputSchema),
});

/**
 * ساختار خروجی یک جلسه تمرینی عادی
 */
export const sessionOutputSchema = Type.Intersect([
  coreSessionOutputParameters,
  optionalSessionParameters
]);
export type sessionOutputType = Static<typeof sessionOutputSchema>;

/**
 * ساختار خروجی پرینتی یک جلسه تمرینی
 */
export const printSessionOutputSchema = Type.Object({
  ...commonSessionProperties,
  exercises: Type.Array(exerciseSchema.printingExerciseOutputSchema),
});
export type printSessionOutputType = Static<typeof printSessionOutputSchema>;

/**
 * اسکیم پایه اطلاعات شاگرد، استفاده شده در ورودی و خروجی برنامه ها
 */
const StudentInfoSchema = Type.Object({
  studentId: Type.String({ format: 'uuid' }),
  studentLevel: generalSchema.levelEnum,
  studentWeight: Type.Number(),
  studentAge: Type.Number(),
  studentGender: Type.Union([Type.Literal('m'), Type.Literal('f')]),
});

// اسکیم پایه برای اطلاعات اصلی برنامه تمرینی
const BasePlanSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  teacherId: Type.Union([Type.Literal('-'), Type.String({ format: 'uuid' })]),
  title: Type.Optional(Type.String({ minLength: 2, maxLength: 255 })),
  target: generalSchema.targetEnum,
  description: Type.Optional(Type.String()),
  status: Type.Enum({
    published: 'published',
    draft: 'draft',
    paid: 'paid',
    deleted: 'deleted'
  }),
  createdAt: Type.String({ pattern: isoWithoutTimezonePattern }),
  updatedAt: Type.String({ pattern: isoWithoutTimezonePattern }),
});

/**
 * اسکیم یک برنامه تمرینی
 */
export const PlanSchema = Type.Composite([
  BasePlanSchema,
  StudentInfoSchema,
  Type.Object({
    workoutPlan: Type.Object({
      sessions: Type.Array(sessionInPlanSchema),
    }),
  })
]);
export type PlanType = Static<typeof PlanSchema>;

/**
 * اسکیم یک برنامه تمرینی در خروجی نشان داده شده به کاربر
 */
export const PlanOutputSchema = Type.Composite([
  BasePlanSchema,
  StudentInfoSchema,
  Type.Object({
    workoutPlan: Type.Object({
      sessions: Type.Array(sessionOutputSchema),
    }),
  })
]);
export type PlanOutputType = Static<typeof PlanOutputSchema>;

/**
 * اسکیم یک برنامه تمرینی پرینتی
 */
export const PrintPlanSchema = Type.Composite([
  BasePlanSchema,
  StudentInfoSchema,
  Type.Object({
    workoutPlan: Type.Object({
      sessions: Type.Array(printSessionOutputSchema),
    }),
  })
]);
export type PrintPlanType = Static<typeof PrintPlanSchema>;

// -------------------------------------- ساختار ورودی های تولید برنامه تمرینی --------------------------------------

/**
 * ساختار درخواست آپدیت برنامه تمرینی
 */
export const UpdatePlanRequest = Type.Partial(PlanSchema)
export type UpdatePlanRequestType = Static<typeof UpdatePlanRequest>

/**
 * پارامتر های ورودی جهت تولید جلسه تمرینی توسط هوش مصنوعی
 */
export const GenerateSessionByAIRequest = Type.Object({
  teacherId: Type.Union([Type.Literal('-'), Type.String({ format: 'uuid' })]),
  description: Type.String(),
  weeks: Type.Array(Type.Number()),
  exerciseType: Type.String({ minLength: 2, maxLength: 255 }),
  target: generalSchema.targetEnum,
  injuries: Type.Array(Type.String()),
  targetMuscles: generalSchema.targetMusclesEnum,
  traineeInfo: Type.Object({
    level: generalSchema.levelEnum,
    age: Type.Optional(Type.Number()),
    weight: Type.Optional(Type.Number()),
    gender: Type.Union([Type.Literal('m'), Type.Literal('f')]),
  }),
})
export type GenerateSessionByAIRequestType = Static<typeof GenerateSessionByAIRequest>

/**
 * ورودی تولید برنامه تمرینی بر اساس جلسات تولید شده
 */
export const CreatePlanRequest = Type.Object({
  workoutPlan: Type.Object({
    sessions: Type.Array(sessionInputSchema),
  }),
  title: Type.String(),
  description: Type.String(),
  studentId: Type.String({ format: 'uuid' }),
  teacherId: Type.Union([Type.Literal('-'), Type.String({ format: 'uuid' })]),
  status: Type.Enum({
    published: 'published',
    draft: 'draft'
  }),
  studentGender: Type.Union([Type.Literal('m'), Type.Literal('f')]),
  studentLevel: generalSchema.levelEnum,
  target: generalSchema.targetEnum,
  studentWeight: Type.Number(),
  studentAge: Type.Number(),
})
export type CreatePlanRequestType = Static<typeof CreatePlanRequest>

// -------------------------------------- ساختار خروجی های یک برنامه تمرینی --------------------------------------

/**
 * ساختار خروجی یک برنامه تمرینی (تفاوتش با 
 * planSchema
 * در این است که اونجا جلسات اسکیمشون فرق داشته)
 */
export const planOutputSchema = Type.Object({
  workoutPlan: Type.Object({
    sessions: Type.Array(sessionOutputSchema),
  }),
})
export type planOutputType = Static<typeof planOutputSchema>

// -------------------------------------- ساختار پاسخ ها --------------------------------------

/**
 * پاسخ موفق یک برنامه
 */
export const SinglePlanResponse = Type.Object({
  data: Type.Object({
    plan: PlanOutputSchema,
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})

/**
 * پاسخ موفق چند برنامه
 */
export const MultiplePlanResponse = Type.Object({
  data: Type.Object({
    plans: Type.Array(PlanOutputSchema),
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})

/**
 * پاسخ موفق یک برنامه تمرینی پرینتی
 */
export const SinglePrintPlanResponse = Type.Object({
  data: Type.Object({
    plan: PrintPlanSchema,
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})

/**
 * پاسخ موفق یک جلسه تمرینی تولید شده
 */
export const SingleSessionResponse = Type.Object({
  data: Type.Object({
    session: sessionOutputSchema,
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})
