export type LoadPlan = {
    loadIncrement: string;
    deload: string;
};

export function getPlanInstructions(level: string): LoadPlan {
    let loadIncrement = "";
    let deload = "";
    // Determine rest between sessions based on workout split
    // switch (workout_split) {
    //     case "Full-Body":
    //     case "Upper/Lower":
    //         restBetweenSessions_ceiling = 48;
    //         restBetweenSessions_ground = 48;
    //         break;
    //     case "Push/Pull/Legs":
    //         restBetweenSessions_ceiling = 72;
    //         restBetweenSessions_ground = 48;
    //         break;
    //     case "Body Part Split":
    //         restBetweenSessions_ceiling = 7;
    //         restBetweenSessions_ground = 5;
    //         break;
    // }

    // Determine load adjustments based on level
    switch (level) {
        case "beginner":
        case "novice":
            loadIncrement = "افزایش ۲۰ الی ۴۰٪ حجم تمرینی در ماه";
            deload = "هر ۵ هفته یک بار کاهش حجم تمرین به میزان ۳۰ الی ۴۰٪";
            break;
        case "intermediate":
            loadIncrement = "افزایش ۲۰ الی ۳۰٪ وزن یا ست‌ها در ماه";
            deload = "هر ۴ الی ۶ هفته یک بار کاهش حجم تمرین به میزان ۳۰٪";
            break;
        case "advanced":
            loadIncrement = "افزایش ۱۵ الی ۲۰٪ وزن در ماه، با تمرکز بر حجم و شدت";
            deload = "هر ۵ الی ۸ هفته یک بار کاهش حجم تمرین به میزان ۴۰ الی ۵۰٪";
            break;
        case "expert":
            loadIncrement = "افزایش ۱۰ الی ۱۵٪ در ماه برای حرکات سنگین";
            deload = "هر ۵ الی ۶ هفته یک بار کاهش حجم تمرین به میزان ۵۰٪ با تمرکز بر ریکاوری و تکنیک";
            break;
    }

    return { loadIncrement, deload };
}