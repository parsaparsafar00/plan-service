import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import * as generalSchema from '../../../domain/schemas/plan-general-schema.js'
import * as systemSchema from '../../../domain/schemas/system-schema.js'
import * as systemUseCase from '../../../domain/use-cases/system-use-case.js'

export async function systemRoutes(app: FastifyInstance) {
  /**
   * ایجاد سیستم جدید
   * POST /v1/plan/create-system
   */
  app.post('/create-system', {
    schema: {
      tags: ['Plan'],
      summary: 'ایجاد سیستم جدید',
      description: `## مربی و ادمین قادر به تولید سیستم جدید هستند `,
      body: systemSchema.CreatePlanSystemRequest,
      response: {
        200: { content: { 'application/json': { schema: systemSchema.SingleSystemResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Body: systemSchema.CreatePlanSystemRequestType }>, reply: FastifyReply) => {
      const system = await systemUseCase.createPlanSystem(request)
      reply.send({ data: { system }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * گرفتن اطلاعات یک سیستم تولید شده توسط مربی با آیدی
   * GET /v1/plan/system-by-id/:id
   */
  app.get('/system-by-id/:id', {
    schema: {
      tags: ['Plan'],
      summary: 'دریافت سیستم مربی با استفاده از آیدی ',
      description: `ادمین میتونه تمام سیستم ها رو بگیره ولی مربی، فقط سیستم های خودش رو (که توسط خودش یا هوش مصنوعی براش ساخته شده) میتونه بگیره`,
      params: generalSchema.IdParam,
      response: {
        200: { content: { 'application/json': { schema: systemSchema.SingleSystemResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: generalSchema.IdParamType }>, reply: FastifyReply) => {
      const system = await systemUseCase.getSystemById(request)
      reply.send({ data: { system }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * گرفتن همه سیستم های تولیدی مربی
   * GET /v1/plan/all-systems-by-id/:teacherid
   */
  app.get('/all-systems-by-teacherid/:id', {
    schema: {
      tags: ['Plan'],
      summary: 'دریافت تمام سیستم های برنامه تمرینی مربی با استفاده از آیدی مربی',
      description: `ادمین میتونه تمام سیستم ها رو بگیره ولی مربی، فقط سیستم های خودش رو (که توسط خودش یا هوش مصنوعی براش ساخته شده) میتونه بگیره`,
      params: generalSchema.IdParam,
      response: {
        200: { content: { 'application/json': { schema: systemSchema.MultipleSystemResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: generalSchema.IdParamType }>, reply: FastifyReply) => {
      const systems = await systemUseCase.getAllSystemsByTeacherId(request)
      reply.send({ data: { systems }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * ویرایش سیستم تمرینی
   * PATCH /v1/plan/edit/system-by-id/:id
   */
  app.patch('/edit/system-by-id/:id', {
    schema: {
      tags: ['Plan'],
      summary: 'ویرایش سیستم تمرینی',
      description: `## ادمین برای همه سیستم های همه مربی ها رو میتونه ویرایش کنه مربی فقط سیستم خودش رو میتونه ویرایش کنه`,
      params: generalSchema.IdParam,
      body: systemSchema.UpdateSystemRequestSchema,
      response: {
        200: { content: { 'application/json': { schema: systemSchema.SingleSystemResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: generalSchema.IdParamType, Body: systemSchema.UpdateSystemRequestType }>, reply: FastifyReply) => {
      const system = await systemUseCase.updateSystem(request)
      reply.send({ data: { system }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * حذف سیستم
   * DELETE /v1/plan/delete/system-by-id/:id
   */
  app.delete('/delete/system-by-id/:id', {
    schema: {
      tags: ['Plan'],
      summary: 'حذف سیستم تمرینی',
      description: `## ادمین میتونه سیستم تمرینی همه رو حذف بکنه، مربی فقط سیستم تمرینی خودش رو میتونه حذف کنه`,
      params: generalSchema.IdParam,
      response: {
        200: { content: { 'application/json': { schema: generalSchema.EmptySuccessResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: generalSchema.IdParamType }>, reply: FastifyReply) => {
      await systemUseCase.deleteSystem(request)
      reply.send({ data: {}, msgCode: '', msgType: 'success' })
    },
  })
}
