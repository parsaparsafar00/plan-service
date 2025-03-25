import { AppError } from '@amard/error-handling'
import { getAllExercisesArray } from '../data-access/exercise-repository.js'
import { getExerciseInstructions } from './exercise_instructions.js'
import { getPlanInstructions } from './plan_instructions.js'
import { getSessionInstructions } from './session_instructions.js'

/**
 * در اینترفیس زیر باید توجه داشته باشی که در دیتابیس exercises
 * ستون‌های age_ground, age_ceiling, weight_ground, weight_ceiling, gender, target وجود دارد
 * تا بتوانیم عیناً مثل کوئری بالا فیلتر کنیم.
 */
export interface WeekInput {
  week: number
  sessionsPerWeek: number
  sessions: {
    session: number
    segmentation: string
    targetMuscles: string[]
  }[]
}

export interface PlanGeneratorInput {
  target: string
  level: string
  age: number
  weight: number
  gender: number
  weeks: WeekInput[]
}

/**
 * ساختار خروجی یک تمرین نهایی
 */
export interface GeneratedExercise {
  id: string
  name: string
  mechanics: string | null
  difficulty_level: string | null
  body_region: string | null
  // فیلدهای احتمالی دیگر از ExerciseEntity...
  restBetweenSets: number
  exercise_weight: number
  number_of_sets: number
  repsPerSet: number
}

/**
 * ساختار یک جلسه تمرینی در خروجی
 */
export interface GeneratedSession {
  index: number
  split: string
  targetMuscles: string[]
  cooldownActivities: string[]
  warmupActivities: string[]
  cooldownDuration_ground: number
  cooldownDuration_ceiling: number
  warmupDuration_ground: number
  warmupDuration_ceiling: number
  recoveryTime: number
  sessionDuration: number
  exercises: GeneratedExercise[]
}

/**
 * ساختار یک هفته
 */
export interface GeneratedWeek {
  index: number
  loadIncrement: string
  deload: string
  sessions: GeneratedSession[]
}

/**
 * تابع جدید که جایگزین plan_generator.js شده و فقط منطق ساخت برنامه را انجام می‌دهد.
 * در بخش فیلترکردن آرایه‌ی تمرین‌ها، همان شرایط کوئری قدیمی لحاظ می‌شود تا خروجی منطبق باشد.
 */
export function generatePlan(input: PlanGeneratorInput): GeneratedWeek[] {
  // اطلاعات بالادستی برنامه (LoadIncrement, Deload)
  const workout_plan_info = getPlanInstructions(input.level)

  // کل لیست تمرین‌ها از حافظه
  const allExercises = getAllExercisesArray()
  if (!allExercises || allExercises.length === 0) {
    throw new AppError('PLAN_NO_EXERCISES_FOUND', 'No exercises loaded in memory', 400)
  }

  // جهت منطبق‌سازی سطح سختی:
  const levels = ['novice', 'beginner', 'intermediate', 'advanced', 'expert']
  const userLevelIndex = levels.indexOf(input.level.toLowerCase())
  // اگر مثلاً userLevelIndex=2 یعنی حداکثر اجازه difficulty_level='intermediate' را می‌دهیم

  const weeks: GeneratedWeek[] = []

  for (const w of input.weeks) {
    const weekData: GeneratedWeek = {
      index: w.week,
      loadIncrement: workout_plan_info.loadIncrement,
      deload: workout_plan_info.deload,
      sessions: [],
    }

    for (const sessionItem of w.sessions) {
      // اول از session_instructions منطق تعداد تمرین و غیره را می‌گیریم
      const sessionInfo = getSessionInstructions({
        age: input.age,
        gender: input.gender,
        target: input.target,
        level: input.level,
        target_muscle_groups: sessionItem.targetMuscles,
      })

      // ساختار جلسه
      const sessionData: GeneratedSession = {
        index: sessionItem.session,
        split: sessionItem.segmentation,
        targetMuscles: sessionItem.targetMuscles,
        cooldownActivities: sessionInfo.cooldownActivities,
        warmupActivities: sessionInfo.warmupActivities,
        cooldownDuration_ground: sessionInfo.cooldownDuration_ground,
        cooldownDuration_ceiling: sessionInfo.cooldownDuration_ceiling,
        warmupDuration_ground: sessionInfo.warmupDuration_ground,
        warmupDuration_ceiling: sessionInfo.warmupDuration_ceiling,
        recoveryTime: sessionInfo.recoveryTime,
        sessionDuration: sessionInfo.sessionDuration,
        exercises: [],
      }

      // منطق فیلتر: EXACT همان شرایط کوئری
      //  (age_ground <= input.age AND age_ceiling >= input.age)
      //  (weight_ground <= input.weight AND weight_ceiling >= input.weight)
      //  (gender = input.gender OR gender IS NULL)
      //  (target = input.target OR target IS NULL)
      //  difficulty_level IN (levels.slice(0..userLevelIndex))
      //  (target_muscle_group IN sessionItem.targetMuscles OR target_muscle_group IS NULL)
      const muscleValues = sessionItem.targetMuscles

      // اعمال فیلتر
      const filtered = allExercises.filter((ex) => {
        // شرط سن
        if (ex.age_ground !== null && ex.age_ground > input.age)
          return false
        if (ex.age_ceiling !== null && ex.age_ceiling < input.age)
          return false

        // شرط وزن
        if (ex.weight_ground !== null && ex.weight_ground > input.weight)
          return false
        if (ex.weight_ceiling !== null && ex.weight_ceiling < input.weight)
          return false

        // شرط جنسیت
        if (ex.gender !== null && ex.gender !== input.gender)
          return false

        // شرط target
        if (ex.target !== null && ex.target !== input.target)
          return false

        // شرط difficulty_level
        if (ex.difficulty_level) {
          const exLevelIndex = levels.indexOf(ex.difficulty_level.toLowerCase())
          // اگر difficulty_level در آرایه‌ی levels نباشد (exLevelIndex=-1) => رد
          // یا اگر بالاتر از سطح کاربر باشد => رد
          if (exLevelIndex === -1 || exLevelIndex > userLevelIndex)
            return false
        }

        // شرط muscle group
        // اگر muscleValues.length > 0 باشد، باید ex.target_muscle_group:
        //  (در آن muscleValues باشد) OR null
        if (muscleValues.length > 0) {
          if (
            ex.target_muscle_group !== null
            && !muscleValues.includes(ex.target_muscle_group)
          ) {
            return false
          }
        }

        return true
      })

      // رندم‌کردن
      shuffleArray(filtered)

      // تعیین limit:
      //  sessionInfo.number_of_exercises_per_muscle * sessionItem.targetMuscles.length
      const limitCount
        = sessionInfo.number_of_exercises_per_muscle * sessionItem.targetMuscles.length

      const chosenExercises = filtered.slice(0, limitCount)

      // حالا برای هرتمرین، اطلاعات مربوط به sets/reps/... را از exercise_instructions می‌گیریم
      const finalExercises: GeneratedExercise[] = chosenExercises.map((ex) => {
        const exInstr = getExerciseInstructions({
          age: input.age,
          gender: input.gender,
          target: input.target,
          level: input.level,
          mechanics: ex.mechanics || '',
          target_muscle_groups: sessionItem.targetMuscles,
        })

        return {
          ...ex,
          restBetweenSets: exInstr.restBetweenSets,
          exercise_weight: exInstr.exercise_weight,
          number_of_sets: exInstr.number_of_sets,
          repsPerSet: exInstr.repsPerSet,
        }
      })

      sessionData.exercises = finalExercises
      weekData.sessions.push(sessionData)
    }

    weeks.push(weekData)
  }

  return weeks
}

/**
 * تابع شافل کردن آرایه (مشابه ORDER BY RANDOM())
 */
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}
