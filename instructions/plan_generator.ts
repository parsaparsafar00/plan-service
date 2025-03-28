import { AppError } from '@amard/error-handling'
import { getAllExercisesArray } from '../data-access/exercise-repository.js'
import { getExerciseInstructions } from './exercise_instructions.js'
import { getPlanInstructions } from './plan_instructions.js'
import { getSessionInstructions } from './session_instructions.js'

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
  difficultyLevel: string | null
  bodyRegion: string | null
  // ... بقیه ستون‌ها در صورت نیاز
  restBetweenSets: number
  exerciseWeight: number
  numberOfSets: number
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
  cooldownDurationGround: number
  cooldownDurationCeiling: number
  warmupDurationGround: number
  warmupDurationCeiling: number
  recoveryTime: number
  sessionDuration: number
  exercises: GeneratedExercise[]
}

/**
 * ساختار یک هفته در خروجی
 */
export interface GeneratedWeek {
  index: number
  loadIncrement: string
  deload: string
  sessions: GeneratedSession[]
}

/**
 * تولید برنامه تمرینی بر اساس داده‌های داخل ورودی کاربر و داده های موجود در متغیر سراسری حرکات
 */
export function generatePlan(input: PlanGeneratorInput): GeneratedWeek[] {
  // استفاده از دستورالعمل های مربوط به برنامه تمرینی
  const workoutPlanInfo = getPlanInstructions(input.level)

  const allExercises = getAllExercisesArray()
  if (!allExercises || allExercises.length === 0)
    throw new AppError('PLAN_NO_EXERCISES_FOUND', 'No exercises loaded in memory', 400)

  const levels = ['novice', 'beginner', 'intermediate', 'advanced', 'expert']
  const userLevelIndex = levels.indexOf(input.level.toLowerCase())

  const weeks: GeneratedWeek[] = []

  for (const w of input.weeks) {
    const weekData: GeneratedWeek = {
      index: w.week,
      loadIncrement: workoutPlanInfo.loadIncrement,
      deload: workoutPlanInfo.deload,
      sessions: [],
    }

    for (const sessionItem of w.sessions) {
      // استفاده از دستورالعمل های مربوط به جلسه تمرینی
      const sessionInfo = getSessionInstructions({
        age: input.age,
        gender: input.gender,
        target: input.target,
        level: input.level,
        target_muscle_groups: sessionItem.targetMuscles,
      })

      const sessionData: GeneratedSession = {
        index: sessionItem.session,
        split: sessionItem.segmentation,
        targetMuscles: sessionItem.targetMuscles,
        cooldownActivities: sessionInfo.cooldownActivities,
        warmupActivities: sessionInfo.warmupActivities,
        cooldownDurationGround: sessionInfo.cooldownDuration_ground,
        cooldownDurationCeiling: sessionInfo.cooldownDuration_ceiling,
        warmupDurationGround: sessionInfo.warmupDuration_ground,
        warmupDurationCeiling: sessionInfo.warmupDuration_ceiling,
        recoveryTime: sessionInfo.recoveryTime,
        sessionDuration: sessionInfo.sessionDuration,
        exercises: [],
      }

      const muscleValues = sessionItem.targetMuscles
      let chosen_exercises = [];
      // منطق فیلترینگ
      const filtered = allExercises.filter((ex) => {
        // فیلتر بر اساس سن
        if (ex.ageGround && ex.ageGround > input.age)
          return false
        if (ex.ageCeiling && ex.ageCeiling < input.age)
          return false

        // فیلتر بر اساس وزن
        if (ex.weightGround && ex.weightGround > input.weight)
          return false
        if (ex.weightCeiling && ex.weightCeiling < input.weight)
          return false

        // فیلتر بر اساس جنسیت
        if (ex.gender !== null && ex.gender !== input.gender)
          return false

        // فیلتر بر اساس هدف تمرین شخص
        if (ex.target && ex.target !== input.target)
          return false

        // فیلتر بر اساس درجه سختی حرکت
        if (ex.difficultyLevel) {
          const exLevelIndex = levels.indexOf(ex.difficultyLevel.toLowerCase())
          if (exLevelIndex === -1 || exLevelIndex > userLevelIndex)
            return false
        }

        // فیلتر بر اساس عضلات هدف
        if (muscleValues.length > 0 && ex.targetMuscleGroup) {
          if (!muscleValues.includes(ex.targetMuscleGroup))
            return false
        }
        return true
      });

      // شافل کردن آرایه برای انتخاب رندوم حرکات
      shuffleArray(filtered)

      // به ازای هر کدوم از حرکات، باید به تعدادی که دستور داده شده، حرکت انتخاب بشه
      chosen_exercises = [];
      for (const muscleGroup of muscleValues) {
        const exercisesForMuscle = filtered.filter(ex => ex.targetMuscleGroup === muscleGroup || ex.targetMuscleGroup);
        chosen_exercises.push(...exercisesForMuscle.slice(0, sessionInfo.number_of_exercises_per_muscle));
      }
      
      // استفاده از دستورالعمل های مربوط به حرکات بدنسازی
      const finalExercises = chosen_exercises.map((ex) => {
        const exInstr = getExerciseInstructions({
          age: input.age,
          gender: input.gender,
          target: input.target,
          level: input.level,
          mechanics: ex.mechanics || '',
          target_muscle_groups: muscleValues,
        });

        return {
          ...ex,
          restBetweenSets: exInstr.restBetweenSets,
          exerciseWeight: exInstr.exercise_weight,
          numberOfSets: exInstr.number_of_sets,
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

function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}
