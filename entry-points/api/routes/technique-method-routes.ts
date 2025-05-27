import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import * as generalSchema from '../../../domain/schemas/plan-general-schema.js'
import * as techniqueMethodSchema from '../../../domain/schemas/technique-method-schema.js'
import * as techniqueMethodUseCase from '../../../domain/use-cases/technique-method-use-case.js'
import * as planHelperUseCase from '../../../domain/use-cases/plan-helper-use-case.js'

export async function techniqueMethodRoutes(app: FastifyInstance) {
  /**
   * ایجاد متد تکنیکی جدید
   * POST /v1/plan/create-technique-method
   */
  app.post('/create-technique-method', {
    schema: {
      tags: ['Plan'],
      summary: 'ایجاد متد تکنیکی جدید',
      description: 'ادمین قادر به تولید متد تکنیکی جدید است',
      body: techniqueMethodSchema.CreatePlanTechniqueMethodRequest,
      querystring: generalSchema.IdQueryTeacher,
      response: {
        200: { content: { 'application/json': { schema: techniqueMethodSchema.SingleTechniqueMethodResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Body: techniqueMethodSchema.CreatePlanTechniqueMethodRequestType; Querystring: generalSchema.IdQueryTeacherType }>, reply: FastifyReply) => {
      const techniqueMethod = await techniqueMethodUseCase.createTechniqueMethod(request)
      reply.send({ data: { techniqueMethod }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * گرفتن اطلاعات یک متد تکنیکی با آیدی
   * GET /v1/plan/technique-method-by-id/:id
   */
  app.get('/technique-method-by-id/:id', {
    schema: {
      tags: ['Plan'],
      summary: 'دریافت متد تکنیکی با استفاده از آیدی',
      description: 'ادمین قادر به گرفتن تمام متدهای تکنیکی است',
      params: generalSchema.IdParam,
      response: {
        200: { content: { 'application/json': { schema: techniqueMethodSchema.SingleTechniqueMethodResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: generalSchema.IdParamType }>, reply: FastifyReply) => {
      const techniqueMethod = await techniqueMethodUseCase.getTechniqueMethodById(request)
      reply.send({ data: { techniqueMethod }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * گرفتن اطلاعات یک متد تکنیکی با شماره
   * GET /v1/plan/technique-method-by-number/:number
   */
  app.get('/technique-method-by-number/:number', {
    schema: {
      tags: ['Plan'],
      summary: 'دریافت متد تکنیکی با استفاده از شماره',
      description: 'ادمین قادر به گرفتن تمام متدهای تکنیکی است',
      params: generalSchema.numberParam,
      response: {
        200: { content: { 'application/json': { schema: techniqueMethodSchema.SingleTechniqueMethodResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: generalSchema.numberParamType }>, reply: FastifyReply) => {
      const techniqueMethod = await techniqueMethodUseCase.getTechniqueMethodByNumber(request)
      reply.send({ data: { techniqueMethod }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * گرفتن همه متدهای تکنیکی و تعداد استفاده‌هایشان
   * GET /v1/plan/all-technique-methods-and-usage-times/:id
   */
  app.get('/all-technique-methods-and-usage-times/:id', {
    schema: {
      tags: ['Plan'],
      summary: 'تمام متدهای تکنیکی استفاده شده توسط مربی به همراه تعداد دفعات استفاده‌شان با استفاده از آیدی مربی',
      description: 'ادمین با قرار دادن آیدی معتبر یک مربی در می‌تواند متدهای تکنیکی را بر اساس میزان استفاده آن مربی دریافت کند. شناسه مربی از توکن گرفته می‌شود ولی در کوئری باید علامت تیره قرار گیرد',
      params: generalSchema.IdQueryTeacher,
      response: {
        200: { content: { 'application/json': { schema: techniqueMethodSchema.TechniqueMethodsAndUsageTimesResponseSchema } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: generalSchema.IdQueryTeacherType }>, reply: FastifyReply) => {
      const techniqueMethods = await planHelperUseCase.getTechniqueMethodsAndTheirUsageTimes(request)
      reply.send({ data: { techniqueMethods }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * گرفتن اطلاعات تمام متدهای تکنیکی
   * GET /v1/plan/all-technique-methods
   */
  app.get('/all-technique-methods', {
    schema: {
      tags: ['Plan'],
      summary: 'دریافت تمام متدهای تکنیکی',
      description: 'ادمین قادر به گرفتن تمام متدهای تکنیکی است',
      response: {
        200: { content: { 'application/json': { schema: techniqueMethodSchema.MultipleTechniqueMethodResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request, reply: FastifyReply) => {
      const techniqueMethods = await techniqueMethodUseCase.getAllTechniqueMethods(request)
      reply.send({ data: { techniqueMethods }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * ویرایش متد تکنیکی تمرینی
   * PATCH /v1/plan/edit/technique-method-by-id/:id
   */
  app.patch('/edit/technique-method-by-id/:id', {
    schema: {
      tags: ['Plan'],
      summary: 'ویرایش متد تکنیکی تمرینی',
      description: 'ادمین می‌تواند تمام متدهای تکنیکی را آپدیت کند',
      params: generalSchema.IdParam,
      body: techniqueMethodSchema.UpdateTechniqueMethodRequestSchema,
      response: {
        200: { content: { 'application/json': { schema: techniqueMethodSchema.SingleTechniqueMethodResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: generalSchema.IdParamType; Body: techniqueMethodSchema.UpdateTechniqueMethodRequestType }>, reply: FastifyReply) => {
      const techniqueMethod = await techniqueMethodUseCase.updateTechniqueMethod(request)
      reply.send({ data: { techniqueMethod }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * حذف متد تکنیکی
   * DELETE /v1/plan/delete/technique-method-by-id/:id
   */
  app.delete('/delete/technique-method-by-id/:id', {
    schema: {
      tags: ['Plan'],
      summary: 'حذف متد تکنیکی تمرینی',
      description: 'ادمین می‌تواند متد تکنیکی تمرینی را حذف کند',
      params: generalSchema.IdParam,
      response: {
        200: { content: { 'application/json': { schema: generalSchema.EmptySuccessResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: generalSchema.IdParamType }>, reply: FastifyReply) => {
      await techniqueMethodUseCase.deleteTechniqueMethod(request)
      reply.send({ data: {}, msgCode: '', msgType: 'success' })
    },
  })
}
