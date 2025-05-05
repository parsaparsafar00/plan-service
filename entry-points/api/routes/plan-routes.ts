import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import * as generalSchema from '../../../domain/schemas/plan-general-schema.js'
import * as planSchema from '../../../domain/schemas/plan-schema.js'
import * as planUseCase from '../../../domain/use-cases/plan-use-case.js'

export async function planRoutes(app: FastifyInstance) {
  /**
   * تولید یک جلسه تمرینی توسط هوش مصنوعی
   * POST /v1/plan/generate-session-AI
   */
  app.post('/generate-session-AI', {
    schema: {
      tags: ['Plan'],
      summary: 'تولید جلسه ای برنامه تمرینی توسط هوش مصنوعی',
      description: `##فقط مربی بایستی قادر باشه که برنامه تولید بکنه `,
      body: planSchema.GenerateSessionByAIRequest,
      response: {
        200: { content: { 'application/json': { schema: planSchema.SingleSessionResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Body: planSchema.GenerateSessionByAIRequestType }>, reply: FastifyReply) => {
      const session = await planUseCase.generateSessionAI(request)
      reply.send({ data: { session }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * تولید برنامه تمرینی با استفاده از جلسات تولید شده
   * POST /v1/plan/create
   */
  app.post('/create', {
    schema: {
      tags: ['Plan'],
      summary: 'تولید برنامه جدید',
      description: `##فقط مربی بایستی قادر باشه که برنامه تولید بکنه `,
      body: planSchema.CreatePlanRequest,
      response: {
        200: { content: { 'application/json': { schema: planSchema.SinglePlanResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Body: planSchema.CreatePlanRequestType }>, reply: FastifyReply) => {
      const plan = await planUseCase.createPlan(request)
      reply.send({ data: { plan }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * گرفتن برنامه تمرینی
   * GET /v1/plan/by-id/:id
   * به این معنی هست ک بایستی به طور مستقیم ایدی رو بعد از اسلش وارد بکنی
   */

  app.get('/by-id/:id', {
    schema: {
      tags: ['Plan'],
      summary: 'دریافت برنامه تمرینی با آیدی',
      description: `## ادمین میتونه همه برنامه ها رو بگیره مربی و دانش آموز فقط برای خودشون رو میتونن بگیرن`,
      params: generalSchema.IdParam,
      response: {
        200: { content: { 'application/json': { schema: planSchema.SinglePlanResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: generalSchema.IdParamType }>, reply: FastifyReply) => {
      const plan = await planUseCase.getPlanById(request)
      reply.send({ data: { plan }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * گرفتن برنامه تمرینی مخصوص پرینت
   * GET /v1/plan/by-id-print/:id
   */
  app.get('/by-id-print/:id', {
    schema: {
      tags: ['Plan'],
      summary: 'دریافت برنامه تمرینی پرینتی با آیدی',
      description: `## ادمین میتونه همه برنامه ها رو بگیره مربی و دانش آموز فقط برای خودشون رو میتونن بگیرن`,
      params: generalSchema.IdParam,
      response: {
        200: { content: { 'application/json': { schema: planSchema.SinglePrintPlanResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: generalSchema.IdParamType }>, reply: FastifyReply) => {
      const plan = await planUseCase.getPrintPlan(request)
      reply.send({ data: { plan }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * گرفتن همه برنامه تمرینی های مربی
   * GET /v1/plan/all-by-teacherid/:id
   */
  app.get('/all-by-teacherid/:id', {
    schema: {
      tags: ['Plan'],
      summary: 'دریافت تمام برنامه های تمرینی با استفاده از آیدی مربی',
      description: `## ادمین میتونه همه برنامه ها رو بگیره مربی و دانش آموز فقط برای خودشون رو میتونن بگیرن`,
      params: generalSchema.IdParam,
      response: {
        200: { content: { 'application/json': { schema: planSchema.MultiplePlanResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: generalSchema.IdParamType }>, reply: FastifyReply) => {
      const plans = await planUseCase.getAllPlansByTeacherId(request)
      console.log(plans)
      reply.send({ data: { plans }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * ویرایش برنامه تمرینی
   * PATCH /v1/plan/edit/by-id/:id
   */
  app.patch('/edit/by-id/:id', {
    schema: {
      tags: ['Plan'],
      summary: 'ویرایش برنامه تمرینی',
      description: `## امکان ویرایش یک برنامه تمرینی - ادمین برای همه - مربی فقط برنامه خودش  `,
      params: generalSchema.IdParam,
      body: planSchema.UpdatePlanRequest,
      response: {
        200: { content: { 'application/json': { schema: planSchema.SinglePlanResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: generalSchema.IdParamType, Body: planSchema.UpdatePlanRequestType }>, reply: FastifyReply) => {
      const plan = await planUseCase.updatePlan(request)
      reply.send({ data: { plan }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * حذف برنامه تمرینی
   * DELETE /v1/plan/delete/by-id/:id
   */
  app.delete('/delete/by-id/:id', {
    schema: {
      tags: ['Plan'],
      summary: 'حذف برنامه تمرینی',
      description: `## ادمین میتونه برنامه همه رو حذف بکنه، مربی فقط برنامه خودش رو میتونه حذف کنن`,
      params: generalSchema.IdParam,
      response: {
        200: { content: { 'application/json': { schema: generalSchema.EmptySuccessResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: generalSchema.IdParamType }>, reply: FastifyReply) => {
      await planUseCase.deletePlan(request)
      reply.send({ data: {}, msgCode: '', msgType: 'success' })
    },
  })
}
