import { AppError } from '@amard/error-handling'
import { getAllExercisesArray } from '../data-access/exercise-repository.js'
import { getExerciseInstructions } from './exercise_instructions.js'
import { getPlanInstructions } from './plan_instructions.js'
import { getSessionInstructions } from './session_instructions.js'
// import { getWeekInstructions } from './week_instructions.js'
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

    // const weekInfo = getWeekInstructions({
    //   gender: input.gender,
    //   target: input.target,
    //   level: input.level
    // });
    
    const weekData: PlanSchemas.weekOutputType = {
      number: w.number,
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
        
        // فیلتر حرکاتی ک فیلم آموزشی دارند
        if (!ex.shortYoutubeDemonstration || ex.shortYoutubeDemonstration == '' || ex.shortYoutubeDemonstration == null)
          return false
        
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
        if (muscleValues.length > 0) {
          for (let i=0; i <= muscleValues.length - 1; i++) {
            if (muscleValues[i] !== ex.targetMuscleGroup) {
              if (i === muscleValues.length - 1) return false;
            } else {
              break
            }
          }
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
          gender: input.gender,
          target: input.target,
          mechanics: ex.mechanics || '',
          level: input.level,
          target_muscle_groups: muscleValues
        });

        let exData: PlanSchemas.printingExerciseOutputType | PlanSchemas.exerciseOutputType;
        
        //  انتخاب رندوم تعداد تکرار ها و تعداد ست ها بر اساس مقدار ماکسیمم و مینیمم ممکن
        let numberOfSets = Math.floor(Math.random() * (exInstr.numberOfSetsCeiling - exInstr.numberOfSetsGround + 1)) + exInstr.numberOfSetsGround;
        let repeatSystem = []

        for (let s=1; s <= numberOfSets; s++) {
          let repeatsPerSet = Math.floor(Math.random() * (exInstr.repeatsPerSetCeiling - exInstr.repeatsPerSetGround + 1)) + exInstr.repeatsPerSetGround;
          repeatSystem.push(repeatsPerSet);
        }


        const restBestweenSets = getRandomMultipleOf5(exInstr.restBetweenSetsGround, exInstr.restBetweenSetsCeiling);
        let weightPercentage
        if (ex.primaryEquipment == "bodyweight") weightPercentage = "وزن بدن"
        else weightPercentage = getRandomMultipleOf5(exInstr.weightGroundPercentage, exInstr.weightCeilingPercentage).toString();

        if (input.printingPlan && input.printingPlan == true) {
        exData = {
          number: ex.number,
          name: ex.name,
          nameFa: ex.nameFa,
          restBetweenSets: restBestweenSets,
          weightPercentage: weightPercentage,
          system: repeatSystem,
        }
      } else {
        exData = {
          ...ex,
          restBetweenSets: restBestweenSets,
          weightPercentage: weightPercentage,
          system: repeatSystem,
        }
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

function getRandomMultipleOf5(min: number, max: number): number {
  // Ensure min <= max (swap if needed)
  const [lower, upper] = [Math.min(min, max), Math.max(min, max)];
  
  // Find the nearest multiples of 5 within the range
  const lowerBound = Math.ceil(lower / 5) * 5;  // Round up to nearest 5
  const upperBound = Math.floor(upper / 5) * 5; // Round down to nearest 5

  // If no multiples of 5 in range, return NaN or handle error
  if (lowerBound > upperBound) return NaN; // (Or throw an error)

  // Generate a random multiple of 5
  const randomSteps = Math.floor(Math.random() * ((upperBound - lowerBound) / 5 + 1));
  return lowerBound + randomSteps * 5;
}