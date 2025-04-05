export interface ExerciseInstructionInput {
  age: number
  // gender: number // 0 -> male, 1 -> female
  target: string
  mechanics: string
  repeatsPerSetGround: number, 
  repeatsPerSetCeiling: number
}

export interface ExerciseInstructionResult {
  restBetweenSetsCeiling: number
  restBetweenSetsGround: number
}

export function getExerciseInstructions({ target, mechanics, repeatsPerSetGround, repeatsPerSetCeiling }: ExerciseInstructionInput): ExerciseInstructionResult {

  let restBetweenSetsCeiling: number
  let restBetweenSetsGround: number


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
  } else if (target === 'hypertrophy') {
    if (repeatsPerSetGround >= 6 && repeatsPerSetCeiling <= 12) {
      restBetweenSetsCeiling = 60
      restBetweenSetsGround = 30
    } else {
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
  //
  //         if (exerciseType === "compound") {
  //             dropSet_maxUsagePerSession_ceiling = 2;
  //             dropSet_maxUsagePerSession_ground = 1;
  //         } else {
  //             dropSet_maxUsagePerSession_ceiling = 4;
  //             dropSet_maxUsagePerSession_ground = 3;
  //         }
  //     }
  //
  //     allowDropSets = sessionForcedRepsCount < 2;
  //
  //     dropSet_restBetweenDrops_ceiling = 20;
  //     dropSet_restBetweenDrops_ground = 10;
  //     dropSet_restBetweenSetsCeiling = 90;
  //     dropSet_restBetweenSetsGround = 60;
  // }
  //
  // if (advancedTechniques === "Superset") {
  //     if (target === "muscle growth") {
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
  //
  // if (advancedTechniques === "Giant Set") {
  //     if (target === "endurance") {
  //         giantSet_exerciseCount = 4;
  //     } else if (target === "hypertrophy") {
  //         giantSet_exerciseCount = 3;
  //     }
  //
  //     allowGiantSet = !["Squat", "Deadlift"].includes(exerciseList);
  //
  //     giantSet_restBetweenSetsCeiling = 3;
  //     giantSet_restBetweenSetsGround = 2;
  // }
  //
  // if (advancedTechniques === "Forced Reps") {
  //     if (muscleFailure) {
  //         forcedReps_additionalReps_ceiling = 3;
  //         forcedReps_additionalReps_ground = 2;
  //     }
  //
  //     allowForcedReps = sessionForcedRepsCount < 2;
  //
  //     forcedReps_allowed = exerciseType === "compound";
  // }
  //
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
  //
  //     myoReps_allowed = exerciseType !== "compound";
  // }
  //
  // if (advancedTechniques === "Isometric") {
  //     if (target === "hypertrophy" || target === "strength") {
  //         isometricTraining_goal = "increase strength at weak points & improve neuromuscular connection";
  //
  //         if (exerciseType === "compound") {
  //             isometricTraining_executionTime_ceiling = 10;
  //             isometricTraining_executionTime_ground = 5;
  //         }
  //
  //         allowIsometric = isometricSets < 3;
  //     }
  // }

  // Methods for Injured Individuals
  // if (injurySeverity === 'high') {
  //     injuryDesc = "Reduce intensity significantly. Use lighter weights and limit sets and repetitions."
  //
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
    restBetweenSetsGround
  }
}
