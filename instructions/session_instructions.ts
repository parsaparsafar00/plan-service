export interface SessionInstructionInput {
  age: number
  gender: number
  target: string
  level: string
  target_muscle_groups: string[]
}

export interface SessionInstructionResult {
  recoveryTime: number
  number_of_exercises_per_muscle: number
  sessionDuration: number
  warmupDuration_ceiling: number
  warmupDuration_ground: number
  cooldownDuration_ceiling: number
  cooldownDuration_ground: number
  warmupActivities: string[]
  cooldownActivities: string[]
}

export function getSessionInstructions({ age, gender, target, level, target_muscle_groups }: SessionInstructionInput): SessionInstructionResult {
  // let age = global.age; // Age of the individual
  // let target_muscle_groups = global.target_muscle_groups;
  // let gender = global.gender; // 0 for male, 1 for female
  // let target = global.target;
  // let level = global.level;

  let recoveryTime_ceiling: number
  let recoveryTime_ground: number
  let number_of_exercises_per_muscle: number
  let warmupDuration_ceiling: number
  let warmupDuration_ground: number
  let cooldownDuration_ceiling: number
  let cooldownDuration_ground: number
  let warmupActivities: string[] = []
  let cooldownActivities: string[] = []

  // Recovery Periods Logic
  if (target_muscle_groups.some(item => ['Chest', 'Back', 'Abductors', 'Adductors'].includes(item))) {
    if (gender === 0) {
      recoveryTime_ceiling = 72
      recoveryTime_ground = 48
    }
    else {
      recoveryTime_ceiling = 60
      recoveryTime_ground = 36
    }
  }
  else if (target_muscle_groups.some(item => ['Biceps', 'Triceps', 'Shoulders', 'Calves'].includes(item))) {
    if (gender === 0) {
      recoveryTime_ceiling = 48
      recoveryTime_ground = 24
    }
    else {
      recoveryTime_ceiling = 36
      recoveryTime_ground = 18
    }
  }
  else if (target === 'hypertrophy') {
    if (gender === 0) {
      recoveryTime_ceiling = 72
      recoveryTime_ground = 48
    }
    else {
      recoveryTime_ceiling = 60
      recoveryTime_ground = 36
    }
  }
  else if (target === 'endurance') {
    if (gender === 0) {
      recoveryTime_ceiling = 48
      recoveryTime_ground = 24
    }
    else {
      recoveryTime_ceiling = 36
      recoveryTime_ground = 18
    }
  }

  if (age > 40) {
    recoveryTime_ceiling += 24
    recoveryTime_ground += 12
  }

  const recoveryTime = Number.parseInt(((recoveryTime_ceiling + recoveryTime_ground) / 2).toString())

  // Determine session duration based on level and target
  let sessionDuration_ceiling: number
  let sessionDuration_ground: number

  if (level === 'beginner' || level === 'novice') {
    sessionDuration_ceiling = 45
    sessionDuration_ground = 30
    if (target === 'strength') {
      sessionDuration_ceiling = 45
    }
    else {
      sessionDuration_ground = 30
    }
  }
  else if (level === 'intermediate') {
    sessionDuration_ceiling = 60
    sessionDuration_ground = 45
    if (target === 'strength') {
      sessionDuration_ceiling = 60
    }
    else if (target === 'hypertrophy') {
      sessionDuration_ceiling = 75
    }
    else {
      sessionDuration_ground = 55
    }
  }
  else {
    // level === "advanced" or level === "expert"
    if (gender === 0) {
      sessionDuration_ceiling = 90
      sessionDuration_ground = 60
    }
    else {
      sessionDuration_ceiling = 90
      sessionDuration_ground = 75
    }
  }

  if (age >= 40) {
    sessionDuration_ceiling -= 10
    sessionDuration_ground -= 10
    if (target === 'endurance') {
      sessionDuration_ground += 10
      sessionDuration_ceiling += 10
    }
  }

  const sessionDuration = Number.parseInt(((sessionDuration_ground + sessionDuration_ceiling) / 2).toString())

  // Number of exercises per muscle group
  if (target === 'hypertrophy') {
    if (level === 'beginner') {
      number_of_exercises_per_muscle = 1
    }
    else if (level === 'novice') {
      number_of_exercises_per_muscle = 2
    }
    else if (level === 'intermediate') {
      number_of_exercises_per_muscle = 3
    }
    else if (level === 'advanced') {
      number_of_exercises_per_muscle = 4
    }
    else {
      // expert
      number_of_exercises_per_muscle = 5
    }
  }
  else if (target === 'strength') {
    if (level === 'beginner') {
      number_of_exercises_per_muscle = 1
    }
    else if (level === 'novice') {
      number_of_exercises_per_muscle = 2
    }
    else if (level === 'intermediate') {
      number_of_exercises_per_muscle = 2
    }
    else if (level === 'advanced') {
      number_of_exercises_per_muscle = 3
    }
    else {
      // expert
      number_of_exercises_per_muscle = 4
    }
  }
  else if (target === 'endurance') {
    if (level === 'beginner') {
      number_of_exercises_per_muscle = 1
    }
    else if (level === 'novice') {
      number_of_exercises_per_muscle = 2
    }
    else if (level === 'intermediate') {
      number_of_exercises_per_muscle = 2
    }
    else if (level === 'advanced') {
      number_of_exercises_per_muscle = 3
    }
    else {
      // expert
      number_of_exercises_per_muscle = 4
    }
  }
  else {
    // general fitness
    if (level === 'beginner') {
      number_of_exercises_per_muscle = 1
    }
    else if (level === 'novice') {
      number_of_exercises_per_muscle = 2
    }
    else if (level === 'intermediate') {
      number_of_exercises_per_muscle = 2
    }
    else if (level === 'advanced') {
      number_of_exercises_per_muscle = 3
    }
    else {
      // expert
      number_of_exercises_per_muscle = 4
    }
  }

  // Determine warm-up and cool-down based on gender and level
  if (gender === 0) {
    if (level === 'beginner' || level === 'novice') {
      warmupDuration_ceiling = 10
      warmupDuration_ground = 5
      cooldownDuration_ceiling = 10
      cooldownDuration_ground = 5
      warmupActivities = ['تمرینات هوازی سبک', 'کشش‌های پویا', 'حرکات افزایش دامنه حرکتی']
      cooldownActivities = ['راه رفتن سبک', 'کشش‌های ایستا', 'تمرینات تنفسی']
    }
    else if (level === 'intermediate') {
      warmupDuration_ceiling = 15
      warmupDuration_ground = 10
      cooldownDuration_ceiling = 10
      cooldownDuration_ground = 5
      warmupActivities = ['تمرینات هوازی متوسط', 'حرکات تحرک پویا', 'ست‌های گرم کردنی سبک']
      cooldownActivities = ['کاردیو با سرعت کم', 'کشش‌های ایستا', 'ماساژ با فوم رولر']
    }
    else {
      // level === "advanced" or level === "expert
      warmupDuration_ceiling = 20
      warmupDuration_ground = 15
      cooldownDuration_ceiling = 15
      cooldownDuration_ground = 10
      warmupActivities = ['تمرینات هوازی با شدت بالا', 'فعال‌سازی سیستم عصبی مرکزی', 'حرکات پویا']
      cooldownActivities = ['کشش‌های ایستا عمیق', 'ماساژ با فوم رولر', 'سرد کردن تدریجی']
    }
  }
  else {
    if (level === 'beginner' || level === 'novice') {
      warmupDuration_ceiling = 12
      warmupDuration_ground = 7
      cooldownDuration_ceiling = 12
      cooldownDuration_ground = 5
      warmupActivities = ['تمرینات هوازی سبک', 'کشش‌های پویا', 'حرکات افزایش دامنه مفصلی']
      cooldownActivities = ['راه رفتن سبک', 'کشش‌های ایستا', 'تمرینات تنفسی', 'ریلکسیشن بر پایه یوگا']
    }
    else if (level === 'intermediate') {
      warmupDuration_ceiling = 18
      warmupDuration_ground = 12
      cooldownDuration_ceiling = 12
      cooldownDuration_ground = 7
      warmupActivities = ['تمرینات هوازی متوسط', 'حرکات پویا', 'فعال‌سازی عضلات سرینی', 'ست‌های گرم کردنی سبک']
      cooldownActivities = ['کاردیو با سرعت کم', 'کشش‌های یوگا', 'ماساژ با فوم رولر']
    }
    else {
      // level === "advanced" or level === "expert
      warmupDuration_ceiling = 22
      warmupDuration_ground = 15
      cooldownDuration_ceiling = 15
      cooldownDuration_ground = 10
      warmupActivities = ['تمرینات هوازی شدید', 'فعال‌سازی سیستم عصبی مرکزی', 'پیش‌ خستگی برای عضلات تثبیت‌کننده']
      cooldownActivities = ['کشش‌های ایستا عمیق', 'ماساژ با فوم رولر', 'سرد کردن با تمرکز بر تحرک‌پذیری']
    }
  }

  if (target_muscle_groups.includes('Chest')) {
    warmupActivities.push('چرخش بازوها', 'پرس سینه با دمبل سبک')
    cooldownActivities.push('کشش سینه ایستاده', 'کشش بازو در مقابل سینه')
  }
  else if (target_muscle_groups.includes('Back')) {
    warmupActivities.push('چرخش تنه', 'پارو زدن با کش')
    cooldownActivities.push('کشش کودک', 'کشش گربه-شتر')
  }
  else if (
    target_muscle_groups.includes('Adductors')
    || target_muscle_groups.includes('Abductors')
    || target_muscle_groups.includes('Hip Flexors')
    || target_muscle_groups.includes('Quadricepts')
  ) {
    warmupActivities.push('لانج پویا', 'اسکات با وزن بدن')
    cooldownActivities.push('کشش همسترینگ نشسته', 'کشش چهارسر ایستاده')
  }
  else if (target_muscle_groups.includes('Shoulders')) {
    warmupActivities.push('چرخش شانه', 'بالا بردن جانبی دمبل سبک')
    cooldownActivities.push('کشش شانه در مقابل بدن', 'کشش عضله دلتوئید')
  }
  else if (
    target_muscle_groups.includes('Forearms')
    || target_muscle_groups.includes('Bicepts')
    || target_muscle_groups.includes('Tricepts')
  ) {
    warmupActivities.push('چرخش مچ', 'پرس پشت بازو با دمبل سبک')
    cooldownActivities.push('کشش پشت بازو بالای سر', 'کشش عضله دوسر')
  }

  // // exercise per session (we can only use exercise per musclesssssssss !!!)
  // if (target === "hypertrophy") {
  //     if (level === "beginner" || level === "novice") {
  //         exercises_per_session = 4;
  //     } else if (level === "intermediate") {
  //         exercises_per_session = 5;
  //     } else { // advanced and expert
  //         exercises_per_session = 6;
  //     }
  // } else if (target === "strength") {
  //     if (level === "beginner" || level === "novice") {
  //         exercises_per_session = 3;
  //     } else if (level === "intermediate") {
  //         exercises_per_session = 4;
  //     } else { // advanced and expert
  //         exercises_per_session = 5;
  //     }
  // } else if (target === "endurance") {
  //     if (level === "beginner" || level === "novice") {
  //         exercises_per_session = 5;
  //     } else if (level === "intermediate") {
  //         exercises_per_session = 6;
  //     } else { // advanced and expert
  //         exercises_per_session = 7;
  //     }
  // } else {
  //     if (level === "beginner" || level === "novice") {
  //         exercises_per_session = 3;
  //     } else if (level === "intermediate") {
  //         exercises_per_session = 4;
  //     } else { // advanced and expert
  //         exercises_per_session = 5;
  //     }
  // }

  return {
    recoveryTime,
    number_of_exercises_per_muscle,
    sessionDuration,
    warmupDuration_ceiling,
    warmupDuration_ground,
    cooldownDuration_ceiling,
    cooldownDuration_ground,
    warmupActivities,
    cooldownActivities,
  }
}
