export interface WeekInstructionInput {
  gender: 'm' | 'f'
  target: string
  level: string
}

export interface WeekInstructionResult {
  // weightGroundPercentage: number,
  // weightCeilingPercentage: number,
  // numberOfSetsCeiling: number,
  // numberOfSetsGround: number,
  // repeatsPerSetCeiling: number,
  // repeatsPerSetGround: number,

}

export function getWeekInstructions({}: WeekInstructionInput): WeekInstructionResult {
  return []
}
