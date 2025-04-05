import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import * as planSchema from '../../domain/plan-schema.js'
import * as planUseCase from '../../domain/plan-use-case.js'

export async function planRoutes(app: FastifyInstance) {
  /**
   * ایجاد یادداشت
   * POST /v1/plan/create
   */
  app.post('/create', {
    schema: {
      tags: ['Plan'],
      summary: 'ایجاد یادداشت جدید',
      description: `
##فقط معلم بایستی قادر باشه که برنامه تولید بکنه 
`,
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
      summary: 'ایجاد یادداشت جدید',
      description: `
  ##فقط معلم بایستی قادر باشه که برنامه تولید بکنه 
  `,
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
      description: `
## ادمین میتونه همه برنامه ها رو ببینه، معلم و دانش آموز فقط برای خودشون رو میتونن ببینن
`,
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
   * ویرایش برنامه تمرینی
   * PATCH /v1/plan/edit/by-id/:id 
   * به این معنی هست ک بایستی به طور مستقیم ایدی رو بعد از اسلش وارد بکنی
   */
//   app.patch('/edit/by-id/:id', {
//     schema: {
//       tags: ['Plan'],
//       summary: 'ویرایش برنامه تمرینی',
//       description: `
// ## امکان ویرایش یک برنامه تمرینی
// - ادمین برای همه
// - معلم فقط برنامه خودش
// `,
//       params: planSchema.IdParam,
//       body: planSchema.UpdatePlanRequest,
//       response: {
//         200: { content: { 'application/json': { schema: planSchema.SinglePlanResponse } }, description: planSchema.SuccessResponseDes },
//         400: planSchema.BadRequestError,
//         403: planSchema.ForbiddenError,
//         500: planSchema.InternalServerError,
//       },
//     },
//     handler: async (request: FastifyRequest<{ Params: planSchema.IdParamType, Body: planSchema.UpdatePlanRequestType }>, reply: FastifyReply) => {
//       const plan = await planUseCase.updatePlan(request)
//       reply.send({ data: { plan }, msgCode: '', msgType: 'success' })
//     },
//   })


  /**
   * حذف برنامه تمرینی
   * DELETE /v1/plan/delete/by-id/:id
   */
  app.delete('/delete/by-id/:id', {
    schema: {
      tags: ['Plan'],
      summary: 'حذف برنامه تمرینی',
      description: `
## ادمین میتونه برنامه همه رو حذف بکنه، معلم فقط برنامه خودش رو میتونه حذف کنن
`,
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
}
