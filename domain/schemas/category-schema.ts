import type { Static } from '@sinclair/typebox'
import { getCodesByServiceAndStatus } from '@amard/message-manager'
import { isoWithoutTimezonePattern } from '@amard/validation'
import { Type } from '@sinclair/typebox'

// پاسخ موفق ایجاد یا دریافت کتگوری
export const CategorySchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  teacherId: Type.Union([Type.Literal('-'), Type.String({ format: 'uuid' })]),
  title: Type.String({ minLength: 3, maxLength: 255 }),
  isGlobal: Type.Boolean(),
  createdAt: Type.String({ pattern: isoWithoutTimezonePattern }),
  updatedAt: Type.String({ pattern: isoWithoutTimezonePattern }),
})
export type CategoryType = Static<typeof CategorySchema>

export const CreateCategoryRequest = Type.Object({
  title: Type.String({ minLength: 3, maxLength: 255 }),
  isGlobal: Type.Boolean(),
})
export type CreateCategoryRequestType = Static<typeof CreateCategoryRequest>

export const UpdateCategoryRequest = Type.Object({
  title: Type.String({ minLength: 3, maxLength: 255 }),
})
export type UpdateCategoryRequestType = Static<typeof UpdateCategoryRequest>

export const IdParam = Type.Object({
  id: Type.String({ format: 'uuid' }),
})
export type IdParamType = Static<typeof IdParam>

export const EmptySuccessResponse = Type.Object({
  data: Type.Object({}),
  msgCode: Type.String(),
  msgType: Type.Literal('success'),
})

export const CategoryResponse = Type.Object({
  data: Type.Object({
    category: CategorySchema,
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})

export const AllCategoriesResponse = Type.Object({
  data: Type.Object({
    categories: Type.Array(CategorySchema),
  }),
  msgCode: Type.String(),
  msgType: Type.Union([Type.Literal('error'), Type.Literal('success')]),
})

// تابع کمکی برای تولید داینامیک توضیحات خطاها
function generateDescriptionForStatus(title: string, status: number) {
  const codes = getCodesByServiceAndStatus('plan-category', status)
  const lines = codes.map(item => `- **${item.code}**: ${item.message}`)
  return `${title}${lines.join('\n')}`
}

// پاسخ خطا
export const ErrorResponse = Type.Object({
  data: Type.Object({ message: Type.String() }),
  msgCode: Type.String(),
  msgType: Type.Literal('error'),
})

export const SuccessResponseDes = `### عملیات موفق با کد 200 گزارش میشود. مدل خروجی در اسکیما.`

export const BadRequestError = {
  description: generateDescriptionForStatus(`
### هرگونه مشکلی در ورودی اطلاعات با خطای 400 گزارش میشود
  `, 400),
  content: {
    'application/json': {
      schema: ErrorResponse,
    },
  },
}
export const ForbiddenError = {
  description: generateDescriptionForStatus(`
### خطاهای سطح دسترسی با کد 403 گزارش میشوند
`, 403),
  content: {
    'application/json': {
      schema: ErrorResponse,
    },
  },
}

export const InternalServerError = {
  description: generateDescriptionForStatus(`
### خطاهای داخلی با کد 500 گزارش میشوند
---
### این خطاها خطرناک هستن و بهتر است در صورت مشاهده خطای 500 آنرا به برنامه نویس بکاند گزارش دهید
`, 500),
  content: {
    'application/json': {
      schema: ErrorResponse,
    },
  },
}
