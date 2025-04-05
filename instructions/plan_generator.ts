import { AppError } from '@amard/error-handling'
import { getAllExercisesArray } from '../data-access/exercise-repository.js'
import { getExerciseInstructions } from './exercise_instructions.js'
import { getPlanInstructions } from './plan_instructions.js'
import { getSessionInstructions } from './session_instructions.js'
import { getWeekInstructions } from './week_instructions.js'
import * as PlanSchemas from '../domain/plan-schema.js'

/**
 * تولید برنامه تمرینی بر اساس داده‌های داخل ورودی کاربر و داده های موجود در متغیر سراسری حرکات
 */

export function generatePlan(input: PlanSchemas.planInputSchema): PlanSchemas.planOutputType[] {
  // استفاده از دستورالعمل های مربوط به برنامه تمرینی
  if (!input.level) throw new AppError("PLAN_STUDENT_LEVEL_INVALID", "No exercises loaded in memory", 400);
  const workoutPlanInfo = getPlanInstructions(input.level)

  const allExercises = getAllExercisesArray()
  if (!allExercises || allExercises.length === 0) throw new AppError('PLAN_NO_EXERCISES_FOUND', 'No exercises loaded in memory', 400)

  const levels = ['novice', 'beginner', 'intermediate', 'advanced', 'expert']
  const userLevelIndex = levels.indexOf(input.level.toLowerCase())
  const plan : PlanSchemas.planOutputType = {     
    load: workoutPlanInfo.loadIncrement,
    deload: workoutPlanInfo.deload,
    weeks: []
  }
  const weeks: PlanSchemas.weekOutputType[] = []

  for (const w of input.weeks) {
    const weekInfo = getWeekInstructions({
      gender: input.gender,
      target: input.target,
      level: input.level
    });

    const repeatsPerSet = Math.ceil((weekInfo.repeatsPerSetCeiling + weekInfo.repeatsPerSetGround) / 2)
    const numberOfSets = Math.ceil((weekInfo.numberOfSetsCeiling + weekInfo.numberOfSetsGround) / 2)
    
    const weekData: PlanSchemas.weekOutputType = {
      name: "هفته " + w.week,
      system: numberOfSets + " × " + repeatsPerSet,
      weightCeiling: weekInfo.weightCeilingPercentage,
      weightGround: weekInfo.weightCeilingPercentage,
      sessions: []
    }

    for (const sessionItem of w.sessions) {

      // استفاده از دستورالعمل های مربوط به جلسات تمرینی
      const sessionInfo = getSessionInstructions({
        age: input.age,
        gender: input.gender,
        target: input.target,
        level: input.level,
        target_muscle_groups: sessionItem.targetMuscles,
      });

      const sessionData: PlanSchemas.sessionOutputType = {
        index: sessionItem.session,
        targetMuscles: sessionItem.targetMuscles,
        number_of_exercises_per_muscle_set: sessionInfo.number_of_exercises_per_muscle_set,
        cooldownActivities: sessionInfo.cooldownActivities,
        warmupActivities: sessionInfo.warmupActivities,
        cooldownDuration: sessionInfo.cooldownDuration_ground  + " تا " + sessionInfo.cooldownDuration_ceiling + " دقیقه",
        warmupDuration: sessionInfo.warmupDuration_ground  + " تا " + sessionInfo.warmupDuration_ceiling + " دقیقه",
        recoveryTime: sessionInfo.recoveryTime_ground + " تا " + sessionInfo.recoveryTime_ceiling + " ساعت",
        sessionDuration: sessionInfo.sessionDuration_ground + " تا " + sessionInfo.sessionDuration_ceiling + " ساعت",
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
          if (!muscleValues.includes(ex.targetMuscleGroup)
             && (ex.primeMoverMuscle && !muscleValues.includes(ex.primeMoverMuscle)|| !ex.primeMoverMuscle)
             && (ex.secondaryMuscle && !muscleValues.includes(ex.secondaryMuscle) || !ex.secondaryMuscle)
             && (ex.tertiaryMuscle && !muscleValues.includes(ex.tertiaryMuscle)) || !ex.tertiaryMuscle)
            return false
        } else {
          return false
        }

        return true
      });

      // شافل کردن آرایه برای انتخاب رندوم حرکات
      shuffleArray(filtered)

      // به ازای هر کدوم از حرکات، باید به تعدادی که دستور داده شده، حرکت انتخاب بشه
      chosen_exercises = [];
      for (const i in muscleValues) {
        const exercisesForMuscle = filtered.filter(ex => ex.targetMuscleGroup === muscleValues[i] || ex.targetMuscleGroup);
        chosen_exercises.push(...exercisesForMuscle.slice(0, sessionInfo.number_of_exercises_per_muscle_set[i]));
      }

      // استفاده از دستورالعمل های مربوط به حرکات بدنسازی
      const finalExercises = chosen_exercises.map((ex) => {
        const exInstr = getExerciseInstructions({
          age: input.age,
          target: input.target,
          mechanics: ex.mechanics || '',
          repeatsPerSetGround: weekInfo.repeatsPerSetGround,
          repeatsPerSetCeiling: weekInfo.repeatsPerSetCeiling
        });

        return {
          ...ex,
          restBetweenSetsCeiling: exInstr.restBetweenSetsCeiling,
          restBetweenSetsGround: exInstr.restBetweenSetsGround,
        }
      })
      sessionData.exercises = finalExercises
      weekData.sessions.push(sessionData)
    }

    weeks.push(weekData)
  }

  plan.weeks = weeks
  return plan
}

/**
 * تولید برنامه تمرینی بر اساس داده‌های داخل ورودی کاربر و داده های موجود در متغیر سراسری حرکات
 */
export function printGeneratePlan(input: PlanSchemas.planInputSchema): PlanSchemas.planOutputType[] {

  // استفاده از دستورالعمل های مربوط به برنامه تمرینی
  if (!input.level) throw new AppError("PLAN_STUDENT_LEVEL_INVALID", "No exercises loaded in memory", 400);
  const workoutPlanInfo = getPlanInstructions(input.level)

  const allExercises = getAllExercisesArray()
  if (!allExercises || allExercises.length === 0) throw new AppError('PLAN_NO_EXERCISES_FOUND', 'No exercises loaded in memory', 400)

  const levels = ['novice', 'beginner', 'intermediate', 'advanced', 'expert']
  const userLevelIndex = levels.indexOf(input.level.toLowerCase())
  const plan : PlanSchemas.planOutputType = {     
    load: workoutPlanInfo.loadIncrement,
    deload: workoutPlanInfo.deload,
    weeks: []
  }
  const weeks: PlanSchemas.weekOutputType[] = []

  for (const w of input.weeks) {
    const weekInfo = getWeekInstructions({
      gender: input.gender,
      target: input.target,
      level: input.level
    });

    const repeatsPerSet = Math.ceil((weekInfo.repeatsPerSetCeiling + weekInfo.repeatsPerSetGround) / 2)
    const numberOfSets = Math.ceil((weekInfo.numberOfSetsCeiling + weekInfo.numberOfSetsGround) / 2)

    const weekData: PlanSchemas.weekOutputType = {
      name: "هفته " + w.week,
      system: numberOfSets + " × " + repeatsPerSet,
      weightCeiling: weekInfo.weightCeilingPercentage,
      weightGround: weekInfo.weightCeilingPercentage,
      sessions: []
    }

    for (const sessionItem of w.sessions) {

      // استفاده از دستورالعمل های مربوط به جلسات تمرینی
      const sessionInfo = getSessionInstructions({
        age: input.age,
        gender: input.gender,
        target: input.target,
        level: input.level,
        target_muscle_groups: sessionItem.targetMuscles,
      });

      const sessionData: PlanSchemas.printingSessionOutputType = {
        index: sessionItem.session,
        targetMuscles: sessionItem.targetMuscles,
        cooldownActivities: sessionInfo.cooldownActivities,
        warmupActivities: sessionInfo.warmupActivities,
        cooldownDuration: sessionInfo.cooldownDuration_ground  + " تا " + sessionInfo.cooldownDuration_ceiling + " دقیقه",
        warmupDuration: sessionInfo.warmupDuration_ground  + " تا " + sessionInfo.warmupDuration_ceiling+ " دقیقه",
        recoveryTime: sessionInfo.recoveryTime_ground + " تا " + sessionInfo.recoveryTime_ceiling + " ساعت",
        sessionDuration: sessionInfo.sessionDuration_ground + " تا " + sessionInfo.sessionDuration_ceiling + " ساعت",
        exercises: [],
      }

      const muscleValues = sessionItem.targetMuscles
      let chosen_exercises = [];

      // منطق فیلترینگ
      const filtered = allExercises.filter((ex) => {
        // فیلتر بر اساس سن
        if (ex.ageGround && ex.ageGround > input.age) return false
        if (ex.ageCeiling && ex.ageCeiling < input.age) return false

        // فیلتر بر اساس وزن
        if (ex.weightGround && ex.weightGround > input.weight) return false
        if (ex.weightCeiling && ex.weightCeiling < input.weight) return false

        // فیلتر بر اساس جنسیت
        if (ex.gender && ex.gender !== input.gender) return false

        // فیلتر بر اساس هدف تمرین شخص
        if (ex.target && ex.target !== input.target) return false

        // فیلتر بر اساس درجه سختی حرکت
        if (ex.difficultyLevel) {
          const exLevelIndex = levels.indexOf(ex.difficultyLevel.toLowerCase())
          if (exLevelIndex === -1 || exLevelIndex > userLevelIndex) return false
        }

        // فیلتر بر اساس عضلات هدف
        if (muscleValues.length > 0 && ex.targetMuscleGroup) {
          if (!muscleValues.includes(ex.targetMuscleGroup)
             && (ex.primeMoverMuscle && !muscleValues.includes(ex.primeMoverMuscle)|| !ex.primeMoverMuscle)
             && (ex.secondaryMuscle && !muscleValues.includes(ex.secondaryMuscle) || !ex.secondaryMuscle)
             && (ex.tertiaryMuscle && !muscleValues.includes(ex.tertiaryMuscle)) || !ex.tertiaryMuscle)
            return false
        } else {
          return false
        }

        return true
      });

      // شافل کردن آرایه برای انتخاب رندوم حرکات
      shuffleArray(filtered)
      // به ازای هر کدوم از حرکات، باید به تعدادی که دستور داده شده، حرکت انتخاب بشه
      chosen_exercises = [];
      let exercisesForMuscle = []
      for (let i = 0; i < muscleValues.length; i++) {
        exercisesForMuscle = filtered.filter(
          ex => ex.targetMuscleGroup === muscleValues[i] 
          || ex.primeMoverMuscle === muscleValues[i] 
          || ex.secondaryMuscle === muscleValues[i] 
          || ex.tertiaryMuscle === muscleValues[i]);
        chosen_exercises.push(...exercisesForMuscle.slice(0, sessionInfo.number_of_exercises_per_muscle_set[i]));
      }
      
      // استفاده از دستورالعمل های مربوط به حرکات بدنسازی
      const finalExercises = chosen_exercises.map((ex) => {
        const exInstr = getExerciseInstructions({
          age: input.age,
          target: input.target,
          mechanics: ex.mechanics || '',
          repeatsPerSetGround: weekInfo.repeatsPerSetGround,
          repeatsPerSetCeiling: weekInfo.repeatsPerSetCeiling
        });


        const exData: PlanSchemas.printingExerciseOutputType = {
          name: ex.name,
          nameFa: ex.nameFa,
          restBetweenSetsCeiling: exInstr.restBetweenSetsCeiling,
          restBetweenSetsGround: exInstr.restBetweenSetsGround,
        }
        return exData
      });

      sessionData.exercises = finalExercises
      weekData.sessions.push(sessionData)
    }

    weeks.push(weekData)
  }
  plan.weeks = weeks
  return plan

}

function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}
