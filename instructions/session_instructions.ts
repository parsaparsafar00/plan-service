export interface SessionInstructionInput {
  age: number
  gender: number
  target: string
  level: string
  target_muscle_groups: string[]
}

export interface SessionInstructionResult {
  recoveryTime_ceiling: number
  recoveryTime_ground: number
  number_of_exercises_per_muscle_set: number[]
  sessionDuration_ceiling: number
  sessionDuration_ground: number
  warmupDuration_ceiling: number
  warmupDuration_ground: number
  cooldownDuration_ceiling: number
  cooldownDuration_ground: number
  warmupActivities: string[]
  cooldownActivities: string[]
}

export function getSessionInstructions({ age, gender, target, level, target_muscle_groups }: SessionInstructionInput): SessionInstructionResult {

  let recoveryTime_ceiling: number
  let recoveryTime_ground: number
  let number_of_exercises_per_muscle_set: number[]
  let warmupDuration_ceiling: number
  let warmupDuration_ground: number
  let cooldownDuration_ceiling: number
  let cooldownDuration_ground: number
  let warmupActivities: string[] = []
  let cooldownActivities: string[] = []

  // دستورالعمل های دوره های ریکاوری ورزشکار
  if (target_muscle_groups.some(item => ['chest', 'back', 'abductors', 'adductors'].includes(item))) {
    if (gender === 0) {
      recoveryTime_ceiling = 72
      recoveryTime_ground = 48
    } else {
      recoveryTime_ceiling = 60
      recoveryTime_ground = 36
    }
  } else if (target_muscle_groups.some(item => ['biceps', 'triceps', 'shoulders', 'calves'].includes(item))) {
    if (gender === 0) {
      recoveryTime_ceiling = 48
      recoveryTime_ground = 24
    } else {
      recoveryTime_ceiling = 36
      recoveryTime_ground = 18
    }
  } else if (target === 'hypertrophy') {
    if (gender === 0) {
      recoveryTime_ceiling = 72
      recoveryTime_ground = 48
    } else {
      recoveryTime_ceiling = 60
      recoveryTime_ground = 36
    }
  } else if (target === 'endurance') {
    if (gender === 0) {
      recoveryTime_ceiling = 48
      recoveryTime_ground = 24
    } else {
      recoveryTime_ceiling = 36
      recoveryTime_ground = 18
    }
  } else { // genereal fitness purposes
    if (gender === 0) {
      recoveryTime_ceiling = 48;
      recoveryTime_ground = 36;
    } else {
      recoveryTime_ceiling = 36;
      recoveryTime_ground = 24;
    }
  }

  if (age > 40) {
    recoveryTime_ceiling += 24
    recoveryTime_ground += 12
  } 

  // دستورالعمل های مدت زمان جلسه تمرینی 
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
  } else if (level === 'intermediate') {
    sessionDuration_ceiling = 60
    sessionDuration_ground = 45
    if (target === 'strength') {
      sessionDuration_ceiling = 60
    } else if (target === 'hypertrophy') {
      sessionDuration_ceiling = 75
    } else {
      sessionDuration_ground = 55
    }
  } else {
    // level === "advanced" or level === "expert"
    if (gender === 0) {
      sessionDuration_ceiling = 90
      sessionDuration_ground = 60
    } else {
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

  // دستورالعمل های تعداد حرکات به ازای هر عضله
  const largeMuscles = ['back', 'chest', 'quadricepts', 'hamstrings', 'glutes'];
  const smallMuscles = ['biceps', 'triceps', 'calves', 'abdominals', 'shoulders'];

  // گام اول - چیدن مقدار اولیه تعداد کل حرکات در جلسه، بر حسب هدف ورزشکار
  let total_number_of_exercises;
  switch (target) {
    case 'hypertrophy':
      total_number_of_exercises = level === 'beginner' ? 9 :
                           level === 'novice' ? 10 :
                           level === 'intermediate' ? 11 :
                           level === 'advanced' ? 12 : 13;
    break;
    case 'strength':
      total_number_of_exercises = level === 'beginner' ? 7 :
                           level === 'novice' ? 8 :
                           level === 'intermediate' ? 9 :
                           level === 'advanced' ? 10 : 11;
    break;
    case 'endurance':
      total_number_of_exercises = level === 'beginner' ? 6 :
                           level === 'novice' ? 7 :
                           level === 'intermediate' ? 8 :
                           level === 'advanced' ? 9 : 9;
    break;
    default: // general fitness
    total_number_of_exercises = level === 'beginner' ? 8 :
                           level === 'novice' ? 9 :
                           level === 'intermediate' ? 10 :
                           level === 'advanced' ? 11 : 12;
  }
  // آداپته کردن جواب بر اساس اینکه چقدر عضله های مورد تمرین در جلسه فعلی بزرگ هستند
  number_of_exercises_per_muscle_set = new Array(target_muscle_groups.length).fill(Math.floor(total_number_of_exercises / target_muscle_groups.length));
  target_muscle_groups.forEach((muscle, index) => {
    if (largeMuscles.includes(muscle)) number_of_exercises_per_muscle_set[index] -= 1;
    else if (smallMuscles.includes(muscle)) number_of_exercises_per_muscle_set[index] += 1;
  });

  // دستورالعمل های گرم کردن و سرد کردن
  if (gender === 0) {
    if (level === 'beginner' || level === 'novice') {
      warmupDuration_ceiling = 10
      warmupDuration_ground = 5
      cooldownDuration_ceiling = 10
      cooldownDuration_ground = 5
      warmupActivities = ['تمرینات هوازی سبک', 'کشش‌های پویا', 'حرکات افزایش دامنه حرکتی']
      cooldownActivities = ['راه رفتن سبک', 'کشش‌های ایستا', 'تمرینات تنفسی']
    } else if (level === 'intermediate') {
      warmupDuration_ceiling = 15
      warmupDuration_ground = 10
      cooldownDuration_ceiling = 10
      cooldownDuration_ground = 5
      warmupActivities = ['تمرینات هوازی متوسط', 'حرکات تحرک پویا', 'ست‌های گرم کردنی سبک']
      cooldownActivities = ['کاردیو با سرعت کم', 'کشش‌های ایستا', 'ماساژ با فوم رولر']
    } else {
      // level === "advanced" or level === "expert
      warmupDuration_ceiling = 20
      warmupDuration_ground = 15
      cooldownDuration_ceiling = 15
      cooldownDuration_ground = 10
      warmupActivities = ['تمرینات هوازی با شدت بالا', 'فعال‌سازی سیستم عصبی مرکزی', 'حرکات پویا']
      cooldownActivities = ['کشش‌های ایستا عمیق', 'ماساژ با فوم رولر', 'سرد کردن تدریجی']
    }
  } else {
    if (level === 'beginner' || level === 'novice') {
      warmupDuration_ceiling = 12
      warmupDuration_ground = 7
      cooldownDuration_ceiling = 12
      cooldownDuration_ground = 5
      warmupActivities = ['تمرینات هوازی سبک', 'کشش‌های پویا', 'حرکات افزایش دامنه مفصلی']
      cooldownActivities = ['راه رفتن سبک', 'کشش‌های ایستا', 'تمرینات تنفسی', 'ریلکسیشن بر پایه یوگا']
    } else if (level === 'intermediate') {
      warmupDuration_ceiling = 18
      warmupDuration_ground = 12
      cooldownDuration_ceiling = 12
      cooldownDuration_ground = 7
      warmupActivities = ['تمرینات هوازی متوسط', 'حرکات پویا', 'فعال‌سازی عضلات سرینی', 'ست‌های گرم کردنی سبک']
      cooldownActivities = ['کاردیو با سرعت کم', 'کشش‌های یوگا', 'ماساژ با فوم رولر']
    } else {
      // level === "advanced" or level === "expert
      warmupDuration_ceiling = 22
      warmupDuration_ground = 15
      cooldownDuration_ceiling = 15
      cooldownDuration_ground = 10
      warmupActivities = ['تمرینات هوازی شدید', 'فعال‌سازی سیستم عصبی مرکزی', 'پیش‌ خستگی برای عضلات تثبیت‌کننده']
      cooldownActivities = ['کشش‌های ایستا عمیق', 'ماساژ با فوم رولر', 'سرد کردن با تمرکز بر تحرک‌پذیری']
    }
  }

  if (target_muscle_groups.includes('chest')) {
    warmupActivities.push('چرخش بازوها', 'پرس سینه با دمبل سبک')
    cooldownActivities.push('کشش سینه ایستاده', 'کشش بازو در مقابل سینه')
  } else if (target_muscle_groups.includes('back')) {
    warmupActivities.push('چرخش تنه', 'پارو زدن با کش')
    cooldownActivities.push('کشش کودک', 'کشش گربه-شتر')
  } else if (
    target_muscle_groups.includes('adductors')
    || target_muscle_groups.includes('abductors')
    || target_muscle_groups.includes('hip flexors')
    || target_muscle_groups.includes('quadricepts')
  ) {
    warmupActivities.push('لانج پویا', 'اسکات با وزن بدن')
    cooldownActivities.push('کشش همسترینگ نشسته', 'کشش چهارسر ایستاده')
  } else if (target_muscle_groups.includes('shoulders')) {
    warmupActivities.push('چرخش شانه', 'بالا بردن جانبی دمبل سبک')
    cooldownActivities.push('کشش شانه در مقابل بدن', 'کشش عضله دلتوئید')
  } else if (
    target_muscle_groups.includes('forearms')
    || target_muscle_groups.includes('bicepts')
    || target_muscle_groups.includes('tricepts')
  ) {
    warmupActivities.push('چرخش مچ', 'پرس پشت بازو با دمبل سبک')
    cooldownActivities.push('کشش پشت بازو بالای سر', 'کشش عضله دوسر')
  }

    // دستورالعمل تعداد سوپر ست های مجاز در هر جلسه
    // if (target === 'endurance' || target === 'balance' || target === 'hypertrophy') {
    //   numberOfSuperSets = level === 'novice' ? 0: level === 'beginner' ? 1 : level === 'intermediate' ? 2 : 3
    // }
  
    // // دستورالعمل تعداد دراپ ست های مجاز در هر جلسه
    // if (target === 'hypertrophy' && (targetMuscleGroups.includes('biceps') || targetMuscleGroups.includes('triceps') || targetMuscleGroups.includes('shoulders'))) {
    //   numberOfDropSets = level === 'novice' ? 0: level === 'beginner' ? 1 : 2
    // }
  
    // // دستورالعمل تعداد جاینت ست های مجاز در هر جلسه
    // if ((target === 'balance' || target === 'hypertrophy') && (targetMuscleGroups.includes('quadriceps') || targetMuscleGroups.includes('adductors') || targetMuscleGroups.includes('abductors'))) {
    //   numberOfGiantSets = level === 'novice' ? 0: level === 'beginner' ? 0 : level === 'intermediate' ? 1 : 2
    // }

  return {
    recoveryTime_ceiling,
    recoveryTime_ground,
    number_of_exercises_per_muscle_set,
    sessionDuration_ceiling,
    sessionDuration_ground,
    warmupDuration_ceiling,
    warmupDuration_ground,
    cooldownDuration_ceiling,
    cooldownDuration_ground,
    warmupActivities,
    cooldownActivities,
  }
}
