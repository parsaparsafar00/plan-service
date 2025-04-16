import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import * as planSchema from '../../domain/plan-schema.js'
import * as planUseCase from '../../domain/plan-use-case.js'

export async function planRoutes(app: FastifyInstance) {
  
  
  /**------------------------------------------------------- Plans -------------------------------------------------------*/  
  /**
   * ایجاد برنامه تمرینی
   * POST /v1/plan/create
   */
  app.post('/create', {
    schema: {
      tags: ['Plan'],
      summary: 'ایجاد برنامه جدید',
      description: `##فقط مربی بایستی قادر باشه که برنامه تولید بکنه `,
      body: planSchema.CreatePlanRequest,
      response: {
        200: { content: { 'application/json': { schema: planSchema.SinglePlanResponse } }, description: planSchema.SuccessResponseDes },
        400: planSchema.BadRequestError,
        403: planSchema.ForbiddenError,
        500: planSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Body: planSchema.CreatePlanRequestType }>, reply: FastifyReply) => {
      const plan = await planUseCase.createPlan(request)
      reply.send({ data: { plan }, msgCode: '', msgType: 'success' })
    },
  })

  /**
     * ایجاد برنامه تمرینی مخصوص پرینت گرفتن ورزشکارن
     * POST /v1/plan/create-print
  */
  app.post('/create-print', {
    schema: {
      tags: ['Plan'],
      summary: 'ایجاد برنامه جدید، مخصوص پرینت گرفتن ورزشکاران',
      description: `  ##فقط مربی بایستی قادر باشه که برنامه تولید بکنه  `,
      body: planSchema.CreatePlanRequest,
      response: {
        200: { content: { 'application/json': { schema: planSchema.SinglePlanResponse } }, description: planSchema.SuccessResponseDes },
        400: planSchema.BadRequestError,
        403: planSchema.ForbiddenError,
        500: planSchema.InternalServerError,
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
      params: planSchema.IdParam,
      response: {
        200: { content: { 'application/json': { schema: planSchema.SinglePlanResponse } }, description: planSchema.SuccessResponseDes },
        400: planSchema.BadRequestError,
        403: planSchema.ForbiddenError,
        500: planSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: planSchema.IdParamType }>, reply: FastifyReply) => {
      const plan = await planUseCase.getPlan(request)
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
      params: planSchema.IdParam,
      response: {
        200: { content: { 'application/json': { schema: planSchema.EmptySuccessResponse } }, description: planSchema.SuccessResponseDes },
        400: planSchema.BadRequestError,
        403: planSchema.ForbiddenError,
        500: planSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: planSchema.IdParamType }>, reply: FastifyReply) => {
      await planUseCase.deletePlan(request)
      reply.send({ data: {}, msgCode: '', msgType: 'success' })
    },
  })

  /**------------------------------------------------------- Systems -------------------------------------------------------*/
  
  /**
   * ایجاد سیستم جدید
   * POST /v1/plan/create-system
  */
  app.post('/create-system', {
    schema: {
      tags: ['Plan'],
      summary: 'ایجاد سیستم جدید',
      description: `## مربی و ادمین قادر به تولید سیستم جدید هستند `,
      body: planSchema.CreatePlanSystemRequest,
      response: {
        200: { content: { 'application/json': { schema: planSchema.SingleSystemResponse } }, description: planSchema.SuccessResponseDes },
        400: planSchema.BadRequestError,
        403: planSchema.ForbiddenError,
        500: planSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Body: planSchema.CreatePlanSystemRequestType }>, reply: FastifyReply) => {
      const system = await planUseCase.createPlanSystem(request)
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
      params: planSchema.IdParam,
      response: {
        200: { content: { 'application/json': { schema: planSchema.MultipleSystemResponse } }, description: planSchema.SuccessResponseDes },
        400: planSchema.BadRequestError,
        403: planSchema.ForbiddenError,
        500: planSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: planSchema.IdParamType }>, reply: FastifyReply) => {
      const systems = await planUseCase.getAllSystemsByTeacherId(request)
      reply.send({ data: { systems }, msgCode: '', msgType: 'success' })
    },
  })

/**------------------------------------------------------- Techniques -------------------------------------------------------*/

  /**
   * ایجاد تکنیک جدید
   * POST /v1/plan/technique-system
  */
  app.post('/create-technique', {
    schema: {
      tags: ['Plan'],
      summary: 'ایجاد تکنیک جدید',
      description: `## مربی و ادمین قادر به تولید تکنیک جدید هستند `,
      body: planSchema.CreateTechniqueRequest,
      response: {
        200: { content: { 'application/json': { schema: planSchema.SingleTechniqueResponse } }, description: planSchema.SuccessResponseDes },
        400: planSchema.BadRequestError,
        403: planSchema.ForbiddenError,
        500: planSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Body: planSchema.CreateTechniqueRequestType }>, reply: FastifyReply) => {
      const technique = await planUseCase.createTechnique(request);
      console.log(technique)
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
      params: planSchema.IdParam,
      response: {
        200: { content: { 'application/json': { schema: planSchema.MultipleTechniqueResponse } }, description: planSchema.SuccessResponseDes },
        400: planSchema.BadRequestError,
        403: planSchema.ForbiddenError,
        500: planSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: planSchema.IdParamType }>, reply: FastifyReply) => {
      const techs = await planUseCase.getAllTechniquesByTeacherId(request)
      reply.send({ data: { techs }, msgCode: '', msgType: 'success' })
    },
  })
}

