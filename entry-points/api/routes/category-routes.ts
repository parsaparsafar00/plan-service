import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import * as categorySchemas from '../../../domain/schemas/category-schema.js'
import * as generalSchema from '../../../domain/schemas/plan-general-schema.js'
import * as categoryUseCase from '../../../domain/use-cases/category-use-case.js'

export async function categoryRoutes(app: FastifyInstance) {
  /**
   * ایجاد کتگوری
   * route: POST /v1/plan
   */
  app.post('/create-category', {
    schema: {
      tags: ['Plan'],
      summary: 'ایجاد کتگوری',
      description: `
      ## اگر قرار است **ادمین**، کتگوری ایجاد کند باید یک شناسه معلم معتبر در کوئری قرار دهید
      ## اگر قرار است **معلم**، کتگوری را ایجاد کند، شناسه معلم از توکن گرفته میشود ولی باز هم کوئری نباید خالی باشد. متوانید یک علامت تیره - در کوئری قرار دهید
      `,
      querystring: generalSchema.IdQueryTeacher,
      body: categorySchemas.CreateCategoryRequest,
      response: {
        200: { content: { 'application/json': { schema: categorySchemas.CategoryResponse } }, description: categorySchemas.SuccessResponseDes },
        400: categorySchemas.BadRequestError,
        403: categorySchemas.ForbiddenError,
        500: categorySchemas.InternalServerError,
      },
    },
    handler: async (
      request: FastifyRequest<{ Body: categorySchemas.CreateCategoryRequestType, Querystring: generalSchema.IdQueryTeacherType }>,
      reply: FastifyReply,
    ) => {
      const category = await categoryUseCase.createCategory(request)
      reply.send({ data: { category }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * گرفتن کتگوری بر اساس آیدی
   * route: GET /v1/plan/category-by-id/:id
   */
  app.get('/category-by-id/:id', {
    schema: {
      tags: ['Plan'],
      summary: 'گرفتن کتگوری بر اساس آیدی',
      description: `## معلم و ادمین میتوانند به این مسیر درخواست بدهند اما گرفتن خروجی بسته به قوانین سطح دسترسی دارد`,
      params: categorySchemas.IdParam,
      response: {
        200: { content: { 'application/json': { schema: categorySchemas.CategoryResponse } }, description: categorySchemas.SuccessResponseDes },
        400: categorySchemas.BadRequestError,
        403: categorySchemas.ForbiddenError,
        500: categorySchemas.InternalServerError,
      },
    },
    handler: async (
      request: FastifyRequest<{ Params: categorySchemas.IdParamType }>,
      reply: FastifyReply,
    ) => {
      const category = await categoryUseCase.getCategoryById(request)
      reply.send({ data: { category }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * گرفتن کتگوری‌های یک معلم
   * route: GET /v1/plan/all-categories-by-teacherid/:id
   */
  app.get('/all-categories-by-teacherid/:id', {
    schema: {
      tags: ['Plan'],
      summary: 'گرفتن کتگوری‌های یک معلم',
      description: `## اگر قرار است **ادمین** کتگوریهای یک معلم را دریافت کند، باید یک شناسه معلم (معتبر) در کوئری قرار دهید ## اگر قرار است **معلم**، کتگوریهای خودش را دریافت کند، شناسه معلم از توکن گرفته میشود ولی باز هم کوئری نباید خالی باشد. میتوان یک علامت تیره - در کوئری قرار داده شود`,
      params: categorySchemas.IdParam,
      response: {
        200: { content: { 'application/json': { schema: categorySchemas.AllCategoriesResponse } }, description: categorySchemas.SuccessResponseDes },
        400: categorySchemas.BadRequestError,
        403: categorySchemas.ForbiddenError,
        500: categorySchemas.InternalServerError,
      },
    },
    handler: async (
      request: FastifyRequest<{ Querystring: generalSchema.IdQueryTeacherType }>,
      reply: FastifyReply,
    ) => {
      const categories = await categoryUseCase.getTeacherCategories(request)
      reply.send({ data: { categories }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * گرفتن همه کتگوری‌ها
   * route: GET /v1/plan/all-categories
   */
  app.get('/all-categories', {
    schema: {
      tags: ['Plan'],
      summary: 'لیست کلیه کتگوری‌ها',
      description: `## چیز خاصی ندارد جز سطح دسترسی`,
      response: {
        200: { content: { 'application/json': { schema: categorySchemas.AllCategoriesResponse } }, description: categorySchemas.SuccessResponseDes },
        400: categorySchemas.BadRequestError,
        403: categorySchemas.ForbiddenError,
        500: categorySchemas.InternalServerError,
      },
    },
    handler: async (request, reply: FastifyReply) => {
      const categories = await categoryUseCase.getAllCategories(request)
      reply.send({ data: { categories }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * ویرایش کتگوری
   * route: PATCH /v1/plan/edit/category-by-id/:id
   */
  app.patch('/edit/category-by-id/:id', {
    schema: {
      tags: ['Plan'],
      summary: 'ویرایش اطلاعات کتگوری',
      description: `## معلم و ادمین میتوانند به این مسیر درخواست بدهند اما گرفتن خروجی محدودیت هایی دارد که در قوانین سطح دسترسی ذکر شده است`,
      params: categorySchemas.IdParam,
      body: categorySchemas.UpdateCategoryRequest,
      response: {
        200: { content: { 'application/json': { schema: categorySchemas.CategoryResponse } }, description: categorySchemas.SuccessResponseDes },
        400: categorySchemas.BadRequestError,
        403: categorySchemas.ForbiddenError,
        500: categorySchemas.InternalServerError,
      },
    },
    handler: async (
      request: FastifyRequest<{ Params: categorySchemas.IdParamType, Body: categorySchemas.UpdateCategoryRequestType }>,
      reply: FastifyReply,
    ) => {
      const category = await categoryUseCase.updateCategory(request)
      reply.send({ data: { category }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * حذف کتگوری
   * route: DELETE /v1/plan/category-by-id/:id
   */
  app.delete('/delete/category-by-id/:id', {
    schema: {
      tags: ['Plan'],
      summary: 'حذف کتگوری',
      description: `
## اگر معلم یک کتگوری را حذف کند دانش آموزان وی که زیر مجموعه این کتگوری هستند باید ویرایش شوند
## تغییر کتگوری های دانشآموزان ترجیجا به کتگوری با نام "عمومی" انجام میپذرد و ممکن است فرایند انجام کمی کند باشد
## لذا بهتر است برای فرایند حذف یک پاپاپ به منظور دعوت کاربر به صبر کردن در نظر گرفته شود
`,
      params: categorySchemas.IdParam,
      response: {
        200: { content: { 'application/json': { schema: categorySchemas.EmptySuccessResponse } }, description: categorySchemas.SuccessResponseDes },
        400: categorySchemas.BadRequestError,
        403: categorySchemas.ForbiddenError,
        500: categorySchemas.InternalServerError,
      },
    },
    handler: async (
      request: FastifyRequest<{ Params: categorySchemas.IdParamType }>,
      reply: FastifyReply,
    ) => {
      await categoryUseCase.deleteCategory(request)
      reply.send({ data: {}, msgCode: '', msgType: 'success' })
    },
  })
}
