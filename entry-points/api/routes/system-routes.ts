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
   * گرفتن سیستم های تولیدی مربی
   * GET /v1/plan/system-by-id/:id
   * به این معنی هست ک بایستی به طور مستقیم ایدی رو بعد از اسلش وارد بکنی
   */

  app.get('/system-by-id/:id', {
    schema: {
      tags: ['Plan'],
      summary: 'دریافت سیستم های برنامه تمرینی مربی با استفاده از آیدی',
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
}

