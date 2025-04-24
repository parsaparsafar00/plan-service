export interface LoadPlan {
  loadIncrement: string
  deload: string
  numberOfSuperSets: number
  numberOfGiantSets: number
  numberOfDropSets: number
}

export function getPlanInstructions(level: string): LoadPlan {
  let loadIncrement = ''
  let deload = ''
  const numberOfSuperSets = 0
  const numberOfDropSets = 0
  const numberOfGiantSets = 0

  // دستورالعمل های افزایش و کاهش بار تمرینی در طی هفته ها
  switch (level) {
    case 'beginner':
    case 'novice':
      loadIncrement = 'افزایش ۲۰ الی ۴۰٪ حجم تمرینی در ماه'
      deload = 'هر ۵ هفته یک بار کاهش حجم تمرین به میزان ۳۰ الی ۴۰٪'
      break
    case 'intermediate':
      loadIncrement = 'افزایش ۲۰ الی ۳۰٪ وزن یا ست‌ها در ماه'
      deload = 'هر ۴ الی ۶ هفته یک بار کاهش حجم تمرین به میزان ۳۰٪'
      break
    case 'advanced':
      loadIncrement = 'افزایش ۱۵ الی ۲۰٪ وزن در ماه، با تمرکز بر حجم و شدت'
      deload = 'هر ۵ الی ۸ هفته یک بار کاهش حجم تمرین به میزان ۴۰ الی ۵۰٪'
      break
    case 'expert':
      loadIncrement = 'افزایش ۱۰ الی ۱۵٪ در ماه برای حرکات سنگین'
      deload = 'هر ۵ الی ۶ هفته یک بار کاهش حجم تمرین به میزان ۵۰٪ با تمرکز بر ریکاوری و تکنیک'
      break
    default:
      loadIncrement = ''
      deload = ''
  }

  return { loadIncrement, deload, numberOfDropSets, numberOfGiantSets, numberOfSuperSets }
}
