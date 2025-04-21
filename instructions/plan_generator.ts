import { AppError } from '@amard/error-handling'
import { getAllExercisesArray } from '../data-access/exercise-repository.js'
import { getExerciseInstructions } from './exercise_instructions.js'
// import { getPlanInstructions } from './plan_instructions.js' // نیازی به داشتن دستورالعمل های سطح برنامه در نسخه های فعلی نداریم 
import { getSessionInstructions } from './session_instructions.js'
import * as PlanSchemas from '../domain/schemas/plan-schema.js'
import * as exerciseSchema from '../domain/schemas/exercise-schema.js'

/**
 * تولید حلسه تمرینی توسط هوش مصنوعی بر اساس داده‌های ورودی کاربر و حرکات موجود در متغیر سراسری حرکات
 */
export function AISessionGenerator(sessionInput: PlanSchemas.GeneratePlanRequestType): PlanSchemas.sessionOutputType {
  const level = sessionInput.traineeInfo.level
  const age = sessionInput.traineeInfo.age
  const gender = sessionInput.traineeInfo.gender
  const weight = sessionInput.traineeInfo.weight
  const muscleValues = sessionInput.targetMuscles

  if (!level) throw new AppError("PLAN_STUDENT_LEVEL_INVALID", "No exercises loaded in memory", 400);

  const allExercises = getAllExercisesArray()
  if (!allExercises || allExercises.length === 0) throw new AppError('PLAN_NO_EXERCISES_FOUND', 'No exercises loaded in memory', 400)

  const levels = ['novice', 'beginner', 'intermediate', 'advanced', 'expert']
  const userLevelIndex = levels.indexOf(level.toLowerCase())

  // استفاده از دستورالعمل های مربوط به جلسات تمرینی
  const sessionInfo = getSessionInstructions({
    age: age,
    gender: gender,
    target: sessionInput.target,
    level: level,
    target_muscle_groups: muscleValues,
  });

  const sessionData: PlanSchemas.sessionOutputType = {
    targetMuscles: muscleValues,
    weeks: sessionInput.weeks,
    description: '', // وقتی هوش مصنوعی برنامه تولید میکنه، توضیحات خالی خواهد بود
    cooldownActivities: sessionInfo.cooldownActivities,
    warmupActivities: sessionInfo.warmupActivities,
    cooldownDuration: sessionInfo.cooldownDuration_ground  + " تا " + sessionInfo.cooldownDuration_ceiling + " دقیقه",
    warmupDuration: sessionInfo.warmupDuration_ground  + " تا " + sessionInfo.warmupDuration_ceiling + " دقیقه",
    recoveryTime: sessionInfo.recoveryTime_ground + " تا " + sessionInfo.recoveryTime_ceiling + " ساعت",
    sessionDuration: sessionInfo.sessionDuration_ground + " تا " + sessionInfo.sessionDuration_ceiling + " ساعت",
    exercises: [],
  }

  let chosen_exercises = [];
  // منطق فیلترینگ
  const filtered = allExercises.filter((ex) => {
    
    // فیلتر حرکاتی ک فیلم آموزشی دارند
    if (!ex.shortYoutubeDemonstration || ex.shortYoutubeDemonstration == '' || ex.shortYoutubeDemonstration == null)
      return false
    
    // فیلتر بر اساس سن
    if (ex.ageGround && ex.ageGround > age)
      return false
    if (ex.ageCeiling && ex.ageCeiling < age)
      return false

    // فیلتر بر اساس وزن
    if (ex.weightGround && ex.weightGround > weight)
      return false
    if (ex.weightCeiling && ex.weightCeiling < weight)
      return false

    // فیلتر بر اساس جنسیت
    if (ex.gender !== null && ex.gender !== gender)
      return false

    // فیلتر بر اساس هدف تمرین شخص
    if (ex.target && ex.target !== sessionInput.target)
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

  // فیلتر نهایی حرکات بدنسازی
  const finalExercises = chosen_exercises.map((ex) => {
    // استفاده از دستورالعمل های مربوط به حرکات بدنسازی
    const exInstr = getExerciseInstructions({
      gender: gender,
      target: sessionInput.target,
      mechanics: ex.mechanics || '',
      level: level,
      target_muscle_groups: muscleValues
    });
    
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

    const exData : exerciseSchema.exerciseOutputInPlanType = {
      number: ex.number, // صرفا شماره حرکت رو در جدول برنامه ها ذخیره میکنیم و زمانی که نیاز به نشان دادن برنامه بود، حرکت رو بر حسب شمارش پیدا میکنیم
      restBetweenSets: restBestweenSets,
      weightPercentage: weightPercentage,
      system: repeatSystem,
      systemMethod: 'دلخواه',
    }

    return exData
  });
  
  sessionData.exercises = finalExercises
  return sessionData
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