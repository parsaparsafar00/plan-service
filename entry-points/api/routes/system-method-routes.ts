import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import * as generalSchema from '../../../domain/schemas/plan-general-schema.js'
import * as systemMethodSchema from '../../../domain/schemas/system-method-schema.js'
import * as systemMethodUseCase from '../../../domain/use-cases/system-method-use-case.js'
import * as planHelperUseCase from '../../../domain/use-cases/plan-helper-use-case.js'

export async function systemMethodRoutes(app: FastifyInstance) {
  /**
   * ایجاد متد سیستم جدید
   * POST /v1/plan/create-system-method
   */
  app.post('/create-system-method', {
    schema: {
      tags: ['Plan'],
      summary: 'ایجاد متد سیستم جدید',
      description: `## ادمین قادر به تولید سیستم جدید هست `,
      body: systemMethodSchema.CreatePlanSystemMethodRequest,
      querystring: generalSchema.IdQueryTeacher,
      response: {
        200: { content: { 'application/json': { schema: systemMethodSchema.SingleSystemMethodResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Body: systemMethodSchema.CreatePlanSystemMethodRequestType; Querystring: generalSchema.IdQueryTeacherType }>, reply: FastifyReply) => {
      const systemMethod = await systemMethodUseCase.createPlanSystemMethod(request)
      reply.send({ data: { systemMethod }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * گرفتن اطلاعات یک متد سیستم با آیدی
   * GET /v1/plan/system-method-by-id/:id
   */
  app.get('/system-method-by-id/:id', {
    schema: {
      tags: ['Plan'],
      summary: 'دریافت متد سیستم با استفاده از آیدی ',
      description: `ادمین قادر به گرفتن تمام متد های سیستم هاست`,
      params: generalSchema.IdParam,
      response: {
        200: { content: { 'application/json': { schema: systemMethodSchema.SingleSystemMethodResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: generalSchema.IdParamType }>, reply: FastifyReply) => {
      const systemMethod = await systemMethodUseCase.getSystemMethodById(request)
      reply.send({ data: { systemMethod }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * گرفتن اطلاعات یک متد سیستم با شماره
   * GET /v1/plan/system-method-by-number/:number
   */
  app.get('/system-method-by-number/:number', {
    schema: {
      tags: ['Plan'],
      summary: 'دریافت متد سیستم با استفاده از شماره ',
      description: `ادمین قادر به گرفتن تمام متد های سیستم هاست`,
      params: generalSchema.numberParam,
      response: {
        200: { content: { 'application/json': { schema: systemMethodSchema.SingleSystemMethodResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: generalSchema.numberParamType }>, reply: FastifyReply) => {
      const systemMethod = await systemMethodUseCase.getSystemMethodByNumber(request)
      reply.send({ data: { systemMethod }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * گرفتن همه متد های سیستم های موجود و تعداد استفادشون
   * GET /v1/plan/all-system-methods-and-usage-times/:id
   */
  app.get('/all-system-methods-and-usage-times/:id', {
    schema: {
      tags: ['Plan'],
      summary: ' تمام متد های سیستم های استفاده شده توسط مربی به همراه تعداد دفعات استفادشون با استفاده از آیدی مربی، به منظور راحتی مربی ها برای انتخاب سیستم های تکرار',
      description: `## ادمین با قرار دادن آیدی معتبر یک معلم در کوئری میتواند از این روت استفاده بکنه و متد های سیستم های تکرار رو بر اساس میزان استفاده اون مربی بگیره 
        ## شناسه معلم از توکن گرفته می شود ولی در کوئری هم بایستی علامت تیره قرار بگیرد 
        `,
      params: generalSchema.IdQueryTeacher,
      response: {
        200: { content: { 'application/json': { schema: systemMethodSchema.SystemMethodsAndUsageTimesResponseSchema } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: generalSchema.IdQueryTeacherType }>, reply: FastifyReply) => {
      const systemMethods = await planHelperUseCase.getSystemMethodsAndTheirUsageTimes(request)
      reply.send({ data: { systemMethods }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * گرفتن اطلاعات تمام متد ها
   * GET /v1/plan/all-system-methods
   */
  app.get('/all-system-methods', {
    schema: {
      tags: ['Plan'],
      summary: 'دریافت تمام متد ها ',
      description: `ادمین قادر به گرفتن تمام متد های سیستم هاست`,
      response: {
        200: { content: { 'application/json': { schema: systemMethodSchema.MultipleSystemMethodResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request, reply: FastifyReply) => {
      const systemMethods = await systemMethodUseCase.getAllSystemMethods(request)
      reply.send({ data: { systemMethods }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * ویرایش متد سیستم تمرینی
   * PATCH /v1/plan/edit/system-method-by-id/:id
   */
  app.patch('/edit/system-method-by-id/:id', {
    schema: {
      tags: ['Plan'],
      summary: 'ویرایش متد سیستم تمرینی',
      description: `## ادمین میتواند تمام متد های سیستم ها رو آپدیت بکنه`,
      params: generalSchema.IdParam,
      body: systemMethodSchema.UpdateSystemMethodRequestSchema,
      response: {
        200: { content: { 'application/json': { schema: systemMethodSchema.SingleSystemMethodResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: generalSchema.IdParamType; Body: systemMethodSchema.UpdateSystemMethodRequestType }>, reply: FastifyReply) => {
      const systemMethod = await systemMethodUseCase.updateSystemMethod(request)
      reply.send({ data: { systemMethod }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * حذف متد سیستم
   * DELETE /v1/plan/delete/system-method-by-id/:id
   */
  app.delete('/delete/system-method-by-id/:id', {
    schema: {
      tags: ['Plan'],
      summary: 'حذف متد سیستم تمرینی',
      description: `## ادمین میتونه متد سیستم تمرینی رو پاک بکنه `,
      params: generalSchema.IdParam,
      response: {
        200: { content: { 'application/json': { schema: generalSchema.EmptySuccessResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: generalSchema.IdParamType }>, reply: FastifyReply) => {
      await systemMethodUseCase.deleteSystemMethod(request)
      reply.send({ data: {}, msgCode: '', msgType: 'success' })
    },
  })
}
