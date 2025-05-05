import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import * as exerciseSchema from '../../../domain/schemas/exercise-schema.js'
import * as generalSchema from '../../../domain/schemas/plan-general-schema.js'
import * as exerciseUseCase from '../../../domain/use-cases/exercise-use-case.js'

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
  });

  /**
   * گرفتن حرکات تمرینی بر اساس شماره حرکت
   * GET /exercise-by-id/:number
   */
  app.get('/exercise-by-number/:number', {
    schema: {
      tags: ['Plan'],
      params: exerciseSchema.GetExerciseByNumberRequest,
      summary: 'گرفتن حرکات تمرینی با استفاده از عضلات هدف برای تولید تمرین بصورت دستی',
      description: `## مربی و ادمین قادر به گرفتن حرکات هستند `,
      response: {
        200: { content: { 'application/json': { schema: exerciseSchema.SingleRawExerciseResponse } }, description: generalSchema.SuccessResponseDes },
        400: generalSchema.BadRequestError,
        403: generalSchema.ForbiddenError,
        500: generalSchema.InternalServerError,
      },
    },
    handler: async (request: FastifyRequest<{ Params: exerciseSchema.GetExerciseByNumberRequestType }>, reply: FastifyReply) => {
      const exercise = await exerciseUseCase.getExerciseByNumber(request)
      reply.send({ data: { exercise }, msgCode: '', msgType: 'success' })
    },
  })
}
