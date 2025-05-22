import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import * as generalSchema from '../../../domain/schemas/plan-general-schema.js'
import * as templateSchema from '../../../domain/schemas/template-schema.js'
import * as templateUseCase from '../../../domain/use-cases/template-use-case.js'

export async function templateRoutes(app: FastifyInstance) {
  /**
   * ایجاد قالب جدید
   * POST /v1/plan/create-template-AI
   */
  app.post('/create-template-AI', {
    schema: {
      tags: ['Plan'],
      summary: 'ایجاد قالب جدید توسط هوش مصنوعی',
      description: `## مربی میتونه قالب جدید با استفاده از هوش مصنوعی تولید بکنه `,
      body: templateSchema.CreateTemplateByAIRequest,
      response: {
        200: { content: { 'application/json': { schema: templateSchema.SingleTemplateResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Body: templateSchema.CreateTemplateByAIRequestType }>, reply: FastifyReply) => {
      const template = await templateUseCase.createTemplateByAI(request)
      reply.send({ data: { template }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * ایجاد قالب جدید
   * POST /v1/plan/create-template-manual
   */
  app.post('/create-template-manual', {
    schema: {
      tags: ['Plan'],
      summary: 'ایجاد قالب جدید بصورت دستی',
      description: `## مربی میتونه بصورت دستی قالب جدید تولید بکنه `,
      body: templateSchema.CreateTemplateManualRequest,
      response: {
        200: { content: { 'application/json': { schema: templateSchema.SingleTemplateResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Body: templateSchema.CreateTemplateManualRequestType }>, reply: FastifyReply) => {
      const template = await templateUseCase.createTemplateManual(request)
      reply.send({ data: { template }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * گرفتن اطلاعات یک قالب تولید شده توسط مربی با استفاده از آیدی قالب
   * GET /v1/plan/template-by-id/:id
   */
  app.get('/template-by-id/:id', {
    schema: {
      tags: ['Plan'],
      summary: 'دریافت قالب مربی با استفاده از آیدی ',
      description: `ادمین میتونه تمام قالب ها رو بگیره ولی مربی، فقط قالب های خودش رو میتونه بگیره`,
      params: generalSchema.IdParam,
      response: {
        200: { content: { 'application/json': { schema: templateSchema.SingleTemplateResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: generalSchema.IdParamType }>, reply: FastifyReply) => {
      const template = await templateUseCase.getTemplateById(request)
      reply.send({ data: { template }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * گرفتن همه قالب های تولیدی مربی
   * GET /v1/plan/all-templates-by-id/:teacherid
   */
  app.get('/all-templates-by-teacherid/:id', {
    schema: {
      tags: ['Plan'],
      summary: 'دریافت تمام قالب های برنامه تمرینی مربی با استفاده از آیدی مربی',
      description: `ادمین میتونه تمام قالب ها رو بگیره ولی مربی، فقط قالب های خودش رو (که توسط خودش یا هوش مصنوعی براش ساخته شده) میتونه بگیره`,
      params: generalSchema.IdParam,
      response: {
        200: { content: { 'application/json': { schema: templateSchema.MultipleTemplateResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: generalSchema.IdParamType }>, reply: FastifyReply) => {
      const templates = await templateUseCase.getAllTemplatesByTeacherId(request)
      reply.send({ data: { templates }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * ویرایش قالب تمرینی
   * PATCH /v1/plan/edit/template-by-id/:id
   */
  app.patch('/edit/template-by-id/:id', {
    schema: {
      tags: ['Plan'],
      summary: 'ویرایش قالب تمرینی',
      description: `## ادمین قالب های رو میتونه ویرایش کنه مربی فقط قالب خودش رو میتونه ویرایش کنه`,
      params: generalSchema.IdParam,
      body: templateSchema.UpdateTemplateRequest,
      response: {
        200: { content: { 'application/json': { schema: templateSchema.SingleTemplateResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: generalSchema.IdParamType; Body: templateSchema.UpdateTemplateRequestType }>, reply: FastifyReply) => {
      const template = await templateUseCase.updateTemplate(request)
      reply.send({ data: { template }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * حذف قالب
   * DELETE /v1/plan/delete/template-by-id/:id
   */
  app.delete('/delete/template-by-id/:id', {
    schema: {
      tags: ['Plan'],
      summary: 'حذف قالب تمرینی',
      description: `## ادمین میتونه قالب تمرینی همه رو حذف بکنه، مربی فقط قالب تمرینی خودش رو میتونه حذف کنه`,
      params: generalSchema.IdParam,
      response: {
        200: { content: { 'application/json': { schema: generalSchema.EmptySuccessResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: generalSchema.IdParamType }>, reply: FastifyReply) => {
      await templateUseCase.deleteTemplate(request)
      reply.send({ data: {}, msgCode: '', msgType: 'success' })
    },
  })
}
