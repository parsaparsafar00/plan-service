import type { FastifyRequest } from 'fastify'
import type * as exerciseSchema from '../schemas/exercise-schema.js'
import { AppError } from '@amard/error-handling'
import * as exerciseRepo from '../../data-access/exercise-repository.js'

/**
 * گرفتن اطلاعات حرکت با استفاده از شماره حرکت
 */
export async function getExercise(request: FastifyRequest<{ Params: exerciseSchema.getExerciseType }>) {
  const exercise = await exerciseRepo.getExerciseByNumber(request.params)
  if (!exercise) throw new AppError('EXERCISE_NOT_FOUND', 'Exercise not found', 400)
  return exercise
}
