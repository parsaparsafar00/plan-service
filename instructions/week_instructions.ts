export interface WeekInstructionInput {
  gender: number
  target: string
  level: string
}

export interface WeekInstructionResult {
  weightGroundPercentage: number,
  weightCeilingPercentage: number,
  numberOfSetsCeiling: number,
  numberOfSetsGround: number,
  repeatsPerSetCeiling: number,
  repeatsPerSetGround: number,

}

export function getWeekInstructions({ gender, target, level }: WeekInstructionInput): WeekInstructionResult {

  let weightCeilingPercentage: number
  let weightGroundPercentage: number
  let numberOfSetsCeiling: number
  let numberOfSetsGround: number
  let repeatsPerSetGround: number
  let repeatsPerSetCeiling: number

  
  // دستور العمل های وزن حرکت
  if (target === 'hypertrophy') {
    weightCeilingPercentage = 75
    weightGroundPercentage = 65
    numberOfSetsCeiling = 6
    numberOfSetsGround = 3
  } else if (target === 'strength') {
    if (gender === 0) {
      weightCeilingPercentage = 100
      weightGroundPercentage = 80
    } else {
      weightCeilingPercentage = 95
      weightGroundPercentage = 80
    }

    numberOfSetsCeiling = 5
    numberOfSetsGround = 3

  } else if (target === 'endurance') {
    weightCeilingPercentage = gender === 0 ? 60 : 65
    weightGroundPercentage = gender === 0 ? 40 : 45
    numberOfSetsCeiling = 4
    numberOfSetsGround = 2

  } else {
    numberOfSetsCeiling = 4
    numberOfSetsGround = 3
    weightCeilingPercentage = 70
    weightGroundPercentage = 60
  }

  // دستورالعمل های تکرار حرکات برای هر کدام از عضلات
  if (target === 'strength') {
    if (level === 'beginner' || level === 'novice') {
      repeatsPerSetGround = 12
      repeatsPerSetCeiling = 15
    } else if (level === 'intermediate') {
      repeatsPerSetGround = 6
      repeatsPerSetCeiling = 12
    } else {
      repeatsPerSetGround = 1
      repeatsPerSetCeiling = 5
    }
  } else if (target === 'endurance') {
    if (level === 'beginner' || level === 'novice') {
      repeatsPerSetGround = 12
      repeatsPerSetCeiling = 20
    }
    else if (level === 'intermediate') {
      repeatsPerSetGround = 15
      repeatsPerSetCeiling = 25
    }
    else {
      repeatsPerSetGround = 20
      repeatsPerSetCeiling = 30
    }
  } else if (target === 'hypertrophy') {
    if (level === 'beginner' || level === 'novice') {
      repeatsPerSetGround = 10
      repeatsPerSetCeiling = 15
    }
    else if (level === 'intermediate') {
      repeatsPerSetGround = 8
      repeatsPerSetCeiling = 12
    }
    else {
      repeatsPerSetGround = 6
      repeatsPerSetCeiling = 12
    }
  } else if (target === 'balance' || target === 'postural') {
    if (level === 'beginner' || level === 'novice') {
      repeatsPerSetGround = 10
      repeatsPerSetCeiling = 15
    }
    else if (level === 'intermediate') {
      repeatsPerSetGround = 12
      repeatsPerSetCeiling = 20
    }
    else {
      repeatsPerSetGround = 15
      repeatsPerSetCeiling = 25
    }
  } else { // target === 'mobility'
    if (level === 'beginner' || level === 'novice') {
      repeatsPerSetGround = 8
      repeatsPerSetCeiling = 12
    } else if (level === 'intermediate') {
      repeatsPerSetGround = 10
      repeatsPerSetCeiling = 15
    } else {
      repeatsPerSetGround = 12
      repeatsPerSetCeiling = 20
    }
  }

  // we cannot use below code scope at the moment cause we are defining systems based on weeks not based on the exercises details !!! :

  // if (
  //   target_muscle_groups.some(item => ['chest', 'back', 'abductors', 'adductors'].includes(item))
  // ) {
  //   repeatsPerSetGround += 2
  //   repeatsPerSetCeiling += 2
  // } else if (
  //   target_muscle_groups.some(item => ['biceps', 'triceps', 'shoulders', 'calves'].includes(item))
  // ) {
  //   repeatsPerSetGround -= 2
  //   repeatsPerSetCeiling -= 2
  // }
  return {
    weightGroundPercentage,
    weightCeilingPercentage,
    numberOfSetsCeiling,
    numberOfSetsGround,
    repeatsPerSetCeiling,
    repeatsPerSetGround,
  }
}
