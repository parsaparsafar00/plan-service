export type ExerciseInstructionInput = {
    age: number;
    gender: Number
    target: string;
    level: string;
    mechanics: string;
    target_muscle_groups: string[];
  };
  
  export type ExerciseInstructionResult = {
    restBetweenSets: number;
    exercise_weight: number;
    number_of_sets: number;
    repsPerSet: number;
  };
  
  export function getExerciseInstructions({
    gender,
    target,
    level,
    mechanics,
    target_muscle_groups
  }: ExerciseInstructionInput): ExerciseInstructionResult {
    // let injuryDesc; // Count of isometric sets performed
    // let age = global.age;
    // let target_muscle_groups = global.target_muscle_groups;
    // let gender = global.gender; // 0 for male, 1 for female
    // let target = global.target;
    // let difficulty_level = global.difficulty_level;
    // let mechanics = global.mechanics;
    // let weight = global.weight;
  
    let weight_ceiling: number, weight_ground: number;
    let number_of_sets_ceiling: number, number_of_sets_ground: number;
    let repeats_per_set_ground: number, repeats_per_set_ceiling: number;
    let restBetweenSets_ceiling: number, restBetweenSets_ground: number;
  
    // Determine workout intensity based on gender and target
    if (target === "hypertrophy") {
      weight_ceiling = 75;
      weight_ground = 65;
      if (mechanics === "Compound") {
        number_of_sets_ceiling = 6;
        number_of_sets_ground = 3;
      } else if (mechanics === "Isolation") {
        number_of_sets_ceiling = 4;
        number_of_sets_ground = 3;
      }
    } else if (target === "strength") {
      if (gender === 0) {
        weight_ceiling = 100;
        weight_ground = 80;
      } else {
        weight_ceiling = 95;
        weight_ground = 80;
      }
      if (mechanics === "Compound") {
        number_of_sets_ceiling = 6;
        number_of_sets_ground = 4;
      } else if (mechanics === "Isolation") {
        number_of_sets_ceiling = 5;
        number_of_sets_ground = 3;
      }
    } else if (target === "endurance") {
      weight_ceiling = gender === 0 ? 60 : 65;
      weight_ground = gender === 0 ? 40 : 45;
      if (mechanics === "Compound") {
        number_of_sets_ceiling = 4;
        number_of_sets_ground = 3;
      } else {
        number_of_sets_ceiling = 3;
        number_of_sets_ground = 2;
      }
    } else {
      number_of_sets_ceiling = 4;
      number_of_sets_ground = 3;
      weight_ceiling = 70;
      weight_ground = 60;
    }
  
    const exercise_weight = parseInt(((weight_ground + weight_ceiling) / 2).toString());
    const number_of_sets = parseInt(((number_of_sets_ceiling + number_of_sets_ground) / 2).toString());
  
    // repeat per each muscle 
    if (target === "strength") {
      if (level === "beginner" || level === "novice") {
        repeats_per_set_ground = 12;
        repeats_per_set_ceiling = 15;
      } else if (level === "intermediate") {
        repeats_per_set_ground = 6;
        repeats_per_set_ceiling = 12;
      } else {
        repeats_per_set_ground = 1;
        repeats_per_set_ceiling = 5;
      }
    } else if (target === "endurance") {
      if (level === "beginner" || level === "novice") {
        repeats_per_set_ground = 12;
        repeats_per_set_ceiling = 20;
      } else if (level === "intermediate") {
        repeats_per_set_ground = 15;
        repeats_per_set_ceiling = 25;
      } else {
        repeats_per_set_ground = 20;
        repeats_per_set_ceiling = 30;
      }
    } else if (target === "hypertrophy") {
      if (level === "beginner" || level === "novice") {
        repeats_per_set_ground = 10;
        repeats_per_set_ceiling = 15;
      } else if (level === "intermediate") {
        repeats_per_set_ground = 8;
        repeats_per_set_ceiling = 12;
      } else {
        repeats_per_set_ground = 6;
        repeats_per_set_ceiling = 12;
      }
    } else if (target === "balance" || target === "postural") {
      if (level === "beginner" || level === "novice") {
        repeats_per_set_ground = 10;
        repeats_per_set_ceiling = 15;
      } else if (level === "intermediate") {
        repeats_per_set_ground = 12;
        repeats_per_set_ceiling = 20;
      } else {
        repeats_per_set_ground = 15;
        repeats_per_set_ceiling = 25;
      }
    } else if (target === "mobility") {
      if (level === "beginner" || level === "novice") {
        repeats_per_set_ground = 8;
        repeats_per_set_ceiling = 12;
      } else if (level === "intermediate") {
        repeats_per_set_ground = 10;
        repeats_per_set_ceiling = 15;
      } else {
        repeats_per_set_ground = 12;
        repeats_per_set_ceiling = 20;
      }
    }
  
    if (
      target_muscle_groups.some(item => ["Chest", "Back", "Abductors", "Adductors"].includes(item))
    ) {
      repeats_per_set_ground += 2;
      repeats_per_set_ceiling += 2;
    } else if (
      target_muscle_groups.some(item => ["Biceps", "Triceps", "Shoulders", "Calves"].includes(item))
    ) {
      repeats_per_set_ground -= 2;
      repeats_per_set_ceiling -= 2;
    }
  
    const repsPerSet = parseInt(((repeats_per_set_ceiling + repeats_per_set_ground) / 2).toString());
  
    // Rest Between Sets Logic
    if (target === "strength") {
      if (mechanics === "Compound") {
        if (repsPerSet <= 5) {
          restBetweenSets_ceiling = 300;
          restBetweenSets_ground = 180;
        } else {
          restBetweenSets_ceiling = 240;
          restBetweenSets_ground = 120;
        }
      } else if (mechanics === "Isolation") {
        restBetweenSets_ceiling = 120;
        restBetweenSets_ground = 60;
      }
    } else if (target === "hypertrophy") {
      if (repsPerSet >= 6 && repsPerSet <= 12) {
        restBetweenSets_ceiling = 60;
        restBetweenSets_ground = 30;
      } else {
        restBetweenSets_ceiling = 45;
        restBetweenSets_ground = 30;
      }
    } else if (target === "endurance") {
      if (repsPerSet > 12) {
        restBetweenSets_ceiling = 60;
        restBetweenSets_ground = 20;
      } else {
        restBetweenSets_ceiling = 90;
        restBetweenSets_ground = 30;
      }
    } else if (["balance", "postural"].includes(target)) {
      restBetweenSets_ceiling = 60;
      restBetweenSets_ground = 30;
    } else if (target === "mobility") {
      restBetweenSets_ceiling = 60;
      restBetweenSets_ground = 20;
    }
  
    const restBetweenSets = parseInt(((restBetweenSets_ceiling + restBetweenSets_ground) / 2).toString());
    

        
    // Special Techniques Logic
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
    //     dropSet_restBetweenSets_ceiling = 90;
    //     dropSet_restBetweenSets_ground = 60;
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
    //     giantSet_restBetweenSets_ceiling = 3;
    //     giantSet_restBetweenSets_ground = 2;
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

    // Export the results for use in main.ts
    return {
      restBetweenSets,
      exercise_weight,
      number_of_sets,
      repsPerSet
    };
  }
  