import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import * as exerciseSchema from '../../../domain/schemas/exercise-schema.js'
import * as generalSchema from '../../../domain/schemas/plan-general-schema.js'
import * as exerciseUseCase from '../../../domain/use-cases/exercise-use-case.js'
import * as planHelperUseCase from '../../../domain/use-cases/plan-helper-use-case.js'

export async function exerciseRoutes(app: FastifyInstance) {
  /**
   * گرفتن حرکات تمرینی بر اساس عضله
   * GET /exercises-by-muscle/:muscle
   */
  app.get('/exercises-by-muscle/:targetMuscles', {
    schema: {
      tags: ['Plan'],
      params: exerciseSchema.GetExerciseByMuscleRequest,
      summary: 'گرفتن حرکات تمرینی با استفاده از عضلات هدف برای تولید تمرین بصورت دستی',
      description: `## مربی و ادمین قادر به گرفتن حرکات هستند `,
      response: {
        200: { content: { 'application/json': { schema: exerciseSchema.MultipleExerciseResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: exerciseSchema.GetExerciseByMuscleType }>, reply: FastifyReply) => {
      const exercises = await exerciseUseCase.getExercisesByMuscles(request)
      reply.send({ data: { exercises }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * گرفتن همه حرکت های استفاده شده توسط مربی و تعداد استفادشون
   * GET /v1/plan/all-exercises-methods-and-usage-times/:id
   */
  app.get('/all-exercises-and-usage-times/:id', {
    schema: {
      tags: ['Plan'],
      summary: ' تمام حرکت های استفاده شده توسط مربی به همراه تعداد دفعات استفادشون با استفاده از آیدی مربی، به منظور راحتی مربی ها برای انتخاب حرکت ها',
      description: `## ادمین با قرار دادن آیدی معتبر یک معلم در کوئری میتواند از این روت استفاده بکنه و متد های حرکت ها رو بر اساس میزان استفاده اون مربی بگیره 
          ## شناسه معلم از توکن گرفته می شود ولی در کوئری هم بایستی علامت تیره قرار بگیرد 
          `,
      params: generalSchema.IdQueryTeacher,
      response: {
        200: { content: { 'application/json': { schema: exerciseSchema.ExercisesAndUsageTimesResponseSchema } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: generalSchema.IdQueryTeacherType }>, reply: FastifyReply) => {
      const exercises = await planHelperUseCase.getExercisesAndTheirUsageTimes(request)
      reply.send({ data: { exercises }, msgCode: '', msgType: 'success' })
    },
  })

  /**
   * گرفتن حرکات تمرینی بر اساس شماره حرکت
   * GET /exercise-by-id/:number
   */
  app.get('/exercise-by-number/:number', {
    schema: {
      tags: ['Plan'],
      params: generalSchema.numberParam,
      summary: 'گرفتن حرکات تمرینی با استفاده از عضلات هدف برای تولید تمرین بصورت دستی',
      description: `## مربی و ادمین قادر به گرفتن حرکات هستند `,
      response: {
        200: { content: { 'application/json': { schema: exerciseSchema.SingleRawExerciseResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: generalSchema.numberParamType }>, reply: FastifyReply) => {
      const exercise = await exerciseUseCase.getExerciseByNumber(request)
      reply.send({ data: { exercise }, msgCode: '', msgType: 'success' })
    },
  })
}
