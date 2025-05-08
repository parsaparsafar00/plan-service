export interface ExerciseInstructionInput {
  gender: 'm' | 'f';
  target: string
  mechanics: string
  level: string
  target_muscle_groups: string[]
}

export interface ExerciseInstructionResult {
  restBetweenSetsCeiling: number
  restBetweenSetsGround: number
  weightGroundPercentage: number
  weightCeilingPercentage: number
  numberOfSetsCeiling: number
  numberOfSetsGround: number
  repeatsPerSetCeiling: number
  repeatsPerSetGround: number
}

export function getExerciseInstructions({ gender, target, mechanics, level, target_muscle_groups }: ExerciseInstructionInput): ExerciseInstructionResult {
  let restBetweenSetsCeiling: number
  let restBetweenSetsGround: number
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
  }
  else if (target === 'strength') {
    if (gender === 'm') {
      weightCeilingPercentage = 100
      weightGroundPercentage = 80
    }
    else {
      weightCeilingPercentage = 95
      weightGroundPercentage = 80
    }

    numberOfSetsCeiling = 5
    numberOfSetsGround = 3
  }
  else if (target === 'endurance') {
    weightCeilingPercentage = gender === 'm' ? 60 : 65
    weightGroundPercentage = gender === 'm' ? 40 : 45
    numberOfSetsCeiling = 4
    numberOfSetsGround = 2
  }
  else {
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
    }
    else if (level === 'intermediate') {
      repeatsPerSetGround = 6
      repeatsPerSetCeiling = 12
    }
    else {
      repeatsPerSetGround = 1
      repeatsPerSetCeiling = 5
    }
  }
  else if (target === 'endurance') {
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
  }
  else if (target === 'hypertrophy') {
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
  }
  else if (target === 'balance' || target === 'postural') {
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
  }
  else { // target === 'mobility'
    if (level === 'beginner' || level === 'novice') {
      repeatsPerSetGround = 8
      repeatsPerSetCeiling = 12
    }
    else if (level === 'intermediate') {
      repeatsPerSetGround = 10
      repeatsPerSetCeiling = 15
    }
    else {
      repeatsPerSetGround = 12
      repeatsPerSetCeiling = 20
    }
  }

  if (target_muscle_groups.some(item => ['chest', 'back', 'abductors', 'adductors'].includes(item))) {
    repeatsPerSetGround += 2
    repeatsPerSetCeiling += 2
  }
  else if (target_muscle_groups.some(item => ['biceps', 'triceps', 'shoulders', 'calves'].includes(item))) {
    repeatsPerSetGround -= 2
    repeatsPerSetCeiling -= 2
  }

  // دستور العمل های استراحت بین ست ها
  if (target === 'strength') {
    if (mechanics === 'compound') {
      if (repeatsPerSetGround <= 5) {
        restBetweenSetsCeiling = 300
        restBetweenSetsGround = 180
      }
      else {
        restBetweenSetsCeiling = 240
        restBetweenSetsGround = 120
      }
    }
    else { // mechanics === 'isolation'
      restBetweenSetsCeiling = 120
      restBetweenSetsGround = 60
    }
  }
  else if (target === 'hypertrophy') {
    if (repeatsPerSetGround >= 6 && repeatsPerSetCeiling <= 12) {
      restBetweenSetsCeiling = 60
      restBetweenSetsGround = 30
    }
    else {
      restBetweenSetsCeiling = 45
      restBetweenSetsGround = 30
    }
  }
  else if (target === 'endurance') {
    if (repeatsPerSetGround > 12) {
      restBetweenSetsCeiling = 60
      restBetweenSetsGround = 20
    }
    else {
      restBetweenSetsCeiling = 90
      restBetweenSetsGround = 30
    }
  }
  else if (target === 'balance' || target === 'postural') {
    restBetweenSetsCeiling = 60
    restBetweenSetsGround = 30
  }
  else { // target === 'mobility'
    restBetweenSetsCeiling = 60
    restBetweenSetsGround = 20
  }

  // دستور العمل های تکنیک های خاص
  // const useSuperSet = (() => {
  //   if (target === 'endurance' || target === 'balance')
  //     return true
  //   if (target === 'hypertrophy' && mechanics === 'isolation')
  //     return true
  //   if (mechanics === 'compound')
  //     return false
  //   return false
  // })()

  // const useDropSet = (() => {
  //   if (target === 'hypertrophy' && repeatsPerSetGround >= 8 && repeatsPerSetCeiling <= 12) {
  //     if (mechanics === 'isolation')
  //       return true
  //   }
  //   if (target_muscle_groups === 'arms' || target_muscle_groups === 'shoulders')
  //     return true
  //   return false
  // })()

  // const useGiantSet = (() => {
  //   if (target === 'hypertrophy' && target_muscle_groups === 'legs')
  //     return true
  //   if (target === 'balance' && age < 35)
  //     return true
  //   if (mechanics === 'compound' && repeatsPerSetGround >= 10)
  //     return true
  //   return false
  // })()

  // if (advancedTechniques === "Drop Set") {
  //     if (target === "hypertrophy") {
  //         if (age <= 30) {
  //             dropSet_weightReduction_ceiling = 15;
  //             dropSet_weightReduction_ground = 10;
  //         } else if (age <= 40) {
  //             dropSet_weightReduction_ceiling = 12;
  //             dropSet_weightReduction_ground = 8;
  //         } else {
  //             dropSet_weightReduction_ceiling = 10;
  //             dropSet_weightReduction_ground = 5;
  //         }

  //         if (exerciseType === "compound") {
  //             dropSet_maxUsagePerSession_ceiling = 2;
  //             dropSet_maxUsagePerSession_ground = 1;
  //         } else {
  //             dropSet_maxUsagePerSession_ceiling = 4;
  //             dropSet_maxUsagePerSession_ground = 3;
  //         }
  //     }

  //     allowDropSets = sessionForcedRepsCount < 2;

  //     dropSet_restBetweenDrops_ceiling = 20;
  //     dropSet_restBetweenDrops_ground = 10;
  //     dropSet_restBetweenSetsCeiling = 90;
  //     dropSet_restBetweenSetsGround = 60;
  // }

  // if (advancedTechniques === "Superset") {
  //     if (target === "hypertrophy") {
  //         if (target_muscle_groups === "antagonistic") {
  //             superset_exerciseCount_ceiling = 2;
  //             superset_exerciseCount_ground = 2;
  //             superset_restBetweenExercises_ceiling = 30;
  //             superset_restBetweenExercises_ground = 30;
  //         } else if (target_muscle_groups === "agonistic") {
  //             superset_exerciseCount_ceiling = 3;
  //             superset_exerciseCount_ground = 2;
  //             superset_restBetweenExercises_ceiling = 45;
  //             superset_restBetweenExercises_ground = 45;
  //         }
  //     } else if (target === "fat loss") {
  //         if (comboType === "upper + lower") {
  //             superset_restBetweenExercises_ceiling = 30;
  //             superset_restBetweenExercises_ground = 15;
  //         } else {
  //             superset_restBetweenExercises_ceiling = 45;
  //             superset_restBetweenExercises_ground = 45;
  //         }
  //     }
  // }

  // if (advancedTechniques === "Giant Set") {
  //     if (target === "endurance") {
  //         giantSet_exerciseCount = 4;
  //     } else if (target === "hypertrophy") {
  //         giantSet_exerciseCount = 3;
  //     }

  //     allowGiantSet = !["Squat", "Deadlift"].includes(exerciseList);

  //     giantSet_restBetweenSetsCeiling = 3;
  //     giantSet_restBetweenSetsGround = 2;
  // }

  // if (advancedTechniques === "Forced Reps") {
  //     if (muscleFailure) {
  //         forcedReps_additionalReps_ceiling = 3;
  //         forcedReps_additionalReps_ground = 2;
  //     }

  //     allowForcedReps = sessionForcedRepsCount < 2;

  //     forcedReps_allowed = exerciseType === "compound";
  // }

  // if (advancedTechniques === "Myo-Reps") {
  //     if (intensity >= 65 && intensity <= 75) {
  //         myoReps_initialSetReps_ceiling = 15;
  //         myoReps_initialSetReps_ground = 10;
  //         myoReps_miniSetReps_ceiling = 5;
  //         myoReps_miniSetReps_ground = 3;
  //         myoReps_restBetweenMiniSets_ceiling = 15;
  //         myoReps_restBetweenMiniSets_ground = 5;
  //         myoReps_goal = "maximize muscle fiber activation & maintain metabolic stress";
  //     }

  //     myoReps_allowed = exerciseType !== "compound";
  // }

  // if (advancedTechniques === "Isometric") {
  //     if (target === "hypertrophy" || target === "strength") {
  //         isometricTraining_goal = "increase strength at weak points & improve neuromuscular connection";

  //         if (exerciseType === "compound") {
  //             isometricTraining_executionTime_ceiling = 10;
  //             isometricTraining_executionTime_ground = 5;
  //         }

  //         allowIsometric = isometricSets < 3;
  //     }
  // }

  // Methods for Injured Individuals
  // if (injurySeverity === 'high') {
  //     injuryDesc = "Reduce intensity significantly. Use lighter weights and limit sets and repetitions."

  //     if (isUsingMachines) {
  //         console.log("Continue using exercise machines for better control.");
  //     } else {
  //         console.log("Switch to exercise machines to limit movement and control pressure.");
  //     }
  // } else if (injurySeverity === 'low') {
  //     console.log("You can gradually increase the intensity of your exercises.");
  // }

  // بازگشت خروجی
  return {
    restBetweenSetsCeiling,
    restBetweenSetsGround,
    weightGroundPercentage,
    weightCeilingPercentage,
    numberOfSetsCeiling,
    numberOfSetsGround,
    repeatsPerSetCeiling,
    repeatsPerSetGround,
  }
}
