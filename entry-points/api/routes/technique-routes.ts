import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import * as generalSchema from '../../../domain/schemas/plan-general-schema.js'
import * as techniqueSchema from '../../../domain/schemas/technique-schema.js'
import * as techniqueUseCase from '../../../domain/use-cases/technique-use-case.js'

export async function techniqueRoutes(app: FastifyInstance) {
  /**
   * ایجاد تکنیک جدید
   * POST /v1/plan/technique-system
  */
  app.post('/create-technique', {
    schema: {
      tags: ['Plan'],
      summary: 'ایجاد تکنیک جدید',
      description: `## مربی و ادمین قادر به تولید تکنیک جدید هستند `,
      body: techniqueSchema.CreateTechniqueRequest,
      response: {
        200: { content: { 'application/json': { schema: techniqueSchema.SingleTechniqueResponse } }, description: techniqueSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Body: techniqueSchema.CreateTechniqueRequestType }>, reply: FastifyReply) => {
      const technique = await techniqueUseCase.createTechnique(request);
      reply.send({ data: { technique }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * گرفتن تکنیک های تولیدی مربی
   * GET /v1/plan/technique-by-id/:id
   * به این معنی هست ک بایستی به طور مستقیم ایدی رو بعد از اسلش وارد بکنی
   */

  app.get('/technique-by-id/:id', {
    schema: {
      tags: ['Plan'],
      summary: 'دریافت تکنیک های برنامه تمرینی مربی با استفاده از آیدی',
      description: `ادمین میتونه تمام تکنیک ها رو بگیره ولی مربی، فقط تکنیک های خودش رو (که توسط خودش یا هوش مصنوعی براش ساخته شده) میتونه بگیره`,
      params: generalSchema.IdParam,
      response: {
        200: { content: { 'application/json': { schema: techniqueSchema.MultipleTechniqueResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: generalSchema.IdParamType }>, reply: FastifyReply) => {
      const techs = await techniqueUseCase.getAllTechniquesByTeacherId(request)
      reply.send({ data: { techs }, msgCode: '', msgType: 'success' })
    },
  })   
}

