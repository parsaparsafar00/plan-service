import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import * as generalSchema from '../../../domain/schemas/plan-general-schema.js'
import * as systemSchema from '../../../domain/schemas/system-schema.js'
import * as systemUseCase from '../../../domain/use-cases/system-use-case.js'
import * as planHelperUseCase from '../../../domain/use-cases/plan-helper-use-case.js'

export async function systemRoutes(app: FastifyInstance) {
  /**
   * ایجاد سیستم جدید
   * POST /v1/plan/create-system
   */
  app.post('/create-system', {
    schema: {
      tags: ['Plan'],
      summary: 'ایجاد سیستم جدید',
      description: `
## مربی و ادمین قادر به تولید سیستم جدید هستند 
اگر ادمین بخواهد که سیستم جدیدی برای یک مربی تولید بکند بایستی یک شناسه معلم معتبر در کوئری قرار دهد
درغیر این صورت اگر شناسه معتبر نباشد یعنی خط تیره وارد شده باشد، ادمین سیستم را بصورت گلوبال تولید میکند 
      `,
      body: systemSchema.CreatePlanSystemRequest,
      querystring: generalSchema.IdQueryTeacher,
      response: {
        200: { content: { 'application/json': { schema: systemSchema.SingleSystemResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Body: systemSchema.CreatePlanSystemRequestType; Querystring: generalSchema.IdQueryTeacherType }>, reply: FastifyReply) => {
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
   * گرفتن اطلاعات یک سیستم تولید شده توسط مربی با شماره سیستم
   * GET /v1/plan/system-by-number/:number
   */
  app.get('/system-by-number/:number', {
    schema: {
      tags: ['Plan'],
      summary: 'دریافت سیستم مربی با استفاده از شماره ',
      description: `ادمین میتونه تمام سیستم ها رو بگیره ولی مربی، فقط سیستم های خودش رو (که توسط خودش یا هوش مصنوعی براش ساخته شده) میتونه بگیره`,
      params: generalSchema.numberParam,
      response: {
        200: { content: { 'application/json': { schema: systemSchema.SingleSystemResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: generalSchema.numberParamType }>, reply: FastifyReply) => {
      const system = await systemUseCase.getSystemByNumber(request)
      reply.send({ data: { system }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * گرفتن همه سیستم های تولیدی مربی
   * GET /v1/plan/all-systems-by-id/:id
   */
  app.get('/all-systems-by-teacherid/:id', {
    schema: {
      tags: ['Plan'],
      summary: 'دریافت تمام سیستم های برنامه تمرینی مربی با استفاده از آیدی مربی',
      description: `## ادمین با قرار دادن آیدی معتبر یک معلم در کوئری میتواند سیستم های آن مربی را مشاهده بکند 
##  معلم میتواند سیستم های خودش را دریافت کند، شناسه معلم از توکن گرفته می شود ولی در کوئری هم بایستی علامت تیره قرار بگیرد `,
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
   * گرفتن اطلاعات تمام سیستم های تکرار موجود مخصوص ادمین
   * GET /v1/plan/all-systems
   */
  app.get('/all-systems', {
    schema: {
      tags: ['Plan'],
      summary: 'دریافت تمام سیتم های تکرار ',
      description: `ادمین قادر به گرفتن تمام سیستم های تکرار است`,
      response: {
        200: { content: { 'application/json': { schema: systemSchema.MultipleSystemResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request, reply: FastifyReply) => {
      const systems = await systemUseCase.getAllSystems(request)
      reply.send({ data: { systems }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * گرفتن همه های سیستم های موجود و تعداد استفادشون
   * GET /v1/plan/all-systems-and-usage-times/:id
   */
  app.get('/all-systems-and-usage-times/:id', {
    schema: {
      tags: ['Plan'],
      summary: ' تمام سیستم های برنامه تمرینی استفاده شده توسط مربی به همراه تعداد دفعات استفادشون با استفاده از آیدی مربی، به منظور راحتی مربی ها برای انتخاب سیستم های تکرار',
      description: `## ادمین با قرار دادن آیدی معتبر یک معلم در کوئری میتواند از این روت استفاده بکنه و سیستم های تکرار رو بر اساس میزان استفاده اون مربی بگیره 
## شناسه معلم از توکن گرفته می شود ولی در کوئری هم بایستی علامت تیره قرار بگیرد `,
      params: generalSchema.IdQueryTeacher,
      response: {
        200: { content: { 'application/json': { schema: systemSchema.ExercisesAndUsageTimesResponseSchema } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: generalSchema.IdQueryTeacherType }>, reply: FastifyReply) => {
      const systems = await planHelperUseCase.getSystemsAndTheirUsageTimes(request)
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
      description: `## ادمین میتواند تمام سیستم ها رو (چه گلوبال ها و چه سیستم های مربوط به مربی ها) رو آپدیت بکنه
      اما مربی فقط مال خودش رو میتونه آپدیت کنه
      `,
      params: generalSchema.IdParam,
      body: systemSchema.UpdateSystemRequestSchema,
      response: {
        200: { content: { 'application/json': { schema: systemSchema.SingleSystemResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: generalSchema.IdParamType; Body: systemSchema.UpdateSystemRequestType }>, reply: FastifyReply) => {
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
      description: `## (گلوبال ها رو حق نداره حذف کنه) ادمین میتونه سیستم تمرینی همه رو حذف بکنه، مربی فقط سیستم تمرینی خودش رو میتونه حذف کنه`,
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
