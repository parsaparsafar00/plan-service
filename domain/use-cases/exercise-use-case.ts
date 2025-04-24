import type { FastifyRequest } from 'fastify'
import type * as exerciseSchema from '../schemas/exercise-schema.js'
import { getAllExercisesArray } from '../../data-access/exercise-repository.js'
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

/**
 * گرفتن اطلاعات حرکت با استفاده از عضلات هدف - به این صورت که آرایه اولیه ما فیلتر میشه.
 */
export async function getExercisesByMuscles(request: FastifyRequest<{ Params: exerciseSchema.GetExerciseByMuscleType }>) {
  const muscleValues = JSON.parse(request.params.targetMuscles)

  const allExercises = getAllExercisesArray()
  if (!allExercises || allExercises.length === 0) throw new AppError('PLAN_NO_EXERCISES_FOUND', 'No exercises loaded in memory', 400)

  // منطق فیلترینگ
  const filteredExercises = allExercises.filter((ex) => {
    
    // فیلتر حرکاتی ک فیلم آموزشی دارند
    if (!ex.shortYoutubeDemonstration || ex.shortYoutubeDemonstration == '' || ex.shortYoutubeDemonstration == null)
      return false
    
    // فیلتر بر اساس عضلات هدف
    if (muscleValues.length > 0) {
      for (let i=0; i <= muscleValues.length - 1; i++) {
        if (muscleValues[i] !== ex.targetMuscleGroup) {
          if (i === muscleValues.length - 1) return false;
        } else {
          break
        }
      }
    } else return false
    

    return true
  });
  
  return filteredExercises
}

