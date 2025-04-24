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
        200: { content: { 'application/json': { schema: techniqueSchema.SingleTechniqueResponse } }, description: generalSchema.SuccessResponseDes },
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
   * گرفتن اطلاعات یک تکنیک تولید شده توسط مربی با آیدی
   * GET /v1/plan/technique-by-id/:id
  */
  app.get('/technique-by-id/:id', {
    schema: {
      tags: ['Plan'],
      summary: 'دریافت تکنیک مربی با استفاده از آیدی ',
      description: `ادمین میتونه تمام تکنیک ها رو بگیره ولی مربی، فقط تکنیک های خودش رو (که توسط خودش یا هوش مصنوعی براش ساخته شده) میتونه بگیره`,
      params: generalSchema.IdParam,
      response: {
        200: { content: { 'application/json': { schema: techniqueSchema.SingleTechniqueResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: generalSchema.IdParamType }>, reply: FastifyReply) => {
      const technique = await techniqueUseCase.getTechniqueById(request)
      reply.send({ data: { technique }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * گرفتن همه تکنیک های تولیدی مربی
   * GET /v1/plan/all-techniques-by-id/:teacherid
  */
  app.get('/all-techniques-by-teacherid/:id', {
    schema: {
      tags: ['Plan'],
      summary: 'دریافت تمام تکنیک های برنامه تمرینی مربی با استفاده از آیدی مربی',
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
      const techniques = await techniqueUseCase.getAllTechniquesByTeacherId(request)
      reply.send({ data: { techniques }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * ویرایش تکنیک تمرینی
   * PATCH /v1/plan/edit/technique-by-id/:id
  */
  app.patch('/edit/technique-by-id/:id', {
    schema: {
      tags: ['Plan'],
      summary: 'ویرایش تکنیک تمرینی',
      description: `## ادمین برای همه تکنیک های همه مربی ها رو میتونه ویرایش کنه مربی فقط تکنیک خودش رو میتونه ویرایش کنه`,
      params: generalSchema.IdParam,
      body: techniqueSchema.UpdateTechniqueRequest,
      response: {
        200: { content: { 'application/json': { schema: techniqueSchema.SingleTechniqueResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: generalSchema.IdParamType, Body: techniqueSchema.UpdateTechniqueRequestType }>, reply: FastifyReply) => {
      const updatedTechnique = await techniqueUseCase.updateTechnique(request)
      reply.send({ data: { technique: updatedTechnique }, msgCode: '', msgType: 'success' })
    },
  });

  /**
   * حذف تکنیک 
   * DELETE /v1/plan/delete/technique-by-id/:id
  */
  app.delete('/delete/technique-by-id/:id', {
    schema: {
      tags: ['Plan'],
      summary: 'حذف تکنیک تمرینی',
      description: `## ادمین میتونه تکنیک همه رو حذف بکنه، مربی فقط تکنیک خودش رو میتونه حذف کنه`,
      params: generalSchema.IdParam,
      response: {
        200: { content: { 'application/json': { schema: generalSchema.EmptySuccessResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: generalSchema.IdParamType }>, reply: FastifyReply) => {
      await techniqueUseCase.deleteTechnique(request);
      reply.send({ data: {}, msgCode: '', msgType: 'success' });
    },
  })
}
